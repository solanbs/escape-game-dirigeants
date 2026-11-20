import { pino } from 'pino'
import type { Role } from '@escape/shared'
import type { Actor } from '../src/engine/types.js'
import type { Outputs } from '../src/session/ports.js'

export const silentLog = pino({ level: 'silent' })

export const master: Actor = { kind: 'player', role: 'master', deviceId: 'tab-fixe-1' }
export const ops: Actor = { kind: 'player', role: 'ops', deviceId: 'tab-1' }
export const gm: Actor = { kind: 'gm' }

/** Fausses sorties : enregistrent ce qu'on leur demande. */
export function fakeOutputs() {
  const calls = {
    pushViews: 0,
    notify: [] as { to: Role[]; message: string }[],
    iot: [] as { deviceId: string; action: string }[],
  }
  const outputs: Outputs = {
    pushViews: () => void calls.pushViews++,
    notify: (to, message) => void calls.notify.push({ to, message }),
    iot: (deviceId, action) => void calls.iot.push({ deviceId, action }),
  }
  return { outputs, calls }
}
