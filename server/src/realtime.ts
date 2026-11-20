import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { SOCKET_EVENTS } from '@escape/shared'
import type { ClientEvents, ServerEvents, ServerEventName } from '@escape/shared'
import { logger } from './logger.js'

/** Émet un événement typé vers tous les navigateurs connectés. */
export type Emit = <E extends ServerEventName>(
  event: E,
  payload: Parameters<ServerEvents[E]>[0],
) => void

export type Realtime = {
  io: Server<ClientEvents, ServerEvents>
  emit: Emit
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

  const emit: Emit = (event, payload) => {
    // Cast local : socket.io ne sait pas inférer un événement génériqué.
    const broadcast = io.emit.bind(io) as (name: string, data: unknown) => void
    broadcast(event, payload)
  }

  return {
    io,
    emit,
    close: () =>
      new Promise<void>((resolve) => {
        io.close(() => resolve())
      }),
  }
}
