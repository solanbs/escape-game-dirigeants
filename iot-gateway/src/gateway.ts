import { randomUUID } from 'node:crypto'
import type {
  CommandId,
  EventId,
  IotAudioRequest,
  IotCommand,
  IotCommandAck,
  IotDesiredState,
  IotEventAck,
  IotWelcome,
} from '@escape/shared/iot'
import type { GatewayConfig } from './config.js'
import type { GatewayDevices, Unsubscribe } from './devices/types.js'
import type { Logger } from './logger.js'
import type { State } from './state.js'
import type { GatewayTransport } from './transport/socket.js'

type PendingCode = {
  eventId: EventId
  resolve: (ack: IotEventAck) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

export type Gateway = {
  start(): Promise<void>
  stop(): Promise<void>
}

export type GatewayDeps = {
  config: GatewayConfig
  transport: GatewayTransport
  devices: GatewayDevices
  state: State
  logger: Logger
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function assertNonEmpty(value: string, name: string): void {
  if (!value.trim()) throw new Error(`${name} is required`)
}

function assertAudio(audio: IotAudioRequest): void {
  assertNonEmpty(audio.track, 'track')
  if (
    audio.volume !== undefined &&
    (!Number.isFinite(audio.volume) || audio.volume < 0 || audio.volume > 100)
  ) {
    throw new Error('volume must be between 0 and 100')
  }
}

export function createGateway(deps: GatewayDeps): Gateway {
  const { config, transport, devices, state, logger } = deps

  const seenCommands = new Set<CommandId>()
  const pendingCodes = new Map<EventId, PendingCode>()
  let sessionId: string | null = null
  let started = false
  let subscriptions: Unsubscribe[] = []

  function sendState(): void {
    transport.sendState(state.snapshot())
  }

  function refreshOutputs(): void {
    state.setLights(devices.light.getState())
    state.setAudio(devices.audio.getState())
  }

  async function executeCommand(command: IotCommand): Promise<void> {
    switch (command.type) {
      case 'light':
        if (command.action === 'on') {
          await devices.light.turnOn()
        } else if (command.action === 'off') {
          await devices.light.turnOff()
        } else if (command.action === 'scene') {
          assertNonEmpty(command.scene, 'scene')
          await devices.light.setScene(command.scene)
        } else {
          throw new Error('Unknown light action')
        }
        break

      case 'audio':
        if (command.action === 'play') {
          assertAudio(command.audio)
          await devices.audio.play(command.audio)
        } else if (command.action === 'stop') {
          await devices.audio.stop()
        } else {
          throw new Error('Unknown audio action')
        }
        break

      default:
        throw new Error('Unknown command type')
    }
  }

  async function handleCommand(command: IotCommand): Promise<void> {
    if (seenCommands.has(command.commandId)) {
      logger.debug({ commandId: command.commandId }, 'commande déjà appliquée')
      return
    }
    seenCommands.add(command.commandId)

    logger.info(
      {
        commandId: command.commandId,
        type: command.type,
        action: command.action,
      },
      'commande reçue',
    )

    let ack: IotCommandAck

    try {
      await executeCommand(command)
      refreshOutputs()
      ack = {
        commandId: command.commandId,
        ok: true,
        outputs: state.outputs(),
      }
    } catch (err) {
      refreshOutputs()
      ack = {
        commandId: command.commandId,
        ok: false,
        error: errorMessage(err),
        outputs: state.outputs(),
      }
      logger.error(
        { commandId: command.commandId, err },
        'commande échouée',
      )
    }

    transport.sendCommandAck(ack)
    sendState()
  }

  async function applyDesiredState(desired: IotDesiredState): Promise<void> {
    if (desired.lights === null) {
      await devices.light.turnOff()
    } else {
      assertNonEmpty(desired.lights, 'lights')
      await devices.light.setScene(desired.lights)
    }

    if (desired.audio === null) {
      await devices.audio.stop()
    } else {
      assertAudio(desired.audio)
      await devices.audio.play(desired.audio)
    }

    refreshOutputs()
    sendState()
  }

  function handleWelcome(welcome: IotWelcome): void {
    if (sessionId !== welcome.sessionId) {
      sessionId = welcome.sessionId
      seenCommands.clear()
    }

    logger.info({ sessionId: welcome.sessionId }, 'welcome reçu')

    void (async () => {
      try {
        await applyDesiredState(welcome.desiredState)
      } catch (err) {
        logger.error({ err }, 'application de desiredState impossible')
        sendState()
      }
    })()
  }

  function handleDoor(door: 'open' | 'closed'): void {
    state.setDoor(door)
    sendState()

    transport.sendEvent({
      eventId: randomUUID(),
      type: 'door',
      deviceId: 'door-main',
      state: door,
      at: Date.now(),
    })
  }

  function requestCodeAck(eventId: EventId, code: string): Promise<IotEventAck> {
    transport.sendEvent({
      eventId,
      type: 'code',
      deviceId: 'keypad-main',
      code,
      at: Date.now(),
    })

    return new Promise<IotEventAck>((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingCodes.delete(eventId)
        reject(new Error('EVENT_ACK timeout'))
      }, 5000)

      pendingCodes.set(eventId, { eventId, resolve, reject, timer })
    })
  }

  async function handleCode(code: string): Promise<void> {
    const eventId = randomUUID()
    const ack = await requestCodeAck(eventId, code)

    if (ack.ok) {
      await devices.keypad.display(ack.result.display)
    } else {
      await devices.keypad.display('ERREUR')
    }
  }

  function onCode(code: string): void {
    void handleCode(code).catch(async (err) => {
      logger.error({ err }, 'traitement du code impossible')
      try {
        await devices.keypad.display('ERREUR')
      } catch (displayErr) {
        logger.error({ err: displayErr }, 'affichage clavier impossible')
      }
    })
  }

  function handleEventAck(ack: IotEventAck): void {
    const pending = pendingCodes.get(ack.eventId)
    if (!pending) {
      logger.debug({ eventId: ack.eventId }, 'EVENT_ACK inconnu')
      return
    }

    pendingCodes.delete(ack.eventId)
    clearTimeout(pending.timer)

    if (ack.ok) {
      pending.resolve(ack)
    } else {
      pending.reject(new Error(ack.error))
    }
  }

  function sendHello(): void {
    transport.sendHello({
      gatewayId: config.gatewayId,
      version: config.version,
      devices: ['light-main', 'audio-main', 'door-main', 'keypad-main'],
      state: state.snapshot(),
      at: Date.now(),
    })
  }

  function rejectAllPendingCodes(): void {
    for (const [eventId, pending] of pendingCodes) {
      pendingCodes.delete(eventId)
      clearTimeout(pending.timer)
      pending.reject(new Error('gateway stopped'))
    }
  }

  return {
    async start() {
      if (started) return
      started = true

      subscriptions = [
        transport.onConnect(sendHello),
        transport.onWelcome(handleWelcome),
        transport.onCommand((command) => {
          void handleCommand(command).catch((err) => {
            logger.error({ err }, 'handler commande inattendu')
          })
        }),
        transport.onEventAck(handleEventAck),
        devices.door.onChange(handleDoor),
        devices.keypad.onCode(onCode),
      ]

      transport.connect()
      logger.info(
        {
          gatewayId: config.gatewayId,
          serverUrl: config.serverUrl,
        },
        'gateway démarré',
      )
    },

    async stop() {
      if (!started) return
      started = false

      for (const unsubscribe of subscriptions.splice(0)) {
        unsubscribe()
      }

      rejectAllPendingCodes()
      transport.disconnect()

      for (const device of Object.values(devices)) {
        await device.close?.()
      }

      logger.info('gateway arrêté')
    },
  }
}
