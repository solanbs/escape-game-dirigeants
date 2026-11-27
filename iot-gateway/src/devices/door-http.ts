import type { Logger } from '../logger.js'
import { createHttpChannel, requireString } from './http-channel.js'
import { HttpDeviceError, type DeviceHttpServer } from './http-server.js'
import type { DoorSensor, Unsubscribe } from './types.js'

export type HttpDoorOptions = {
  server: DeviceHttpServer
  deviceId?: string
  logger?: Logger
}

/** Capteur de porte ESP32 : reçoit `open` / `closed` sur le bus HTTP commun. */
export function createHttpDoor(options: HttpDoorOptions): DoorSensor {
  const deviceId = options.deviceId ?? 'door-main'
  let state: 'open' | 'closed' = 'closed'
  const handlers = new Set<(state: 'open' | 'closed') => void>()

  const channel = createHttpChannel<{ state: 'open' | 'closed' }>(options.server, {
    deviceId,
    type: 'door',
    parse(payload) {
      const value = requireString(payload, 'state', 16)
      if (value !== 'open' && value !== 'closed') {
        throw new HttpDeviceError(400, 'state must be open or closed')
      }
      return { state: value }
    },
    logger: options.logger,
  })

  channel.onEvent((event) => {
    if (event.state === state) {
      options.logger?.debug({ deviceId, state }, 'état de porte inchangé')
      return
    }
    state = event.state
    for (const handler of handlers) handler(state)
  })

  return {
    getState() {
      return state
    },
    onChange(handler): Unsubscribe {
      handlers.add(handler)
      return () => {
        handlers.delete(handler)
      }
    },
    async close() {
      await options.server.close()
    },
  }
}
