# Exemples de bout en bout : deux user stories

> Ce document suit **deux fonctionnalités, de l'écran du joueur jusqu'au serveur et retour**,
> pour montrer comment les modules de [architecture.md](./architecture.md) travaillent ensemble.
>
> - **Cas simple** : le master coupe l'alarme. Tout passe par des mécanismes généraux du moteur.
> - **Cas plus difficile** : le MJ envoie un indice. Il fait intervenir le module `gm` et le journal.
>
> Les numéros d'étape renvoient à [plan-back.md](./plan-back.md).

---

## Rappel : comment lire une user story

Une user story décrit un besoin **du point de vue de quelqu'un qui utilise le jeu**, pas du code :

> **En tant que** *qui*, **je veux** *quoi*, **afin de** *pourquoi*.

Elle est suivie de **critères d'acceptation** : la liste de ce qu'on doit pouvoir constater pour dire « c'est fait ». Ensuite seulement, on regarde ce que chaque module doit faire.

---

Rappel sur le journal (détails : architecture.md, section 7) : une entrée sans `pour` n'est vue que par le MJ ; avec `pour`, elle va dans la fenêtre Journal des destinataires ; avec `notifier: true`, elle s'affiche aussi à l'écran.

---

## Cas simple : le master coupe l'alarme

### La user story

> **En tant que** master,
> **je veux** saisir le code du boîtier d'alarme,
> **afin de** couper la sirène et accéder à la session de Maël.

### Critères d'acceptation

1. Avec le **bon code**, la tablette master affiche « Accès accepté ».
2. La sirène s'arrête et les lumières repassent en ambiance (cue IoT `alarm-off`).
3. Le journal des tablettes **master et ops** reçoit « Alarme désactivée à 14h32. », affiché aussi à l'écran.
4. Sur la tablette master, un **nouveau champ** apparaît : « Session Windows de Maël Morin ».
5. Avec un **mauvais code**, la tablette affiche « Accès refusé » et rien d'autre ne change côté joueurs.
6. Une tablette ops **ne voit pas** le champ du boîtier, et une commande forgée depuis les outils de développement est **refusée**.
7. Le MJ voit dans son journal la tentative, le signal `alarmPanel.solved` et l'entrée envoyée aux joueurs.

### Les données (`scenario.yaml`)

```yaml
nodes:
  alarmPanel:
    type: PasswordLock
    config: { label: "Boîtier d'alarme SuperSecure", answer: "SuperSecure1234" }
    allow: [master]
    visible: { roles: [master] }
    journal:
      solved: { texte: "Alarme désactivée à {heure}.", pour: { roles: [master, ops] }, notifier: true }

  alarmOffCue:
    type: IotCue
    config: { cue: alarm-off }

  maelSession:
    type: PasswordLock
    enabled: false
    config: { label: Session Windows de Maël Morin, answer: "…" }
    allow: [master]
    visible: { roles: [master] }

links:
  - [alarmPanel.solved, alarmOffCue.play]
  - [alarmPanel.solved, maelSession.enable]
```

Aucune ligne de code n'est propre à cette énigme : tout le comportement vient de ces trois nœuds, de leur entrée `journal:` et de deux liens.

### Le trajet complet

```
 TABLETTE MASTER                    SERVEUR                                                   AUTRES
 ───────────────                    ───────                                                   ──────
 ① le joueur tape le code
   dans le champ du boîtier
   et valide
        │
        │  network/ envoie le message 'cmd'
        ▼
 ──────────────────────────► ② connections
   { node: 'alarmPanel',        la connexion est celle d'un master
     input: 'submit',           (rôle retenu à la connexion, jamais lu dans le message)
     payload: 'SuperSecure1234' }
                                       │
                                       ▼
                              ③ session.dispatch
                                 la partie est lancée ? oui → on continue
                                       │
                                       ▼
                              ④ timeline.run
                                 alarmPanel autorise le master ? (allow) oui
                                 PasswordLock compare le code → bon → sortie « solved »
                                 fired += 'alarmPanel.solved'
                                 entrée journal: prévue pour « solved » → effet journal
                                 les liens propagent :
                                   alarmOffCue.play     → effet { cue: 'alarm-off' }
                                   maelSession.enable   → le nœud devient actif
                                 renvoie : nouvel état + effets + signaux + réponse
                                       │
                                       ▼
                              ⑤ session (suite)
                                 journal : écrit les signaux (sans « pour » → MJ seul)
                                           et l'entrée du scénario (pour master + ops, notifiée)
                                 persistence : sauvegarde l'état et le journal
                                 effet cue → iot.cue('alarm-off') ─────────────────────► ⑥ iot-gateway
                                 « les vues ont changé » → connections                    lumières + son
                                       │
                                       ▼
                              ⑦ connections
                                 'journal:add' aux tablettes master et ops
                                 pour chaque salle :
                                   vue = session.viewFor(rôle)   (views filtre par visible)
                                   envoie 'view' à la salle
                                 tableau de bord à jour pour le MJ
                                       │
 ◄─────────────────────────────────────┤───────────────────────────────────────────────► tablettes ops
 ⑧ réponse : « Accès accepté »         │                                                 'journal:add'
   'journal:add' : « Alarme            │                                                 (affiché à l'écran
   désactivée à 14h32. »               │                                                  et dans le journal)
   'view' : contient maintenant        │                                                 'view' (inchangée
   le champ maelSession                │                                                  pour les ops)
        │
        ▼
 ⑨ state/ range la vue et l'entrée
   le bureau se redessine (nouveau champ),
   l'entrée s'affiche à l'écran
   et dans la fenêtre Journal
```

### Les messages échangés

```jsonc
// ① tablette master → serveur
"cmd"         { "node": "alarmPanel", "input": "submit", "payload": "SuperSecure1234" }

// ⑧ serveur → tablette master (réponse directe à la commande)
{ "ok": true, "message": "Accès accepté" }

// ⑦ serveur → tablettes master et ops
"journal:add" { "id": "j-41", "at": 1795788951938, "type": "scenario", "notifier": true,
                "data": { "texte": "Alarme désactivée à 14h32." } }

// ⑦ serveur → salle master
"view"        { "role": "master", "ecran": "bureau", "session": { … },
                "nodes": [ { "id": "alarmPanel", "type": "PasswordLock", "data": { "label": "…", "solved": true } },
                           { "id": "maelSession", "type": "PasswordLock", "data": { "label": "Session Windows de Maël Morin", "solved": false } },
                           … ] }
```

Le code de l'alarme (`answer`) n'apparaît dans **aucun** message envoyé. Le champ `pour` non plus : chaque tablette reçoit seulement ce qui la concerne.

### Qui fait quoi

| Module | Son travail dans cette histoire | Étape du plan |
|---|---|---|
| front `network/` | envoyer `cmd`, recevoir la réponse, `view` et `journal:add` | front |
| front `state/`, bureau, fenêtre Journal | ranger la nouvelle vue et l'entrée, redessiner le bureau, afficher l'entrée | front |
| `connections` | savoir que la connexion est celle du master ; transmettre ; envoyer les vues et l'entrée de journal aux bonnes tablettes | 1, 3, 5, 7 |
| `session` | vérifier que la partie est lancée ; appeler la timeline ; écrire dans le journal ; distribuer les effets | ✅ existe (journal unique : 7) |
| `timeline` | vérifier `allow` ; faire tourner `PasswordLock` ; suivre les liens ; ajouter à `fired` ; produire l'entrée `journal:` | ✅ existe (`fired` : 3 ; `journal:` : 7) |
| `views` | filtrer les nœuds avec `visible` et le journal avec `pour` | 5, 7 |
| `persistence` | sauvegarder l'état et le journal | ✅ existe (en mémoire) |
| `iot` | transformer le cue `alarm-off` en commandes lumière + son | ✅ existe (raccordement : 10) |

### Les cas qui doivent échouer proprement

| Situation | Où c'est arrêté | Ce que voit le joueur | Ce que voit le MJ |
|---|---|---|---|
| Mauvais code | `PasswordLock` (timeline) | « Accès refusé » (tablette master seulement) | la tentative dans son journal |
| Une ops forge la commande | `timeline` : la ops n'est pas dans `allow` | « Action non autorisée » | une entrée « refus » dans son journal |
| Partie en pause | `session` | « Partie en pause » | — |
| Le gateway IoT est éteint | `iot` : la commande échoue | rien : le jeu continue | l'erreur dans son tableau de bord |

### Les tests qui prouvent que ça marche

- **timeline** : bon code → `alarmPanel.solved` dans `fired`, `maelSession` actif, effets `cue` et `journal` produits ; mauvais code → rien ne change ; commande d'une ops → refusée.
- **views** : la vue master contient `maelSession` après le bon code ; la vue ops ne contient ni `alarmPanel` ni `maelSession` ; le journal filtré d'une ops contient l'entrée « Alarme désactivée », mais pas les signaux.
- **de bout en bout** : avec deux fausses tablettes (`scripts/tablette.ts`), le master envoie le code ; les deux tablettes reçoivent `journal:add` ; seule la master reçoit le nouveau champ.

---

## Cas plus difficile : le MJ envoie un indice

### La user story

> **En tant que** MJ,
> **je veux** envoyer un indice — préparé à l'avance ou écrit sur le moment — à toute l'équipe, à un rôle ou à une seule tablette,
> **afin de** relancer une équipe qui bloque, sans casser l'immersion.

### Critères d'acceptation

1. Dans sa console, le MJ voit la **liste des indices préparés**. Ceux qui sont **utiles maintenant** sont mis en avant : par exemple, les indices sur l'alarme tant que l'alarme n'est pas coupée.
2. Il peut **modifier le texte** d'un indice préparé avant de l'envoyer, ou **écrire un message à la main**.
3. Il choisit le **destinataire** (tous les joueurs, un rôle, une tablette précise) et si l'indice est **affiché à l'écran** ou seulement ajouté au journal.
4. L'indice arrive dans la **fenêtre Journal** des tablettes visées, avec le template de son type (`indice` : encadré avec une ampoule ; `message` : bulle du « commanditaire »…). S'il est notifié, il s'affiche aussi à l'écran.
5. Une tablette qui **redémarre** retrouve tout son journal, indices compris.
6. Le journal du MJ garde une trace : « 14h40 — MJ → indice `alarme-1` → tous les joueurs ».
7. Une tablette joueur qui envoie elle-même la commande d'indice est **refusée**.
8. Le texte écrit par le MJ s'affiche **tel quel**, comme du texte : pas de HTML interprété.

### Les données

**Les indices préparés**, un fichier par sujet, dans le dossier du scénario :

```yaml
# scenarios/scenario1_red_team/indices/alarme.yml
- id: alarme-1
  type: indice                          # type d'entrée de journal → template côté front
  pour: { roles: [master, ops] }        # destinataires proposés par défaut
  notifier: true                        # proposé par défaut ; le MJ peut changer
  utile: { before: alarmPanel.solved }  # mis en avant tant que l'alarme n'est pas coupée
  data:
    titre: "Une marque, un boîtier…"
    texte: "Les codes d'usine sont souvent publiés dans les guides de mise en service."

- id: alarme-2
  type: indice
  pour: { roles: [master, ops] }
  notifier: true
  utile: { before: alarmPanel.solved }
  data:
    titre: "Regardez du côté des archives"
    texte: "Un fabricant garde parfois ses anciennes notices en ligne."
```

`utile` reprend la mécanique de `visible` (`after` / `before`) : le moteur sait déjà l'évaluer.

**Les types d'entrée de journal** ont chacun leur forme, dans `shared/src/journal/`, et leur template, dans `client/src/journal/`. C'est le même principe que pour les pages :

```ts
// shared/src/journal/index.ts
export type IndiceData   = { titre: string; texte: string }
export type MessageData  = { de?: string; texte: string }
export type ScenarioData = { texte: string }
```

### Le trajet complet

```
 CONSOLE MJ                          SERVEUR                                                   TABLETTES
 ──────────                          ───────                                                   ─────────
 ① le tableau de bord affiche
   les indices préparés,
   « alarme-1 » et « alarme-2 »
   mis en avant (utile = vrai)
   le MJ choisit « alarme-1 »,
   corrige le texte, choisit
   « tous les joueurs », notifié,
   envoie
        │
        │  network/ envoie 'gm:indice'
        ▼
 ──────────────────────────► ② connections
   { indice: 'alarme-1',        la connexion est-elle celle du MJ ?
     pour: { tous: true },        non → refus « Action non autorisée »
     notifier: true,              oui → on continue
     data: { texte: "…" } }
                                       │
                                       ▼
                              ③ session
                                 transmet au module gm, avec ce dont il a besoin
                                 (indices chargés, rôles de config.yaml, tablettes connectées)
                                       │
                                       ▼
                              ④ gm
                                 retrouve « alarme-1 », applique les modifications du MJ
                                 vérifie : le type existe ? les destinataires existent ?
                                 construit l'entrée :
                                   { type: 'indice', data: { titre, texte }, pour, notifier }
                                       │
                                       ▼
                              ⑤ session (suite)
                                 écrit l'entrée dans le journal
                                 écrit aussi « MJ → indice alarme-1 → tous » (sans « pour » → MJ seul)
                                 persistence : sauvegarde le journal
                                 la TIMELINE N'EST PAS TOUCHÉE : un indice ne change pas le déroulé
                                       │
                                       ▼
                              ⑥ connections
                                 « tous »      → toutes les tablettes joueurs
                                 « rôle X »    → les tablettes du rôle X
                                 « tablette »  → la connexion de cette tablette (retrouvée par son jeton)
                                       │
 ◄──── réponse : « envoyé à 4 tablettes » ───────┤───────────────────────────────────────► ⑦ 'journal:add'
                                                                                            { type: 'indice',
                                                                                              notifier: true, data }
                                                                                                  │
                                                                                                  ▼
                                                                                         ⑧ network/ → state/
                                                                                            template « indice »
                                                                                            affiché à l'écran
                                                                                            et dans le Journal

 PLUS TARD : une tablette ops redémarre
 ───────────────────────────────────────
 { token }  ──────────────► connections : reconnue (ops)
            ◄────────────── 'welcome', 'view'
            ◄────────────── 'journal' : toutes les entrées visibles par cette tablette (indice compris)
```

### Les messages échangés

```jsonc
// ① console MJ → serveur : un indice préparé, modifié
"gm:indice" { "indice": "alarme-1",
              "pour": { "tous": true },                // ou { "roles": ["ops"] } ou { "tablette": "<id>" }
              "notifier": true,
              "data": { "texte": "Les codes d'usine sont dans le guide de mise en service. Cherchez SuperSecure." } }

// ou un message écrit à la main, sans indice préparé
"gm:indice" { "type": "message", "pour": { "roles": ["master"] }, "notifier": true,
              "data": { "de": "Le commanditaire", "texte": "Vous avez 10 minutes avant l'arrivée de l'agent." } }

// réponse directe au MJ
{ "ok": true, "message": "Envoyé à 4 tablettes" }

// ⑦ serveur → tablettes visées
"journal:add" { "id": "j-57", "at": 1795788951938, "type": "indice", "notifier": true,
                "data": { "titre": "Une marque, un boîtier…", "texte": "Les codes d'usine sont dans le guide…" } }

// après une reconnexion
"journal" [ { "id": "j-41", "type": "scenario", … }, { "id": "j-57", "type": "indice", … } ]
```

### Qui fait quoi

| Module | Son travail dans cette histoire | Étape du plan |
|---|---|---|
| front console MJ | afficher les indices (mis en avant selon `utile`), éditer, choisir destinataires et `notifier`, envoyer `gm:indice` | front |
| front fenêtre Journal + `journal/` | un template par type d'entrée (`indice`, `message`, `scenario`), choisi par un registre, comme pour les pages ; affichage à l'écran si `notifier` | front |
| `scenario-loader` | lire `indices/*.yml` ; vérifier le type, les rôles de `pour`, les sorties citées dans `utile` | 7 |
| `connections` | refuser `gm:indice` hors connexion MJ ; livrer à tous, à un rôle ou à une tablette précise ; envoyer le journal complet à la (re)connexion | 7 |
| `session` | transmettre à `gm` ; écrire dans le journal ; sauvegarder | 7 |
| `gm` | retrouver l'indice, appliquer les modifications, vérifier type et destinataires, construire l'entrée ; calculer `utile` pour la console | 6, 7 |
| `views` | filtrer le journal pour chaque tablette (`journalFor`) ; évaluer `utile` (même fonction que `visible`) | 7 |
| `timeline` | **rien** : un indice ne change pas le déroulé | — |
| `persistence` | sauvegarder le journal avec la session | 7 |

### Pourquoi c'est plus difficile que le cas simple

| Difficulté | Comment l'architecture y répond |
|---|---|
| Le contenu peut être **écrit en direct** et non préparé dans un YAML | Le contenu voyage toujours sous la forme `{ type, data }` : qu'il vienne d'un YAML ou de la console, le front l'affiche avec le même template. `gm` vérifie que `data` respecte la forme du type. |
| La cible peut être **une seule tablette**, pas un rôle | `connections` retient déjà « quel jeton → quelle connexion » (étape 1). Il suffit de livrer à cette connexion. |
| La tablette peut être **déconnectée** au moment de l'envoi | L'entrée est dans le journal, sauvegardé avec la session : la tablette la reçoit à sa reconnexion. |
| Le MJ est un **acteur à part** | Tout passe par le module `gm`. Aucun autre module ne sait que l'indice vient du MJ, sauf le journal du MJ. |
| L'indice **ne doit pas** modifier le scénario | La session n'appelle pas la timeline. *(Si un jour on veut qu'un indice compte, par exemple une pénalité de temps, on pourra déclencher une sortie `mj.indice` dans la timeline, sans changer le reste.)* |
| Le journal contient aussi la **mécanique du jeu** | Les entrées automatiques (signaux, pause, refus) n'ont pas de `pour` : elles restent au MJ. Le quatrième mur reste intact. |
| Le texte du MJ pourrait contenir du HTML | Les templates d'entrée affichent du texte (`{{ texte }}`), jamais `v-html`. |

### Les tests qui prouvent que ça marche

- **gm** : un indice préparé + des modifications → la bonne entrée ; un type inconnu → refus ; un destinataire inconnu → refus ; `utile` vrai avant `alarmPanel.solved`, faux après.
- **scenario-loader** : un indice avec un `type` inconnu ou une sortie inexistante dans `utile` → refus de démarrer.
- **views** : `journalFor` ne garde que les entrées adressées au rôle ou à la tablette ; les entrées sans `pour` ne sortent jamais.
- **connections** : `gm:indice` envoyé par une tablette ops → refusé ; cible « tablette » → seule cette tablette reçoit ; reconnexion → `journal` contient l'indice.
- **de bout en bout** : MJ + master + ops en fausses tablettes ; le MJ envoie `alarme-1` à tous ; les deux tablettes reçoivent `journal:add` ; la ops redémarre et retrouve l'indice ; le journal du MJ contient l'envoi.
