import path from 'node:path'

export type LogLevel = 'debug' | 'info'
export type AudioDriver = 'fake' | 'mpv'
export type InputDriver = 'fake' | 'http'

export type GatewayConfig = {
  gatewayId: string
  serverUrl: string
  token: string
  version: string
  logLevel: LogLevel
  fakeInput: boolean
  audio: {
    driver: AudioDriver
    dir: string
    device?: string
    command: string
  }
  /** Bus HTTP partagé par tous les devices ESP32. */
  deviceHttp: {
    host: string
    port: number
    token?: string
  }
  door: { driver: InputDriver }
  keypad: { driver: InputDriver }
}

function readString(env: NodeJS.ProcessEnv, key: string, fallback: string): string {
  const value = env[key]
  return value && value.trim() ? value.trim() : fallback
}

function readLogLevel(env: NodeJS.ProcessEnv): LogLevel {
  if (env.LOG_LEVEL === 'debug' || env.LOG_LEVEL === 'info') {
    return env.LOG_LEVEL
  }
  return env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function readAudioDriver(env: NodeJS.ProcessEnv): AudioDriver {
  const value = env.IOT_AUDIO_DRIVER?.trim()
  if (!value || value === 'fake') return 'fake'
  if (value === 'mpv') return 'mpv'
  throw new Error('IOT_AUDIO_DRIVER must be fake or mpv')
}

function readInputDriver(env: NodeJS.ProcessEnv, key: string): InputDriver {
  const value = env[key]?.trim()
  if (!value || value === 'fake') return 'fake'
  if (value === 'http') return 'http'
  throw new Error(`${key} must be fake or http`)
}

function readPort(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const value = env[key]?.trim()
  if (!value) return fallback
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${key} must be an integer between 1 and 65535`)
  }
  return port
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const token = env.IOT_GATEWAY_TOKEN

  if (!token) {
    throw new Error('IOT_GATEWAY_TOKEN is required')
  }

  const config: GatewayConfig = {
    gatewayId: readString(env, 'IOT_GATEWAY_ID', 'gateway-local'),
    serverUrl: readString(env, 'IOT_SERVER_URL', 'http://localhost:3000'),
    token,
    version: readString(env, 'IOT_GATEWAY_VERSION', '0.1.0'),
    logLevel: readLogLevel(env),
    fakeInput: env.IOT_FAKE_INPUT === '1' || env.IOT_FAKE_INPUT === 'true',
    audio: {
      driver: readAudioDriver(env),
      dir: path.resolve(readString(env, 'IOT_AUDIO_DIR', 'audio')),
      device: env.IOT_AUDIO_DEVICE?.trim() || undefined,
      command: readString(env, 'IOT_AUDIO_COMMAND', 'mpv'),
    },
    deviceHttp: {
      host: readString(env, 'IOT_DEVICES_HTTP_HOST', '0.0.0.0'),
      port: readPort(env, 'IOT_DEVICES_HTTP_PORT', 8080),
      token: env.IOT_DEVICE_TOKEN?.trim() || undefined,
    },
    door: { driver: readInputDriver(env, 'IOT_DOOR_DRIVER') },
    keypad: { driver: readInputDriver(env, 'IOT_KEYPAD_DRIVER') },
  }

  if (
    (config.door.driver === 'http' || config.keypad.driver === 'http') &&
    !config.deviceHttp.token
  ) {
    throw new Error('IOT_DEVICE_TOKEN is required when a device driver is http')
  }

  return config
}
