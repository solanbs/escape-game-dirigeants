# CLAUDE.md : règles communes à tous les Claude du projet

Ce fichier est lu par chaque Claude qui travaille sur ce dépôt. Plusieurs personnes travaillent en parallèle, chacune dans son domaine (**front**, **back**, **IoT**, **scénario**), chacune avec son Claude. Ces règles garantissent que tout le monde a la même vision du projet et pousse du code qui marche.

**En cas de doute sur une règle ou sur une décision d'architecture : demander à l'utilisateur, ne pas improviser.**

---

## 1. Le projet en bref

Escape game de sensibilisation à la cybersécurité pour des dirigeants. Les joueurs sont une équipe d'attaquants (OSINT, intrusion physique, élévation de privilèges, exfiltration). Ils jouent sur des tablettes : une tablette fixe commune (rôle `master`, tout ce qui est actif) et des petites tablettes (rôle `ops`, tout ce qui est passif). Un maître du jeu (MJ) pilote la partie. Des objets connectés (lumières, son, clavier, porte) suivent le scénario.

Un serveur Node fait tourner un **moteur de jeu générique** qui prend en entrée un **dossier de scénario** (YAML). Il sert aussi le front (Vue 3, application monopage) et dialogue avec les tablettes en Socket.IO. Un processus séparé, `iot-gateway`, pilote le matériel.

## 2. Où trouver quoi

La documentation est dans `docs/` (index : `docs/README.md`). À lire selon ce qu'on fait :

| Si tu travailles sur… | Lis d'abord |
|---|---|
| n'importe quoi de technique | `docs/architecture.md` (décisions, modules, formats, protocole) |
| le back | `docs/plan-back.md` (où on en est, étape par étape) |
| les pages, le contenu | `docs/format_pages.md` |
| le scénario, le lore | `docs/scenario.md`, `docs/infos.md`, `docs/referencement.md` |
| le front | `docs/front_to_do.md`, puis `docs/architecture.md` sections 9 et 10 |
| l'IoT | `docs/architecture.md` section 11 |
| un parcours complet de bout en bout | `docs/exemples-user-stories.md` |

## 3. Les décisions qui ne se discutent pas sans l'utilisateur

1. **Le serveur fait autorité.** Les tablettes envoient des commandes ; le serveur vérifie tout et renvoie l'état. Cacher un bouton ne protège rien : des joueurs ouvriront les outils de développement.
2. **Aucune solution ni aucun contenu de jeu dans le code du front.** Tout ce qui est dans le JS est lisible par les joueurs. Le contenu vit dans les YAML, lus par le serveur, qui n'envoie que ce que chaque tablette a le droit de voir. *(Exception provisoire et assumée : le front lit encore les pages YAML au build, cf. `client/src/data/pages.ts`. Ne pas étendre cette exception.)*
3. **Le moteur prend en entrée un dossier de scénario** : `scenario.yaml` (nœuds + liens), `pages/`, `indices/`, `search.yaml`, `config.yaml` (rôles, mots de passe, nombre de joueurs). La config technique (port, mot de passe du MJ, jeton IoT) est dans `.env`.
4. **Les rôles sont définis dans `config.yaml`.** Le code n'en connaît aucun.
5. **Le MJ n'est pas un rôle** : c'est un acteur privilégié, géré uniquement par le module `gm`. Il voit tout, peut tout déclencher, et n'apparaît dans **aucun** fichier du scénario (jamais dans `visible`, `allow`, `pour`).
6. **La visibilité s'écrit avec une seule clé, `visible`** (`roles`, `after`, `before`), sur une page, une partie de page ou un nœud. Plus de `visibleTo` ni de `when`.
7. **Le back est découpé en modules autour d'un point central, la session.** Aucun module ne parle directement à un autre ; chaque module n'expose qu'un `index.ts`.
8. **Un journal unique**, natif du moteur. Par défaut, une entrée n'est vue que par le MJ ; les joueurs ne voient que ce qui leur est adressé (`pour`). La mécanique du jeu ne sort jamais chez les joueurs.
9. **Le faux Google est le seul moteur de recherche du jeu**, et il est côté serveur (`search.yaml`). Les autres barres de recherche sont décoratives.
10. **On construit par étapes qui marchent de bout en bout** (`docs/plan-back.md`).

## 4. Organisation du dépôt et domaines

```
docs/          documentation                                    tout le monde
scenarios/     dossiers de scénario (YAML)                      scénario
templates/     gabarits YAML vierges des pages                  scénario + front
shared/        contrats entre serveur, front et gateway         ⚠️ partagé
server/        serveur et moteur (server/src/modules/)          back
client/        front Vue 3 + Vite                               front
iot-gateway/   processus qui pilote le matériel                 IoT
scripts/       outils communs (check-docker.sh)                 tout le monde
```

**Reste dans ton domaine.** Si une tâche demande de modifier le domaine d'un autre, fais le minimum nécessaire, explique-le dans le message de commit, et signale-le à l'utilisateur. Ne réécris jamais le travail d'un autre domaine pour qu'il corresponde à tes préférences.

**Les contrats sont partagés** : `shared/`, le format des YAML (`docs/format_pages.md`, `docs/architecture.md` section 5), le protocole Socket.IO (`docs/architecture.md` section 9). Les modifier, c'est modifier le travail des autres :
- prévenir l'utilisateur avant ;
- mettre à jour **les deux côtés** (producteur et consommateur) dans le même commit, ou garder la compatibilité ;
- mettre à jour la doc correspondante dans le même commit.

### Règles par domaine

**Back** (`server/`)
- Suivre `docs/plan-back.md`, étape par étape ; mettre à jour la section « Où on en est » et marquer l'étape faite quand elle l'est.
- La timeline reste **pure** (aucune entrée/sortie, aucun `setTimeout`). Les effets passent par la session.
- Toute entrée extérieure est vérifiée (`zod` pour les YAML et les messages). Un YAML invalide doit **empêcher le démarrage**, avec un message qui nomme le fichier.
- Logs avec le logger pino (`server/src/logger.ts`), jamais de `console.log` dans `server/src/` (autorisé dans `server/scripts/`). Ne jamais logger un mot de passe ni un jeton.

**Front** (`client/`)
- Une seule couche parle au serveur (`network/`, aujourd'hui `services/socket.ts`). Les composants n'importent jamais `socket.io-client`.
- Aucun texte de jeu en dur dans un `.vue` : un template affiche des données reçues. Pas de `v-html` sur du texte venant du serveur ou du MJ (exception : le formatage `**gras**` maîtrisé de `data/texte.ts`).
- Connexion : un écran envoie `io({ auth: { password } })`, garde le jeton reçu dans `welcome`, et revient à l'écran de connexion si le serveur refuse le jeton.

**IoT** (`iot-gateway/`, `server/src/modules/iot/`)
- Le gateway est un exécuteur : il ne connaît ni le scénario ni les noms de cues ; il n'importe que `@escape/shared/iot`.
- Le raccordement au moteur se fait par l'interface `IotPort` (`docs/architecture.md` section 11.4).

**Scénario** (`scenarios/`, `templates/`, docs de contenu)
- Écrire les pages en copiant un gabarit de `templates/pages/` ; respecter `docs/format_pages.md`.
- Les solutions (codes, mots de passe) ne vont **que** dans `scenario.yaml` (nœuds `PasswordLock`), jamais dans une page.
- Changer l'`url` d'une page oblige à mettre `search.yaml` à jour.

## 5. Conventions

- **Langue** : documentation, commentaires, messages de log, messages de commit et textes affichés **en français**. Noms de code (variables, fonctions, types) en anglais ou en français, mais cohérents dans un même fichier.
- **TypeScript strict**, modules ESM : les imports relatifs se terminent par `.js` (`import { x } from './y.js'`).
- **Tests** avec vitest, dans `server/test/` et `iot-gateway/test/`. Toute logique nouvelle côté serveur ou gateway arrive avec ses tests.
- **Ne jamais désactiver ou affaiblir un test** pour le faire passer. Si un test a une raison légitime de changer, le dire dans le commit.

## 6. Commandes

```bash
npm install                 # installer (à refaire si package-lock.json a changé)
cp .env.example .env        # première fois ; ne jamais commiter .env
npm run dev                 # shared + serveur + front (front : localhost:5173)
npm run dev:gateway         # le gateway IoT, dans un autre terminal
npm test                    # tests du serveur et du gateway
npm run typecheck           # TypeScript, tous les paquets
npm run demo                # une partie de démonstration dans le terminal
npm run tablette -w @escape/server -- ops123   # une fausse tablette
npm run check               # typecheck + tests + build
npm run check:docker        # images Docker + démarrage + vérifications (≈ 1 min)
```

## 7. Avant chaque push : obligatoire

**On ne pousse jamais du code qui ne passe pas ces étapes.** Si l'une échoue, on corrige avant de pousser ; si l'échec vient d'un autre domaine et qu'on ne sait pas le corriger proprement, on s'arrête et on prévient l'utilisateur.

1. **Récupérer le travail des autres** : `git fetch` puis `git pull --no-rebase`.
   - En cas de conflit, **garder l'intention des deux côtés** (par exemple : le renommage d'un collègue *et* ton changement de champ). Ne jamais écraser le travail d'un autre en choisissant aveuglément « le mien » ou « le leur ».
   - Pour `package-lock.json` : prendre la version distante (`git checkout --theirs package-lock.json`), puis `npm install` pour y ajouter tes dépendances.
2. **Réinstaller si besoin** : `npm install` si `package.json` ou `package-lock.json` ont changé.
3. **Contrôle local** : `npm run check` → typecheck, tests et build doivent être **verts**.
4. **Contrôle Docker** : `npm run check:docker` → doit finir par « ✅ Docker OK ». Il vérifie :
   - que les images se construisent et que `game` et `gateway` démarrent et restent en marche ;
   - que le serveur répond, charge le scénario et sert le front ;
   - que le gateway IoT se connecte, et que son bus HTTP (clavier, porte) répond et exige son jeton ;
   - qu'une tablette se connecte avec un mot de passe de rôle et qu'un mauvais mot de passe est refusé ;
   - qu'il n'y a aucune erreur dans les logs du serveur.

   Si une fonctionnalité importante est ajoutée, **ajouter sa vérification** dans `scripts/check-docker.sh`.
5. **Doc à jour** : si le code change une décision, un format, un protocole ou l'état d'avancement, mettre à jour la doc concernée **dans le même push** (`docs/architecture.md`, `docs/plan-back.md`, `docs/format_pages.md`…).
6. **Commits** : petits et cohérents, message en français, de la forme `<domaine> : <résumé>` (`back : étape 2, une page servie`, `front : écran de connexion`, `iot : driver WLED`, `scénario : pages de l'alarme`, `doc : …`), avec une liste à puces dans le corps si utile.
7. **Pousser** : `git push`. Si le push est refusé parce que le distant a avancé, recommencer à l'étape 1.

**Interdits** : `git push --force` sur `main`, commiter `.env` ou un secret, commiter `node_modules/` ou `dist/`, pousser en sautant une étape « parce que c'est un petit changement ».

**Ne pousser que si l'utilisateur l'a demandé.** Ces étapes s'appliquent à chaque push, mais c'est l'utilisateur qui décide quand pousser.

## 8. Ce qu'il ne faut jamais faire

- Mettre une solution, un mot de passe de jeu ou un texte de jeu dans le code du front.
- Citer le MJ dans un fichier du scénario, ou créer un rôle `gm` / `mj`.
- Faire parler deux modules du back directement, ou importer un fichier interne d'un autre module.
- Logger un mot de passe ou un jeton.
- Modifier le `.env` de quelqu'un ou commiter un `.env`.
- Supprimer ou réécrire le travail d'un autre domaine sans le signaler.
- Laisser la doc contredire le code.
