import {IOT_EVENTS, IOT_NAMESPACE} from '@escape/shared/iot'
import type {
  IotCommand,
  IotCommandAck,
  IotDeviceState,
  IotEvent,
  IotHello,
  IotWelcome,
} from '@escape/shared/iot'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {createSocketTransport} from '../../src/transport/socket.js'
import {makeConfig, makeLogger} from '../helpers.js'

const mocks = vi.hoisted(() => ({
  io: vi.fn(),
  socket: {
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}))

vi.mock('socket.io-client', () => ({io: mocks.io}))

function receive(event: string, payload?: unknown): void {
  const call = mocks.socket.on.mock.calls.find(([name]) => name === event)
  expect(call).toBeDefined()
  const handler = call?.[1] as ((payload?: unknown) => void) | undefined
  handler?.(payload)
}

describe('createSocketTransport', () => {
  beforeEach(() => {
    mocks.io.mockReset()
    mocks.io.mockReturnValue(mocks.socket)
    for (const fn of Object.values(mocks.socket)) fn.mockReset()
  })

  it('se connecte au namespace /iot avec le token et sans connexion automatique', () => {
    createSocketTransport(
      makeConfig({serverUrl: 'http://serveur:3000', token: 'secret'}),
      makeLogger(),
    )

    expect(mocks.io).toHaveBeenCalledWith('http://serveur:3000/iot', {
      auth: {token: 'secret'},
      autoConnect: false,
      reconnection: true,
    })
    expect(mocks.socket.on.mock.calls.map(([name]) => name)).toEqual([
      'connect',
      'disconnect',
      'connect_error',
      IOT_EVENTS.WELCOME,
      IOT_EVENTS.COMMAND,
      IOT_EVENTS.EVENT_ACK,
    ])
  })

  it('délègue connect et disconnect au socket', () => {
    const transport = createSocketTransport(makeConfig(), makeLogger())

    transport.connect()
    expect(mocks.socket.connect).toHaveBeenCalledTimes(1)

    transport.disconnect()
    expect(mocks.socket.removeAllListeners).toHaveBeenCalledTimes(1)
    expect(mocks.socket.disconnect).toHaveBeenCalledTimes(1)
  })

  it('émet chaque message sur le bon événement du protocole', () => {
    const transport = createSocketTransport(makeConfig(), makeLogger())
    const state: IotDeviceState = {lights: 'alarm', audio: null, door: 'open'}
    const hello: IotHello = {
      gatewayId: 'gw-1',
      version: '1.0',
      devices: ['light-main'],
      state,
      at: 1000,
    }
    const ack: IotCommandAck = {commandId: 'c1', ok: true, outputs: {lights: null, audio: null}}
    const event: IotEvent = {
      eventId: 'e1',
      type: 'door',
      deviceId: 'door-main',
      state: 'open',
      at: 1000,
    }

    transport.sendHello(hello)
    transport.sendCommandAck(ack)
    transport.sendEvent(event)
    transport.sendState(state)

    expect(mocks.socket.emit.mock.calls).toEqual([
      [IOT_EVENTS.HELLO, hello],
      [IOT_EVENTS.COMMAND_ACK, ack],
      [IOT_EVENTS.EVENT, event],
      [IOT_EVENTS.STATE, state],
    ])
  })

  it('dispatche les messages reçus et permet le désabonnement', () => {
    const transport = createSocketTransport(makeConfig(), makeLogger())
    const onConnect = vi.fn()
    const onWelcome = vi.fn()
    const onCommand = vi.fn()
    const onEventAck = vi.fn()

    const unsubscribeConnect = transport.onConnect(onConnect)
    transport.onWelcome(onWelcome)
    transport.onCommand(onCommand)
    transport.onEventAck(onEventAck)

    const welcome: IotWelcome = {
      sessionId: 'session-1',
      desiredState: {lights: null, audio: null},
      at: 1000,
    }
    const command: IotCommand = {commandId: 'c1', type: 'light', action: 'on'}
    const ack: IotCommandAck = {commandId: 'c1', ok: true, outputs: {lights: 'on', audio: null}}

    receive('connect')
    receive(IOT_EVENTS.WELCOME, welcome)
    receive(IOT_EVENTS.COMMAND, command)
    receive(IOT_EVENTS.EVENT_ACK, ack)

    expect(onConnect).toHaveBeenCalledTimes(1)
    expect(onWelcome).toHaveBeenCalledWith(welcome)
    expect(onCommand).toHaveBeenCalledWith(command)
    expect(onEventAck).toHaveBeenCalledWith(ack)

    unsubscribeConnect()
    receive('connect')
    expect(onConnect).toHaveBeenCalledTimes(1)
  })

  it('isole les handlers qui lèvent une erreur', () => {
    const logger = makeLogger()
    const transport = createSocketTransport(makeConfig(), logger)
    const command: IotCommand = {commandId: 'c1', type: 'light', action: 'on'}

    const healthyCommand = vi.fn()
    transport.onCommand(() => {
      throw new Error('boom')
    })
    transport.onCommand(healthyCommand)
    receive(IOT_EVENTS.COMMAND, command)

    expect(healthyCommand).toHaveBeenCalledWith(command)
    expect(logger.error).toHaveBeenCalledWith(
      {err: expect.any(Error), handler: 'command'},
      'error in handler',
    )

    const healthyConnect = vi.fn()
    transport.onConnect(() => {
      throw new Error('boom')
    })
    transport.onConnect(healthyConnect)
    receive('connect')

    expect(healthyConnect).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith({err: expect.any(Error)}, 'error in connect handler')
  })

  it('loggue les déconnexions et les refus de connexion', () => {
    const logger = makeLogger()
    createSocketTransport(makeConfig(), logger)

    receive('disconnect', 'io server disconnect')
    expect(logger.info).toHaveBeenCalledWith(
      {reason: 'io server disconnect'},
      'déconnecté du serveur',
    )

    receive('connect_error', new Error('refusé'))
    expect(logger.error).toHaveBeenCalledWith(
      {err: expect.any(Error)},
      'connexion refusée par le serveur',
    )
  })
})
