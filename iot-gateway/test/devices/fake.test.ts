import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {createFakeDevices} from '../../src/devices/fake.js'

describe('devices factices', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('light', () => {
    it('démarre éteint et applique les actions', async () => {
      const light = createFakeDevices().light
      expect(light.getState()).toBeNull()

      await light.turnOn()
      expect(light.getState()).toBe('on')

      await light.setScene('alarm')
      expect(light.getState()).toBe('alarm')

      await light.turnOn()
      expect(light.getState()).toBe('alarm')

      await light.turnOff()
      expect(light.getState()).toBeNull()
    })

    it('refuse une scène vide', async () => {
      const light = createFakeDevices().light
      await expect(light.setScene('   ')).rejects.toThrow('scene is required')
      expect(light.getState()).toBeNull()
    })
  })

  describe('audio', () => {
    it('joue une piste avec les valeurs par défaut', async () => {
      const audio = createFakeDevices().audio
      expect(audio.getState()).toBeNull()

      await audio.play({track: 'ambiance.mp3'})
      expect(audio.getState()).toEqual({
        track: 'ambiance.mp3',
        volume: 70,
        loop: false,
        status: 'playing',
      })

      await audio.stop()
      expect(audio.getState()).toBeNull()
    })

    it('respecte volume et loop fournis', async () => {
      const audio = createFakeDevices().audio
      await audio.play({track: 'alarm.mp3', volume: 0, loop: true})

      expect(audio.getState()).toEqual({
        track: 'alarm.mp3',
        volume: 0,
        loop: true,
        status: 'playing',
      })
    })

    it.each([
      [{track: '  '}, 'track is required'],
      [{track: 'a.mp3', volume: -1}, 'volume must be between 0 and 100'],
      [{track: 'a.mp3', volume: 101}, 'volume must be between 0 and 100'],
      [{track: 'a.mp3', volume: Number.NaN}, 'volume must be between 0 and 100'],
    ])('refuse une requête invalide %o', async (request, message) => {
      const audio = createFakeDevices().audio
      await expect(audio.play(request)).rejects.toThrow(message)
      expect(audio.getState()).toBeNull()
    })
  })

  describe('door', () => {
    it('bascule et notifie les abonnés', () => {
      const door = createFakeDevices().door
      const states: Array<'open' | 'closed'> = []
      const unsubscribe = door.onChange((state) => states.push(state))

      expect(door.getState()).toBe('closed')
      door.toggle()
      door.toggle()
      expect(door.getState()).toBe('closed')
      expect(states).toEqual(['open', 'closed'])

      unsubscribe()
      door.toggle()
      expect(door.getState()).toBe('open')
      expect(states).toEqual(['open', 'closed'])
    })
  })

  describe('keypad', () => {
    it('transmet les codes non vides et garde le dernier affichage', async () => {
      const keypad = createFakeDevices().keypad
      const codes: string[] = []
      const unsubscribe = keypad.onCode((code) => codes.push(code))

      expect(keypad.getLastDisplay()).toBe('')
      keypad.pushCode('   ')
      keypad.pushCode('1234')
      expect(codes).toEqual(['1234'])

      await keypad.display('ACCÉDÉ')
      expect(keypad.getLastDisplay()).toBe('ACCÉDÉ')

      unsubscribe()
      keypad.pushCode('9999')
      expect(codes).toEqual(['1234'])
    })
  })
})
