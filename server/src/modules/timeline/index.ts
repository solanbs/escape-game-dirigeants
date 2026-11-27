/**
 * Module timeline : le moteur du scénario (nœuds + liens).
 * Seule porte d'entrée du module : les autres modules n'importent que ce fichier.
 */
export { createEngine, createRegistry, describeActor, formatTrace } from './engine.js'
export type { Registry } from './engine.js'
export { defineNode, node } from './types.js'
export type {
  Actor,
  AnyNodeType,
  Ctx,
  Effect,
  Engine,
  EngineInput,
  EngineState,
  Handlers,
  InputHandler,
  InputResult,
  Link,
  NodeDef,
  NodeRuntime,
  NodeType,
  RunResult,
  Scenario,
  TraceEntry,
} from './types.js'
export { AllOf, App, IotCue, Notify, PasswordLock, registry } from './nodes/index.js'
