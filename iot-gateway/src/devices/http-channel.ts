import type { Logger } from '../logger.js'
import { HttpDeviceError, type DeviceEventHandler, type DeviceHttpServer } from './http-server.js'
import type { Unsubscribe } from './types.js'

export type HttpChannel<T> = {
  onEvent(handler: (payload: T) => void): Unsubscribe
}

export type HttpChannelOptions<T> = {
  deviceId: string
  type: string
  parse(payload: Record<string, unknown>): T
  logger?: Logger
}

/** Canal typé au-dessus du bus HTTP : c'est le seul code à écrire pour un nouveau device. */
export function createHttpChannel<T>(
  server: DeviceHttpServer,
  options: HttpChannelOptions<T>,
): HttpChannel<T> {
  return {
    onEvent(handler): Unsubscribe {
      const onEvent: DeviceEventHandler = (payload) => {
        try {
          handler(options.parse(payload))
        } catch (err) {
          if (err instanceof HttpDeviceError) throw err
          options.logger?.error(
            { err, deviceId: options.deviceId, type: options.type },
            'handler de canal HTTP impossible',
          )
          throw err
        }
      }
      return server.onEvent(options.deviceId, options.type, onEvent)
    },
  }
}

export function requireString(payload: Record<string, unknown>, key: string, maxLength = 64): string {
  const value = payload[key]
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpDeviceError(400, `${key} is required`)
  }
  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw new HttpDeviceError(400, `${key} is too long`)
  }
  return trimmed
}
