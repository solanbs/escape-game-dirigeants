import { createRegistry } from '../engine.js'
import { AllOf } from './AllOf.js'
import { IotCue } from './IotCue.js'
import { Notify } from './Notify.js'
import { PasswordLock } from './PasswordLock.js'
import { App } from './App.js'

export { AllOf, App, IotCue, Notify, PasswordLock }

/** Tous les types de nœuds disponibles pour écrire un scénario. */
export const registry = createRegistry([PasswordLock, App, AllOf, IotCue, Notify])
