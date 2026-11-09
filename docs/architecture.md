# Architecture — Escape Game Cyber

> Proposition d'architecture pour le back, les tablettes et l'IoT.
> Base existante : Socket.IO, workspace `shared/`, front Vue 3.

---

## Résumé

- **Tablettes ↔ serveur : WebSocket via Socket.IO** (déjà en place).
- **IoT ↔ serveur : MQTT** (broker Mosquitto) plutôt que WebSocket.
- **Moteur de jeu** : les clients envoient des **commandes**, le serveur fait autorité et renvoie l'**état**.
- **Scénario décrit en données**, moteur générique et réutilisable.

---

## 1. Vue d'ensemble

```
             ┌──────────────── Serveur (Node, 1 process) ───────────────────┐
 Tablettes   │                                                              │
 ┌────────┐  │  ┌──────────────┐    ┌──────────────────┐    ┌───────────┐  │
 │ MASTER │◄─┼─►│  Passerelle  │───►│   MOTEUR (pur)   │───►│ Effets    │  │
 └────────┘  │  │  Socket.IO   │cmd │ (état, cmd) →    │    │ - envoyer │  │
 ┌────────┐  │  │ salles/rôles │    │ (état', effets)  │    │   la vue  │  │
 │ OPÉ x4 │◄─┼─►│              │◄───│                  │    │ - IoT     │  │
 └────────┘  │  └──────────────┘vue │ Scénario = DATA  │    │ - mail... │  │
 ┌────────┐  │         ▲            └──────────────────┘    └───────────┘  │
 │   MJ   │◄─┼─────────┘                 ▲          │                     │
 └────────┘  │                     ┌─────┴──────┐   ▼                     │
             │                     │ Passerelle │  SQLite (snapshot +     │
             │                     │    MQTT    │  journal d'événements)  │
             └─────────────────────┴─────┬──────┴─────────────────────────┘
                                         │
                                  ┌──────┴──────┐
                                  │  Mosquitto  │◄──► ESP32 (boîte, alarme…)
                                  └─────────────┘
```

---

## 2. Tablettes ↔ serveur : Socket.IO

On garde Socket.IO plutôt que du `ws` brut. Il apporte :

- la **reconnexion** automatique ;
- les **salles** (« rooms ») pour cibler un rôle ;
- les **acks**, qui donnent un mode requête/réponse sur le socket.

Avec les acks, REST n'est plus nécessaire pour les actions de jeu : `POST /api/answer` devient une commande socket.

Le HTTP reste utile pour ce qui n'est pas du jeu : servir le front, les faux sites OSINT, les images et les PDF.

### Protocole

Trois messages suffisent :

```ts
// client → serveur, avec ack
'cmd': (c: Command, ack: (r: { ok: boolean; error?: string }) => void) => void

// serveur → client
'view':  (v: ViewState) => void    // ÉTAT COMPLET filtré pour le rôle du client
'event': (e: GameEvent) => void    // notifications ponctuelles : nouveau mail, son, toast
```

### Envoyer l'état complet, pas des différences

L'état fait quelques Ko : des diffs n'apporteraient que de la complexité.

Avantage principal : une tablette qui redémarre en pleine partie se reconnecte, reçoit `view`, et se retrouve exactement où elle en était. En escape game, ça arrivera forcément.

---

## 3. Rôles et affichage dynamique

### Le rôle appartient à l'appareil, pas au joueur

| Appareil | Rôle | Outils |
|---|---|---|
| Tablette fixe commune | `master` | Actifs / offensifs : saisie de mots de passe, mail, envoi de données, shell… |
| Petites tablettes (x4) | `ops` | Passifs : recherche, OSINT, craquage de hash en local… |
| Poste animateur | `gm` | Console maître du jeu |

- Chaque tablette reçoit une fois un jeton, par une URL du type `/?device=master-01&token=...` stockée en localStorage.
- Elle l'envoie à la connexion : `io({ auth: { token } })`.
- Le serveur en déduit le rôle et place le socket dans la bonne salle (`master`, `ops`, `gm`).

### Le serveur calcule une vue par rôle

`viewFor(state, role)` construit l'état envoyé à chaque rôle :

- une opé ne reçoit **jamais** les données du master ;
- **personne** ne reçoit les réponses attendues.

### Côté Vue : un seul front

Un registre d'outils associe chaque `toolId` à un composant. Le bureau Windows affiche les icônes de `view.tools` et ne décide rien lui-même.

```ts
const TOOLS = { browser: FakeGoogle, cracker: Cracker, mail: MailClient, shell: Shell, exfil: Exfil }
// <component :is="TOOLS[id]" v-for="id in view.tools" />
```

### ⚠️ Sécurité : valider côté serveur

Chaque commande est validée côté serveur selon le **rôle du socket**. Cacher un bouton ne suffit pas : c'est un escape game *cyber* et certains joueurs ouvriront les outils de développement. Si une opé envoie `submitPassword`, le serveur refuse.

### Collaboration forcée

Le découpage passif/actif s'intègre naturellement. Exemple :

1. une opé craque un hash dans son navigateur ;
2. elle **dit** le mot de passe au master ;
3. le master le saisit ;
4. le serveur le valide et débloque le nouvel outil pour le groupe.

---

## 4. Le moteur de jeu

### Une fonction pure

```ts
function reduce(state: GameState, cmd: Command, from: Role): { state: GameState; effects: Effect[] }

type Effect =
  | { type: 'broadcast' }                          // renvoyer les vues
  | { type: 'iot'; device: string; action: string } // ex. ouvrir la boîte
  | { type: 'mail'; to: Role; mailId: string }      // David répond
  | { type: 'sound'; id: string }
```

- Le moteur **ne fait aucune entrée/sortie** : il renvoie une liste d'effets, que les passerelles exécutent.
- Il est facile à tester : « si le master tape X à l'étape 3, l'outil shell se débloque ».
- Une partie peut être rejouée à partir du journal des commandes.

### Des flags plutôt qu'une machine à états stricte

L'étape 4 contient des énigmes en parallèle (alarme et recherche de la session de Maël). Une machine à états linéaire les gère mal.

Proposition :

- l'état est un ensemble de **flags** (`alarmDisabled`, `usbInstalled`, …) ;
- des **règles** du type : « quand ces flags sont posés et que cette commande arrive → poser ces flags, débloquer ces outils, déclencher ces effets ».

Le parallèle se gère alors sans effort. XState reste possible mais semble surdimensionné ici.

### Le scénario est un fichier de données

`scenario.ts` décrit les étapes, les mots de passe attendus, les outils débloqués et les effets IoT. Le moteur reste générique : un deuxième scénario ne demandera qu'un autre fichier.

---

## 5. IoT : MQTT

### Pourquoi pas Socket.IO

Socket.IO sur ESP32 est fragile : les bibliothèques sont peu maintenues et suivent mal les versions du protocole Engine.IO.

### Pourquoi MQTT

- **Bibliothèques solides** côté ESP32 (PubSubClient, ou `mqtt` en MicroPython).
- **Last Will** : le broker annonce lui-même qu'un appareil s'est déconnecté. Le MJ voit en direct si la boîte est hors ligne.
- **Débogage sans matériel** : avec MQTT Explorer sur un PC, on simule un capteur ou on observe les ordres envoyés.
- **Mise en place simple** : un conteneur `eclipse-mosquitto` dans le `docker-compose`, et le paquet npm `mqtt` côté serveur.

### Topics

```
escape/dev/<deviceId>/cmd      serveur → appareil   {"action":"unlock"}
escape/dev/<deviceId>/event    appareil → serveur   {"type":"opened"}
escape/dev/<deviceId>/status   online/offline (retained + Last Will)
```

### Des appareils « bêtes »

Les appareils ne sont que des capteurs et des actionneurs, sans aucune logique de scénario. La passerelle MQTT traduit un `event` en commande pour le moteur, exactement comme la passerelle Socket.IO. Le moteur ne sait pas d'où vient la commande.

---

## 6. Éléments indispensables

### Console MJ (rôle `gm`)

- démarrer, mettre en pause, réinitialiser la partie ;
- forcer une étape ;
- envoyer un indice ;
- voir l'état des appareils IoT.

Le jour J, si un ESP32 plante, c'est elle qui sauve la partie.

### Persistance

- Sauvegarde de l'état dans SQLite à chaque transition, plus un **journal horodaté** des commandes.
- Le serveur survit à un redémarrage.
- Le journal donne une **chronologie pour le débrief** (« à 14h32 vous avez trouvé le mail de David… »), ce qui a beaucoup de valeur pour sensibiliser des dirigeants.

### Réseau 100 % local

Un mini-PC ou un Raspberry Pi avec Docker, et un routeur Wi-Fi dédié. Aucune dépendance à Internet (le faux Google va déjà dans ce sens).

### Sessions

Une seule session active à la fois (une salle physique), mais un `sessionId` partout : ça ne coûte rien.

---

## 7. Stack proposée

| Couche | Choix |
|---|---|
| Serveur | Node + TypeScript + Express (statique) + Socket.IO (déjà en place) |
| Contrat | `shared/` : types `Command`, `ViewState`, `Effect`, topics MQTT |
| Validation | `zod` sur les commandes entrantes |
| IoT | Mosquitto + paquet `mqtt` ; ESP32 avec PubSubClient |
| Persistance | SQLite (`better-sqlite3`) |
| Front | Vue 3 ; `reactive` suffit pour l'instant, Pinia si l'état grossit |

---

## 8. Prochaines étapes

1. Types `Command` / `ViewState` / `Effect` dans `shared/`.
2. Moteur pur et premier scénario (étapes 1 et 2).
3. Authentification des appareils et salles par rôle dans la passerelle Socket.IO.
4. Migration de `POST /api/answer` vers une commande socket.
5. Console MJ minimale.
6. Conteneur Mosquitto et passerelle MQTT.
