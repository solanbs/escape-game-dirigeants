// ===========================================================================
// Les blocs
// ---------------------------------------------------------------------------
// Ils seront aussi utilisés par CompanySite (même liste `corps:`) : quand ce
// template arrivera, cette partie déménagera dans un fichier Blocs.ts commun.
// ===========================================================================

/** Champs que tous les blocs peuvent avoir. */
type BlocCommun = {
  id?: string
  /**
   * Condition d'apparition : sortie(s) de nœud déjà déclenchée(s).
   * Lue par le serveur, qui la RETIRE avant d'envoyer la page : le template ne la voit jamais.
   */
  when?: string | string[]
}

// Chaque bloc a un `type` OBLIGATOIRE et toujours écrit en toutes lettres
// ('paragraphe', 'encadre'…). C'est grâce à lui que TypeScript sait, dans un
// `v-if="bloc.type === 'tableau'"`, que `bloc.colonnes` existe.

export type BlocParagraphe = BlocCommun & {
  type: 'paragraphe'
  texte: string // obligatoire : un paragraphe vide ne sert à rien
}

export type BlocIntertitre = BlocCommun & {
  type: 'intertitre'
  texte: string
}

/** Un élément de liste : un texte simple, OU un élément détaillé. */
export type ElementListe =
  | string
  | {
      icone?: string
      /** Partie mise en avant, ex. le code « 1234 ». */
      label?: string
      texte?: string
      note?: string
    }

export type BlocListe = BlocCommun & {
  type: 'liste'
  elements: ElementListe[]
}

export type BlocEtapes = BlocCommun & {
  type: 'etapes'
  /** Liste numérotée : le numéro est ajouté par le template. */
  elements: {
    titre?: string // facultatif : une étape peut n'être qu'une phrase
    texte: string
  }[]
}

export type BlocEncadre = BlocCommun & {
  type: 'encadre'
  /** Défaut : 'info'. 'alerte' = encadré rouge/orange. */
  ton?: 'info' | 'alerte'
  icone?: string
  titre?: string
  texte: string
  /** Petite phrase en dessous du texte, en plus discret. */
  avertissement?: string
  /** Texte du bouton (décoratif) ; absent = pas de bouton. */
  bouton?: string
}

export type BlocCitation = BlocCommun & {
  type: 'citation'
  texte: string
  auteur?: string
}

export type BlocTableau = BlocCommun & {
  type: 'tableau'
  titre?: string
  colonnes: string[]
  /** Une ligne = un tableau de cases, autant que de colonnes. */
  lignes: string[][]
}

export type BlocImage = BlocCommun & {
  type: 'image'
  /** Chemin dans scenarios/<scénario>/assets/. */
  fichier: string // obligatoire : une image sans fichier n'a rien à afficher
  legende?: string
}

export type BlocChiffres = BlocCommun & {
  type: 'chiffres'
  elements: { valeur: string; label: string }[]
}

export type BlocCartes = BlocCommun & {
  type: 'cartes'
  elements: { icone?: string; titre: string; texte?: string }[]
}

export type BlocPersonnes = BlocCommun & {
  type: 'personnes'
  titre?: string
  liste: { nom: string; poste?: string; bio?: string; photo?: string }[]
}

export type BlocActus = BlocCommun & {
  type: 'actus'
  elements: { id?: string; date?: string; titre: string; extrait?: string }[]
}

export type BlocTemoignages = BlocCommun & {
  type: 'temoignages'
  elements: { texte: string; auteur?: string }[]
}

export type BlocContact = BlocCommun & {
  type: 'contact'
  // Tout est facultatif : on met les coordonnées dont la page a besoin.
  titre?: string
  texte?: string
  adresse?: string
  telephone?: string
  email?: string
}

/**
 * Un bloc = UN de ces types (le « | » se lit « ou »).
 * Un `type` qui n'est pas dans cette liste est refusé.
 */
export type Bloc =
  | BlocParagraphe
  | BlocIntertitre
  | BlocListe
  | BlocEtapes
  | BlocEncadre
  | BlocCitation
  | BlocTableau
  | BlocImage
  | BlocChiffres
  | BlocCartes
  | BlocPersonnes
  | BlocActus
  | BlocTemoignages
  | BlocContact


