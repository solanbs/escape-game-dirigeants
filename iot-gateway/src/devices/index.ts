import type { GatewayConfig } from '../config.js'
import type { Logger } from '../logger.js'
import { createHttpDoor } from './door-http.js'
import { createFakeDevices } from './fake.js'
import type { DeviceHttpServer } from './http-server.js'
import { createDeviceHttpServer } from './http-server.js'
import { createHttpKeypad } from './keypad-http.js'
import type { GatewayDevices } from './types.js'
import { createMpvAudio } from './mpv.js'

/**
 * Les devices sont choisis par configuration. Les drivers HTTP partagent un
 * seul bus : ajouter un nouvel ESP32 = un driver + un canal, sans toucher au gateway.
 */
export function createDevices(config: GatewayConfig, logger: Logger): GatewayDevices {
  const devices: GatewayDevices = createFakeDevices()

  if (config.audio.driver === 'mpv') {
    devices.audio = createMpvAudio({
      audioDir: config.audio.dir,
      command: config.audio.command,
      device: config.audio.device,
      logger,
    })
  }

  let server: DeviceHttpServer | undefined
  if (config.door.driver === 'http' || config.keypad.driver === 'http') {
    if (!config.deviceHttp.token) {
      throw new Error('IOT_DEVICE_TOKEN is required when a device driver is http')
    }
    server = createDeviceHttpServer({
      host: config.deviceHttp.host,
      port: config.deviceHttp.port,
      token: config.deviceHttp.token,
      logger,
    })
  }

  if (config.door.driver === 'http' && server) {
    devices.door = createHttpDoor({ server, logger })
  }

  if (config.keypad.driver === 'http' && server) {
    devices.keypad = createHttpKeypad({ server, logger })
  }

  return devices
}
