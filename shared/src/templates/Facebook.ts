// ===========================================================================
// Le template Facebook : profil sur un réseau social personnel.
// Décrit le bloc `data:` des YAML de page qui ont `template: Facebook`.
// ===========================================================================

/** Un commentaire sous une publication. */
export type Commentaire = {
  /** Identifiant stable ; obligatoire si le commentaire a un `when`. */
  id?: string
  /** Condition d'apparition (lue et retirée par le serveur). */
  when?: string | string[]
  auteur: string
  texte: string
}

/** Une publication du fil. Ce n'est PAS un bloc : elle n'existe que dans un profil. */
export type Publication = {
  /** Identifiant stable ; obligatoire si la publication a un `when` (sert de :key). */
  id?: string
  /** Condition d'apparition (lue et retirée par le serveur). */
  when?: string | string[]
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

export type FacebookData = {
  /** Couleur principale → variable CSS --couleur-principale (défaut : bleu). */
  couleur?: string

  profil: {
    nom: string // obligatoire : l'en-tête affiche toujours le nom
    /** Absent = initiale du nom dans un rond. */
    photo?: string
    /** Absent = dégradé de la couleur principale. */
    couverture?: string
    /** Courte phrase sous le nom et en haut de l'Intro. */
    bio?: string
    /** Ex. "312 amis". */
    amis?: string
  }

  /** Lignes de la colonne « Intro », ex. ["Habite à Bordeaux", "Travaille chez …"]. */
  intro?: string[]

  /** De la plus récente à la plus ancienne. */
  publications: Publication[]
}
