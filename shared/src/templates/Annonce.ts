/**
 * Template Annonce : petite annonce de vente.
 *
 * Décrit le bloc `data:` des YAML de page qui ont `template: Annonce`.
 * Le serveur valide les YAML contre ce type ; Annonce.vue en tire ses props.
 *
 * Convention de texte : **mot** = gras ; une ligne vide sépare deux paragraphes.
 */
export type AnnonceData = {
  /** Couleur principale du site → variable CSS --couleur-principale. */
  couleur?: string

  /** Le site de petites annonces lui-même. */
  site: {
    nom: string
    logo?: string
    /** Texte pré-rempli dans la barre de recherche (décorative). */
    recherche?: string
  }

  titre: string
  prix: string
  /** Ex. "12/09/2026 à 14h30". */
  date: string
  lieu?: string

  image?: {
    /** Vide = cadre gris avec la légende. */
    fichier?: string
    legende?: string
  }

  /** Plusieurs paragraphes séparés par une ligne vide. */
  description: string

  vendeur: {
    nom: string
    /** Lettre ou emoji ; vide = initiale du nom. */
    avatar?: string
    /** Ex. "Particulier", "Professionnel". */
    type?: string
    /** Nombre d'étoiles, de 0 à 5. */
    note?: number
    nombre_avis?: number
  }
}
