import type { GatewayConfig } from '../config.js'
import type { Logger } from '../logger.js'
import { createFakeDevices, type FakeDevices } from './fake.js'
import { createMpvAudio } from './mpv.js'

/**
 * Les entrées (porte, clavier) et les lumières restent factices pour l'instant.
 * Seul l'audio peut être remplacé par un vrai driver, sans toucher au gateway.
 */
export function createDevices(config: GatewayConfig, logger: Logger): FakeDevices {
  const devices = createFakeDevices()

  if (config.audio.driver === 'mpv') {
    devices.audio = createMpvAudio({
      audioDir: config.audio.dir,
      command: config.audio.command,
      device: config.audio.device,
      logger,
    })
  }

  return devices
}
