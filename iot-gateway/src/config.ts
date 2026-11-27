import path from 'node:path'

export type LogLevel = 'debug' | 'info'
export type AudioDriver = 'fake' | 'mpv'

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

export function readConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const token = env.IOT_GATEWAY_TOKEN

  if (!token) {
    throw new Error('IOT_GATEWAY_TOKEN is required')
  }

  return {
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
  }
}
