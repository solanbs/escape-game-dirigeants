/**
 * Noyau de la timeline : fait circuler les signaux entre les nœuds.
 *
 * Il ne connaît ni Socket.IO, ni l'IoT, ni le stockage. Il reçoit un état et
 * une entrée, et renvoie le nouvel état, des effets et une trace.
 */
import type { NodeView, Role } from '@escape/shared'
import type {
  Actor,
  AnyNodeType,
  Ctx,
  Effect,
  Engine,
  EngineInput,
  EngineState,
  Handlers,
  InputResult,
  NodeDef,
  RunResult,
  Scenario,
  TraceEntry,
} from './types.js'

/** Entrées présentes sur tous les nœuds, gérées par le moteur. */
const BUILTIN_INPUTS = ['enable', 'disable']

/** Garde-fou contre les boucles de liens (A → B → A → …). */
const MAX_SIGNALS = 1000

export type Registry = ReadonlyMap<string, AnyNodeType>

export function createRegistry(types: AnyNodeType[]): Registry {
  const registry = new Map<string, AnyNodeType>()
  for (const type of types) {
    if (registry.has(type.name)) throw new Error(`Type de nœud en double : ${type.name}`)
    registry.set(type.name, type)
  }
  return registry
}

type Compiled = {
  def: NodeDef
  type: AnyNodeType
  handlers: Handlers<unknown, unknown>
}

type Target = { node: string; input: string }

/**
 * Prépare un scénario : vérifie les types et chaque lien, puis renvoie le moteur.
 * Un scénario invalide plante ICI, au démarrage, et pas en pleine partie.
 */
export function createEngine(scenario: Scenario, registry: Registry): Engine {
  const errors: string[] = []
  const compiled = new Map<string, Compiled>()

  for (const [id, def] of Object.entries(scenario.nodes)) {
    const type = registry.get(def.type)
    if (!type) {
      errors.push(`${id} : type inconnu « ${def.type} »`)
      continue
    }
    const handlers = typeof type.inputs === 'function' ? type.inputs(def.config) : type.inputs
    compiled.set(id, { def, type, handlers })
  }

  const hasInput = (c: Compiled, input: string) =>
    BUILTIN_INPUTS.includes(input) || Object.hasOwn(c.handlers, input)

  // 'emetteur.sortie' → liste des entrées branchées dessus
  const linksFrom = new Map<string, Target[]>()

  for (const [from, to] of scenario.links) {
    const src = parsePort(from)
    const dst = parsePort(to)
    if (!src || !dst) {
      errors.push(`lien mal formé : ${from} → ${to} (attendu 'noeud.port')`)
      continue
    }
    const s = compiled.get(src.node)
    const d = compiled.get(dst.node)
    if (!s) errors.push(`lien ${from} → ${to} : nœud « ${src.node} » inconnu`)
    else if (!s.type.outputs.includes(src.port))
      errors.push(
        `lien ${from} → ${to} : ${s.type.name} n'a pas de sortie « ${src.port} » (sorties : ${s.type.outputs.join(', ') || 'aucune'})`,
      )
    if (!d) errors.push(`lien ${from} → ${to} : nœud « ${dst.node} » inconnu`)
    else if (!hasInput(d, dst.port))
      errors.push(
        `lien ${from} → ${to} : ${d.type.name} n'a pas d'entrée « ${dst.port} » (entrées : ${[...Object.keys(d.handlers), ...BUILTIN_INPUTS].join(', ')})`,
      )

    const list = linksFrom.get(from) ?? []
    list.push({ node: dst.node, input: dst.port })
    linksFrom.set(from, list)
  }

  if (errors.length > 0) {
    throw new Error(`Scénario « ${scenario.id} » invalide :\n  - ${errors.join('\n  - ')}`)
  }

  // -------------------------------------------------------------------------

  /** Contrôle d'accès sur l'entrée initiale (celle qui vient de l'extérieur). */
  function checkAccess(input: EngineInput): InputResult | null {
    const c = compiled.get(input.node)
    if (!c) return { ok: false, message: `Nœud inconnu : ${input.node}` }

    if (input.from.kind === 'player') {
      const allowed = c.def.allow?.includes(input.from.role) ?? false
      // Un joueur ne peut jamais activer/désactiver un nœud lui-même.
      if (!allowed || BUILTIN_INPUTS.includes(input.input)) {
        return { ok: false, message: 'Action non autorisée' }
      }
    }

    if (!hasInput(c, input.input)) {
      return { ok: false, message: `Entrée inconnue : ${input.node}.${input.input}` }
    }
    return null
  }

  /** Livre une entrée à un nœud. Les sorties émises sont mises en file. */
  function deliver(
    state: EngineState,
    item: EngineInput,
    queue: EngineInput[],
    effects: Effect[],
    trace: TraceEntry[],
  ): InputResult | void {
    const c = compiled.get(item.node)
    const rt = state[item.node]
    if (!c || !rt) return { ok: false, message: `Nœud inconnu : ${item.node}` }

    trace.push({
      kind: 'input',
      node: item.node,
      input: item.input,
      from: describeActor(item.from),
      ...(item.payload !== undefined && { payload: item.payload }),
    })

    if (item.input === 'enable') {
      rt.enabled = true
      return
    }
    if (item.input === 'disable') {
      rt.enabled = false
      return
    }
    if (!rt.enabled) return { ok: false, message: 'Indisponible pour le moment' }

    const ctx: Ctx<unknown, unknown> = {
      id: item.node,
      config: c.def.config,
      state: rt.data,
      from: item.from,
      emit(output, payload) {
        if (!c.type.outputs.includes(output)) {
          throw new Error(`${item.node} (${c.type.name}) émet une sortie non déclarée : ${output}`)
        }
        trace.push({ kind: 'output', node: item.node, output })
        const link = `${item.node}.${output}`
        for (const target of linksFrom.get(link) ?? []) {
          queue.push({ ...target, payload, from: { kind: 'link', from: link } })
        }
      },
      effect(effect) {
        effects.push(effect)
      },
    }

    const handler = c.handlers[item.input]
    const result = handler?.(ctx, item.payload)
    rt.data = ctx.state
    return result
  }

  return {
    scenario,

    init() {
      const state: EngineState = {}
      for (const [id, c] of compiled) {
        state[id] = { enabled: c.def.enabled ?? true, data: c.type.init(c.def.config) }
      }
      return state
    },

    run(state, input): RunResult {
      const denied = checkAccess(input)
      if (denied) return { state, effects: [], trace: [], result: denied }

      // On travaille sur une copie : l'état reçu n'est jamais modifié.
      const next = structuredClone(state)
      const effects: Effect[] = []
      const trace: TraceEntry[] = []
      const queue: EngineInput[] = []

      // L'entrée initiale : sa réponse est renvoyée à l'émetteur.
      const result = deliver(next, input, queue, effects, trace) ?? { ok: true }

      // Puis on suit les liens jusqu'à ce que plus rien ne bouge (FIFO).
      let signals = 1
      while (queue.length > 0) {
        if (++signals > MAX_SIGNALS) {
          throw new Error(`Plus de ${MAX_SIGNALS} signaux pour une seule action : boucle dans les liens ?`)
        }
        deliver(next, queue.shift()!, queue, effects, trace)
      }

      return { state: next, effects, trace, result }
    },

    view(state, role): NodeView[] {
      const views: NodeView[] = []
      for (const [id, c] of compiled) {
        const rt = state[id]
        if (!rt) continue

        // Le MJ voit tout, y compris l'état brut et les nœuds inactifs.
        if (role === 'gm') {
          views.push({ id, type: c.type.name, enabled: rt.enabled, data: rt.data })
          continue
        }

        if (!rt.enabled || !c.type.view || !c.def.visibleTo?.includes(role)) continue
        views.push({ id, type: c.type.name, enabled: true, data: c.type.view(rt.data, c.def.config) })
      }
      return views
    },
  }
}

// ---------------------------------------------------------------------------

function parsePort(value: string): { node: string; port: string } | null {
  const dot = value.indexOf('.')
  if (dot <= 0 || dot === value.length - 1) return null
  return { node: value.slice(0, dot), port: value.slice(dot + 1) }
}

export function describeActor(actor: Actor): string {
  switch (actor.kind) {
    case 'player':
      return `${actor.role}(${actor.deviceId})`
    case 'gm':
      return 'mj'
    case 'iot':
      return `iot(${actor.deviceId})`
    case 'timer':
      return 'timer'
    case 'link':
      return actor.from
  }
}

/** Ligne lisible pour les logs : 'master(tab-1) → alarmPanel.submit' ou 'alarmPanel.solved ⚡'. */
export function formatTrace(entry: TraceEntry): string {
  if (entry.kind === 'output') return `${entry.node}.${entry.output} ⚡`
  return `${entry.from} → ${entry.node}.${entry.input}`
}
