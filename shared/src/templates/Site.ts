// ===========================================================================
// Le template Site : site vitrine d'une entreprise ou d'une marque
// (SuperSecure, Carbona, Aérofourneau…).
// Décrit le bloc `data:` des YAML de page qui ont `template: Site`.
// Le corps réutilise les blocs des articles (Bloc.ts), affichés par Blocs.vue.
// ===========================================================================

import type { Entete, Bandeau } from './Communs.js'
import type { Bloc } from './Bloc.js'

export type SiteData = {
  /** Couleur principale → variable CSS --couleur-principale. */
  couleur?: string

  /** Barre du haut : logo, nom, slogan, menu, téléphone, bouton. */
  entete: Entete

  /** Grande zone d'accroche sous l'en-tête ; absente = pas de bandeau. */
  bandeau?: Bandeau

  /** Contenu de la page : mêmes blocs que les articles. */
  corps: Bloc[]

  /** Texte du pied de page, ex. "© 2027 Carbona Racing Team SAS" ; absent = nom du site. */
  pied_de_page?: string
}
