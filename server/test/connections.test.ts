/**
 * Test d'intégration : un vrai serveur Socket.IO et de vrais clients,
 * comme une tablette (sans le reste du serveur).
 */
import assert from 'node:assert/strict'
import { createServer, type Server as HttpServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Server } from 'socket.io'
import { io as connect, type Socket } from 'socket.io-client'
import { afterEach, beforeEach, describe, it } from 'vitest'
import type { Welcome } from '@escape/shared'
import { attachConnections, createSeats } from '../src/modules/connections/index.js'
import type { ScenarioConfig } from '../src/modules/scenario-loader/index.js'
import { silentLog } from './helpers.js'

const config: ScenarioConfig = {
  roles: {
    master: { motDePasse: 'm', ecran: 'bureau', joueurs: { min: 1, max: 1 } },
    ops: { motDePasse: 'o', ecran: 'bureau', joueurs: { min: 1, max: 6 } },
  },
}

let httpServer: HttpServer
let io: Server
let url: string
const clients: Socket[] = []

beforeEach(async () => {
  httpServer = createServer()
  io = new Server(httpServer)
  attachConnections(io, { config, seats: createSeats(config), log: silentLog })
  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`
})

afterEach(async () => {
  for (const client of clients.splice(0)) client.disconnect()
  await new Promise<void>((resolve) => io.close(() => resolve()))
})

/** Connecte une tablette ; renvoie le welcome reçu, ou le message de refus. */
function tablet(auth: object): Promise<{ welcome?: Welcome; refused?: string; socket: Socket }> {
  const socket = connect(url, { auth, reconnection: false, forceNew: true })
  clients.push(socket)
  return new Promise((resolve) => {
    socket.on('welcome', (welcome: Welcome) => resolve({ welcome, socket }))
    socket.on('connect_error', (err) => resolve({ refused: err.message, socket }))
  })
}

describe('connexion des tablettes', () => {
  it('un mot de passe de rôle donne le rôle, l’écran et un jeton', async () => {
    const { welcome } = await tablet({ password: 'o' })
    assert.equal(welcome?.role, 'ops')
    assert.equal(welcome?.ecran, 'bureau')
    assert.ok(welcome?.token)
  })

  it('un mot de passe inconnu ou absent est refusé', async () => {
    assert.equal((await tablet({ password: 'azerty' })).refused, 'mot de passe inconnu')
    assert.equal((await tablet({})).refused, 'mot de passe requis')
  })

  it('une 2e tablette master est refusée, puis acceptée quand la 1re part', async () => {
    const first = await tablet({ password: 'm' })
    assert.equal(first.welcome?.role, 'master')
    assert.equal((await tablet({ password: 'm' })).refused, 'nombre maximum de joueurs atteint')

    first.socket.disconnect()
    await new Promise((resolve) => setTimeout(resolve, 50))
    assert.equal((await tablet({ password: 'm' })).welcome?.role, 'master')
  })

  it('une tablette qui revient avec son jeton retrouve son rôle', async () => {
    const first = await tablet({ password: 'm' })
    first.socket.disconnect()
    const again = await tablet({ token: first.welcome!.token })
    assert.equal(again.welcome?.role, 'master')
    assert.equal(again.welcome?.token, first.welcome!.token)
  })

  it('la tablette est rangée dans la salle de son rôle', async () => {
    const ops = await tablet({ password: 'o' })
    const master = await tablet({ password: 'm' })
    const received: string[] = []
    ops.socket.on('test', () => received.push('ops'))
    master.socket.on('test', () => received.push('master'))

    io.to('ops').emit('test')
    await new Promise((resolve) => setTimeout(resolve, 50))
    assert.deepEqual(received, ['ops'])
  })
})
