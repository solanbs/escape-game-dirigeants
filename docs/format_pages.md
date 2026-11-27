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

Pour créer une page, copiez le template du type voulu depuis `templates/pages/` dans `scenarios/<scénario>/pages/`, puis remplissez-le. Des pages complètes servent d'exemples dans `templates/exemples_alarme/`.

## Un fichier = une enveloppe + un contenu

```yaml
# --- Enveloppe : lue par le serveur et le navigateur du jeu
url: leboncoin.fr/annonce/centrale-supersecure-v2
template: ClassifiedAd
visibleTo: [master, ops]
when: alarmPanel.failed          # facultatif
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
| `visibleTo` | rôles qui peuvent ouvrir la page : `master`, `ops` |
| `when` | facultatif : la page n'est disponible qu'après cette sortie du scénario (ex. `mailDavid.sent`). Une liste = toutes les sorties requises. |
| `onglet.icone` | un emoji pour l'onglet du navigateur |
| `data` | tout le contenu de la page. `data.couleur` donne la couleur principale du site. |

`when` peut aussi se mettre sur un **élément de liste** : un bloc, un message de forum, une publication, un fichier. L'élément n'apparaît qu'après la sortie indiquée. Donnez alors un `id` à cet élément (`id: p3`), pour que l'application l'ajoute sans recharger la page.

C'est le serveur qui lit `url`, `visibleTo` et `when`, et qui retire les éléments pas encore débloqués avant d'envoyer la page. Le template ne voit que `data`.

## Les templates

| `template` | À utiliser pour | Modèle à copier | Schéma |
|---|---|---|---|
| `Article` | article de journal ou de blog, page de centre d'aide, notice | `article.yml` | `shared/src/templates/Article.ts` |
| `CompanySite` | site vitrine d'une entreprise ou d'une marque | `site.yml` | à venir |
| `ForumThread` | fil de discussion | `forum.yml` | à venir |
| `ClassifiedAd` | petite annonce de vente | `annonce.yml` | `shared/src/templates/ClassifiedAd.ts` |
| `FileIndex` | listing de fichiers en ligne (« Index of /… ») | `index_fichiers.yml` | à venir |
| `LinkedInProfile` | profil professionnel | `linkedin.yml` | à venir |
| `FacebookProfile` | profil personnel | `facebook.yml` | à venir |

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

Le titre et l'extrait d'un résultat Google ne sont **pas** dans la page : ils sont écrits dans la recherche qui le fait apparaître.

```yaml
- query: [david ecnasiol, ecnasiol]       # mots-clés reconnus
  results:
    - url: aerofourneau-consulting.fr      # l'url d'une page
      title: "Aérofourneau Consulting — la startup de David Ecnasiol"
      snippet: "…"
```

Les `url` des résultats doivent correspondre aux `url` des pages. **Changer l'`url` d'une page casse les recherches qui la citent** : mettez `search.yaml` à jour en même temps.

Pour l'instant, le faux Google utilise encore les recherches écrites dans le code (`client/src/data/scenario.ts`) ; il passera à `search.yaml` plus tard.

## Ce qui n'est pas dans les pages

- **Les solutions** (code de l'alarme, mot de passe de Maël…) : ce sont les réponses des nœuds `PasswordLock` dans `scenario.yaml`. Elles restent sur le serveur et ne sont jamais envoyées aux tablettes (architecture.md, section 8). Il n'y a pas de fichier `solutions.yml`.
- **Les indices** que les joueurs doivent trouver (le code d'usine dans l'archive des notices, par exemple) sont du contenu normal : ils sont écrits dans la page. S'ils ne doivent apparaître qu'après une étape, mettez un `when`.
- **Le mail de David et le bureau de Maël** : ce sont des nœuds du scénario (`scenario.yaml`), pas des pages.
