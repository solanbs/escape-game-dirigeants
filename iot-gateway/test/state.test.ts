import type {IotAudioState} from '@escape/shared/iot'
import {describe, expect, it} from 'vitest'
import {createState} from '../src/state.js'
import {makeDevices} from './helpers.js'

const AUDIO: IotAudioState = {
  track: 'ambiance.mp3',
  volume: 40,
  loop: true,
  status: 'playing',
}

describe('createState', () => {
  it('initialise l état depuis les devices', () => {
    const devices = makeDevices({lights: 'ambiance', audio: AUDIO, door: 'open'})
    const state = createState(devices.devices)

    expect(state.snapshot()).toEqual({lights: 'ambiance', audio: AUDIO, door: 'open'})
    expect(state.outputs()).toEqual({lights: 'ambiance', audio: AUDIO})
  })

  it('applique les setters, y compris la remise à zéro', () => {
    const state = createState(makeDevices().devices)

    state.setLights('alarm')
    state.setAudio(AUDIO)
    state.setDoor('open')
    expect(state.snapshot()).toEqual({lights: 'alarm', audio: AUDIO, door: 'open'})

    state.setLights(null)
    state.setAudio(null)
    state.setDoor('closed')
    expect(state.snapshot()).toEqual({lights: null, audio: null, door: 'closed'})
  })

  it('isole l audio des mutations externes', () => {
    const devices = makeDevices({lights: 'ambiance', audio: {...AUDIO}})
    const state = createState(devices.devices)

    const snapshot = state.snapshot()
    snapshot.audio!.volume = 99
    snapshot.lights = 'MUTATED'
    snapshot.door = 'open'
    expect(state.snapshot()).toEqual({lights: 'ambiance', audio: AUDIO, door: 'closed'})

    const source = {...AUDIO}
    state.setAudio(source)
    source.track = 'MUTATED.mp3'
    expect(state.snapshot().audio?.track).toBe('ambiance.mp3')

    const outputs = state.outputs()
    outputs.audio!.loop = false
    expect(state.snapshot().audio?.loop).toBe(true)
  })

  it('gère un état audio initial vide', () => {
    const state = createState(makeDevices({audio: null}).devices)

    expect(state.snapshot().audio).toBeNull()
    expect(state.outputs().audio).toBeNull()

    state.setAudio(AUDIO)
    expect(state.outputs()).toEqual({lights: null, audio: AUDIO})
  })
})
