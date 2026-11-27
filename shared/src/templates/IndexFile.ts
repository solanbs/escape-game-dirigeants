/**
 * Template IndexFile : listing de fichiers en ligne (page « Index of /… »).
 *
 * Décrit le bloc `data:` des YAML de page qui ont `template: IndexFile`.
 * Les fichiers utilisent le type commun `Fichier` (Communs.ts).
 */
import type { Fichier } from './Communs.js'

export type IndexFileData = {
  /** Couleur des liens → variable CSS --couleur-principale (défaut : bleu des liens). */
  couleur?: string

  /** Dossier affiché, ex. "/manuals/supersecure/2019/". Titre de la page : « Index of <chemin> ». */
  chemin: string

  /** Lignes du listing, dans l'ordre d'affichage. */
  fichiers: Fichier[]
}
