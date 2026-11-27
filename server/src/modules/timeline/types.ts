/**
 * Types de la timeline (le moteur du scénario).
 *
 * Vocabulaire (cf. docs/architecture.md, sections 1 et 6) :
 * - un TYPE de nœud (PasswordLock, App…) définit une interface :
 *   des entrées, des sorties, un état, une vue ;
 * - un NŒUD est une instance d'un type dans un scénario (alarmPanel, shell…) ;
 * - un LIEN relie la sortie d'un nœud à l'entrée d'un autre ;
 * - un SCÉNARIO = des nœuds + des liens. C'est de la donnée, pas du code.
 */
import type { CommandResult, NodeView, PlayerRole, Role } from '@escape/shared'
import type { CueName } from '@escape/shared/iot'

// ---------------------------------------------------------------------------
// Entrées et sorties du moteur
// ---------------------------------------------------------------------------

/** Qui est à l'origine d'une entrée. */
export type Actor =
  | { kind: 'player'; role: PlayerRole; deviceId: string }
  | { kind: 'gm' }
  | { kind: 'iot'; deviceId: string }
  | { kind: 'timer' }
  /** Entrée déclenchée par un lien ; `from` = 'noeud.sortie'. */
  | { kind: 'link'; from: string }

/** Tout ce qui arrive au moteur : « l'entrée X du nœud Y ». */
export type EngineInput = {
  node: string
  input: string
  payload?: unknown
  from: Actor
}

/** Réponse renvoyée à celui qui a envoyé la commande. */
export type InputResult = CommandResult

/**
 * Effet de bord demandé par un nœud. Le moteur ne l'exécute pas :
 * il le renvoie, et c'est la session qui le transmet au bon module.
 */
export type Effect =
  | { type: 'cue'; name: CueName }
  | { type: 'notify'; to: Role[]; message: string }

/** Une ligne du journal : chaque signal qui a circulé pendant une action. */
export type TraceEntry =
  | { kind: 'input'; node: string; input: string; from: string; payload?: unknown }
  | { kind: 'output'; node: string; output: string }

// ---------------------------------------------------------------------------
// Types de nœuds
// ---------------------------------------------------------------------------

/** Ce qu'un nœud reçoit quand une de ses entrées est appelée. */
export interface Ctx<C, S> {
  /** Id du nœud dans le scénario (ex. 'alarmPanel'). */
  readonly id: string
  readonly config: C
  /** État du nœud : on peut le modifier directement. */
  state: S
  readonly from: Actor
  /** Déclenche une sortie : le moteur suit les liens branchés dessus. */
  emit(output: string, payload?: unknown): void
  /** Demande un effet de bord (cue IoT, notification…). */
  effect(effect: Effect): void
}

export type InputHandler<C, S> = (ctx: Ctx<C, S>, payload: unknown) => InputResult | void

export type Handlers<C, S> = Record<string, InputHandler<C, S>>

/**
 * Interface d'un type de nœud.
 *
 * Les entrées `enable` et `disable` existent sur TOUS les nœuds, gérées par
 * le moteur : inutile de les déclarer.
 */
export interface NodeType<C, S> {
  readonly name: string
  /** Sorties que le nœud peut émettre. Émettre une sortie non déclarée = erreur. */
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
export type AnyNodeType = NodeType<any, any>

/** Aide au typage : `defineNode<Config, State>({ ... })`. */
export function defineNode<C, S>(type: NodeType<C, S>): NodeType<C, S> {
  return type
}

// ---------------------------------------------------------------------------
// Scénario
// ---------------------------------------------------------------------------

/** Un nœud tel que déclaré dans un scénario. */
export type NodeDef = {
  type: string
  config: unknown
  /** Actif au démarrage ? (défaut : oui). Un nœud inactif est invisible et ignore ses entrées. */
  enabled?: boolean
  /** Rôles joueurs autorisés à envoyer des commandes à ce nœud (défaut : aucun). */
  allow?: PlayerRole[]
  /** Rôles joueurs qui voient ce nœud (défaut : aucun). Le MJ voit tout. */
  visibleTo?: PlayerRole[]
}

/** Déclare un nœud avec une config typée selon son type. */
export function node<C, S>(
  type: NodeType<C, S>,
  def: Omit<NodeDef, 'type' | 'config'> & { config: C },
): NodeDef {
  return { ...def, type: type.name }
}

/** Lien : ['emetteur.sortie', 'recepteur.entree']. */
export type Link = readonly [from: string, to: string]

export type Scenario = {
  id: string
  title: string
  nodes: Record<string, NodeDef>
  links: readonly Link[]
}

// ---------------------------------------------------------------------------
// État et moteur
// ---------------------------------------------------------------------------

export type NodeRuntime = { enabled: boolean; data: unknown }

/** État complet d'une partie : un objet JSON, facile à sauvegarder et recharger. */
export type EngineState = Record<string, NodeRuntime>

export type RunResult = {
  state: EngineState
  effects: Effect[]
  trace: TraceEntry[]
  /** Réponse à l'entrée initiale (pas aux entrées déclenchées par les liens). */
  result: InputResult
}

export interface Engine {
  readonly scenario: Scenario
  init(): EngineState
  /** Fonction pure : ne modifie pas `state`, n'a aucun effet de bord. */
  run(state: EngineState, input: EngineInput): RunResult
  view(state: EngineState, role: Role): NodeView[]
}
