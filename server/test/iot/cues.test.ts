import {describe, expect, it} from 'vitest'
import {CUES} from '../../src/iot/cues.js'
import type {CueName} from '@escape/shared/iot'

const EXPECTED_CUES: CueName[] = ['alarm', 'alarm-off', 'success', 'failure', 'ambiance']

describe('CUES - contrat métier scénario → commandes matérielles', () => {
  it('définit exactement les cues métier attendus', () => {
    expect(Object.keys(CUES).sort()).toEqual([...EXPECTED_CUES].sort())
  })

  it('alarm: déclenche le signal d alarme lumineux et sonore en boucle', () => {
    expect(CUES.alarm).toEqual([
      {type: 'light', action: 'scene', scene: 'alarm'},
      {
        type: 'audio',
        action: 'play',
        audio: {track: 'alarm.mp3', volume: 80, loop: true},
      },
    ])
  })

  it('alarm-off: rétablit l ambiance et coupe le son', () => {
    expect(CUES['alarm-off']).toEqual([
      {type: 'light', action: 'scene', scene: 'ambiance'},
      {type: 'audio', action: 'stop'},
    ])
  })

  it('success: joue le feedback de réussite sans boucle', () => {
    expect(CUES.success).toEqual([
      {type: 'light', action: 'scene', scene: 'success'},
      {
        type: 'audio',
        action: 'play',
        audio: {track: 'success.mp3', volume: 70, loop: false},
      },
    ])
  })

  it('failure: joue le feedback d échec sans boucle', () => {
    expect(CUES.failure).toEqual([
      {type: 'light', action: 'scene', scene: 'failure'},
      {
        type: 'audio',
        action: 'play',
        audio: {track: 'failure.mp3', volume: 70, loop: false},
      },
    ])
  })

  it('ambiance: installe l ambiance lumineuse et sonore en boucle', () => {
    expect(CUES.ambiance).toEqual([
      {type: 'light', action: 'scene', scene: 'ambiance'},
      {
        type: 'audio',
        action: 'play',
        audio: {track: 'ambiance.mp3', volume: 40, loop: true},
      },
    ])
  })
})
