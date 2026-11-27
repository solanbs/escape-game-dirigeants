import {vi} from 'vitest'
import type {
  IotAudioRequest,
  IotAudioState,
  IotCommand,
  IotEvent,
  IotEventAck,
  IotWelcome,
} from '@escape/shared/iot'
import type {GatewayConfig} from '../src/config.js'
import type {GatewayDevices, Unsubscribe} from '../src/devices/types.js'
import {createGateway} from '../src/gateway.js'
import type {Logger} from '../src/logger.js'
import {createState} from '../src/state.js'
import type {GatewayTransport} from '../src/transport/socket.js'

type DoorState = 'open' | 'closed'

export type DeviceStateInit = {
  lights?: string | null
  audio?: IotAudioState | null
  door?: DoorState
}

export function makeConfig(overrides: Partial<GatewayConfig> = {}): GatewayConfig {
  return {
    gatewayId: 'gw-test',
    serverUrl: 'http://localhost:3000',
    token: 'token-test',
    version: '1.2.3',
    logLevel: 'debug',
    fakeInput: false,
    audio: {driver: 'fake', dir: '/audio-test', command: 'mpv'},
    ...overrides,
  }
}

export function makeLogger(): Logger {
  return {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  } as unknown as Logger
}

export function makeDevices(initial: DeviceStateInit = {}) {
  let lights = initial.lights ?? null
  let audio = initial.audio ?? null
  let door = initial.door ?? 'closed'

  const doorHandlers = new Set<(state: DoorState) => void>()
  const codeHandlers = new Set<(code: string) => void>()

  const devices: GatewayDevices = {
    light: {
      setScene: vi.fn(async (scene: string) => {
        lights = scene
      }),
      turnOn: vi.fn(async () => {
        lights = lights ?? 'on'
      }),
      turnOff: vi.fn(async () => {
        lights = null
      }),
      getState: vi.fn(() => lights),
      close: vi.fn(async () => {}),
    },
    audio: {
      play: vi.fn(async (request: IotAudioRequest) => {
        audio = {
          track: request.track,
          volume: request.volume ?? 70,
          loop: request.loop ?? false,
          status: 'playing',
        }
      }),
      stop: vi.fn(async () => {
        audio = null
      }),
      getState: vi.fn(() => audio),
      close: vi.fn(async () => {}),
    },
    door: {
      getState: vi.fn(() => door),
      onChange: vi.fn((handler: (state: DoorState) => void): Unsubscribe => {
        doorHandlers.add(handler)
        return () => {
          doorHandlers.delete(handler)
        }
      }),
      close: vi.fn(async () => {}),
    },
    keypad: {
      onCode: vi.fn((handler: (code: string) => void): Unsubscribe => {
        codeHandlers.add(handler)
        return () => {
          codeHandlers.delete(handler)
        }
      }),
      display: vi.fn(async (_text: string) => {}),
      close: vi.fn(async () => {}),
    },
  }

  return {
    devices,
    emitDoor(state: DoorState): void {
      door = state
      for (const handler of doorHandlers) handler(state)
    },
    emitCode(code: string): void {
      for (const handler of codeHandlers) handler(code)
    },
  }
}

export function makeTransport() {
  const handlers = {
    connect: new Set<() => void>(),
    welcome: new Set<(welcome: IotWelcome) => void>(),
    command: new Set<(command: IotCommand) => void>(),
    eventAck: new Set<(ack: IotEventAck) => void>(),
  }

  const transport: GatewayTransport = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onConnect: vi.fn((handler: () => void): Unsubscribe => {
      handlers.connect.add(handler)
      return () => {
        handlers.connect.delete(handler)
      }
    }),
    onWelcome: vi.fn((handler: (welcome: IotWelcome) => void): Unsubscribe => {
      handlers.welcome.add(handler)
      return () => {
        handlers.welcome.delete(handler)
      }
    }),
    onCommand: vi.fn((handler: (command: IotCommand) => void): Unsubscribe => {
      handlers.command.add(handler)
      return () => {
        handlers.command.delete(handler)
      }
    }),
    onEventAck: vi.fn((handler: (ack: IotEventAck) => void): Unsubscribe => {
      handlers.eventAck.add(handler)
      return () => {
        handlers.eventAck.delete(handler)
      }
    }),
    sendHello: vi.fn(),
    sendCommandAck: vi.fn(),
    sendEvent: vi.fn(),
    sendState: vi.fn(),
  }

  return {
    transport,
    handlers,
    emitConnect(): void {
      for (const handler of handlers.connect) handler()
    },
    emitWelcome(payload: IotWelcome): void {
      for (const handler of handlers.welcome) handler(payload)
    },
    emitCommand(payload: IotCommand): void {
      for (const handler of handlers.command) handler(payload)
    },
    emitEventAck(payload: IotEventAck): void {
      for (const handler of handlers.eventAck) handler(payload)
    },
  }
}

export function makeHarness(
  options: {config?: Partial<GatewayConfig>; initial?: DeviceStateInit} = {},
) {
  const transport = makeTransport()
  const devices = makeDevices(options.initial)
  const state = createState(devices.devices)
  const logger = makeLogger()
  const gateway = createGateway({
    config: makeConfig(options.config),
    transport: transport.transport,
    devices: devices.devices,
    state,
    logger,
  })

  return {gateway, transport, devices, state, logger}
}

export function lastEvent(transport: GatewayTransport): IotEvent {
  const calls = vi.mocked(transport.sendEvent).mock.calls
  return calls[calls.length - 1][0]
}
