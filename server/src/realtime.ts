/**
 * Serveur Socket.IO provisoire.
 *
 * Il crée le serveur Socket.IO (utilisé aussi par le module IoT, namespace /iot)
 * et garde l'ancien échange avec la fenêtre de test du front (READY, hello).
 * Remplacé par le module connections à l'étape 1 de docs/plan-back.md.
 */
import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { SOCKET_EVENTS } from '@escape/shared'
import type { ClientEvents, ServerEvents } from '@escape/shared'
import { logger } from './logger.js'

export type Realtime = {
  io: Server<ClientEvents, ServerEvents>
  close: () => Promise<void>
}

export function createRealtime(httpServer: HttpServer): Realtime {
  const io = new Server<ClientEvents, ServerEvents>(httpServer)

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'navigateur connecté')

    socket.emit(SOCKET_EVENTS.READY, { ok: true, at: Date.now() })

    socket.on('hello', (payload) => {
      logger.debug({ socketId: socket.id, payload }, 'hello')
    })

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'navigateur déconnecté')
    })
  })

  return {
    io,
    close: () =>
      new Promise<void>((resolve) => {
        io.close(() => resolve())
      }),
  }
}
