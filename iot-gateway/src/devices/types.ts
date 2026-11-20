import type { IotAudioRequest, IotAudioState } from '@escape/shared/iot'

export type Unsubscribe = () => void

export interface Device {
  close?(): Promise<void> | void
}

export interface LightDevice extends Device {
  setScene(scene: string): Promise<void>
  turnOn(): Promise<void>
  turnOff(): Promise<void>
  getState(): string | null
}

export interface AudioDevice extends Device {
  play(request: IotAudioRequest): Promise<void>
  stop(): Promise<void>
  getState(): IotAudioState | null
}

export interface DoorSensor extends Device {
  getState(): 'open' | 'closed'
  onChange(handler: (state: 'open' | 'closed') => void): Unsubscribe
}

export interface Keypad extends Device {
  onCode(handler: (code: string) => void): Unsubscribe
  display(text: string): Promise<void>
}

export interface GatewayDevices {
  light: LightDevice
  audio: AudioDevice
  door: DoorSensor
  keypad: Keypad
}
