# Architecture — Escape Game Cyber

> Document de référence : architecture physique et logicielle, découpage en
> modules, organisation des sources, protocole entre le serveur et les tablettes.
> La section 15 indique ce qui existe déjà dans le code et ce qui reste à faire.

---

## Résumé des décisions

- **Un moteur générique** qui prend en entrée **un scénario** (des fichiers YAML) et **une interface IoT** (`IotPort`, section 12). Il gère le suivi du scénario, les connexions et la construction des pages.
- **Un seul serveur Node** sert le front (compilé par Vite) et fait tourner le jeu.
- **Le client est une application monopage** : un `index.html` quasi vide et un `app.js` qui contient tous les templates de pages, mais **aucun contenu de jeu**.
- **Une page = un template + un contenu.** Le template est un `.vue` compilé dans le JS. Le contenu est un YAML qui reste sur le serveur et n'est envoyé qu'aux tablettes qui y ont droit.
- **Tout le dialogue de jeu passe par le WebSocket** (Socket.IO). Le HTTP ne sert qu'à charger l'application et les fichiers statiques non sensibles.
- **Le scénario est un graphe de nœuds reliés par des liens.** Le comportement vient du câblage entre nœuds, pas du code.
- **Un contenu apparaît quand une sortie de nœud a été déclenchée** (`when: mailDavid.sent`).
- **À chaque changement, le serveur renvoie la page entière** ; Vue ne redessine que ce qui a changé.
- **Le matériel est piloté par un processus séparé, `iot-gateway`**, relié au serveur en Socket.IO (namespace `/iot`). Le moteur ne voit que l'interface `IotPort` (section 12).
- **Par partie : 1 MJ, 1 master, n opé, une seule partie à la fois**, toujours portée par une session identifiée.

---

## 1. Vocabulaire

| Terme | Définition |
|---|---|
| **Scénario** | Le dossier de données d'une partie : nœuds, liens, appareils, pages. |
| **Nœud** | Une brique du scénario : un champ de mot de passe, une application, un mail, un cue IoT, une porte logique… Chaque nœud a des **entrées**, des **sorties**, un **état**. |
| **Type de nœud** | Le comportement d'une catégorie de nœuds (`PasswordLock`, `App`, `AllOf`…), écrit en TypeScript une fois pour toutes. |
| **Lien** | Relie la sortie d'un nœud à l'entrée d'un autre : `alarmPanel.solved → maelSession.enable`. |
| **Sortie déclenchée** | Une sortie qui a été émise au moins une fois pendant la partie. Sert de condition d'apparition (`when`). |
| **Page** | Ce qu'on voit dans le navigateur du jeu : un **template** + un **contenu** (YAML). |
| **Template** | Un composant `.vue` de mise en page, sans contenu (`LinkedInProfile`, `Article`…). |
| **Vue** (`ViewState`) | Ce qu'une tablette voit de la partie : son bureau, ses applications, ses champs de saisie. |
| **Session** | Une partie, identifiée par la date et le nom d'équipe. |
| **Rôle** | `master`, `ops` ou `gm`. Il appartient à l'appareil, pas au joueur. |

---

## 2. Architecture physique

```
┌──────────────────── Boîtier (mini-PC / Raspberry Pi) ────────────────────┐
│  docker compose                                                          │
│  ┌──────────────────────────────────────────┐                            │
│  │ conteneur "game" (Node)                  │                            │
│  │  - moteur + modules                      │                            │
│  │  - sert le front compilé par Vite        │                            │
│  │  - Socket.IO : tablettes + namespace /iot│◄───────────────┐           │
│  │  - lit scenarios/<nom>/ (YAML)           │                │           │
│  │  - SQLite (data/)                        │                │           │
│  └───────────────▲──────────────────────────┘                │           │
└──────────────────┼───────────────────────────────────────────┼───────────┘
                   │ Wi-Fi local, sans accès Internet          │ Socket.IO /iot
     ┌─────────────┼───────────────┐                  ┌────────┴────────┐
  tablette fixe  tablettes opé   poste MJ             │   iot-gateway   │  même machine
  ?device=master  ?device=ops-N  ?device=gm           │     (Node)      │  ou Raspberry Pi
                                                      └────────┬────────┘
                                                WLED · audio (mpv) · clavier ESP32 · porte
```

- **En production**, le front est compilé par Vite lors de la construction de l'image Docker, puis servi par Express.
- **En développement**, Vite tourne à côté (port 5173) et redirige `/socket.io` vers le serveur (port 3000).
- **Aucune dépendance à Internet** : toutes les pages « web » sont fictives et servies par le jeu.

---

## 3. Organisation des sources

Il y a **trois natures de fichiers**, rangées séparément :

| Nature | Dossier | Qui y touche |
|---|---|---|
| **Données** : le scénario, le contenu des pages | `scenarios/` | game designers (YAML uniquement) |
| **Contrats** : ce que le back et le front s'échangent | `shared/` | développeurs back et front, ensemble |
| **Code** | `server/`, `client/` | développeurs |

```
scenarios/
  scenario1_red_team/
    scenario.yaml           nœuds + liens : le déroulé de la partie
    devices.yaml            tablettes
    pages/*.yaml            contenu des pages (template + données + conditions)
    search.yaml             recherches du faux Google → résultats
    assets/                 images des pages (non sensibles)

shared/src/
  protocol.ts               messages Socket.IO, ViewState, PageView
  iot-protocol.ts           contrat filaire serveur ↔ iot-gateway (export @escape/shared/iot)
  templates/*.ts            schéma de données de chaque template de page

server/src/
  app.ts                    assemble les modules (aucune logique)
  modules/
    scenario-loader/        lit et valide le dossier du scénario
    timeline/               le moteur : nœuds, liens, état, sorties déclenchées
      nodes/                les types de nœuds (PasswordLock, App, AllOf…)
    views/                  construit les vues et les pages pour chaque rôle
    session/                cycle de vie de la partie, orchestration
    connections/            tablettes : jetons, rôles, Socket.IO
    iot/                    adaptateur IoT : IotPort, cues, namespace /iot (section 12)
    persistence/            SQLite : sessions et journal
  logger.ts

iot-gateway/src/            processus qui pilote le matériel (section 12)

client/src/
  main.ts
  network/                  le SEUL module qui parle au serveur (Socket.IO)
  state/                    la dernière vue reçue, les pages ouvertes
  shells/                   écran d'attente, bureau, console MJ
  os/                       bureau Windows, fenêtres, barre des tâches
  apps/                     navigateur, mail, cracker, shell…
  templates/                LinkedInProfile.vue, Article.vue, CompanySite.vue…
  registry.ts               nom de template → composant
```

---

## 4. Back : les modules

### Vue d'ensemble

```
            ┌─────────────┐                                  ┌────────────┐
 tablettes ─┤ connections │──── commande ──┐    ┌───────────►│    iot     ├─ objets
            │             │◄─── vues ───┐  │    │            │ section 12 │
            └─────────────┘   + pages   │  ▼    │            └─────┬──────┘
                                    ┌───┴───────┴───┐              │
                                    │    session    │◄─────────────┘
                                    │(orchestrateur)│
                                    └─┬─────┬─────┬─┘
                           run/état   │     │     │ save/journal
                       ┌──────────────┘     │     └──────────────┐
                       ▼                    ▼                    ▼
                ┌────────────┐       ┌────────────┐       ┌─────────────┐
                │  timeline  │◄──────│   views    │       │ persistence │
                │ (nœuds +   │hasFired│(construit │       └─────────────┘
                │  liens)    │       │ les pages) │
                └─────▲──────┘       └─────▲──────┘
                      │                    │
                ┌─────┴────────────────────┴─────┐
                │        scenario-loader          │ ◄── scenarios/scenario1_red_team/*.yaml
                └─────────────────────────────────┘
```

### Responsabilités et interfaces

| Module | Responsabilité unique | Interface exposée | Ne sait rien de… |
|---|---|---|---|
| **scenario-loader** | Lire le dossier du scénario et **tout valider au démarrage** : types de nœuds, liens, conditions `when`, schémas des pages, appareils. | `loadScenario(dir): Scenario` | l'exécution de la partie |
| **timeline** | Le moteur : faire circuler les signaux entre nœuds, vérifier les droits, mémoriser les sorties déclenchées, produire des effets. **Pur**, sans I/O. | `init()`, `run(state, input)`, `nodesFor(state, role)`, `hasFired(state, 'node.sortie')` | les pages, le réseau, le stockage, les sessions |
| **views** | Construire ce que voit chaque rôle : la **vue** (bureau, applications, champs) et les **pages** (template + contenu filtré par les `when`). | `buildView(state, role)`, `page(state, role, url)`, `search(state, role, query)` | le réseau, les règles des nœuds |
| **session** | Cycle de vie de la partie, porte d'entrée unique, **orchestration** : appelle les autres modules dans le bon ordre. | `create`, `start`, `pause`, `end`, `dispatch(input)` | Socket.IO, le protocole IoT, SQLite, le contenu du scénario |
| **connections** | Les tablettes : jeton → appareil → rôle, salles, présence, pages surveillées, aller-retour Socket.IO. | implémente `Clients` : `pushViews()`, `pushPages()`, `notify()` | les règles du jeu |
| **iot** | Dialoguer avec `iot-gateway` (namespace `/iot`), traduire un cue en commandes matérielles, suivre l'état du gateway. | `IotPort` : `cue(name)`, `onDoor()`, `onCode()`, `getSnapshot()` | les règles du jeu |
| **persistence** | Sauvegarder les sessions et le journal. | implémente `Store` : `loadActive()`, `save()`, `append()` | les règles du jeu |
| **app.ts** | Instancier les modules et les brancher entre eux. | — | il ne contient aucune logique |

### Règles de communication

1. **Chaque module expose un seul `index.ts`.** On n'importe jamais un fichier interne d'un autre module.
2. **Un seul orchestrateur : `session`.** `connections` et `iot` *appellent* la session ; la session *appelle* `timeline`, `views`, `persistence`, puis les sorties. Pas de bus d'événements global, où on ne sait plus qui déclenche quoi.
3. **La session ne dépend que d'interfaces** (`Clients`, `Store`, et `cue()` pour l'IoT) déclarées dans `session/ports.ts`. On la teste avec de faux objets, sans réseau.
4. **`timeline` ne connaît pas les pages, et `views` ne connaît des nœuds que `nodesFor` et `hasFired`.** Le contenu et le déroulé évoluent indépendamment.
5. **Ces règles sont vérifiées automatiquement** (dependency-cruiser ou ESLint) : un import interdit casse la CI.

Pour décider où placer une nouvelle fonctionnalité :

| Question | Si oui → |
|---|---|
| Ça change le déroulé ou l'issue de la partie ? | un **type de nœud** (`timeline/nodes/`) + des liens dans le scénario |
| C'est du texte, une image, une page à lire ? | un **YAML** dans `scenarios/` (+ un template s'il n'existe pas) |
| Ça concerne *quand* on a le droit de jouer (statut, pause) ? | **session** |
| C'est une question de protocole ou de transport ? | **connections** ou **iot** |
| Ça ne concerne que l'affichage d'*une* tablette (fenêtre ouverte, défilement) ? | le **front**, sans passer par le serveur |

---

## 5. Le scénario en données

Le moteur ne contient aucune ligne propre à Carbona Racing Team. Un autre scénario = un autre dossier dans `scenarios/`.

### `scenario.yaml` : nœuds et liens

```yaml
id: carbona-racing-team
title: Intrusion chez Carbona Racing Team

nodes:
  browser:
    type: App
    config: { title: Navigateur, app: Browser }
    visibleTo: [master, ops]

  mailDavid:
    type: MailThread
    config: { contact: david.ecnasiol@aerofourneau-consulting.fr }
    allow: [master]          # seul le master peut envoyer
    visibleTo: [master]

  alarmPanel:
    type: PasswordLock
    config: { label: "Boîtier d'alarme SuperSecure", answer: "…" }
    allow: [master]
    visibleTo: [master]

  maelSession:
    type: PasswordLock
    enabled: false
    config: { label: Session Windows de Maël Morin, answer: "…" }
    allow: [master]
    visibleTo: [master]

  alarmOffCue:
    type: IotCue
    config: { cue: alarm-off }     # lumières d'ambiance + arrêt de la sirène (section 12)

links:
  - [alarmPanel.solved, alarmOffCue.play]
  - [alarmPanel.solved, maelSession.enable]
```

### `devices.yaml` : les tablettes

```yaml
tablets:
  - { id: tab-fixe-1, role: master }
  - { id: tab-1,      role: ops }
  - { id: tab-2,      role: ops }
  - { id: poste-mj,   role: gm }
```

Le matériel IoT est décrit dans la configuration de `iot-gateway` (section 12), pas dans le scénario.

Les jetons des tablettes ne sont pas dans le scénario : ils sont fournis par l'environnement (fichier `.env` ou secret Docker).

### `pages/*.yaml` : le contenu des pages

```yaml
url: linkedin.com/in/david-ecnasiol      # identifiant de la page = son URL fictive
template: LinkedInProfile
visibleTo: [master, ops]
when: osintDone.found                     # optionnel : page disponible après cette sortie
data:
  nom: David Ecnasiol
  titre: Fondateur @ Aérofourneau Consulting
  photo: assets/david.jpg
  posts:
    - id: p1
      texte: "Fier de lancer Aérofourneau Consulting !"
    - id: p3
      when: mailDavid.sent                # ce post n'apparaît qu'après le mail du master
      texte: "Certaines entreprises ne respectent pas leurs anciens…"
```

- `when` accepte une sortie (`mailDavid.sent`) ou une liste de sorties, qui doivent alors **toutes** avoir été déclenchées.
- `when` peut figurer sur la page entière ou sur n'importe quel élément d'une liste (post, résultat, paragraphe).
- Le serveur **retire les `when`** et les éléments non disponibles avant d'envoyer la page. Le client reçoit du JSON, jamais de YAML.

### `search.yaml` : le faux Google

```yaml
- query: [david ecnasiol, ecnasiol]       # mots-clés reconnus
  results:
    - { url: aerofourneau-consulting.fr, title: "Aérofourneau Consulting — la startup de David Ecnasiol", snippet: "…" }
    - { url: linkedin.com/in/david-ecnasiol, title: "David Ecnasiol — LinkedIn", snippet: "…" }
    - { url: facebook.com/david.e, title: "Homonymes : David E.", snippet: "…" }
```

### Validation au démarrage

`scenario-loader` refuse de démarrer, avec un message clair, si :

- un nœud a un type inconnu, ou une config qui ne correspond pas à son type ;
- un lien désigne un nœud, une sortie ou une entrée qui n'existe pas ;
- un `when` désigne un nœud qui n'existe pas, ou une sortie que ce nœud ne déclare pas ;
- une page utilise un template inconnu, ou des données qui ne respectent pas le schéma du template ;
- deux pages ont la même URL.

Une faute de frappe dans un YAML est ainsi détectée au démarrage, jamais en pleine partie.

---

## 6. La timeline : nœuds et liens

### Interface d'un type de nœud

```ts
interface NodeType<Config, State> {
  name: string
  outputs: string[]
  init(config: Config): State
  inputs: Handlers | ((config: Config) => Handlers)   // fonction si les noms dépendent de la config (AllOf)
  view?(state: State, config: Config): unknown        // ce que voient les joueurs ; absent = invisible
}

// Dans une entrée :
// ctx.state / ctx.config      → état (modifiable) et config du nœud
// ctx.emit('solved')          → déclenche les liens branchés sur cette sortie
// ctx.effect({ type: 'notify', … }) → effet de bord, exécuté par un adaptateur
// return { ok, message }      → réponse renvoyée à la tablette qui a envoyé la commande
```

Un type de nœud ne connaît que lui-même : ni les autres nœuds, ni les liens, ni les rôles, ni le réseau.

### Propriétés communes à tous les nœuds

Gérées par le moteur, pas par chaque type :

| Propriété | Rôle | Défaut |
|---|---|---|
| `enabled` | Actif au démarrage ? Un nœud inactif est invisible et ignore ses entrées. | `true` |
| `allow` | Rôles joueurs autorisés à **agir** sur le nœud. | aucun |
| `visibleTo` | Rôles joueurs qui **voient** le nœud. Le MJ voit tout. | aucun |

Tous les nœuds ont deux entrées intégrées, **`enable`** et **`disable`**, qu'un joueur ne peut jamais appeler lui-même.

`visibleTo` et `allow` sont deux protections distinctes : la première relève de l'**ergonomie** (le champ n'est pas affiché), la seconde de la **sécurité** (une commande forgée depuis les outils de développement est refusée).

### État de la timeline

```ts
type TimelineState = {
  nodes: Record<string, { enabled: boolean; data: unknown }>
  fired: string[]   // sorties déjà déclenchées : 'alarmPanel.solved', 'mailDavid.sent'…
}
```

`fired` sert aux conditions `when`. C'est la **seule** information que `views` lit dans la timeline, via `hasFired`.

### Boucle d'exécution

```
entrée (tablette, MJ, IoT, timer)
        ↓
 file d'attente (FIFO) ──► nœud.inputs[x](ctx) ──► ctx.emit('sortie') ──► ajoutée à 'fired'
        ↑                                                   │
        └────────────── liens branchés sur cette sortie ◄───┘
        ↓ (file vide)
 { nouvel état, effets, journal }
```

Garde-fous :

1. **Limite de signaux** par action, contre les boucles de liens (A → B → A…).
2. **File FIFO** pour un ordre d'exécution déterministe.
3. **Fonction pure** : l'état reçu n'est jamais modifié ; une erreur annule l'action entière.
4. **Journal** de chaque signal, pour le débogage et la chronologie du débrief.

### Peu de types, très génériques

Le piège serait de créer un type par énigme. On vise une quinzaine de briques réutilisables :

`PasswordLock`, `App`, `MailThread`, `AllOf`, `AnyOf`, `Counter`, `Timer`, `Delay`, `Notify`, `Hint`, `Sound`

Côté IoT : `IotCue` (joue un cue) existe déjà ; les nœuds alimentés par le clavier et la porte sont décrits en section 12.

### Le temps

Le moteur n'appelle jamais `setTimeout`. Un nœud `Timer` produit un effet `schedule` ; la session programme le délai et réinjecte une entrée quand il expire. La timeline reste pure et testable sans attendre.

---

## 7. Sessions

Une seule partie tourne à la fois, mais elle est toujours portée par une session, qui donne un identifiant commun aux logs, à la base et au débrief.

```ts
type Session = {
  id: string          // '2026-11-09_14h30_les-requins'
  teamName: string    // 'Les Requins'
  status: 'lobby' | 'running' | 'paused' | 'ended'
  createdAt: number
  startedAt: number | null
  endedAt: number | null
  state: TimelineState
}
```

```
lobby ──► running ◄──► paused
                │
                ▼
              ended ──► archivée
```

- **L'id combine la date, l'heure et le nom d'équipe.** Le nom seul ne suffit pas : une équipe qui rejoue écraserait son historique.
- **Le MJ crée la session** (nom d'équipe), la lance, la met en pause, la termine. Le serveur refuse d'en ouvrir une nouvelle tant que la précédente n'est pas terminée.
- **Seul le MJ peut agir hors de l'état `running`.** Les commandes des joueurs sont refusées en `lobby` et en `paused`.
- **Chaque ligne de log porte la session** (logger enfant pino `{ session, team }`).
- **Au démarrage, le serveur reprend la session non terminée**, si elle existe.
- **Les tablettes se rattachent automatiquement** à la session active. Sans session, elles affichent « En attente du maître du jeu ». Quand le MJ ouvre une nouvelle session, toutes les tablettes se réinitialisent d'elles-mêmes.

---

## 8. Connexions, rôles et sécurité

### Rôles

| Appareil | Rôle | Nombre | Peut |
|---|---|---|---|
| Tablette fixe commune | `master` | 1 | tout ce qui est **actif** : saisir des mots de passe, envoyer des mails, exfiltrer… |
| Petites tablettes | `ops` | n | tout ce qui est **passif** : naviguer, faire de l'OSINT, craquer un hash en local… |
| Poste animateur | `gm` | 1 | tout voir, tout déclencher, piloter la session |

Le moteur ne compte jamais les tablettes : il parle à des **salles** (`master`, `ops`, `gm`). Passer de 3 à 6 opé ne demande que de modifier `devices.yaml`.

### Identification

1. Chaque tablette est ouverte une fois avec son URL : `/?device=tab-1&token=…`. Le jeton est mémorisé dans le navigateur.
2. À la connexion Socket.IO, la tablette envoie son jeton : `io({ auth: { device, token } })`.
3. `connections` vérifie le jeton, en déduit le rôle et place le socket dans la bonne salle.
4. **Le rôle vient toujours du jeton, jamais d'un champ envoyé par le client.**
5. Si une tablette redémarre, sa nouvelle connexion remplace l'ancienne.

### Règles de sécurité

- **Toute commande est validée côté serveur** (`allow`, statut de la session). Cacher un bouton ne protège rien : c'est un escape game *cyber*, des joueurs ouvriront les outils de développement.
- **Aucun texte de jeu dans un `.vue`.** Tout ce qui est dans le JS est lisible par les joueurs. Le contenu vit dans les YAML du serveur.
- **Aucune solution dans une vue ou une page envoyée** (pas de champ `answer`).
- **Une page indisponible renvoie « introuvable », jamais « interdit »**, pour ne pas confirmer son existence.
- **Une tentative refusée est journalisée** (`WARN`) : en partie réelle, c'est une tentative de triche, utile au débrief.

---

## 9. Protocole Socket.IO

Les types sont définis dans `shared/src/protocol.ts`.

### Client → serveur

| Message | Contenu | Réponse (ack) | Rôle |
|---|---|---|---|
| `cmd` | `{ node, input, payload? }` | `{ ok, message? }` | agir sur un nœud (saisir un code, envoyer un mail…) |
| `page:watch` | `{ url }` | `{ ok: true, page }` ou `{ ok: false }` | ouvrir une page **et** s'abonner à ses mises à jour |
| `page:unwatch` | `{ url }` | — | quitter la page |
| `search` | `{ query }` | `{ results }` | recherche dans le faux Google |
| `gm:*` | `create`, `start`, `pause`, `resume`, `end`, `force` | `{ ok, message? }` | console MJ uniquement |

### Serveur → client

| Message | Contenu | Quand |
|---|---|---|
| `view` | `ViewState` complet pour le rôle | à la connexion, puis après chaque changement |
| `page:update` | `PageView` complète | quand une page surveillée par la tablette a changé |
| `notify` | `{ message }` | message ponctuel (toast) |

### Formes des données

```ts
type ViewState = {
  role: Role
  session: SessionInfo | null
  nodes: NodeView[]          // ce que la tablette voit : applications, champs de saisie…
}

type NodeView = { id: string; type: string; data: unknown }

type PageView = {
  url: string
  template: string           // nom du template à utiliser côté front
  data: unknown              // conforme au schéma du template, déjà filtré
}
```

### Principes

- **Toujours l'état complet, jamais des différences.** Une vue ou une page fait quelques Ko. Une tablette qui redémarre reçoit tout et se retrouve exactement où elle en était.
- **L'abonnement à une page renvoie son contenu actuel.** Pas de fenêtre de course entre « je lis » et « je m'abonne ».
- **Après chaque action**, le serveur recalcule les vues de chaque salle et les pages surveillées par au moins une tablette, puis renvoie celles qui ont changé.

---

## 10. Front : l'application monopage

### Chargement

```
GET /  (une seule fois)
  └─► index.html (quasi vide : <div id="app">) + app.js compilé par Vite
        └─► app.js est le « client embarqué » :
              il ouvre le WebSocket, reçoit les données et construit le HTML
```

### Les couches

```
┌──────────────────────────────────────────────────────────────┐
│ network/       le SEUL module qui connaît Socket.IO          │
│                ouvre la connexion, envoie, reçoit            │
└──────────────────────────┬───────────────────────────────────┘
                           ▼ remplit
┌──────────────────────────────────────────────────────────────┐
│ state/         dernière vue reçue, pages ouvertes            │
└──────────────────────────┬───────────────────────────────────┘
                           ▼ lu par
┌──────────────────────────────────────────────────────────────┐
│ shells/  os/  apps/  templates/                              │
│                transforment les données en HTML              │
│                pour agir : appellent une fonction de network/│
└──────────────────────────────────────────────────────────────┘
```

| Couche | Connaît Socket.IO ? | Responsabilité |
|---|---|---|
| `network/` | **oui, et lui seul** | connexion, envoi des commandes, réception des vues et des pages |
| `state/` | non | garder la dernière vue et le contenu des pages ouvertes |
| `shells/` | non | choisir l'écran selon le rôle et le statut : attente, bureau, console MJ |
| `os/` | non | simuler le système : bureau Windows, fenêtres, barre des tâches |
| `apps/` | non | les applications du bureau : navigateur, mail, cracker, shell |
| `templates/` | non | mettre en page un contenu : profil LinkedIn, article, site d'entreprise… |

Si on change un jour de protocole, seul `network/` est modifié.

### L'assemblage template + contenu

Un **registre** associe chaque nom de template à son composant :

```ts
// client/src/registry.ts
export const TEMPLATES = { LinkedInProfile, Article, CompanySite, SearchResults /* … */ }
```

Le navigateur du jeu demande une page et l'affiche avec le bon template :

```vue
<component v-if="page" :is="TEMPLATES[page.template]" :data="page.data" />
<Page404 v-else-if="introuvable" />
```

Un template ne fait que de la mise en page :

```vue
<!-- client/src/templates/LinkedInProfile.vue -->
<script setup lang="ts">
import type { LinkedInProfileData } from '@escape/shared'
defineProps<{ data: LinkedInProfileData }>()
</script>

<template>
  <header>{{ data.nom }} — {{ data.titre }}</header>
  <TransitionGroup name="post" tag="section">
    <article v-for="post in data.posts" :key="post.id">{{ post.texte }}</article>
  </TransitionGroup>
</template>
```

Grâce au `:key`, quand la page entière est renvoyée avec un post de plus, Vue n'ajoute que le nouveau post : rien ne clignote, la position de lecture est conservée.

### Le contrat entre YAML et template

Chaque template a un **schéma** dans `shared/src/templates/`. Il sert deux fois :

- **côté serveur**, `scenario-loader` valide chaque YAML de page contre ce schéma au démarrage ;
- **côté front**, le `.vue` en tire le type de ses props.

Si quelqu'un renomme un champ d'un côté, l'autre côté casse à la compilation ou au démarrage, jamais en pleine partie.

### Ce qui reste local à une tablette

Les fenêtres ouvertes et leur position, la page courante du navigateur, l'historique de navigation, le menu Démarrer, l'horloge. Rien de tout ça ne passe par le serveur.

---

## 11. Cycle complet d'une page

Exemple : une opé lit le LinkedIn de David quand un nouveau post apparaît.

```
Tablette opé                                         Serveur
────────────                                         ───────
GET /                     ─────────────────────►     index.html + app.js
socket connect (jeton)    ─────────────────────►     connections : jeton → ops → salle 'ops'
                          ◄─────────────────────     'view' : applications disponibles

tape linkedin.com/in/david-ecnasiol
'page:watch' { url }      ─────────────────────►     views.page(état, ops, url)
                                                     → page dispo pour ops ? when OK ?
                                                     → retire les posts non débloqués
                          ◄─────────────────────     ack { template: 'LinkedInProfile', data: {…, posts: [p1]} }
Vue affiche <LinkedInProfile>

        … le master envoie le mail à David
        'cmd' { node: 'mailDavid', input: 'send' } ──► session.dispatch
                                                     → timeline : mailDavid émet 'sent' → ajouté à fired
                                                     → views : la page david-linkedin a changé

                          ◄─────────────────────     'page:update' { url, data: {…, posts: [p1, p3]} }
Vue ajoute le post p3

quitte la page
'page:unwatch' { url }    ─────────────────────►     plus de mises à jour pour cette page
```

---

## 12. IoT

> Partie conçue et implémentée par le responsable IoT de l'équipe.

### 12.1 Principe : Socket.IO + `iot-gateway`

Le serveur reste la **source de vérité**. Le `iot-gateway` est un exécuteur matériel : il ne décide rien du scénario.

- Le serveur expose un seul HTTP/Socket.IO, avec le namespace `/iot` pour le gateway.
- Le gateway s'authentifie avec `IOT_GATEWAY_TOKEN` (variable d'environnement, aussi passée dans `docker-compose.yml`).
- `shared/src/iot-protocol.ts` contient le contrat filaire (export `@escape/shared/iot`).
- `server/src/iot/port.ts` contient l'interface serveur `IotPort`.
- `server/src/iot/cues.ts` contient les cues du scénario, côté serveur uniquement.
- Le gateway n'importe que `@escape/shared/iot` : il ne connaît ni `CueName`, ni `CUES`, ni `IotPort`.

### 12.2 Protocole

| Événement | Sens | Rôle |
|---|---|---|
| `HELLO` | gateway → serveur | annonce `gatewayId`, version, devices, état réel |
| `WELCOME` | serveur → gateway | `sessionId` et `desiredState` |
| `COMMAND` | serveur → gateway | commande précise `light` ou `audio`, avec `commandId` |
| `COMMAND_ACK` | gateway → serveur | résultat de la commande et état réel des sorties |
| `EVENT` | gateway → serveur | événements `door` et `code` |
| `EVENT_ACK` | serveur → gateway | réponse uniquement au code |
| `STATE` | gateway → serveur | état réel complet |

Règles :

- une commande est une `Promise` côté serveur, corrélée par `commandId` ;
- deux acks distincts : `COMMAND_ACK` pour les commandes, `EVENT_ACK` pour le code ;
- la porte et le mouvement sont fire-and-forget, sans ack ;
- il n'y a pas d'événement audio gateway → serveur : l'audio est une commande, et son état réel remonte via `STATE` ;
- la porte est un capteur d'entrée, jamais dans `desiredState` ;
- `IotDesiredState` contient uniquement les sorties : `lights` et `audio` ;
- `IotDeviceState = IotOutputState & IotInputState`.

Les cues sont résolus côté serveur. Par exemple `alarm` devient :

```ts
[
  { type: 'light', action: 'scene', scene: 'alarm' },
  {
    type: 'audio',
    action: 'play',
    audio: { track: 'alarm.mp3', volume: 80, loop: true },
  },
]
```

Le gateway ne reçoit que ces commandes précises, jamais le nom du cue.

### 12.3 Le gateway et le matériel

Le gateway peut tourner sur le même serveur physique que le serveur principal ou sur un Raspberry Pi. Le protocole ne change pas : seule la couche devices change.

Le gateway est un seul processus Node. Il instancie ses devices via de la configuration :

```ts
type GatewayConfig = {
  gatewayId: string
  serverUrl: string
  token: string

  light: { driver: 'wled'; url: string }
  audio: { driver: 'mpv'; device?: string }
  door: { driver: 'gpio' | 'http' | 'mqtt'; pin?: number; endpoint?: string }
  keypad: { driver: 'http'; port: number }
}
```

- **Lumières** : WLED en HTTP/WiFi.
- **Audio** : driver `mpv` générique pour l'instant. L'enceinte filaire ou USB est recommandée : elle reste proche de l'hôte qui exécute `mpv`. La sortie est configurable (`device`), avec la sortie par défaut comme fallback. Un driver Bluetooth ou WiFi/Chromecast pourra être ajouté plus tard derrière la même interface `AudioDevice`.
- **Clavier ESP32** : envoie le code au gateway via un endpoint HTTP local. Le gateway émet un `EVENT` de type `code`, attend l'`EVENT_ACK`, puis renvoie l'affichage au clavier.
- **Porte** : capteur magnétique de type contact reed switch. Il indique `open` ou `closed`. Sur Raspberry Pi, il peut être lu directement sur un GPIO. Sans Pi, un ESP32 lit le capteur et envoie l'événement au gateway en HTTP ou MQTT.

Lancement en développement : `npm run dev:gateway` (devices factices disponibles dans `iot-gateway/src/devices/fake.ts`).

### 12.4 Raccordement avec le moteur

Le moteur ne voit que l'interface `IotPort`. Le raccordement se fait dans `app.ts` (aujourd'hui `server/src/index.ts`), comme pour les autres modules.

| Sens | Côté IoT | Côté moteur | État |
|---|---|---|---|
| moteur → objets | `IotPort.cue(name)` | un nœud `IotCue` produit l'effet `{ type: 'cue', name }` ; la session appelle `Outputs.cue(name)` | ✅ nœud, effet et sortie en place ; branchement sur `IotPort` à faire |
| clavier → moteur | `IotPort.onCode(handler)` | le handler appelle `session.dispatch` sur un nœud `PasswordLock` (acteur `iot`) ; `ok` → `accepted`, `message` → `display` | ⏳ |
| porte → moteur | `IotPort.onDoor(handler)` | le handler appelle `session.dispatch` sur un nœud capteur (à créer), qui émet `opened` / `closed` | ⏳ |
| session → gateway | `getSessionId()`, `getDesiredState()` | l'id vient de la session active ; l'état désiré découle des cues joués | ⏳ (valeurs temporaires dans `index.ts`) |
| supervision | `getSnapshot()`, `onGatewayStatus()` | affichés dans la console MJ | ⏳ |

### 12.5 Points encore ouverts

- Sémantique exacte de `null` dans `IotDesiredState` : « éteint/arrêté » ou « ne rien changer ».
- `IotStateReport` existe dans `shared`, mais l'adapter serveur attend actuellement `IotDeviceState` pour `STATE`.
- Pour l'instant un seul gateway est pris en charge ; le serveur sélectionne le premier socket connecté.
- La reprise audio après reconnexion ne gère pas encore de position dans la piste.

### 12.6 Perspective MQTT (information)

Ce qui suit décrit une cible envisagée si les ESP32 doivent un jour parler directement au serveur. Ce n'est pas l'état actuel de l'implémentation.

Socket.IO sur ESP32 est fragile : les bibliothèques sont peu maintenues et suivent mal les versions du protocole Engine.IO. MQTT apporterait :

- des bibliothèques solides côté ESP32 (PubSubClient, ou `mqtt` en MicroPython) ;
- un **Last Will** : le broker annonce lui-même qu'un appareil s'est déconnecté ;
- un débogage simple avec MQTT Explorer ;
- un conteneur `eclipse-mosquitto` et le paquet npm `mqtt` côté serveur.

Topics envisagés :

```
escape/dev/<deviceId>/cmd      serveur → appareil   {"action":"unlock"}
escape/dev/<deviceId>/event    appareil → serveur   {"type":"opened"}
escape/dev/<deviceId>/status   online/offline (retained + Last Will)
```

Les appareils resteraient des capteurs et des actionneurs, sans logique de scénario : la passerelle traduit un `event` en commande pour le moteur, exactement comme le fait aujourd'hui l'adapter Socket.IO.

---

## 13. Exploitation

### Console MJ

- créer la session (nom d'équipe), la lancer, la mettre en pause, la terminer ;
- déclencher n'importe quelle entrée de n'importe quel nœud (forcer une étape, ouvrir la boîte à la main…) ;
- voir les tablettes connectées, l'état du gateway IoT (`getSnapshot`) et le journal en direct.

Le jour J, si un objet ou une tablette plante, c'est la console MJ qui sauve la partie.

### Persistance (SQLite)

- `sessions` : une ligne par partie (id, équipe, statut, dates, état de la timeline) ;
- `journal(session_id, at, …)` : chaque commande et chaque signal, horodatés ;
- l'état est sauvegardé après chaque action : un redémarrage du serveur ne perd rien ;
- le journal fournit la **chronologie du débrief** (« à 14h32 vous avez trouvé le mail de David… »).

---

## 14. Stack

| Couche | Choix |
|---|---|
| Serveur | Node + TypeScript, Express (fichiers statiques), Socket.IO |
| Front | Vue 3 + Vite, application monopage |
| Contrats | `shared/` : types du protocole, schémas des templates |
| Validation | `zod` (YAML au démarrage, messages entrants) |
| Format du scénario | YAML (`yaml` côté serveur uniquement) |
| Logs | pino, logger enfant par session |
| IoT | processus `iot-gateway` (Node) relié en Socket.IO `/iot` ; MQTT envisagé plus tard (section 12) |
| Persistance | SQLite (`better-sqlite3`) |
| Tests | `node:test` lancé via `tsx` |
| Cloisonnement | dependency-cruiser ou ESLint (règles d'import entre modules) |

---

## 15. État actuel et plan de migration

### Ce qui existe déjà

- **Moteur** : un premier moteur fonctionne et est testé (`npm test`, `npm run demo`), avec l'ancien vocabulaire « élément / câble » et un scénario écrit en TypeScript.
- **IoT** : l'adaptateur serveur (`server/src/iot/`) et le processus `iot-gateway` fonctionnent avec des devices factices, et sont testés (section 12).
- **Front** : les pages de la porte magnétique et de l'alarme SuperSecure existent déjà, sous forme de composants `.vue` avec leur texte en dur.

| Code actuel | Devient |
|---|---|
| `server/src/engine/` (éléments + câbles) | `server/src/modules/timeline/` (nœuds + liens), avec `fired` et `hasFired` en plus |
| `server/src/elements/*.ts` | `server/src/modules/timeline/nodes/*.ts` ; `Tool` devient `App` |
| `server/src/scenarios/demo.ts` | `scenarios/demo/scenario.yaml` |
| `scenarios/scenario1_red_team/carbona_racing_team.yml` (amorce) | `scenarios/scenario1_red_team/scenario.yaml` + `pages/` + `search.yaml` |
| `server/src/iot/` | `server/src/modules/iot/` : simple déplacement, à valider avec le responsable IoT |
| `server/src/session/` | `server/src/modules/session/` |
| `server/src/persistence/MemorySessionRepo.ts` | `server/src/modules/persistence/`, plus une version SQLite |
| `server/src/game.ts`, `realtime.ts`, `POST /api/answer` | supprimés, remplacés par `connections/` |
| `client/src/services/socket.ts` | `client/src/network/` |
| `client/src/components/FakeGoogle.vue` | application `apps/Browser` + template `SearchResults` alimenté par `search.yaml` (le texte en dur disparaît) |
| `client/src/components/BureauWindows.vue` | `os/`, avec des icônes construites à partir de la vue |
| `client/src/components/FakeAlarme*.vue`, `FakePorteMagnetique*.vue`, `FakeSite.vue` + `client/src/data/fakeSite.ts` | des **templates** génériques (`templates/`) + un **YAML par page** dans `scenarios/…/pages/` ; la mise en page et le CSS sont conservés, seul le texte part dans le YAML |

### Ordre de construction

Chaque étape produit quelque chose qui fonctionne et se teste.

| # | Étape | Livrable vérifiable |
|---|---|---|
| 1 | Réorganiser en modules + renommer (nœuds, liens) + `fired` / `hasFired` | Les tests existants passent toujours |
| 2 | `scenario-loader` : scénario de démo en YAML, validation complète | Une faute de frappe dans le YAML empêche le démarrage, avec un message clair |
| 3 | `views` : pages YAML, conditions `when`, schémas de templates dans `shared/` | Tests : une page n'apparaît qu'après la bonne sortie |
| 4 | `connections` : jetons, salles, `cmd`, `view`, `page:watch` / `page:update` | Deux onglets (master et opé) reçoivent des vues différentes |
| 5 | Front : `network/`, `state/`, coquilles par rôle, bureau piloté par la vue, navigateur + 1 template | Un post LinkedIn apparaît en direct quand le master agit |
| 6 | Console MJ | Créer, lancer, mettre en pause ; forcer une entrée |
| 7 | SQLite | Redémarrage du serveur en pleine partie : tout revient |
| 8 | Raccordement IoT dans `app.ts` : `cue()`, `onCode()`, `onDoor()` (section 12.4) | Avec `iot-gateway` et ses devices factices : le bon code au clavier fait avancer la timeline |
| 9 | Le vrai scénario Carbona Racing Team en YAML + ses pages | Partie jouable de bout en bout |
