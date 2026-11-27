import {randomUUID} from 'node:crypto'
import type {IotAudioState, IotCommand} from '@escape/shared/iot'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {lastEvent, makeHarness} from './helpers.js'

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(),
}))

const AUDIO: IotAudioState = {
  track: 'alarm.mp3',
  volume: 80,
  loop: true,
  status: 'playing',
}

const INVALID_COMMANDS: Array<[IotCommand, string]> = [
  [
    {commandId: 'c1', type: 'light', action: 'scene', scene: '   '},
    'scene is required',
  ],
  [
    {commandId: 'c1', type: 'audio', action: 'play', audio: {track: '  '}},
    'track is required',
  ],
  [
    {commandId: 'c1', type: 'audio', action: 'play', audio: {track: 'a.mp3', volume: -1}},
    'volume must be between 0 and 100',
  ],
  [
    {commandId: 'c1', type: 'audio', action: 'play', audio: {track: 'a.mp3', volume: 101}},
    'volume must be between 0 and 100',
  ],
  [
    {commandId: 'c1', type: 'light', action: 'unknown'},
    'Unknown light action',
  ],
  [
    {commandId: 'c1', type: 'audio', action: 'unknown'},
    'Unknown audio action',
  ],
  [{commandId: 'c1', type: 'unknown'}, 'Unknown command type'],
].map(([command, message]) => [command as IotCommand, message]) as Array<[IotCommand, string]>

describe('createGateway', () => {
  beforeEach(() => {
    vi.mocked(randomUUID).mockReturnValue('event-1' as ReturnType<typeof randomUUID>)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('s abonne à tous les flux et connecte le transport une seule fois', async () => {
    const {gateway, transport, devices, logger} = makeHarness()

    await gateway.start()
    await gateway.start()

    expect(transport.transport.connect).toHaveBeenCalledTimes(1)
    for (const name of ['onConnect', 'onWelcome', 'onCommand', 'onEventAck'] as const) {
      expect(transport.transport[name]).toHaveBeenCalledTimes(1)
    }
    expect(devices.devices.door.onChange).toHaveBeenCalledTimes(1)
    expect(devices.devices.keypad.onCode).toHaveBeenCalledTimes(1)
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({gatewayId: 'gw-test'}),
      'gateway démarré',
    )
  })

  it('envoie un hello avec les devices et l état courants à la connexion', async () => {
    const {gateway, transport} = makeHarness()
    await gateway.start()

    transport.emitConnect()

    expect(transport.transport.sendHello).toHaveBeenCalledWith({
      gatewayId: 'gw-test',
      version: '1.2.3',
      devices: ['light-main', 'audio-main', 'door-main', 'keypad-main'],
      state: {lights: null, audio: null, door: 'closed'},
      at: expect.any(Number),
    })
  })

  it('applique le desiredState reçu au welcome', async () => {
    const {gateway, transport, devices, logger} = makeHarness()
    await gateway.start()

    transport.emitWelcome({
      sessionId: 'session-1',
      desiredState: {
        lights: 'ambiance',
        audio: {track: 'ambiance.mp3', volume: 40, loop: true},
      },
      at: 1000,
    })

    await vi.waitFor(() => expect(devices.devices.light.setScene).toHaveBeenCalledWith('ambiance'))
    expect(devices.devices.audio.play).toHaveBeenCalledWith({
      track: 'ambiance.mp3',
      volume: 40,
      loop: true,
    })
    await vi.waitFor(() =>
      expect(transport.transport.sendState).toHaveBeenCalledWith({
        lights: 'ambiance',
        audio: {track: 'ambiance.mp3', volume: 40, loop: true, status: 'playing'},
        door: 'closed',
      }),
    )
    expect(logger.info).toHaveBeenCalledWith({sessionId: 'session-1'}, 'welcome reçu')
  })

  it('éteint lumières et son quand le desiredState est vide', async () => {
    const {gateway, transport, devices} = makeHarness({initial: {lights: 'alarm', audio: AUDIO}})
    await gateway.start()

    transport.emitWelcome({
      sessionId: 'session-1',
      desiredState: {lights: null, audio: null},
      at: 1000,
    })

    await vi.waitFor(() => expect(devices.devices.audio.stop).toHaveBeenCalledTimes(1))
    expect(devices.devices.light.turnOff).toHaveBeenCalledTimes(1)
    expect(transport.transport.sendState).toHaveBeenCalledWith({
      lights: null,
      audio: null,
      door: 'closed',
    })
  })

  it('ne fait pas échouer le welcome quand le desiredState est invalide', async () => {
    const {gateway, transport, devices, logger} = makeHarness()
    vi.mocked(devices.devices.light.setScene).mockRejectedValueOnce(new Error('boom'))
    await gateway.start()

    transport.emitWelcome({
      sessionId: 'session-1',
      desiredState: {lights: 'alarm', audio: null},
      at: 1000,
    })

    await vi.waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith(
        {err: expect.any(Error)},
        'application de desiredState impossible',
      ),
    )
    expect(transport.transport.sendState).toHaveBeenCalledWith({
      lights: null,
      audio: null,
      door: 'closed',
    })
  })

  it('exécute une commande light scene et accuse réception', async () => {
    const {gateway, transport, devices} = makeHarness()
    await gateway.start()

    transport.emitCommand({commandId: 'c1', type: 'light', action: 'scene', scene: 'alarm'})

    await vi.waitFor(() => expect(transport.transport.sendCommandAck).toHaveBeenCalledTimes(1))
    expect(devices.devices.light.setScene).toHaveBeenCalledWith('alarm')
    expect(transport.transport.sendCommandAck).toHaveBeenCalledWith({
      commandId: 'c1',
      ok: true,
      outputs: {lights: 'alarm', audio: null},
    })
    expect(transport.transport.sendState).toHaveBeenCalledWith({
      lights: 'alarm',
      audio: null,
      door: 'closed',
    })
  })

  it.each([
    ['on', 'turnOn'],
    ['off', 'turnOff'],
  ] as const)('exécute une commande light %s', async (action, method) => {
    const {gateway, transport, devices} = makeHarness({initial: {lights: 'ambiance'}})
    await gateway.start()

    transport.emitCommand({commandId: 'c2', type: 'light', action})

    await vi.waitFor(() => expect(transport.transport.sendCommandAck).toHaveBeenCalledTimes(1))
    expect(devices.devices.light[method]).toHaveBeenCalledTimes(1)
    expect(transport.transport.sendCommandAck).toHaveBeenCalledWith({
      commandId: 'c2',
      ok: true,
      outputs: {lights: action === 'on' ? 'ambiance' : null, audio: null},
    })
  })

  it('joue une piste audio via une commande', async () => {
    const {gateway, transport, devices} = makeHarness()
    await gateway.start()

    transport.emitCommand({
      commandId: 'c3',
      type: 'audio',
      action: 'play',
      audio: {track: 'success.mp3', volume: 70, loop: false},
    })

    await vi.waitFor(() => expect(transport.transport.sendCommandAck).toHaveBeenCalledTimes(1))
    expect(devices.devices.audio.play).toHaveBeenCalledWith({
      track: 'success.mp3',
      volume: 70,
      loop: false,
    })
    expect(transport.transport.sendCommandAck).toHaveBeenCalledWith({
      commandId: 'c3',
      ok: true,
      outputs: {
        lights: null,
        audio: {track: 'success.mp3', volume: 70, loop: false, status: 'playing'},
      },
    })
  })

  it('arrête le son via une commande', async () => {
    const {gateway, transport, devices} = makeHarness({initial: {audio: AUDIO}})
    await gateway.start()

    transport.emitCommand({commandId: 'c4', type: 'audio', action: 'stop'})

    await vi.waitFor(() => expect(transport.transport.sendCommandAck).toHaveBeenCalledTimes(1))
    expect(devices.devices.audio.stop).toHaveBeenCalledTimes(1)
    expect(transport.transport.sendCommandAck).toHaveBeenCalledWith({
      commandId: 'c4',
      ok: true,
      outputs: {lights: null, audio: null},
    })
  })

  it('ignore une commande déjà appliquée', async () => {
    const {gateway, transport, devices, logger} = makeHarness()
    await gateway.start()
    const command: IotCommand = {commandId: 'c5', type: 'light', action: 'scene', scene: 'alarm'}

    transport.emitCommand(command)
    await vi.waitFor(() => expect(transport.transport.sendCommandAck).toHaveBeenCalledTimes(1))
    transport.emitCommand(command)

    expect(logger.debug).toHaveBeenCalledWith({commandId: 'c5'}, 'commande déjà appliquée')
    expect(devices.devices.light.setScene).toHaveBeenCalledTimes(1)
    expect(transport.transport.sendCommandAck).toHaveBeenCalledTimes(1)
  })

  it('ré-applique une commande après un changement de session', async () => {
    const {gateway, transport, devices} = makeHarness()
    await gateway.start()
    const command: IotCommand = {commandId: 'c6', type: 'light', action: 'scene', scene: 'alarm'}

    transport.emitCommand(command)
    await vi.waitFor(() => expect(transport.transport.sendCommandAck).toHaveBeenCalledTimes(1))

    transport.emitWelcome({
      sessionId: 'session-2',
      desiredState: {lights: null, audio: null},
      at: 1000,
    })
    await vi.waitFor(() => expect(devices.devices.light.turnOff).toHaveBeenCalledTimes(1))

    transport.emitCommand(command)
    await vi.waitFor(() => expect(transport.transport.sendCommandAck).toHaveBeenCalledTimes(2))
    expect(devices.devices.light.setScene).toHaveBeenCalledTimes(2)
  })

  it.each(INVALID_COMMANDS)('refuse la commande invalide %o', async (command, message) => {
    const {gateway, transport, logger} = makeHarness()
    await gateway.start()

    transport.emitCommand(command)

    await vi.waitFor(() => expect(transport.transport.sendCommandAck).toHaveBeenCalledTimes(1))
    expect(transport.transport.sendCommandAck).toHaveBeenCalledWith({
      commandId: 'c1',
      ok: false,
      error: message,
      outputs: {lights: null, audio: null},
    })
    expect(logger.error).toHaveBeenCalledWith(
      {commandId: 'c1', err: expect.any(Error)},
      'commande échouée',
    )
  })

  it('accuse réception en échec quand un device lève une erreur', async () => {
    const {gateway, transport, devices} = makeHarness()
    vi.mocked(devices.devices.light.setScene).mockRejectedValueOnce(new Error('boom'))
    await gateway.start()

    transport.emitCommand({commandId: 'c7', type: 'light', action: 'scene', scene: 'alarm'})

    await vi.waitFor(() => expect(transport.transport.sendCommandAck).toHaveBeenCalledTimes(1))
    expect(transport.transport.sendCommandAck).toHaveBeenCalledWith({
      commandId: 'c7',
      ok: false,
      error: 'boom',
      outputs: {lights: null, audio: null},
    })
  })

  it('signale un changement de porte dans l état et par un event', async () => {
    const {gateway, transport, devices} = makeHarness()
    await gateway.start()

    devices.emitDoor('open')

    expect(transport.transport.sendState).toHaveBeenCalledWith({
      lights: null,
      audio: null,
      door: 'open',
    })
    expect(transport.transport.sendEvent).toHaveBeenCalledWith({
      eventId: 'event-1',
      type: 'door',
      deviceId: 'door-main',
      state: 'open',
      at: expect.any(Number),
    })
    expect(lastEvent(transport.transport)).toMatchObject({type: 'door', state: 'open'})
  })

  it('envoie le code et affiche le résultat de l ack', async () => {
    const {gateway, transport, devices} = makeHarness()
    await gateway.start()

    devices.emitCode('1234')

    await vi.waitFor(() => expect(transport.transport.sendEvent).toHaveBeenCalledTimes(1))
    expect(transport.transport.sendEvent).toHaveBeenCalledWith({
      eventId: 'event-1',
      type: 'code',
      deviceId: 'keypad-main',
      code: '1234',
      at: expect.any(Number),
    })

    transport.emitEventAck({
      eventId: 'event-1',
      ok: true,
      result: {type: 'code', accepted: true, display: 'ACCÉDÉ'},
    })

    await vi.waitFor(() => expect(devices.devices.keypad.display).toHaveBeenCalledWith('ACCÉDÉ'))
  })

  it('affiche une erreur quand le serveur refuse le code', async () => {
    const {gateway, transport, devices} = makeHarness()
    await gateway.start()

    devices.emitCode('9999')
    await vi.waitFor(() => expect(transport.transport.sendEvent).toHaveBeenCalledTimes(1))
    transport.emitEventAck({eventId: 'event-1', ok: false, error: 'code invalide'})

    await vi.waitFor(() => expect(devices.devices.keypad.display).toHaveBeenCalledWith('ERREUR'))
  })

  it('ignore un ack sans code en attente', async () => {
    const {gateway, transport, devices, logger} = makeHarness()
    await gateway.start()

    transport.emitEventAck({
      eventId: 'event-1',
      ok: true,
      result: {type: 'code', accepted: true, display: 'ACCÉDÉ'},
    })

    expect(logger.debug).toHaveBeenCalledWith({eventId: 'event-1'}, 'EVENT_ACK inconnu')
    expect(devices.devices.keypad.display).not.toHaveBeenCalled()
  })

  it('affiche une erreur après le timeout de l ack', async () => {
    vi.useFakeTimers()
    const {gateway, transport, devices, logger} = makeHarness()
    await gateway.start()

    devices.emitCode('1234')
    expect(transport.transport.sendEvent).toHaveBeenCalledTimes(1)
    expect(devices.devices.keypad.display).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(5000)

    expect(devices.devices.keypad.display).toHaveBeenCalledWith('ERREUR')
    expect(logger.error).toHaveBeenCalledWith(
      {err: expect.any(Error)},
      'traitement du code impossible',
    )
  })

  it('se déabonne, déconnecte et ferme les devices à l arrêt', async () => {
    const {gateway, transport, devices, logger} = makeHarness()
    await gateway.start()

    await gateway.stop()
    await gateway.stop()

    expect(transport.transport.disconnect).toHaveBeenCalledTimes(1)
    expect(logger.info).toHaveBeenCalledWith('gateway arrêté')
    for (const device of Object.values(devices.devices)) {
      expect(device.close).toHaveBeenCalledTimes(1)
    }

    const helloCalls = vi.mocked(transport.transport.sendHello).mock.calls.length
    transport.emitConnect()
    transport.emitCommand({commandId: 'c8', type: 'light', action: 'on'})
    devices.emitDoor('open')
    devices.emitCode('1234')

    expect(transport.transport.sendHello).toHaveBeenCalledTimes(helloCalls)
    expect(transport.transport.sendCommandAck).not.toHaveBeenCalled()
    expect(transport.transport.sendEvent).not.toHaveBeenCalled()
  })

  it('rejette les codes en attente à l arrêt', async () => {
    const {gateway, devices} = makeHarness()
    await gateway.start()

    devices.emitCode('1234')
    await gateway.stop()

    await vi.waitFor(() => expect(devices.devices.keypad.display).toHaveBeenCalledWith('ERREUR'))
  })

  it('ne fait rien si on l arrête avant de l avoir démarré', async () => {
    const {gateway, transport, devices} = makeHarness()

    await gateway.stop()

    expect(transport.transport.disconnect).not.toHaveBeenCalled()
    for (const device of Object.values(devices.devices)) {
      expect(device.close).not.toHaveBeenCalled()
    }
  })
})
