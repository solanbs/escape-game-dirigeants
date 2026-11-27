/**
 * Types communs à plusieurs templates de page.
 *
 * Ce ne sont PAS des blocs : ils n'ont pas de champ `type` et ne vont pas
 * dans un `corps:`. Chaque template les utilise directement dans ses propres
 * champs, par exemple `publications: Publication[]` dans Facebook.
 *
 *   Conditionnel  → tout élément qui peut apparaître en cours de partie (blocs compris)
 *   Publication   → Facebook (publications), LinkedIn (activite)
 *   Commentaire   → sous une Publication
 *   Message       → forum (messages)
 */

/**
 * Champs d'un élément qui peut apparaître en cours de partie.
 * Lus par le serveur, qui RETIRE `when` et les éléments pas encore débloqués
 * avant d'envoyer la page : le template ne voit jamais `when`.
 */
export type Conditionnel = {
  /** Identifiant stable ; obligatoire si l'élément a un `when` (sert de :key côté Vue). */
  id?: string
  /** Sortie(s) de nœud qui doivent avoir été déclenchées, ex. "mailDavid.sent". */
  when?: string | string[]
}

/** Un commentaire sous une publication. */
export type Commentaire = Conditionnel & {
  auteur: string
  texte: string
}

/** Une publication d'un fil (réseau social). */
export type Publication = Conditionnel & {
  /** Ex. "12 mars 2026", "Hier à 18:42". */
  date: string
  texte: string
  /** Auteur de la publication ; absent = le propriétaire du profil. */
  auteur?: string
  /** Chemin dans scenarios/<scénario>/assets/. */
  image?: string
  /** Nombre de réactions affiché sous la publication. */
  reactions?: number
  commentaires?: Commentaire[]
}

/** Un message d'un fil de forum. */
export type Message = Conditionnel & {
  auteur: string
  /** Ex. "14/05/2026 à 09:12". */
  date: string
  texte: string
  /** Lettre ou emoji ; absent = initiale de l'auteur. */
  avatar?: string
  /** Ex. "Installateur Pro". */
  statut?: string
}

/**
 * Ce que tous les profils de réseau social ont en commun (Facebook, LinkedIn).
 * Chaque template l'étend avec ses propres champs, ex. :
 *   profil: Profil & { bio?: string; amis?: string }
 */
export type Profil = {
  nom: string // obligatoire : l'en-tête affiche toujours le nom
  /** Photo de profil (chemin dans assets/) ; absent = initiale du nom dans un rond. */
  photo?: string
}

/** Un fichier d'un listing en ligne (template IndexFile). */
export type Fichier = Conditionnel & {
  /** Ex. "V2_Master_Manual.txt", ou "../" pour le dossier parent. */
  nom: string
  /** Ex. "04-Sep-2019 09:11". */
  date: string
  /** Ex. "45K". */
  taille?: string
  /** true = ligne surlignée. */
  mis_en_avant?: boolean
  /** Texte affiché quand on clique sur le fichier ; absent = aperçu indisponible. */
  contenu?: string
}

/** Un poste dans la rubrique « Expérience ». */
export type Experience = Conditionnel & {
  poste: string
  entreprise: string
  /** Ex. "mars 2021". */
  debut?: string
  /** Absent = « aujourd'hui ». */
  fin?: string
  lieu?: string
  description?: string
}

/** Une ligne de la rubrique « Formation ». */
export type Formation = Conditionnel & {
  ecole: string
  diplome?: string
  debut?: string
  fin?: string
}
