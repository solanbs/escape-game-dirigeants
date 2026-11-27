# Écrire les pages d'un scénario (format YAML)

Les pages des faux sites (résultats Google, articles, profils…) sont écrites dans des fichiers YAML. Vous n'avez pas besoin de toucher au code : l'application lit ces fichiers et les met en forme.

## Où écrire

```
scenarios/<nom_du_scenario>/
  pages/          un fichier .yml par page
  applications/   google_recherches.yml, mail.yml, bureau_windows.yml
  solutions.yml   codes et réponses attendues
```

Pour créer une page, copiez le template du type voulu depuis `templates/pages/` dans `scenarios/<scénario>/pages/`, puis remplissez-le.

**Le nom du fichier sert d'identifiant à la page** (`david-linkedin.yml` → `david-linkedin`). Les recherches Google et les autres fichiers y font référence par ce nom. **Renommer un fichier casse les recherches qui le citent** : si vous renommez une page, mettez à jour `applications/google_recherches.yml`.

## Règles d'écriture

- **Gras** : entourez le mot de deux astérisques, `**comme ceci**`. Cela marche dans tous les champs de texte.
- **Texte sur plusieurs lignes** : écrivez `|` après le nom du champ, puis le texte indenté sur les lignes suivantes. Une ligne vide sépare deux paragraphes.
  ```yaml
  texte: |
    Premier paragraphe.

    Second paragraphe.
  ```
- **Guillemets** : mettez le texte entre `"..."` s'il contient `:` ou `#`, ou s'il commence par un caractère spécial.
- **Champ inutile** : laissez-le vide (`""`) ou supprimez-le. Il ne s'affiche pas.
- **Indentation** : utilisez des espaces, jamais de tabulations. Respectez le décalage du template.

## Les 7 types de page

| Type | À utiliser pour | Template |
|---|---|---|
| `site` | site vitrine d'une entreprise ou d'une marque | `site.yml` |
| `article` | article de journal ou de blog, page de centre d'aide, notice | `article.yml` |
| `forum` | fil de discussion | `forum.yml` |
| `annonce` | petite annonce de vente | `annonce.yml` |
| `index_fichiers` | listing de fichiers en ligne (« Index of /… ») | `index_fichiers.yml` |
| `linkedin` | profil professionnel | `linkedin.yml` |
| `facebook` | profil personnel | `facebook.yml` |

## En-tête commun

Toutes les pages commencent ainsi :

```yaml
type: article          # un des 7 types
google:
  domaine: ""          # adresse affichée dans Google et dans la barre d'adresse
  titre: ""            # titre du résultat Google
  introduction: ""     # texte sous le titre dans Google
icone_onglet: ""       # un emoji pour l'onglet du navigateur
couleur: ""            # couleur principale du site, ex. "#1a73e8"
```

## Les blocs (types `site` et `article`)

Le contenu d'un `site` ou d'un `article` est une liste de blocs, dans le champ `corps:` (et `colonne:` pour la colonne de droite d'un article). Chaque bloc commence par `- type:`. Vous pouvez répéter un bloc ou l'omettre, et les blocs s'affichent dans l'ordre où ils sont écrits.

| Bloc | Champs | Usage |
|---|---|---|
| `paragraphe` | `texte` | paragraphe de texte |
| `intertitre` | `texte` | sous-titre |
| `liste` | `elements` | puces. Chaque élément est un texte simple ou `{icone, label, texte, note}` |
| `etapes` | `elements: [{titre, texte}]` | liste numérotée |
| `encadre` | `ton` (`info` ou `alerte`), `icone`, `titre`, `texte`, `avertissement`, `bouton` | message mis en valeur |
| `citation` | `texte`, `auteur` | citation |
| `tableau` | `titre`, `colonnes`, `lignes` | tableau. Chaque ligne a autant de cases qu'il y a de colonnes |
| `image` | `fichier`, `legende` | image |
| `chiffres` | `elements: [{valeur, label}]` | chiffres clés |
| `cartes` | `elements: [{icone, titre, texte}]` | grille de cartes (services, produits…) |
| `personnes` | `titre`, `liste: [{nom, poste, bio, photo}]` | équipe |
| `actus` | `elements: [{date, titre, extrait}]` | liste d'actualités |
| `temoignages` | `elements: [{texte, auteur}]` | avis clients |
| `contact` | `titre`, `texte`, `adresse`, `telephone`, `email` | coordonnées |

Exemple :

```yaml
corps:
  - type: intertitre
    texte: "Avant de commencer"
  - type: encadre
    ton: alerte
    titre: "Attention"
    texte: "Ne jamais **débrancher** la batterie."
```

Un bloc au nom mal orthographié ne s'affiche pas. Si un bloc manque à l'écran, vérifiez son `type:` (un avertissement s'affiche aussi dans la console du navigateur).

## Champs propres à chaque type

Chaque template de `templates/pages/` décrit en commentaire ses champs propres. Particularités à connaître :

- **`site`** : `entete` (nom, menu, bouton), `bandeau` (grande zone de titre), `corps` (blocs), `pied_de_page`.
- **`article`** : `site` décrit le journal ou blog qui publie l'article, puis viennent `titre`, `chapo`, `auteur`, `date`, `corps` (blocs), `colonne` (blocs, facultatif) et `tags`.
- **`forum`** : `messages` est la liste des messages du fil, dans l'ordre chronologique.
- **`index_fichiers`** : le `contenu` d'un fichier peut contenir le repère `{code_alarme}`. Avant que le joueur valide son recoupement, ce repère est remplacé par le texte `masquage`, puis par le code de `solutions.yml`.

## Les applications

Les fichiers de `applications/` gardent le format actuel du code. Ils font référence aux pages par leur nom de fichier.

- **`google_recherches.yml`** : une recherche affiche des pages si la requête contient au moins un mot de chaque groupe de `requis`. Les accents et les majuscules sont ignorés.
  ```yaml
  - requis: [["david", "ecnasiol"], ["linkedin"]]   # (david OU ecnasiol) ET linkedin
    resultats: [david-linkedin, carbona-officiel]   # noms de fichiers des pages
  ```
- **`mail.yml`** : les réponses de David, les mots déclencheurs et les documents de la poubelle.
- **`bureau_windows.yml`** : les dossiers et fichiers de la session de Maël.

## `solutions.yml`

Ce fichier regroupe les réponses attendues, pour les garder à l'écart du texte des pages :

```yaml
code_alarme: ""
document_utile_david: ""   # nom (id) du bon document dans mail.yml
session_mael:
  identifiant: morinm
  mot_de_passe: ""
```

Ce fichier n'est pas secret : un joueur qui ouvre les outils de développement du navigateur peut le lire. Pour ce public, c'est acceptable.
