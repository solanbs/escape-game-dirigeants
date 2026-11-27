/**
 * Module session : le point central. Il reçoit toutes les demandes, décide si
 * elles sont permises, appelle les autres modules et transmet les résultats.
 * Seule porte d'entrée du module : les autres modules n'importent que ce fichier.
 */
export { GameError, SessionManager } from './SessionManager.js'
export { makeSessionId, slugify } from './sessionId.js'
export type { Outputs, Session, SessionRepo } from './ports.js'
