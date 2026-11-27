// ===========================================================================
// Le template Facebook : profil sur un réseau social personnel.
// Décrit le bloc `data:` des YAML de page qui ont `template: Facebook`.
// ===========================================================================

import type { Profil, Publication } from './Communs.js'

export type FacebookData = {
  /** Couleur principale → variable CSS --couleur-principale (défaut : bleu). */
  couleur?: string

  /** nom et photo : voir Profil (Communs.ts). */
  profil: Profil & {
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
