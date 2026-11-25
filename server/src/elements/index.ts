import { createRegistry } from '../engine/engine.js'
import { AllOf } from './AllOf.js'
import { IotCue } from './IotCue.js'
import { Notify } from './Notify.js'
import { PasswordLock } from './PasswordLock.js'
import { Tool } from './Tool.js'

export { AllOf, IotCue, Notify, PasswordLock, Tool }

/** Tous les types d'éléments disponibles pour écrire un scénario. */
export const registry = createRegistry([PasswordLock, Tool, AllOf, IotCue, Notify])
