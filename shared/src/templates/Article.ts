// ===========================================================================
// Le template Article
// ===========================================================================
import type { Bloc, ElementListe } from './Bloc.js'


export type ArticleData = {
  couleur?: string

  site: {
    nom: string // obligatoire : l'en-tête affiche toujours le nom du site
    slogan?: string
    logo?: string
    /** true = barre de recherche (décorative) dans l'en-tête. */
    recherche?: boolean
    /** Menu du site, ex. ["Actualités", "Sport"]. */
    rubriques?: string[]
  }

  /** Ex. ["Accueil", "Matériel", "Série V2"]. Absent = pas de fil d'Ariane. */
  fil_ariane?: string[]
  rubrique?: string

  titre: string
  /** Texte d'introduction sous le titre. */
  chapo?: string
  auteur?: string
  date?: string
  temps_lecture?: string

  corps: Bloc[] // obligatoire : sans corps, l'article est vide
  /** Colonne de droite : mêmes blocs que `corps`. Absent = pas de colonne. */
  colonne?: Bloc[]

  tags?: string[]
}
