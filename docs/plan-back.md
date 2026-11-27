# Plan du back

> **Où on en est et ce qu'il reste à faire, étape par étape, jusqu'à la fin du back.**
> Les notions utilisées (modules, nœuds, `visible`, journal…) sont définies dans [architecture.md](./architecture.md).

---

## 1. Où on en est

| Partie | État |
|---|---|
| Modules `timeline` (+ types de nœuds), `session`, `persistence` (en mémoire), `iot` | ✅ dans `server/src/modules/`, un `index.ts` chacun |
| Moteur : nœuds, liens, droits (`allow`), garde-fous | ✅ testé |
| Sessions : cycle de vie, id lisible, logs par session, reprise | ✅ testé |
| IoT : adaptateur serveur + `iot-gateway` (devices factices) | ✅ testé, pas encore relié à la session |
| `index.ts` : assemble les modules | ✅ |
| Connexion des tablettes par mot de passe de rôle, `config.yaml` (étape 1) | ✅ testé, essayé sur un vrai serveur |
| Pages, vues, MJ, journal | ❌ étapes 2 à 7 |

**Commandes utiles**

```bash
npm test                                   # tous les tests du serveur
npm run demo                               # une partie jouée dans le terminal
npm run dev:server                         # le serveur seul
npm run tablette -w @escape/server -- ops123          # une fausse tablette (mot de passe d'un rôle)
npm run tablette -w @escape/server -- --token <jeton>  # reconnexion avec un jeton
npm run check && npm run check:docker                  # avant chaque push (CLAUDE.md, section 7)
```

**Encore provisoire dans le code** : `server/src/scenarios/demo.ts` (étape 4), les jetons de reconnexion gardés en mémoire (perdus au redémarrage du serveur, sauvegardés à l'étape 11), les valeurs IoT temporaires de `index.ts` (étape 10), les anciens types de `shared/src/index.ts` (étape 12).

---

## 2. Comment on avance

Par **tranches** : chaque étape ajoute un peu dans plusieurs modules pour qu'**une fonctionnalité de plus marche de bout en bout**, plutôt que de finir un module avant de passer au suivant.

C'est comme ouvrir un restaurant : on sert d'abord un plat à une table (un peu de cuisine, un peu de salle, un peu de caisse), puis on élargit. À chaque étape, tout fonctionne et les problèmes de raccord apparaissent tout de suite.

Pour chaque étape : **le but**, **ce qu'on ajoute** (module par module), et **terminé quand** (ce qu'on doit constater). Pas besoin du front pour vérifier : une fausse tablette en ligne de commande suffit.

---

## 3. Les étapes

| # | Étape | Résultat visible |
|---|---|---|
| 1 | Connexion par mot de passe de rôle | une tablette reçoit son rôle |
| 2 | Une page servie | une tablette ouvre une page selon son rôle |
| 3 | Une page qui change | un post apparaît chez les ops quand le master agit |
| 4 | Le déroulé en YAML | le scénario de démo n'est plus du code |
| 5 | Les vues par rôle | chaque tablette reçoit son bureau |
| 6 | Le module `gm` | le MJ pilote la partie |
| 7 | Le journal et les indices | journal joueur, indices du MJ |
| 8 | Le temps | un compte à rebours déclenche une suite |
| 9 | La recherche | le faux Google répond, sans exiger le mot-clé exact |
| 10 | Le raccordement IoT | le matériel suit la partie (responsable IoT) |
| 11 | La sauvegarde SQLite | un redémarrage ne perd rien |
| 12 | Finitions | plus rien de provisoire |

Le **front** peut se brancher dès la fin de l'étape 3.
Le **raccordement IoT** (étape 10) peut avancer en parallèle dès la fin de l'étape 4.

---

### Étape 1 : connexion par mot de passe de rôle ✅ faite

**But** : une tablette se connecte avec le mot de passe d'un rôle ; le serveur lui attribue ce rôle, vérifie qu'il reste de la place, la range dans la salle du rôle et lui donne un jeton de reconnexion.

```
 Tablette                                         connections
 { password: 'ops123' }   ─────────────────────►  rôle ops ; 2 sur 6 → OK ; crée un jeton
                          ◄──── 'welcome' ──────  { role: 'ops', ecran: 'bureau', token }
 { token }                ─────────────────────►  reconnue, sans compter une place de plus
 { password: 'azerty' }   ─────────────────────►  refus : mot de passe inconnu
```

| Où | Ce qu'on ajoute |
|---|---|
| `scenarios/demo/config.yaml` | Les rôles `master` (max 1) et `ops` (max 6) : `mot_de_passe`, `ecran`, `joueurs`. Dans `.env` et `.env.example` : `SCENARIO_DIR=scenarios/demo`. |
| `scenario-loader` (nouveau) | `loadConfig(dossier)` : lit `config.yaml` (`js-yaml`), vérifie la forme (`zod`) et l'unicité des mots de passe ; sinon, erreur qui nomme le fichier. |
| `connections` (nouveau) | `seats.ts`, sans réseau : `login(motDePasse)`, `resume(jeton)`, `leave(jeton)`. Une place = une tablette connectée ; `resume` ne vérifie pas la limite. `connections.ts` : branche ces règles sur Socket.IO (`io.use` à la connexion, `join` de la salle, `welcome`, `leave` à la déconnexion). |
| `shared/src/protocol.ts` | Le type `Welcome`. |
| `index.ts` | Crée le serveur Socket.IO, charge la config, branche `connections` et donne le même `io` au module IoT. Supprimer `realtime.ts`. |
| `server/scripts/tablette.ts` | Une fausse tablette : `tablette.ts <mot de passe>` ou `tablette.ts --token <jeton>`. |

**Terminé quand**
- `tablette.ts ops123` reçoit `{ role: 'ops', ecran: 'bureau', token }` ; `tablette.ts azerty` est refusée ;
- une 2e tablette master est refusée, puis acceptée quand la 1re se déconnecte ;
- une reconnexion avec jeton retrouve son rôle ;
- deux rôles au même mot de passe empêchent le démarrage ;
- le gateway IoT (`npm run dev:gateway`) se connecte toujours ;
- tests : `loadConfig`, `seats`.

> ⚠️ À prévenir côté front : sans mot de passe, la fenêtre de test actuelle ne se connecte plus. Le front doit ajouter un écran de connexion, et **revenir à cet écran si le serveur refuse le jeton** (« jeton inconnu », par exemple après un redémarrage du serveur). La fausse tablette fait de même : elle repasse par son mot de passe.

**Réalisé** : `scenarios/demo/config.yaml` ; module `scenario-loader` (`loadConfig`) ; module `connections` (`seats.ts`, `connections.ts`) ; type `Welcome` ; `realtime.ts` supprimé ; `scripts/tablette.ts` ; le Dockerfile copie `scenarios/`. Tests : `scenario-loader`, `seats`, `connections` (avec de vrais sockets).

---

### Étape 2 : une page servie

**But** : le serveur lit les pages au démarrage ; une tablette demande une page par son `url` et la reçoit si son rôle est dans `visible.roles`, sinon « introuvable ».

```
 Tablette ops        connections          session              views
 page:watch(url) ──► rôle = ops ────────► page('ops', url) ──► existe ? ops dans visible.roles ?
                 ◄── réponse directe ◄──────────────────────── { url, template, onglet, data } ou rien
```

| Où | Ce qu'on ajoute |
|---|---|
| `scenarios/demo/pages/` | Une page publique (copiée d'un gabarit, par exemple `linkedin.yml`) et une page réservée au master. |
| `scenario-loader` | `loadPages(dossier)` : lit tous les `.yml` ; refuse une `url` en double, un template inconnu, un `visible.roles` absent ou un rôle inconnu. |
| `views` (nouveau) | `page(pages, rôle, url)` : la page sans la clé `visible`, ou rien. |
| `session` | `page(rôle, url)` : appelle `views` avec les pages du scénario. |
| `connections` | Écoute `page:watch` et répond directement à la tablette. |

**Terminé quand**
- la fausse tablette ops reçoit la page publique, et « introuvable » pour la page du master ;
- la tablette master reçoit les deux ;
- une `url` en double ou un rôle inconnu empêche le démarrage ;
- tests : `loadPages`, `views.page`.

---

### Étape 3 : une page qui change

**But** : une ops regarde le LinkedIn de David ; le master envoie le mail à David ; sans rien faire, l'ops voit apparaître un nouveau post. Si cette étape marche, toute la chaîne est validée.

```
 Ops                  Master             connections                 session              timeline / views
 page:watch(david) ────────────────────► retient « ops regarde david »
 ◄── page (1 post) ─────────────────────
                      cmd(mailDavid,  ─► ─────────────────────────► dispatch ───────────► mailDavid → « sent »
                          send)                                                           fired += mailDavid.sent
                      ◄── « envoyé » ───
                                         « les pages ont changé » ◄─
                                         redemande la page ────────► page(...) ─────────► views : post visible
 ◄── page:update (2 posts) ───────────── a changé → envoi
```

```yaml
# la même page, avant et après le mail
activite:
  - id: p1
    texte: "Fier de lancer Aérofourneau Consulting !"
  - id: p3
    visible: { after: mailDavid.sent }     # retiré avant le mail, gardé après (sans la clé visible)
    texte: "Certaines entreprises ne respectent pas leurs anciens…"
```

| Où | Ce qu'on ajoute |
|---|---|
| `timeline` | `fired` dans l'état : chaque sortie déclenchée y est ajoutée (une fois). |
| `timeline/nodes` | `MailThread` : entrée `send`, sortie `sent`. Un nœud `mailDavid` (`allow: [master]`) dans `demo.ts`. |
| `views` | Le filtre `visible` complet : parcourir la page à toutes les profondeurs, évaluer `roles`, `after`, `before` avec le rôle et `fired`, retirer ce qui n'est pas visible, puis toutes les clés `visible`. |
| `scenario-loader` | Vérifier que chaque `after` / `before` cite un nœud et une sortie qui existent. |
| `session` | Donner `fired` à `views`. Après chaque action, prévenir les sorties : `pagesChanged()` (dans `ports.ts`). |
| `connections` | Écouter `cmd` → `session.dispatch` → réponse directe. Retenir les pages regardées par chaque tablette (`page:watch` / `page:unwatch`). Sur `pagesChanged` : redemander chaque page regardée et envoyer `page:update` si elle a changé. |

**Terminé quand**
- deux fausses tablettes : l'ops regarde la page (1 post) ; le master envoie `cmd { node: 'mailDavid', input: 'send' }` ; l'ops reçoit `page:update` (2 posts) ;
- la même commande envoyée par une ops est refusée ;
- `mailDavid.snet` (faute de frappe) dans une page empêche le démarrage ;
- tests : `fired`, filtre `visible` (rien débloqué, tout débloqué, `after`, `before`, règles par rôle, partie imbriquée).

---

### Étape 4 : le déroulé en YAML

**But** : `scenarios/demo/scenario.yaml` remplace `server/src/scenarios/demo.ts`. Le moteur prend tout son scénario dans le dossier, et le code ne contient plus aucun nom de rôle.

| Où | Ce qu'on ajoute |
|---|---|
| `scenarios/demo/scenario.yaml` | La traduction de `demo.ts` (exemple : architecture.md, section 5.2). |
| `timeline/nodes` | Pour chaque type de nœud, le schéma `zod` de sa config. |
| `timeline` | `visible` sur les nœuds à la place de `visibleTo` (même règle que les pages). |
| `shared/src/protocol.ts` | Les rôles deviennent des `string` (au lieu de `'master' \| 'ops' \| 'gm'`) ; le MJ sort de ce type. |
| `scenario-loader` | Lire `scenario.yaml`, vérifier chaque config de nœud et chaque rôle cité, passer le résultat au moteur. |
| `index.ts`, `scripts/demo.ts`, tests | Charger le dossier au lieu d'importer `demo.ts`. |

**Terminé quand**
- `server/src/scenarios/demo.ts` est supprimé ; les étapes 1 à 3 et `npm run demo` marchent avec le YAML ;
- ajouter un rôle `hacker` dans `config.yaml` et l'utiliser dans une page marche sans toucher au code ;
- une faute dans `scenario.yaml` (type inconnu, config incomplète, lien cassé, rôle inconnu) empêche le démarrage.

---

### Étape 5 : les vues par rôle

**But** : à la connexion puis après chaque action, chaque tablette reçoit sa vue : son écran et les nœuds (applications, champs) qu'elle a le droit de voir.

| Où | Ce qu'on ajoute |
|---|---|
| `views` | `view(nœuds, rôle, fired)` : déplacée depuis le moteur (`engine.view`), avec le filtre `visible` et l'`ecran` du rôle. |
| `timeline`, `session` | Supprimer les cas `if (role === 'gm')` (`engine.view`, `viewFor`) : la vue du MJ sera faite par `gm`. |
| `connections` | Envoyer `view` à la connexion, puis à chaque salle sur `pushViews()`. |

**Terminé quand** : master et ops reçoivent des vues différentes ; après le bon code d'alarme, seule la vue du master contient la session de Maël.

---

### Étape 6 : le module `gm`

**But** : le MJ se connecte avec `GM_PASSWORD`, pilote la session et reçoit son tableau de bord.

| Où | Ce qu'on ajoute |
|---|---|
| `.env`, `.env.example` | `GM_PASSWORD`. |
| `gm` (nouveau) | `isGm(motDePasse)` ; validation des commandes MJ ; `dashboard(…)` ; `seeAs(rôle, …)` (exactement ce que voit ce rôle). |
| `views` | `explain(page, fired)` : pour chaque partie d'une page, qui la voit maintenant et sous quelle condition. Générique, sans notion de MJ. |
| `session` | `authenticate(motDePasse)` : `gm` d'abord, puis les rôles. Transmettre à `gm` ce dont il a besoin. Tracer chaque commande du MJ. |
| `connections` | Le MJ dans la salle `gm`. `gm:create`, `start`, `pause`, `resume`, `end`, `force`, `seeAs`, refusés hors connexion MJ. `gm:dashboard` après chaque changement. |

**Terminé quand**
- une partie complète se joue avec trois fausses tablettes (MJ, master, ops) ; sans partie lancée, les joueurs reçoivent une vue vide ;
- une ops qui envoie `gm:start` est refusée ;
- `gm:seeAs { role: 'ops' }` renvoie exactement ce que reçoit une ops ;
- le tableau de bord montre le post de David « à venir après `mailDavid.sent` », puis « visible ».

---

### Étape 7 : le journal et les indices

**But** : un journal unique (architecture.md, section 7). Le moteur y écrit tout (MJ seul), le scénario y écrit via `journal:`, le MJ y envoie des indices ; chaque joueur voit sa partie dans sa fenêtre Journal.

| Où | Ce qu'on ajoute |
|---|---|
| `shared/` | `JournalEntry` et la forme de chaque type d'entrée (`shared/src/journal/`). |
| `timeline` | La propriété commune `journal:` : quand une sortie listée est déclenchée, effet `journal`. Le nœud `Notify` et l'effet `notify` disparaissent. |
| `session` | Une seule façon d'écrire une entrée (signal, statut, refus, scénario, indice) ; les entrées du moteur n'ont pas de `pour`. |
| `persistence` | `appendJournal` à la place de `appendTrace`. |
| `views` | `journalFor(entrées, rôle, tablette)`. |
| `scenario-loader` | Lire `indices/*.yml` ; vérifier `journal:` et les indices (type, rôles, sorties citées dans `utile`). |
| `gm` | `indice(…)` : indice préparé (éventuellement modifié) ou écrit à la main ; vérifier type et destinataires ; calculer `utile`. |
| `connections` | `journal` à la connexion ; `journal:add` aux seules tablettes concernées (rôle ou tablette précise, retrouvée par son jeton) ; `gm:indice` réservé au MJ. |

**Terminé quand**
- le bon code d'alarme écrit « Alarme désactivée à … » chez le master et les ops, affiché à l'écran ; une entrée `notifier: false` n'apparaît que dans le journal ;
- le MJ envoie un indice à tous, puis à une seule tablette : seules les bonnes tablettes le reçoivent ; un message écrit à la main arrive de la même façon ;
- une tablette qui redémarre retrouve tout son journal ;
- signaux, pause et refus sont dans le journal du MJ, jamais chez les joueurs.

---

### Étape 8 : le temps

**But** : le scénario peut attendre ou compter à rebours (par exemple, « l'agent de sécurité arrive 15 minutes après le déclenchement de l'alarme »).

| Où | Ce qu'on ajoute |
|---|---|
| `timeline/nodes` | `Timer` (entrées `start`, `stop` ; sortie `elapsed`) et `Delay`. Ils produisent un effet `schedule` ; la timeline n'appelle jamais `setTimeout`. |
| `session` | Programmer les délais demandés, réinjecter l'action à l'expiration (acteur `timer`), les suspendre pendant la pause, les reprendre après un redémarrage. |
| `gm` | Le temps restant de chaque compte à rebours dans le tableau de bord. |

**Terminé quand** : un `Timer` de démonstration déclenche sa sortie au bon moment ; la pause le suspend ; tests avec une horloge simulée (sans attendre réellement).

---

### Étape 9 : la recherche (le faux Google)

**But** : le faux Google, **seul moteur de recherche du jeu**, répond à partir de `search.yaml`, sans que le joueur ait à taper exactement un mot-clé. Les règles du moteur sont dans architecture.md (section 5.3) ; la façon d'écrire les mots-clés dans [format_pages.md](./format_pages.md).

| Où | Ce qu'on ajoute |
|---|---|
| `scenario-loader` | Lire `search.yaml` ; transformer chaque mot-clé en règle de correspondance (mots dans n'importe quel ordre, ou expression régulière entre `/…/`) une fois pour toutes au démarrage. Refuser une expression régulière invalide ou un résultat dont l'`url` ne correspond à aucune page. |
| `views` | `search(recherches, pages, saisie, rôle, fired)` : normaliser la saisie (minuscules, sans accents, sans apostrophes ni tirets, ponctuation → espaces) ; trouver les recherches qui correspondent ; garder la plus précise (le plus de mots reconnus, puis l'ordre du fichier) ; ne renvoyer que les résultats dont la page est visible pour le rôle. |
| `connections` | Écouter `search` et répondre directement. Les mots-clés ne sont jamais envoyés à la tablette. |

**Terminé quand**
- tests sur la normalisation et la correspondance, avec un tableau de cas : « Procès Carbona », « le procès de carbona racing », « CARBONA PROCES » → la recherche `carbona proces` ; « prud'hommes carbona » et « prudhomes » → la recherche avec `/prud.?hom/` ; « carbona » seul → la recherche générale ; « xyz » → aucun résultat ;
- « carbona proces » l'emporte sur « carbona » quand les deux correspondent ;
- un résultat dont la page n'est pas encore visible n'apparaît pas, puis apparaît après la sortie qui la débloque ;
- une expression régulière invalide ou une `url` inconnue empêche le démarrage.

---

### Étape 10 : le raccordement IoT *(responsable IoT)*

**But** : le matériel suit la partie (architecture.md, section 11.4).

| Où | Ce qu'on ajoute |
|---|---|
| `index.ts` / `session` | Brancher `cue()` sur `IotPort.cue` ; donner au gateway le vrai id de session et l'état désiré (à la place des valeurs temporaires). |
| `timeline/nodes` | Les nœuds alimentés par le clavier (`onCode` → `PasswordLock`, acteur `iot`) et par la porte (`onDoor`). |
| `gm` | L'état du gateway (`getSnapshot`) dans le tableau de bord. |

**Terminé quand** : avec `iot-gateway` et ses devices factices, le bon code au clavier fait avancer la timeline et l'alarme coupée joue le cue `alarm-off`.

---

### Étape 11 : la sauvegarde SQLite

**But** : un redémarrage du serveur en pleine partie ne perd rien.

| Où | Ce qu'on ajoute |
|---|---|
| `persistence` | `SqliteSessionRepo` (même interface que le repo en mémoire) : tables `sessions` et `journal`, dans `./data`. |
| `index.ts` | Utiliser SQLite à la place de la mémoire. |

**Terminé quand** : on redémarre le serveur en pleine partie ; la session, l'état, le journal et les comptes à rebours reprennent ; les tablettes se reconnectent avec leur jeton (les jetons sont donc sauvegardés eux aussi).

---

### Étape 12 : finitions

**But** : plus rien de provisoire dans le back.

- Retirer les anciens types de `shared/src/index.ts` (`AnswerRequest`, `PUZZLE_SOLVED`…), une fois le front branché sur le nouveau protocole.
- Vérifier automatiquement les règles d'import entre modules (dependency-cruiser ou ESLint).
- Relire [architecture.md](./architecture.md) et ce plan pour qu'ils décrivent exactement le code.

**Terminé quand** : le back fait tourner le vrai scénario Carbona Racing Team de bout en bout, avec les tablettes, le MJ et le matériel.
