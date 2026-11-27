/**
 * Module connections : les tablettes (mot de passe → rôle, places, jetons,
 * salles, messages). Seule porte d'entrée du module.
 */
export { attachConnections } from './connections.js'
export type { ConnectionsDeps } from './connections.js'
export { createSeats } from './seats.js'
export type { SeatResult, Seats } from './seats.js'
