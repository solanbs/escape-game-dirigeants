# Architecture

> **Ce que le système est** : décisions, modules, formats de fichiers, protocole.
> Pour **le construire** : [plan-back.md](./plan-back.md). Pour **deux parcours de bout en bout** : [exemples-user-stories.md](./exemples-user-stories.md). Pour **écrire les pages** : [format_pages.md](./format_pages.md).

---

## Les décisions de base

1. **Le moteur prend en entrée un dossier de scénario** :
   - le **scénario** (*ce qui se passe*) : `scenario.yaml` (nœuds + liens), `pages/`, `indices/`, `search.yaml` ;
   - la **config du scénario** (*comment on le joue*) : `config.yaml` (rôles, mots de passe, nombre de joueurs).

   La **config technique** de l'installation (port, dossier de scénario, mot de passe du MJ, jeton IoT) est dans `.env`.
2. **Les rôles sont définis dans `config.yaml`.** Le code n'en connaît aucun.
3. **Le MJ n'est pas un rôle** : c'est un acteur privilégié (l'équivalent de `root`), géré nativement par le moteur dans le module `gm`. Il voit tout, peut tout déclencher, et n'apparaît dans aucun fichier du scénario.
4. **Une tablette se connecte avec le mot de passe d'un rôle**, puis garde un jeton de reconnexion.
5. **La visibilité s'écrit avec une seule clé, `visible`** (`roles`, `after`, `before`), sur une page, une partie de page ou un nœud.
6. **Un journal unique**, natif du moteur : tout y est écrit, chacun n'en voit que ce qui lui est adressé.
7. **Le back est découpé en modules autour d'un point central, la session.** Aucun module ne parle directement à un autre.
8. **Le serveur fait autorité** : les tablettes envoient des commandes, le serveur vérifie tout et renvoie l'état. Aucune solution ni aucun contenu de jeu n'est dans le code du front.

---

## 1. Vocabulaire

**Le jeu**

| Terme | Définition |
|---|---|
| **Nœud** | Une brique du déroulé : champ de mot de passe, application, mail, cue IoT, porte logique… Il a des **entrées**, des **sorties** et un **état**. |
| **Type de nœud** | Le comportement d'une catégorie de nœuds (`PasswordLock`, `App`, `AllOf`…), écrit une fois en TypeScript. |
| **Lien** | Relie la sortie d'un nœud à l'entrée d'un autre : `alarmPanel.solved → maelSession.enable`. |
| **Sorties déclenchées** (`fired`) | La liste de tout ce qui s'est passé depuis le début : `['alarmPanel.solved', 'mailDavid.sent']`. |
| **Page** | Ce qu'on voit dans le navigateur du jeu : un **template** (`.vue`, la mise en page) + un **contenu** (YAML). |
| **Gabarit** | Un YAML vierge de `templates/pages/`, à copier pour écrire une page. |
| **Vue** (`ViewState`) | Ce qu'une tablette voit de la partie : son écran, ses applications, ses champs de saisie. |
| **Journal** | La liste unique de tout ce qui se passe, filtrée pour chacun. |
| **Indice** | Une entrée de journal envoyée par le MJ, préparée (`indices/`) ou écrite à la main. |
| **Session** | Une partie, identifiée par la date et le nom d'équipe. |

**Le réseau**

| Terme | Définition |
|---|---|
| **Socket** | Une connexion **qui reste ouverte** entre une tablette et le serveur (Socket.IO). Les deux côtés peuvent s'envoyer des messages à tout moment. |
| **Message** | Ce qu'un côté envoie à l'autre : un nom (`page:watch`) et un contenu (`{ url }`). |
| **Réponse directe** (« ack ») | La réponse du serveur à **la seule tablette** qui a posé la question. |
| **Salle** (« room ») | Un groupe de sockets. Un rôle = une salle ; on peut écrire à toute une salle d'un coup. |
| **Jeton de reconnexion** | Donné par le serveur à une tablette acceptée. La tablette le renvoie après un redémarrage pour retrouver son rôle. |

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
  tablette fixe  tablettes      poste MJ              │   iot-gateway   │  même machine
                 joueurs                              │     (Node)      │  ou Raspberry Pi
  chacune se connecte avec un mot de passe            └────────┬────────┘
                                                WLED · audio (mpv) · clavier ESP32 · porte
```

- **Production** : le front est compilé par Vite dans l'image Docker, puis servi par Express.
- **Développement** : Vite tourne à côté (port 5173) et redirige `/socket.io` vers le serveur (port 3000).
- **Aucune dépendance à Internet** : toutes les pages « web » sont fictives.
- **Config technique** (`.env`) :

  ```bash
  PORT=3000
  SCENARIO_DIR=scenarios/scenario1_red_team   # dossier de scénario à charger
  GM_PASSWORD=…                               # mot de passe du MJ, quel que soit le scénario
  IOT_GATEWAY_TOKEN=…
  ```

---

## 3. Organisation des sources

| Nature | Dossiers | Qui y touche |
|---|---|---|
| **Données** | `scenarios/`, `templates/pages/` | game designers (YAML uniquement) |
| **Contrats** | `shared/` | développeurs back et front, ensemble |
| **Code** | `server/`, `client/`, `iot-gateway/` | développeurs |

```
scenarios/<nom>/
  scenario.yaml             le déroulé : nœuds + liens
  pages/*.yml               une page par fichier (format_pages.md)
  indices/*.yml             les indices préparés pour le MJ
  search.yaml               les recherches du faux Google
  config.yaml               rôles, mots de passe, nombre de joueurs
  assets/                   images des pages

templates/pages/*.yml       gabarits vierges, un par template

shared/src/
  protocol.ts               messages Socket.IO, ViewState, PageView, sessions
  templates/*.ts            forme du `data` de chaque template de page
  journal/*.ts              forme du contenu de chaque type d'entrée de journal
  iot-protocol.ts           contrat serveur ↔ iot-gateway (@escape/shared/iot)

server/src/
  index.ts                  assemble les modules, aucune logique
  logger.ts
  modules/
    session/                le point central
    timeline/  (+ nodes/)   le moteur et les types de nœuds
    views/                  ce que voit chaque rôle (vues, pages, journal)
    scenario-loader/        lit et vérifie le dossier de scénario
    connections/            les tablettes
    gm/                     le MJ
    persistence/            sauvegarde des sessions et du journal
    iot/                    adaptateur IoT (section 11)

iot-gateway/src/            processus qui pilote le matériel (section 11)

client/src/
  network/                  le SEUL module qui parle au serveur
  state/                    dernière vue reçue, pages ouvertes, journal
  shells/                   connexion, attente, bureau, console MJ
  os/                       bureau Windows, fenêtres, barre des tâches
  apps/                     navigateur, mail, cracker, shell, fenêtre Journal
  templates/                un .vue par template de page
  journal/                  un .vue par type d'entrée de journal
```

---

## 4. Le back : les modules

```
                          ┌───────────────────┐
                          │  scenario-loader  │ ◄── scenarios/<nom>/ (au démarrage)
                          └─────────┬─────────┘
                                    │ scénario + config vérifiés
                                    ▼
  ┌──────────────┐         ┌───────────────────┐         ┌──────────────┐
  │ connections  │◄───────►│      SESSION      │◄───────►│     iot      │
  │ (tablettes)  │         │   point central   │         │ (section 11) │
  └──────────────┘         └─┬──────┬──────┬─┬─┘         └──────────────┘
                             │      │      │ └──────────────────┐
                ┌────────────┘      │      └──────┐             │
                ▼                   ▼             ▼             ▼
        ┌──────────────┐    ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
        │   timeline   │    │    views     │ │ persistence │ │      gm      │
        │ (nœuds +     │    │ (ce que voit │ │ (sauvegarde)│ │   (le MJ)    │
        │  liens)      │    │  chacun)     │ │             │ │              │
        └──────────────┘    └──────────────┘ └─────────────┘ └──────────────┘
```

| Module | Responsabilité | Ce qu'il expose | Ne sait rien de… |
|---|---|---|---|
| **index.ts** | Créer les modules et les brancher. | — | toute logique de jeu |
| **session** | Le point central : reçoit toutes les demandes, vérifie qu'elles sont permises (partie lancée ? en pause ?), appelle les modules dans l'ordre, écrit dans le journal, prévient les sorties. | `create`, `start`, `pause`, `resume`, `end`, `dispatch`, `page`, `viewFor` | Socket.IO, le protocole IoT, les fichiers |
| **timeline** | Faire avancer le déroulé : vérifier `allow`, faire tourner les nœuds, suivre les liens, mémoriser `fired`, produire des effets. **Pur**, sans I/O. | `createEngine(scénario)` → `init`, `run` | les pages, le réseau, le stockage |
| **views** | Construire ce que voit un rôle : sa vue, les pages, les résultats du faux Google et le journal, filtrés par `visible` et `pour`. Expliquer la visibilité d'une page (utilisé pour le tableau de bord du MJ). | `view`, `page`, `search`, `journalFor`, `explain` | le réseau, la timeline, le MJ |
| **scenario-loader** | Lire le dossier de scénario et **tout vérifier au démarrage** (section 5.7). | `loadScenario(dossier)` | l'exécution de la partie |
| **connections** | Les tablettes : mot de passe → rôle, places par rôle, jetons, salles, pages regardées, aller-retour des messages. | les sorties de la session : `pushViews`, `pagesChanged`, `journalAdded` | les règles du jeu |
| **gm** | **Le seul module qui connaît le MJ** : son mot de passe, ses commandes, ses indices, son tableau de bord, le « voir comme… » (section 8). | `isGm`, `indice`, `dashboard`, `seeAs` | le réseau, les fichiers |
| **persistence** | Sauvegarder les sessions et le journal. | `loadActive`, `save`, `appendJournal` | les règles du jeu |
| **iot** | Dialoguer avec `iot-gateway` (section 11). | `IotPort` : `cue`, `onDoor`, `onCode`, `getSnapshot` | les règles du jeu |

**Règles**

1. **Chaque module expose un seul `index.ts`** ; on n'importe jamais un fichier interne d'un autre module.
2. **Tout passe par la session.** `connections` et `iot` l'appellent ; elle appelle `timeline`, `views`, `gm`, `persistence`. Pas de bus d'événements global.
3. **La session ne dépend que d'interfaces** (`modules/session/ports.ts`) : on la teste avec de faux objets, sans réseau.
4. **`timeline` ne connaît pas les pages ; `views` ne connaît pas la timeline** : la session donne `fired` à `views`.
5. **Seul `gm` connaît le MJ.** Le moteur sait seulement qu'un acteur privilégié (`Actor` de type `gm`) peut tout déclencher.

**Où placer une nouvelle chose ?**

| Si ça… | → |
|---|---|
| change le déroulé ou l'issue de la partie | un type de nœud (`timeline/nodes/`) + des liens dans `scenario.yaml` |
| est un texte, une image, une page à lire | un YAML dans `pages/` (+ un template s'il manque) |
| doit s'écrire dans le journal des joueurs quand le scénario avance | `journal:` sur le nœud |
| est un indice que le MJ pourra envoyer | un YAML dans `indices/` |
| concerne les joueurs, les rôles, leurs mots de passe | `config.yaml` |
| concerne ce que le MJ voit ou peut faire | le module `gm` |
| concerne *quand* on a le droit de jouer (pause…) | la session |
| est une question de transport | `connections` ou `iot` |
| ne concerne que l'affichage d'*une* tablette | le front, sans le serveur |

---

## 5. Le dossier de scénario

Le moteur ne contient aucune ligne propre à Carbona Racing Team : un autre scénario = un autre dossier.

### 5.1 Scénario et config

| | Le scénario : *ce qui se passe* | La config : *comment on le joue* |
|---|---|---|
| Fichiers | `scenario.yaml`, `pages/`, `indices/`, `search.yaml` | `config.yaml` |
| Contient | nœuds, liens, pages, indices, recherches, conditions `visible`, entrées `journal:` | rôles : mot de passe, écran, nombre de joueurs |
| Change quand… | on modifie l'histoire | on adapte la partie à un groupe |

Le scénario **utilise** les noms de rôles ; la config les **définit**. Le serveur vérifie au démarrage que les deux correspondent.

### 5.2 `scenario.yaml` : le déroulé

```yaml
id: carbona-racing-team
title: Intrusion chez Carbona Racing Team

nodes:
  browser:
    type: App
    config: { title: Navigateur, app: Browser }
    visible: { roles: [master, ops] }

  alarmPanel:
    type: PasswordLock
    config: { label: "Boîtier d'alarme SuperSecure", answer: "…" }
    allow: [master]                 # qui peut agir
    visible: { roles: [master] }    # qui voit
    journal:                        # ce qui s'écrit dans le journal quand une sortie est déclenchée
      solved: { texte: "Alarme désactivée à {heure}.", pour: { roles: [master, ops] }, notifier: true }

  maelSession:
    type: PasswordLock
    enabled: false                  # inactif tant que l'alarme n'est pas coupée
    config: { label: Session Windows de Maël Morin, answer: "…" }
    allow: [master]
    visible: { roles: [master] }

  alarmOffCue:
    type: IotCue
    config: { cue: alarm-off }

links:
  - [alarmPanel.solved, alarmOffCue.play]
  - [alarmPanel.solved, maelSession.enable]
```

### 5.3 `pages/*.yml` et `search.yaml`

Le format complet, les templates disponibles et les blocs sont décrits dans [format_pages.md](./format_pages.md). Ce que le moteur en utilise :

```yaml
url: linkedin.com/in/david-ecnasiol        # identifiant unique (barre d'adresse)
template: LinkedInProfile                  # mise en page côté front
visible: { roles: [master, ops] }          # qui peut ouvrir la page, et quand
onglet: { icone: "💼" }
data:                                      # contenu transmis au template
  activite:
    - id: p3
      visible: { after: mailDavid.sent }   # une partie de page qui apparaît en cours de partie
      texte: "Certaines entreprises ne respectent pas leurs anciens…"
```

Le serveur filtre la page pour chaque rôle, retire les clés `visible`, et envoie du JSON. Le navigateur ne voit jamais de YAML ni de partie non débloquée.

**Le faux Google est le seul moteur de recherche du jeu.** Les barres de recherche des autres sites (Facebook, articles…) sont décoratives. `search.yaml` associe des mots-clés à des résultats (`url`, titre, extrait), et le moteur côté serveur fonctionne ainsi :

1. **Il normalise la saisie** : minuscules, sans accents, sans apostrophes ni tirets (`Prud'hommes` → `prudhommes`), ponctuation remplacée par des espaces, espaces multiples réduits.
2. **Il compare la saisie à chaque mot-clé** : un mot-clé correspond si **tous ses mots** apparaissent dans la saisie, **dans n'importe quel ordre** et au milieu d'autres mots. « le procès de Carbona » correspond donc à `carbona proces`. Un mot-clé écrit entre `/…/` est une **expression régulière**, appliquée à la saisie normalisée, pour les variantes et fautes de frappe courantes (`/prud.?hom/`).
3. **Il garde la recherche la plus précise** : si plusieurs recherches correspondent, celle dont le mot-clé reconnu contient le plus de mots l'emporte ; en cas d'égalité, la première du fichier.
4. **Il filtre les résultats** : un résultat n'est montré que si sa page est visible pour la tablette. Sans correspondance, « Aucun résultat ».

Les mots-clés restent sur le serveur : la tablette envoie sa saisie (`search`) et reçoit seulement les résultats. La façon d'écrire les mots-clés est décrite dans [format_pages.md](./format_pages.md).

### 5.4 `indices/*.yml`

```yaml
- id: alarme-1
  type: indice                          # type d'entrée de journal → template côté front
  pour: { roles: [master, ops] }        # destinataires proposés (le MJ peut changer)
  notifier: true                        # affiché à l'écran en plus du journal
  utile: { before: alarmPanel.solved }  # mis en avant dans la console MJ tant que c'est vrai
  data:
    titre: "Une marque, un boîtier…"
    texte: "Les codes d'usine sont souvent publiés dans les guides de mise en service."
```

Le MJ peut envoyer un indice préparé (et le modifier) ou en écrire un à la main.

### 5.5 `config.yaml`

```yaml
roles:
  master:
    mot_de_passe: "x"
    ecran: bureau
    joueurs: { min: 1, max: 1 }
  ops:
    mot_de_passe: "y"
    ecran: bureau
    joueurs: { min: 1, max: 6 }
```

- `ecran` : l'écran que le front affiche pour ce rôle.
- `joueurs.max` : au-delà, une nouvelle tablette de ce rôle est refusée.
- Ajouter un rôle = l'ajouter ici, puis l'utiliser dans `visible`, `allow`, `pour`. Aucun code à modifier.
- Le MJ n'est pas ici : son mot de passe est dans `.env`.

### 5.6 La visibilité : `visible`

| Mot | Sens | Vrai quand… |
|---|---|---|
| `roles` | **qui** voit | le rôle de la tablette est dans la liste |
| `after` | **apparaît** quand… | la ou les sorties indiquées ont été déclenchées |
| `before` | **disparaît** quand… | la ou les sorties indiquées ne l'ont **pas encore** été |

Toutes les conditions présentes doivent être vraies. Avec une **liste** de règles, une seule suffit.

| Besoin | Écriture |
|---|---|
| visible par master et ops | `visible: { roles: [master, ops] }` |
| apparaît en cours de partie | `visible: { roles: [master, ops], after: alarmPanel.solved }` |
| disparaît en cours de partie | `visible: { roles: [master, ops], before: carbona.nettoyage }` |
| plus tôt pour le master que pour les ops | `visible: [ { roles: [master] }, { roles: [ops], after: mailDavid.sent } ]` |
| une partie qui en remplace une autre | ancienne : `visible: { before: X }` ; nouvelle : `visible: { after: X }` |

- Une partie n'est visible que si ce qui la contient l'est ; sans `roles`, elle reprend ceux de la page.
- Sur une page ou un nœud, `roles` est **obligatoire** : sans `roles`, personne ne voit rien.
- Le MJ voit tout et n'est jamais cité.
- Limite : apparaître, disparaître puis réapparaître n'est pas possible (`fired` ne fait que s'accumuler). Si besoin, on ajoutera un nœud « interrupteur ».

### 5.7 Vérifications au démarrage

Le serveur refuse de démarrer, en nommant le fichier à corriger, si :

- un nœud a un type inconnu ou une config qui ne correspond pas à son type ;
- un lien, un `after`, un `before`, un `utile` ou une entrée `journal:` cite un nœud ou une sortie qui n'existe pas ;
- un rôle cité (`visible`, `allow`, `pour`) n'est pas défini dans `config.yaml` ;
- une page a un template inconnu, un `data` qui ne respecte pas le schéma du template, ou pas de `roles` ;
- deux pages ont la même `url`, ou un résultat de `search.yaml` cite une `url` inconnue ;
- une expression régulière de `search.yaml` est invalide ;
- deux rôles ont le même mot de passe, ou un rôle n'en a pas.

---

## 6. La timeline

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
// ctx.state / ctx.config         état (modifiable) et config du nœud
// ctx.emit('solved')             déclenche les liens branchés sur cette sortie
// ctx.effect({ type: 'cue', … }) effet de bord, transmis par la session au bon module
// return { ok, message }         réponse renvoyée à la tablette qui a envoyé la commande
```

Un type de nœud ne connaît que lui-même : ni les autres nœuds, ni les liens, ni les rôles, ni le réseau.

### Propriétés communes à tous les nœuds

Gérées par le moteur :

| Propriété | Rôle | Défaut |
|---|---|---|
| `enabled` | Actif ? Un nœud inactif est invisible et ignore ses entrées. Les entrées intégrées `enable` / `disable` le changent (jamais appelables par un joueur). | `true` |
| `allow` | Rôles autorisés à **agir** (sécurité : une commande forgée est refusée). | aucun |
| `visible` | Qui **voit** le nœud, et quand (ergonomie). | personne |
| `journal` | Pour chaque sortie, l'entrée à écrire dans le journal : texte, `pour`, `notifier`. | rien (la sortie est quand même journalisée pour le MJ) |

### État et exécution

```ts
type TimelineState = {
  nodes: Record<string, { enabled: boolean; data: unknown }>
  fired: string[]
}
```

```
action (tablette, MJ, IoT, timer)
        ↓
 file d'attente (FIFO) ──► nœud.inputs[x](ctx) ──► ctx.emit('sortie') ──► ajoutée à fired
        ↑                                                   │
        └────────────── liens branchés sur cette sortie ◄───┘
        ↓ (file vide)
 { nouvel état, effets, signaux, réponse }
```

Garde-fous : une limite de signaux par action (contre les boucles), une file FIFO (ordre déterministe), une fonction pure (une erreur annule toute l'action).

### Types de nœuds

Existants : `PasswordLock`, `App`, `AllOf`, `IotCue`, `Notify` (remplacé par `journal:`, étape 7 du plan). Prévus, au fur et à mesure des besoins : `MailThread`, `AnyOf`, `Counter`, `Timer`, `Delay`, et les nœuds alimentés par le clavier et la porte (section 11.4).

**Le temps** : le moteur n'appelle jamais `setTimeout`. Un nœud `Timer` produit un effet `schedule` ; la session programme le délai et réinjecte une action quand il expire.

---

## 7. Sessions et journal

### La session

```ts
type Session = {
  id: string          // '2026-11-09_14h30_les-requins'
  teamName: string
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

- Une seule partie à la fois. L'id combine date, heure et nom d'équipe (une équipe qui rejoue n'écrase pas son historique).
- Le MJ la crée, la lance, la met en pause, la termine. Pas de nouvelle session tant que la précédente n'est pas terminée.
- Hors `running`, seul le MJ peut agir.
- Chaque ligne de log porte la session (logger enfant pino).
- Au démarrage, le serveur reprend la session non terminée.
- Les tablettes suivent la session active ; sans session, elles affichent « En attente du maître du jeu ».

### Le journal

Un seul journal par session, natif du moteur, indépendant du scénario.

```ts
type JournalEntry = {
  id: string
  at: number
  type: string                     // 'signal' | 'session' | 'refus' | 'scenario' | 'indice' | 'message'…
  data: unknown
  pour?: { roles?: string[]; tablette?: string } | { tous: true }   // absent = MJ seul
  notifier: boolean                // affichée aussi à l'écran des destinataires
}
```

| Source | Exemples | Destinataires |
|---|---|---|
| Le moteur | chaque signal, partie lancée / en pause / terminée, tentative refusée | **MJ seul** |
| Le scénario (`journal:` sur un nœud) | « Alarme désactivée à 14h32. » | `pour` |
| Le MJ | un indice préparé ou écrit à la main | ceux qu'il choisit : tous, un rôle, une tablette |

- **Par défaut, une entrée n'est vue que par le MJ** : la mécanique du jeu (signaux, pause, refus) ne sort jamais chez les joueurs.
- **Un joueur** voit, dans la fenêtre « Journal » toujours présente sur sa tablette, les entrées adressées à son rôle ou à sa tablette.
- **Le MJ** voit tout, avec des filtres par type. Il n'est jamais cité dans `pour`.
- `notifier: true` : l'entrée s'affiche aussi à l'écran à son arrivée. Sinon, elle est silencieuse.
- `{heure}` dans un texte est remplacé par l'heure de l'entrée.
- Le journal est sauvegardé avec la session et sert au débrief.

---

## 8. Connexions, rôles, MJ et sécurité

### Connexion

```
Tablette                                  Serveur (connections)
────────                                  ─────────────────────
saisit « y »          ──── mot de passe ──►  « y » = rôle ops ; 2 ops connectées sur 6 → OK
                      ◄─── welcome ───────   { role: ops, ecran: bureau, token }  → salle « ops »

(redémarrage)
renvoie son jeton     ──── jeton ─────────►  reconnue : ops, même place

« azerty »            ────────────────────►  refusé : mot de passe inconnu
7e tablette ops       ────────────────────►  refusé : nombre maximum de joueurs atteint
```

- Une place = une tablette connectée. Une reconnexion avec jeton n'est pas soumise à la limite.
- Le rôle vient toujours du serveur (mot de passe ou jeton), jamais d'un champ que la tablette annonce.
- Le MJ utilise le même écran avec `GM_PASSWORD` ; c'est le module `gm` qui le reconnaît.

### Rôles

Des **noms** définis dans `config.yaml`, que le moteur se contente de comparer (`visible`, `allow`, `pour`, salles). Pour cet escape game : un **master** (tablette fixe commune, tout ce qui est actif) et des **ops** (petites tablettes, tout ce qui est passif).

### Le MJ

| | |
|---|---|
| Il voit tout, tout le temps | jamais cité dans `visible` ni `pour` ; son tableau de bord est construit par `gm` |
| Il peut tout déclencher | pour le moteur, c'est un acteur privilégié : ni `allow` ni la pause ne s'appliquent |
| Il pilote la session | créer, lancer, mettre en pause, terminer, forcer une action |
| Il envoie des indices | préparés ou écrits à la main, à tous, à un rôle ou à une tablette, notifiés ou non |
| Ses actions sont tracées | dans le journal (MJ seul) : « le MJ a forcé `alarmPanel.solved` » |
| Il n'est dans aucun fichier du scénario | son mot de passe est dans `.env` |

**Son tableau de bord** : tous les documents avec un code couleur par partie (visible, à venir après X, disparu, réservé à d'autres rôles) ; « voir comme… » un rôle ; les indices préparés, mis en avant quand ils sont utiles ; l'état des nœuds, `fired`, le journal complet, les tablettes connectées, l'état du gateway IoT. Plus tard, un « et si… » : voir ce qu'un rôle verrait si telle sortie était déclenchée.

`views` fournit une fonction générique `explain(page, fired)` (qui voit chaque partie, sous quelle condition) ; la session la transmet à `gm`. `views` ne sait rien du MJ.

### Sécurité

- Toute commande est validée côté serveur (`allow`, statut de la session, et pour `gm:*`, la connexion du MJ). Cacher un bouton ne protège rien : des joueurs ouvriront les outils de développement.
- Aucun texte de jeu ni aucune solution dans le code du front.
- Une page indisponible renvoie « introuvable », jamais « interdit ».
- Les textes (y compris ceux du MJ) sont affichés comme du texte, jamais interprétés comme du HTML.
- Toute tentative refusée est journalisée (MJ seul).

---

## 9. Protocole Socket.IO

Types dans `shared/src/protocol.ts`. Connexion : `io({ auth: { password } })` ou `io({ auth: { token } })`.

| Client → serveur | Contenu | Réponse directe |
|---|---|---|
| `cmd` | `{ node, input, payload? }` | `{ ok, message? }` |
| `page:watch` | `{ url }` | `{ ok: true, page }` ou `{ ok: false }` |
| `page:unwatch` | `{ url }` | — |
| `search` | `{ query }` | `{ results }` |
| `gm:*` (MJ uniquement) | `create`, `start`, `pause`, `resume`, `end`, `force`, `seeAs`, `indice` | `{ ok, message? }` |

| Serveur → client | Contenu | Quand |
|---|---|---|
| `welcome` | `{ role, ecran, token }` ou `{ gm: true, token }` | après une connexion acceptée |
| `view` | `ViewState` du rôle | à la connexion, puis à chaque changement |
| `page:update` | `PageView` complète | quand une page regardée a changé |
| `journal` | toutes les entrées visibles par la tablette | à la connexion |
| `journal:add` | une nouvelle entrée visible par la tablette | à chaque nouvelle entrée |
| `gm:dashboard` | le tableau de bord du MJ | au MJ, à la connexion puis à chaque changement |

```ts
type ViewState = { role: string; ecran: string; session: SessionInfo | null; nodes: NodeView[] }
type NodeView  = { id: string; type: string; enabled: boolean; data: unknown }
type PageView  = { url: string; template: string; onglet?: { icone?: string }; data: unknown }
```

- **Toujours l'état complet** (vue, page), jamais des différences : une tablette qui redémarre retrouve tout. Le journal fait exception : on ne fait qu'y ajouter, donc il est envoyé en entier à la connexion puis entrée par entrée.
- **Ouvrir une page renvoie son contenu actuel** : pas de fenêtre de course entre « je lis » et « je m'abonne ».
- **Après chaque action**, le serveur recalcule les vues et les pages regardées, et n'envoie que ce qui a changé.

---

## 10. Le front

Une application monopage : `GET /` renvoie un `index.html` quasi vide et `app.js` (compilé par Vite), qui affiche l'écran de connexion, ouvre le socket et construit le HTML à partir des données reçues.

| Couche | Connaît Socket.IO ? | Responsabilité |
|---|---|---|
| `network/` | **oui, seule** | connexion (mot de passe, jeton), commandes, réception des vues, pages et journal |
| `state/` | non | dernière vue, pages ouvertes, journal |
| `shells/` | non | l'écran : connexion, attente, celui indiqué par `view.ecran`, ou la console MJ |
| `os/` | non | bureau Windows, fenêtres, barre des tâches |
| `apps/` | non | navigateur, mail, cracker, shell, fenêtre Journal (toujours présente) |
| `templates/` | non | un `.vue` par template de page |
| `journal/` | non | un `.vue` par type d'entrée de journal (fenêtre Journal et affichage à l'écran) |

Un registre associe chaque nom de template à son composant :

```vue
<component v-if="page" :is="TEMPLATES[page.template]" :data="page.data" />
<Page404 v-else-if="introuvable" />
```

- **Le contrat YAML ↔ template** : la forme du `data` de chaque template est dans `shared/src/templates/`. Le serveur s'en sert pour vérifier les YAML, le `.vue` pour typer ses props.
- Quand une page est renvoyée avec une partie de plus, le `:key` (l'`id` de la partie) permet à Vue de n'ajouter que la nouvelle partie.
- Restent locales à la tablette : fenêtres ouvertes, page courante, historique de navigation, menu Démarrer, horloge.

---

## 11. IoT

> Partie conçue et implémentée par le responsable IoT de l'équipe.

### 11.1 Principe : Socket.IO + `iot-gateway`

Le serveur reste la **source de vérité**. Le `iot-gateway` est un exécuteur matériel : il ne décide rien du scénario.

- Le serveur expose un seul HTTP/Socket.IO, avec le namespace `/iot` pour le gateway.
- Le gateway s'authentifie avec `IOT_GATEWAY_TOKEN` (variable d'environnement, aussi passée dans `docker-compose.yml`).
- `shared/src/iot-protocol.ts` contient le contrat filaire (export `@escape/shared/iot`).
- `server/src/modules/iot/port.ts` contient l'interface serveur `IotPort`.
- `server/src/modules/iot/cues.ts` contient les cues du scénario, côté serveur uniquement.
- Le gateway n'importe que `@escape/shared/iot` : il ne connaît ni `CueName`, ni `CUES`, ni `IotPort`.

### 11.2 Protocole

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

### 11.3 Le gateway et le matériel

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

### 11.4 Raccordement avec le moteur

Le moteur ne voit que l'interface `IotPort`. Le raccordement se fait dans `app.ts` (aujourd'hui `server/src/index.ts`), comme pour les autres modules.

| Sens | Côté IoT | Côté moteur | État |
|---|---|---|---|
| moteur → objets | `IotPort.cue(name)` | un nœud `IotCue` produit l'effet `{ type: 'cue', name }` ; la session appelle `Outputs.cue(name)` | ✅ nœud, effet et sortie en place ; branchement sur `IotPort` à faire |
| clavier → moteur | `IotPort.onCode(handler)` | le handler appelle `session.dispatch` sur un nœud `PasswordLock` (acteur `iot`) ; `ok` → `accepted`, `message` → `display` | ⏳ |
| porte → moteur | `IotPort.onDoor(handler)` | le handler appelle `session.dispatch` sur un nœud capteur (à créer), qui émet `opened` / `closed` | ⏳ |
| session → gateway | `getSessionId()`, `getDesiredState()` | l'id vient de la session active ; l'état désiré découle des cues joués | ⏳ (valeurs temporaires dans `index.ts`) |
| supervision | `getSnapshot()`, `onGatewayStatus()` | affichés dans la console MJ | ⏳ |

### 11.5 Points encore ouverts

- Sémantique exacte de `null` dans `IotDesiredState` : « éteint/arrêté » ou « ne rien changer ».
- `IotStateReport` existe dans `shared`, mais l'adapter serveur attend actuellement `IotDeviceState` pour `STATE`.
- Pour l'instant un seul gateway est pris en charge ; le serveur sélectionne le premier socket connecté.
- La reprise audio après reconnexion ne gère pas encore de position dans la piste.

### 11.6 Perspective MQTT (information)

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

## 12. Stack

| Couche | Choix |
|---|---|
| Serveur | Node + TypeScript, Express (fichiers statiques), Socket.IO |
| Front | Vue 3 + Vite, application monopage |
| Contrats | `shared/` |
| Format du scénario | YAML, lu **côté serveur uniquement** (`js-yaml`) |
| Vérification | `zod` (YAML au démarrage, messages entrants) |
| Logs | pino, logger enfant par session |
| IoT | `iot-gateway` (Node), Socket.IO `/iot` (section 11) |
| Persistance | en mémoire, puis SQLite (`better-sqlite3`) |
| Tests | vitest |
