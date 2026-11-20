import type { IotAudioRequest, IotAudioState } from '@escape/shared/iot'
import type {
  AudioDevice,
  DoorSensor,
  GatewayDevices,
  Keypad,
  LightDevice,
  Unsubscribe,
} from './types.js'

export type FakeDoorSensor = DoorSensor & {
  toggle(): void
}

export type FakeKeypad = Keypad & {
  pushCode(code: string): void
  getLastDisplay(): string
}

export type FakeDevices = GatewayDevices & {
  door: FakeDoorSensor
  keypad: FakeKeypad
}

function createFakeLight(): LightDevice {
  let scene: string | null = null

  return {
    async setScene(value) {
      if (!value.trim()) throw new Error('scene is required')
      scene = value
    },
    async turnOn() {
      scene = scene ?? 'on'
    },
    async turnOff() {
      scene = null
    },
    getState() {
      return scene
    },
  }
}

function createFakeAudio(): AudioDevice {
  let audio: IotAudioState | null = null

  return {
    async play(request: IotAudioRequest) {
      if (!request.track.trim()) throw new Error('track is required')
      if (
        request.volume !== undefined &&
        (!Number.isFinite(request.volume) || request.volume < 0 || request.volume > 100)
      ) {
        throw new Error('volume must be between 0 and 100')
      }

      audio = {
        track: request.track,
        volume: request.volume ?? 70,
        loop: request.loop ?? false,
        status: 'playing',
      }
    },
    async stop() {
      audio = null
    },
    getState() {
      return audio
    },
  }
}

function createFakeDoor(): FakeDoorSensor {
  let state: 'open' | 'closed' = 'closed'
  const handlers = new Set<(state: 'open' | 'closed') => void>()

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
    toggle() {
      state = state === 'closed' ? 'open' : 'closed'
      for (const handler of handlers) {
        handler(state)
      }
    },
  }
}

function createFakeKeypad(): FakeKeypad {
  const handlers = new Set<(code: string) => void>()
  let lastDisplay = ''

  return {
    onCode(handler): Unsubscribe {
      handlers.add(handler)
      return () => {
        handlers.delete(handler)
      }
    },
    async display(text) {
      lastDisplay = text
      console.info(`[fake-keypad] ${text}`)
    },
    pushCode(code) {
      if (!code.trim()) return
      for (const handler of handlers) {
        handler(code)
      }
    },
    getLastDisplay() {
      return lastDisplay
    },
  }
}

export function createFakeDevices(): FakeDevices {
  return {
    light: createFakeLight(),
    audio: createFakeAudio(),
    door: createFakeDoor(),
    keypad: createFakeKeypad(),
  }
}
