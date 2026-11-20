import type { IotDeviceState, IotOutputState } from '@escape/shared/iot'
import type { GatewayDevices } from './devices/types.js'

export type State = {
  snapshot(): IotDeviceState
  outputs(): IotOutputState
  setLights(scene: string | null): void
  setAudio(audio: IotOutputState['audio']): void
  setDoor(door: 'open' | 'closed'): void
}

function cloneAudio(audio: IotOutputState['audio']): IotOutputState['audio'] {
  return audio ? { ...audio } : null
}

export function createState(devices: GatewayDevices): State {
  const state: IotDeviceState = {
    lights: devices.light.getState(),
    audio: cloneAudio(devices.audio.getState()),
    door: devices.door.getState(),
  }

  return {
    snapshot() {
      return {
        lights: state.lights,
        audio: cloneAudio(state.audio),
        door: state.door,
      }
    },
    outputs() {
      return {
        lights: state.lights,
        audio: cloneAudio(state.audio),
      }
    },
    setLights(scene) {
      state.lights = scene
    },
    setAudio(audio) {
      state.audio = cloneAudio(audio)
    },
    setDoor(door) {
      state.door = door
    },
  }
}
