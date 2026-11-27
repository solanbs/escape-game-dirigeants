# Écrire les pages d'un scénario (format YAML)

Les pages des faux sites (articles, sites d'entreprise, profils, forum…) sont écrites dans des fichiers YAML. Vous n'avez pas à toucher au code : l'application lit ces fichiers et les met en forme.

Ce format suit [architecture.md](architecture.md) (sections 5 et 10) : une page = **un template** (la mise en page, écrite une fois en Vue) + **un contenu** (le YAML).

## Où écrire

```
scenarios/<nom_du_scenario>/
  pages/*.yml      une page par fichier
  search.yaml      les recherches du faux Google
  assets/          les images des pages
```

Pour créer une page, copiez le template du type voulu depuis `templates/pages/` dans `scenarios/<scénario>/pages/`, puis remplissez-le. Les pages du scénario Carbona (`scenarios/scenario1_red_team/pages/`) servent d'exemples complets.

## Un fichier = une enveloppe + un contenu

```yaml
# --- Enveloppe : lue par le serveur et le navigateur du jeu
url: leboncoin.fr/annonce/centrale-supersecure-v2
template: Annonce
visible: { roles: [master, ops] }  # qui peut ouvrir la page (et quand : after / before)
onglet:
  icone: "🛒"

# --- Contenu : transmis tel quel au template
data:
  couleur: "#ff6e14"
  titre: "…"
  # … les champs propres au template
```

| Champ | Rôle |
|---|---|
| `url` | **identifiant unique de la page**, affiché aussi dans la barre d'adresse. Deux pages ne peuvent pas avoir la même `url`. |
| `template` | la mise en page à utiliser (tableau ci-dessous) |
| `visible` | qui peut ouvrir la page, et quand. `roles` est obligatoire ; `after` (apparaît après une sortie du scénario, ex. `mailDavid.sent`) et `before` (disparaît après) sont facultatifs. Détails : [architecture.md](architecture.md), section 5.6. |
| `onglet.icone` | un emoji pour l'onglet du navigateur |
| `data` | tout le contenu de la page. `data.couleur` donne la couleur principale du site. |

`visible` peut aussi se mettre sur un **élément de liste** (un bloc, un message de forum, une publication, un fichier), par exemple `visible: { after: mailDavid.sent }`. Sans `roles`, l'élément reprend ceux de la page. Donnez alors un `id` à cet élément (`id: p3`), pour que l'application l'ajoute sans recharger la page.

C'est le serveur qui lit `url` et `visible`, et qui retire les éléments non visibles avant d'envoyer la page. Le template ne voit que `data`. Le MJ voit tout : ne le citez jamais dans `roles`.

## Les templates

| `template` | À utiliser pour | Modèle à copier | Schéma |
|---|---|---|---|
| `Article` | article de journal ou de blog, page de centre d'aide, notice | `article.yml` | `shared/src/templates/Article.ts` |
| `CompanySite` | site vitrine d'une entreprise ou d'une marque | `site.yml` | à venir |
| `Forum` | fil de discussion | `forum.yml` | `shared/src/templates/Forum.ts` |
| `Annonce` | petite annonce de vente | `annonce.yml` | `shared/src/templates/Annonce.ts` |
| `IndexFile` | listing de fichiers en ligne (« Index of /… ») | `index_fichiers.yml` | `shared/src/templates/IndexFile.ts` |
| `Linkedin` | profil professionnel | `linkedin.yml` | `shared/src/templates/Linkedin.ts` |
| `Facebook` | profil personnel | `facebook.yml` | `shared/src/templates/Facebook.ts` |

Le **schéma** est la référence exacte : il liste chaque champ de `data`, en indiquant s'il est obligatoire (sans `?`) ou facultatif (avec `?`). Les blocs sont décrits dans `shared/src/templates/Bloc.ts`. Au démarrage, le serveur refusera un YAML qui ne respecte pas son schéma.

## Règles d'écriture

- **Gras** : `**comme ceci**`, dans tous les champs de texte.
- **Texte sur plusieurs lignes** : `|` après le nom du champ, puis le texte indenté. Une ligne vide sépare deux paragraphes.
  ```yaml
  texte: |
    Premier paragraphe.

    Second paragraphe.
  ```
- **Guillemets** : mettez le texte entre `"..."` s'il contient `:` ou `#`, ou s'il commence par un caractère spécial.
- **Champ inutile** : supprimez-le, ou laissez-le vide (`""`). Il ne s'affiche pas.
- **Indentation** : des espaces, jamais de tabulations. Tout le contenu est décalé de deux espaces sous `data:`.

## Les blocs (templates `Article` et `CompanySite`)

Le contenu d'un article ou d'un site est une liste de blocs dans `data.corps` (et `data.colonne` pour la colonne de droite d'un article). Chaque bloc commence par `- type:`. On peut répéter un bloc ou l'omettre ; ils s'affichent dans l'ordre où ils sont écrits.

| Bloc | Champs (obligatoires en **gras**) | Usage |
|---|---|---|
| `paragraphe` | **`texte`** | paragraphe |
| `intertitre` | **`texte`** | sous-titre |
| `liste` | **`elements`** : textes simples, ou `{icone, label, texte, note}` | puces ; `label` met en avant un mot (ex. un code) |
| `etapes` | **`elements`** : `[{titre, **texte**}]` | liste numérotée |
| `encadre` | `ton` (`info` par défaut, ou `alerte`), `icone`, `titre`, **`texte`**, `avertissement`, `bouton` | message mis en valeur ; `alerte` est toujours rouge |
| `citation` | **`texte`**, `auteur` | citation |
| `tableau` | `titre`, **`colonnes`**, **`lignes`** | une ligne = autant de cases que de colonnes |
| `image` | **`fichier`**, `legende` | image (fichier dans `assets/`) |
| `chiffres` | **`elements`** : `[{**valeur**, **label**}]` | chiffres clés |
| `cartes` | **`elements`** : `[{icone, **titre**, texte}]` | grille de cartes |
| `personnes` | `titre`, **`liste`** : `[{**nom**, poste, bio, photo}]` | équipe |
| `actus` | **`elements`** : `[{id, date, **titre**, extrait}]` | actualités |
| `temoignages` | **`elements`** : `[{**texte**, auteur}]` | avis |
| `contact` | `titre`, `texte`, `adresse`, `telephone`, `email` | coordonnées |

Exemple :

```yaml
data:
  corps:
    - type: intertitre
      texte: "Avant de commencer"
    - type: encadre
      ton: alerte
      titre: "Attention"
      texte: "Ne jamais **débrancher** la batterie."
```

Un `type` mal orthographié n'affiche rien : vérifiez-le si un bloc manque (un avertissement `[Blocs]` apparaît aussi dans la console du navigateur, F12).

## Le faux Google : `search.yaml`

C'est **le seul moteur de recherche du jeu** : les barres de recherche des autres sites (Facebook, articles…) sont décoratives. Le titre et l'extrait d'un résultat ne sont **pas** dans la page : ils sont écrits dans la recherche qui le fait apparaître.

```yaml
- query: ["carbona proces", "carbona tribunal", "/prud.?hom/"]   # mots-clés reconnus
  results:
    - url: actu-justice-eco.fr/prudhommes/carbona-racing-team-licenciement-abusif   # l'url d'une page
      title: "Licenciement abusif : un ancien ingénieur de Carbona Racing Team attaque l'écurie"
      snippet: "…"
```

**Le joueur n'a pas besoin de taper exactement le mot-clé.** Le moteur :

- **ignore les majuscules, les accents, les apostrophes et la ponctuation** : écrivez les mots-clés en minuscules et sans accents (`proces`, `prudhommes`) ;
- **reconnaît un mot-clé si tous ses mots sont dans la recherche, dans n'importe quel ordre** et au milieu d'autres mots : `carbona proces` correspond à « Procès Carbona », « le procès de carbona racing »… ;
- **accepte des expressions régulières** pour les variantes et fautes de frappe : un mot-clé entre `/…/` (ex. `/prud.?hom/` pour « prudhommes », « prud'hommes », « prudhomes »). Elles s'appliquent à la recherche déjà normalisée (minuscules, sans accents) ;
- **garde la recherche la plus précise** quand plusieurs correspondent : celle dont le mot-clé reconnu a le plus de mots (`carbona proces` l'emporte sur `carbona`) ; en cas d'égalité, la première du fichier ;
- **ne montre un résultat que si sa page est visible** pour la tablette (voir `visible`). Une page débloquée en cours de partie apparaît donc dans les résultats au bon moment.

Les `url` des résultats doivent correspondre aux `url` des pages : le serveur refuse de démarrer sinon, ou si une expression régulière est invalide. **Changer l'`url` d'une page oblige à mettre `search.yaml` à jour.**

Pour l'instant, le faux Google utilise encore des résultats écrits dans le code du front (`client/src/data/fakeSite.ts`) ; il passera à `search.yaml` quand le serveur saura y répondre (plan-back.md, étape 9).

## Ce qui n'est pas dans les pages

- **Les solutions** (code de l'alarme, mot de passe de Maël…) : ce sont les réponses des nœuds `PasswordLock` dans `scenario.yaml`. Elles restent sur le serveur et ne sont jamais envoyées aux tablettes (architecture.md, section 8). Il n'y a pas de fichier `solutions.yml`.
- **Les indices** que les joueurs doivent trouver (le code d'usine dans l'archive des notices, par exemple) sont du contenu normal : ils sont écrits dans la page. S'ils ne doivent apparaître qu'après une étape, mettez un `visible: { after: … }`.
- **Le mail de David et le bureau de Maël** : ce sont des nœuds du scénario (`scenario.yaml`), pas des pages.
