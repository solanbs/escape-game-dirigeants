import { io, type Socket } from 'socket.io-client'
import type { ClientEvents, ServerEvents } from '@escape/shared'

/**
 * Connexion temps réel.
 *
 * Aucune URL n'est écrite en dur : socket.io utilise l'origine de la page.
 * - en dev, Vite proxifie /socket.io vers le serveur (port 3000) ;
 * - en prod, le front est servi par le même serveur.
 */
export const socket: Socket<ServerEvents, ClientEvents> = io({
  autoConnect: false,
})
