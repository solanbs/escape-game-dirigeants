import { io, type Socket } from 'socket.io-client'
import { IOT_EVENTS, IOT_NAMESPACE } from '@escape/shared/iot'
import type {
  IotCommand,
  IotCommandAck,
  IotDeviceState,
  IotEvent,
  IotEventAck,
  IotHello,
  IotWelcome,
} from '@escape/shared/iot'
import type { GatewayConfig } from '../config.js'
import type { Unsubscribe } from '../devices/types.js'
import type { Logger } from '../logger.js'

type Handler<T> = (payload: T) => void

export type GatewayTransport = {
  connect(): void
  disconnect(): void

  onConnect(handler: () => void): Unsubscribe
  onWelcome(handler: Handler<IotWelcome>): Unsubscribe
  onCommand(handler: Handler<IotCommand>): Unsubscribe
  onEventAck(handler: Handler<IotEventAck>): Unsubscribe

  sendHello(hello: IotHello): void
  sendCommandAck(ack: IotCommandAck): void
  sendEvent(event: IotEvent): void
  sendState(state: IotDeviceState): void
}

function dispatch<T>(
  handlers: Set<Handler<T>>,
  payload: T,
  logger: Logger,
  name: string,
): void {
  for (const handler of handlers) {
    try {
      handler(payload)
    } catch (err) {
      logger.error({ err, handler: name }, 'error in handler')
    }
  }
}

export function createSocketTransport(config: GatewayConfig, logger: Logger): GatewayTransport {
  const socket: Socket = io(`${config.serverUrl}${IOT_NAMESPACE}`, {
    auth: { token: config.token },
    autoConnect: false,
    reconnection: true,
  })

  const connectHandlers = new Set<() => void>()
  const welcomeHandlers = new Set<Handler<IotWelcome>>()
  const commandHandlers = new Set<Handler<IotCommand>>()
  const eventAckHandlers = new Set<Handler<IotEventAck>>()

  socket.on('connect', () => {
    logger.info('connecté au serveur')
    for (const handler of connectHandlers) {
      try {
        handler()
      } catch (err) {
        logger.error({ err }, 'error in connect handler')
      }
    }
  })

  socket.on('disconnect', (reason: string) => {
    logger.info({ reason }, 'déconnecté du serveur')
  })

  socket.on('connect_error', (err: Error) => {
    logger.error({ err }, 'connexion refusée par le serveur')
  })

  socket.on(IOT_EVENTS.WELCOME, (payload: IotWelcome) => {
    dispatch(welcomeHandlers, payload, logger, 'welcome')
  })

  socket.on(IOT_EVENTS.COMMAND, (payload: IotCommand) => {
    dispatch(commandHandlers, payload, logger, 'command')
  })

  socket.on(IOT_EVENTS.EVENT_ACK, (payload: IotEventAck) => {
    dispatch(eventAckHandlers, payload, logger, 'event-ack')
  })

  return {
    connect() {
      socket.connect()
    },
    disconnect() {
      socket.removeAllListeners()
      socket.disconnect()
    },
    onConnect(handler) {
      connectHandlers.add(handler)
      return () => {
        connectHandlers.delete(handler)
      }
    },
    onWelcome(handler) {
      welcomeHandlers.add(handler)
      return () => {
        welcomeHandlers.delete(handler)
      }
    },
    onCommand(handler) {
      commandHandlers.add(handler)
      return () => {
        commandHandlers.delete(handler)
      }
    },
    onEventAck(handler) {
      eventAckHandlers.add(handler)
      return () => {
        eventAckHandlers.delete(handler)
      }
    },
    sendHello(hello) {
      socket.emit(IOT_EVENTS.HELLO, hello)
    },
    sendCommandAck(ack) {
      socket.emit(IOT_EVENTS.COMMAND_ACK, ack)
    },
    sendEvent(event) {
      socket.emit(IOT_EVENTS.EVENT, event)
    },
    sendState(state) {
      socket.emit(IOT_EVENTS.STATE, state)
    },
  }
}
