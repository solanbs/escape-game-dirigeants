import type { Logger } from '../logger.js'
import { createHttpChannel, requireString } from './http-channel.js'
import type { DeviceHttpServer } from './http-server.js'
import type { Keypad, Unsubscribe } from './types.js'

export type HttpKeypadOptions = {
  server: DeviceHttpServer
  deviceId?: string
  logger?: Logger
}

/**
 * Clavier à code ESP32 : reçoit les codes sur le bus HTTP commun.
 * Le retour d'affichage n'est pas implémenté : `display()` ne fait que logger.
 */
export function createHttpKeypad(options: HttpKeypadOptions): Keypad {
  const deviceId = options.deviceId ?? 'keypad-main'
  const channel = createHttpChannel<{ code: string }>(options.server, {
    deviceId,
    type: 'code',
    parse(payload) {
      return { code: requireString(payload, 'code') }
    },
    logger: options.logger,
  })

  return {
    onCode(handler): Unsubscribe {
      return channel.onEvent(({ code }) => handler(code))
    },
    async display(text) {
      options.logger?.debug({ deviceId, text }, 'affichage clavier (non transmis au device)')
    },
    async close() {
      await options.server.close()
    },
  }
}
