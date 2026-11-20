/**
 * Types du moteur de jeu.
 *
 * Vocabulaire (cf. docs/architecture.md, section 5) :
 * - un TYPE d'élément (PasswordLock, Tool…) définit une interface :
 *   des entrées, des sorties, un état, une vue ;
 * - un ÉLÉMENT est une instance d'un type dans un scénario (alarmPanel, shell…) ;
 * - un CÂBLE relie la sortie d'un élément à l'entrée d'un autre ;
 * - un SCÉNARIO = des éléments + des câbles. C'est de la donnée, pas du code.
 */
import type { CommandResult, ElementView, PlayerRole, Role } from '@escape/shared'

// ---------------------------------------------------------------------------
// Entrées et sorties du moteur
// ---------------------------------------------------------------------------

/** Qui est à l'origine d'une entrée. */
export type Actor =
  | { kind: 'player'; role: PlayerRole; deviceId: string }
  | { kind: 'gm' }
  | { kind: 'iot'; deviceId: string }
  | { kind: 'timer' }
  /** Entrée déclenchée par un câble ; `from` = 'element.sortie'. */
  | { kind: 'wire'; from: string }

/** Tout ce qui arrive au moteur : « l'entrée X de l'élément Y ». */
export type EngineInput = {
  element: string
  input: string
  payload?: unknown
  from: Actor
}

/** Réponse renvoyée à celui qui a envoyé la commande (ack Socket.IO). */
export type InputResult = CommandResult

/**
 * Effet de bord demandé par un élément. Le moteur ne l'exécute pas :
 * il le renvoie, et ce sont les passerelles (MQTT, Socket.IO…) qui agissent.
 */
export type Effect =
  | { type: 'iot'; deviceId: string; action: string }
  | { type: 'notify'; to: Role[]; message: string }

/** Une ligne du journal : chaque signal qui a circulé pendant une action. */
export type TraceEntry =
  | { kind: 'input'; element: string; input: string; from: string; payload?: unknown }
  | { kind: 'output'; element: string; output: string }

// ---------------------------------------------------------------------------
// Types d'éléments
// ---------------------------------------------------------------------------

/** Ce qu'un élément reçoit quand une de ses entrées est appelée. */
export interface Ctx<C, S> {
  /** Id de l'élément dans le scénario (ex. 'alarmPanel'). */
  readonly id: string
  readonly config: C
  /** État de l'élément : on peut le modifier directement. */
  state: S
  readonly from: Actor
  /** Déclenche une sortie : le moteur suit les câbles branchés dessus. */
  emit(output: string, payload?: unknown): void
  /** Demande un effet de bord (IoT, notification…). */
  effect(effect: Effect): void
}

export type InputHandler<C, S> = (ctx: Ctx<C, S>, payload: unknown) => InputResult | void

export type Handlers<C, S> = Record<string, InputHandler<C, S>>

/**
 * Interface d'un type d'élément.
 *
 * Les entrées `enable` et `disable` existent sur TOUS les éléments, gérées par
 * le moteur : inutile de les déclarer.
 */
export interface ElementType<C, S> {
  readonly name: string
  /** Sorties que l'élément peut émettre. Émettre une sortie non déclarée = erreur. */
  readonly outputs: readonly string[]
  /** État initial. */
  init(config: C): S
  /** Entrées. Une fonction si les noms dépendent de la config (ex. AllOf). */
  readonly inputs: Handlers<C, S> | ((config: C) => Handlers<C, S>)
  /**
   * Ce que voient les joueurs. Absent = jamais affiché aux joueurs.
   * Ne JAMAIS y mettre de solution : ces données partent vers les tablettes.
   */
  view?(state: S, config: C): unknown
}

/** Le registre mélange des types aux configs différentes, d'où le `any`. */
export type AnyElementType = ElementType<any, any>

/** Aide au typage : `defineElement<Config, State>({ ... })`. */
export function defineElement<C, S>(type: ElementType<C, S>): ElementType<C, S> {
  return type
}

// ---------------------------------------------------------------------------
// Scénario
// ---------------------------------------------------------------------------

/** Un élément tel que déclaré dans un scénario. */
export type ElementDef = {
  type: string
  config: unknown
  /** Actif au démarrage ? (défaut : oui). Un élément inactif est invisible et ignore ses entrées. */
  enabled?: boolean
  /** Rôles joueurs autorisés à envoyer des commandes à cet élément (défaut : aucun). */
  allow?: PlayerRole[]
  /** Rôles joueurs qui voient cet élément (défaut : aucun). Le MJ voit tout. */
  visibleTo?: PlayerRole[]
}

/** Déclare un élément avec une config typée selon son type. */
export function element<C, S>(
  type: ElementType<C, S>,
  def: Omit<ElementDef, 'type' | 'config'> & { config: C },
): ElementDef {
  return { ...def, type: type.name }
}

/** Câble : ['emetteur.sortie', 'recepteur.entree']. */
export type Wire = readonly [from: string, to: string]

export type Scenario = {
  id: string
  title: string
  elements: Record<string, ElementDef>
  wires: readonly Wire[]
}

// ---------------------------------------------------------------------------
// État et moteur
// ---------------------------------------------------------------------------

export type ElementRuntime = { enabled: boolean; data: unknown }

/** État complet d'une partie : un objet JSON, facile à sauvegarder et recharger. */
export type EngineState = Record<string, ElementRuntime>

export type RunResult = {
  state: EngineState
  effects: Effect[]
  trace: TraceEntry[]
  /** Réponse à l'entrée initiale (pas aux entrées déclenchées par les câbles). */
  result: InputResult
}

export interface Engine {
  readonly scenario: Scenario
  init(): EngineState
  /** Fonction pure : ne modifie pas `state`, n'a aucun effet de bord. */
  run(state: EngineState, input: EngineInput): RunResult
  view(state: EngineState, role: Role): ElementView[]
}
