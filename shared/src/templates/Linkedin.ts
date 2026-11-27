/**
 * Template LinkedIn : profil sur un réseau social professionnel.
 *
 * Décrit le bloc `data:` des YAML de page qui ont `template: Linkedin`
 * (champs repris de templates/pages/linkedin.yml).
 * Le profil étend le type commun `Profil`, l'activité utilise `Publication` (Communs.ts).
 */
import type { Experience, Profil, Publication, Formation } from './Communs.js'

export type LinkedinData = {
  couleur?: string

  profil: Profil & {
    titre?: string
    banniere?: string
    localisation?: string
    relations?: string
    entreprise_actuelle?: string
  }

  a_propos?: string

  experiences?: Experience[]
  formations?: Formation[]
  competences?: string[]

  activite?: Publication[]
}
