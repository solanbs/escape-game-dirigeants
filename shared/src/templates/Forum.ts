/**
 * Template Forum : un fil de discussion sur un forum.
 *
 * Décrit le bloc `data:` des YAML de page qui ont `template: Forum`.
 * Les messages utilisent le type commun `Message` (Communs.ts).
 */
import type { Message } from './Communs.js'

export type ForumData = {
  /** Couleur principale → variable CSS --couleur-principale. */
  couleur?: string

  /** Le forum lui-même (bandeau en haut de page). */
  site: {
    nom: string
    /** Emoji ou image affiché avant le nom. */
    logo?: string
  }

  /** Ex. ["Portail", "Électricité", "Alarmes & Domotique"]. Absent = pas de fil d'Ariane. */
  fil_ariane?: string[]

  /** Titre du sujet. */
  titre: string
  /** true = préfixe « [Résolu] » devant le titre. Absent = non résolu. */
  resolu?: boolean

  /** Messages du fil, dans l'ordre chronologique. */
  messages: Message[]
}
