import { pino } from 'pino'
import type { Role } from '@escape/shared'
import type { CueName } from '@escape/shared/iot'
import type { Actor } from '../src/modules/timeline/index.js'
import type { Outputs } from '../src/modules/session/index.js'

export const silentLog = pino({ level: 'silent' })

export const master: Actor = { kind: 'player', role: 'master', deviceId: 'tab-fixe-1' }
export const ops: Actor = { kind: 'player', role: 'ops', deviceId: 'tab-1' }
export const gm: Actor = { kind: 'gm' }

/** Fausses sorties : enregistrent ce qu'on leur demande. */
export function fakeOutputs() {
  const calls = {
    pushViews: 0,
    notify: [] as { to: Role[]; message: string }[],
    cue: [] as CueName[],
  }
  const outputs: Outputs = {
    pushViews: () => void calls.pushViews++,
    notify: (to, message) => void calls.notify.push({ to, message }),
    cue: (name) => void calls.cue.push(name),
  }
  return { outputs, calls }
}
