/**
 * Branche les places sur Socket.IO (namespace principal, celui des tablettes).
 * Le namespace /iot a sa propre authentification (module iot) : il n'est pas concerné.
 */
import type { Logger } from 'pino'
import type { Server } from 'socket.io'
import type { Welcome } from '@escape/shared'
import type { ScenarioConfig } from '../scenario-loader/index.js'
import type { Seats } from './seats.js'

export type ConnectionsDeps = {
  config: ScenarioConfig
  seats: Seats
  log: Logger
}

type SocketData = { role: string; token: string }

export function attachConnections(io: Server, { config, seats, log }: ConnectionsDeps): void {
  // 1. À l'ouverture du socket : mot de passe ou jeton → rôle, ou refus.
  io.use((socket, next) => {
    const auth = (socket.handshake.auth ?? {}) as { password?: unknown; token?: unknown }

    const result =
      typeof auth.token === 'string'
        ? seats.resume(auth.token)
        : typeof auth.password === 'string'
          ? seats.login(auth.password)
          : ({ ok: false, error: 'mot de passe requis' } as const)

    if (!result.ok) {
      log.warn({ socketId: socket.id, raison: result.error }, 'connexion refusée')
      return next(new Error(result.error))
    }

    const data: SocketData = { role: result.role, token: result.token }
    socket.data = data
    next()
  })

  // 2. Connexion acceptée : salle du rôle + welcome.
  io.on('connection', (socket) => {
    const { role, token } = socket.data as SocketData

    void socket.join(role)
    const welcome: Welcome = { role, ecran: config.roles[role]!.ecran, token }
    socket.emit('welcome', welcome)
    log.info({ role, socketId: socket.id, connectes: seats.connected() }, 'tablette connectée')

    // 3. Déconnexion : la place est libérée, le jeton reste valable.
    socket.on('disconnect', (reason) => {
      seats.leave(token)
      log.info({ role, socketId: socket.id, raison: reason, connectes: seats.connected() }, 'tablette déconnectée')
    })
  })
}
