import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {IotDeviceState} from '@escape/shared/iot'
import type {IotStatus} from '../../src/iot/port.js'
import {createRegistry} from '../../src/iot/registry.js'

vi.mock('../../src/logger.js', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}))

function makeState(overrides: Partial<IotDeviceState> = {}): IotDeviceState {
  return {
    lights: null,
    audio: null,
    door: 'closed',
    ...overrides,
  }
}

describe('createRegistry - logique métier de supervision', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("expose un état initial vide et sans gateway connue", () => {
    const registry = createRegistry()

    expect(registry.snapshot()).toEqual({gateways: []})
    expect(registry.get('gw-1')).toBeUndefined()
    expect(registry.getGatewayId('sock-1')).toBeUndefined()
    expect(registry.getOnline()).toEqual([])
  })

  it("markOnline: enregistre une gateway disponible et n'émet un statut online que sur transition réelle", () => {
    const registry = createRegistry()
    const statuses: IotStatus[] = []
    registry.onStatus((s) => statuses.push(s))

    const state = makeState({lights: 'ambiance'})
    registry.markOnline('gw-1', 'sock-1', 1000, state)

    expect(registry.get('gw-1')).toMatchObject({
      id: 'gw-1',
      socketId: 'sock-1',
      online: true,
      lastSeenAt: 1000,
    })
    expect(registry.get('gw-1')?.offlineAt).toBeUndefined()
    expect(registry.getGatewayId('sock-1')).toBe('gw-1')
    expect(registry.getOnline().map((g) => g.id)).toEqual(['gw-1'])
    expect(statuses).toEqual([{gatewayId: 'gw-1', online: true, lastSeenAt: 1000}])

    // déjà online : mise à jour sans nouvelle notification de transition
    registry.markOnline('gw-1', 'sock-2', 2000, makeState({lights: 'alarm'}))
    expect(statuses).toHaveLength(1)
    expect(registry.get('gw-1')).toMatchObject({
      socketId: 'sock-2',
      online: true,
      lastSeenAt: 2000,
    })
    expect(registry.get('gw-1')?.state.lights).toBe('alarm')
    expect(registry.getGatewayId('sock-2')).toBe('gw-1')
  })

  it("markOnline: ré-émet online lors d'un retour après déconnexion", () => {
    const registry = createRegistry()
    const statuses: IotStatus[] = []
    registry.onStatus((s) => statuses.push(s))

    registry.markOnline('gw-1', 'sock-1', 1000, makeState())
    registry.markOffline('gw-1', 'sock-1', 1500)
    registry.markOnline('gw-1', 'sock-2', 2000, makeState())

    expect(statuses).toEqual([
      {gatewayId: 'gw-1', online: true, lastSeenAt: 1000},
      {gatewayId: 'gw-1', online: false, lastSeenAt: 1000},
      {gatewayId: 'gw-1', online: true, lastSeenAt: 2000},
    ])
    expect(registry.get('gw-1')?.offlineAt).toBeUndefined()
  })

  it("markOffline: ne s'applique qu'au socket courant et préserve le lastSeenAt métier", () => {
    const registry = createRegistry()
    const statuses: IotStatus[] = []
    registry.onStatus((s) => statuses.push(s))

    registry.markOnline('gw-1', 'sock-1', 1000, makeState())
    registry.touch('gw-1', 1200)

    // socket obsolète: ne doit pas déconnecter la gateway active
    registry.markOffline('gw-1', 'sock-old', 1300)
    expect(registry.get('gw-1')).toMatchObject({online: true, socketId: 'sock-1', lastSeenAt: 1200})

    registry.markOffline('gw-1', 'sock-1', 1500)
    expect(registry.get('gw-1')).toMatchObject({
      online: false,
      socketId: null,
      lastSeenAt: 1200,
      offlineAt: 1500,
    })
    expect(statuses).toEqual([
      {gatewayId: 'gw-1', online: true, lastSeenAt: 1000},
      {gatewayId: 'gw-1', online: false, lastSeenAt: 1200},
    ])

    // déjà offline: pas de nouvelle notification
    registry.markOffline('gw-1', 'sock-1', 1600)
    expect(statuses).toHaveLength(2)

    // inconnue: no-op
    registry.markOffline('gw-x', 'sock-x', 1600)
    expect(statuses).toHaveLength(2)
  })

  it("touch: reflète l'activité connue et ignore les gateways inconnues", () => {
    const registry = createRegistry()
    registry.markOnline('gw-1', 'sock-1', 1000, makeState())

    registry.touch('gw-1', 1234)
    expect(registry.get('gw-1')?.lastSeenAt).toBe(1234)

    registry.touch('gw-x', 9999)
    expect(registry.get('gw-x')).toBeUndefined()
  })

  it("met à jour l'état métier (sorties/entrées) sans impacter les gateways inconnues", () => {
    const registry = createRegistry()
    registry.markOnline('gw-1', 'sock-1', 1000, makeState({lights: 'ambiance', door: 'closed'}))

    registry.setOutputState('gw-1', {
      lights: 'alarm',
      audio: {track: 'alarm.mp3', volume: 80, loop: true, status: 'playing'},
    })
    expect(registry.get('gw-1')?.state).toEqual({
      lights: 'alarm',
      audio: {track: 'alarm.mp3', volume: 80, loop: true, status: 'playing'},
      door: 'closed',
    })

    registry.setInputState('gw-1', {door: 'open'})
    expect(registry.get('gw-1')?.state).toMatchObject({lights: 'alarm', door: 'open'})

    registry.setState('gw-1', makeState({lights: 'success', door: 'closed', audio: null}))
    expect(registry.get('gw-1')?.state).toEqual({lights: 'success', audio: null, door: 'closed'})

    registry.setOutputState('gw-x', {lights: 'x', audio: null})
    registry.setInputState('gw-x', {door: 'open'})
    registry.setState('gw-x', makeState({lights: 'x'}))
    expect(registry.get('gw-x')).toBeUndefined()
  })

  it("copie l'état fourni pour éviter toute corruption par mutation externe", () => {
    const registry = createRegistry()
    const incoming = makeState({
      lights: 'ambiance',
      audio: {track: 'a.mp3', volume: 10, loop: true, status: 'playing'},
    })

    registry.markOnline('gw-1', 'sock-1', 1000, incoming)
    incoming.lights = 'MUTATED'
    incoming.audio!.volume = 99

    expect(registry.get('gw-1')?.state).toEqual({
      lights: 'ambiance',
      audio: {track: 'a.mp3', volume: 10, loop: true, status: 'playing'},
      door: 'closed',
    })

    const next = makeState({
      lights: 'success',
      audio: {track: 'b.mp3', volume: 20, loop: false, status: 'playing'},
    })
    registry.setState('gw-1', next)
    next.lights = 'MUTATED'
    next.audio!.track = 'MUTATED.mp3'
    expect(registry.get('gw-1')?.state).toMatchObject({lights: 'success'})
    expect(registry.get('gw-1')?.state.audio).toMatchObject({track: 'b.mp3'})
  })

  it("expose des lectures isolées: muter un résultat ne modifie pas l'état interne", () => {
    const registry = createRegistry()
    registry.markOnline('gw-1', 'sock-1', 1000, makeState({
      lights: 'ambiance',
      audio: {track: 'a.mp3', volume: 10, loop: true, status: 'playing'},
    }))

    const got = registry.get('gw-1')!
    got.state.lights = 'MUTATED'
    got.state.audio!.volume = 99
    got.socketId = 'MUTATED'

    expect(registry.get('gw-1')?.state.lights).toBe('ambiance')
    expect(registry.get('gw-1')?.state.audio?.volume).toBe(10)
    expect(registry.get('gw-1')?.socketId).toBe('sock-1')

    const online = registry.getOnline()
    online[0].state.door = 'open'
    expect(registry.get('gw-1')?.state.door).toBe('closed')

    const snap = registry.snapshot()
    snap.gateways[0].state.lights = 'MUTATED'
    expect(registry.get('gw-1')?.state.lights).toBe('ambiance')
  })

  it("onStatus: permet le désabonnement et isole une défaillance de handler", () => {
    const registry = createRegistry()
    const received: IotStatus[] = []
    const unsubscribe = registry.onStatus((s) => received.push(s))
    registry.onStatus(() => {
      throw new Error('boom')
    })
    const receivedAfter: IotStatus[] = []
    registry.onStatus((s) => receivedAfter.push(s))

    registry.markOnline('gw-1', 'sock-1', 1000, makeState())

    expect(received).toEqual([{gatewayId: 'gw-1', online: true, lastSeenAt: 1000}])
    expect(receivedAfter).toEqual([{gatewayId: 'gw-1', online: true, lastSeenAt: 1000}])

    unsubscribe()
    registry.markOffline('gw-1', 'sock-1', 1500)
    expect(received).toHaveLength(1)
    expect(receivedAfter).toHaveLength(2)
  })
})
