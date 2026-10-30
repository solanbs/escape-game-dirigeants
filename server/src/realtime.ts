import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { IOT_NAMESPACE, SOCKET_EVENTS } from '@escape/shared'
import type { ClientEvents, ServerEvents, ServerEventName } from '@escape/shared'

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
    console.log(`[socket] navigateur connecté (${socket.id})`)

    socket.emit(SOCKET_EVENTS.READY, { ok: true, at: Date.now() })

    socket.on('hello', (payload) => {
      console.log(`[socket] hello de ${socket.id} :`, payload)
    })

    socket.on('disconnect', (reason) => {
      console.log(`[socket] navigateur déconnecté (${socket.id}) : ${reason}`)
    })
  })

  // Objets connectés : même protocole, namespace dédié.
  // Rien à faire pour l'instant ; l'authentification viendra ici.
  const iot = io.of(IOT_NAMESPACE)
  iot.on('connection', (socket) => {
    console.log(`[iot] objet connecté (${socket.id})`)
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
