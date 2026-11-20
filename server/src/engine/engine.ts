/**
 * Noyau du moteur : fait circuler les signaux entre les éléments.
 *
 * Il ne connaît ni Socket.IO, ni MQTT, ni SQLite. Il reçoit un état et une
 * entrée, et renvoie le nouvel état, des effets et une trace.
 */
import type { ElementView, Role } from '@escape/shared'
import type {
  Actor,
  AnyElementType,
  Ctx,
  Effect,
  Engine,
  EngineInput,
  EngineState,
  ElementDef,
  Handlers,
  InputResult,
  RunResult,
  Scenario,
  TraceEntry,
} from './types.js'

/** Entrées présentes sur tous les éléments, gérées par le moteur. */
const BUILTIN_INPUTS = ['enable', 'disable']

/** Garde-fou contre les boucles de câbles (A → B → A → …). */
const MAX_SIGNALS = 1000

export type Registry = ReadonlyMap<string, AnyElementType>

export function createRegistry(types: AnyElementType[]): Registry {
  const registry = new Map<string, AnyElementType>()
  for (const type of types) {
    if (registry.has(type.name)) throw new Error(`Type d'élément en double : ${type.name}`)
    registry.set(type.name, type)
  }
  return registry
}

type Compiled = {
  def: ElementDef
  type: AnyElementType
  handlers: Handlers<unknown, unknown>
}

type Target = { element: string; input: string }

/**
 * Prépare un scénario : vérifie les types et chaque câble, puis renvoie le moteur.
 * Un scénario invalide plante ICI, au démarrage, et pas en pleine partie.
 */
export function createEngine(scenario: Scenario, registry: Registry): Engine {
  const errors: string[] = []
  const compiled = new Map<string, Compiled>()

  for (const [id, def] of Object.entries(scenario.elements)) {
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
  const wiresFrom = new Map<string, Target[]>()

  for (const [from, to] of scenario.wires) {
    const src = parsePort(from)
    const dst = parsePort(to)
    if (!src || !dst) {
      errors.push(`câble mal formé : ${from} → ${to} (attendu 'element.port')`)
      continue
    }
    const s = compiled.get(src.element)
    const d = compiled.get(dst.element)
    if (!s) errors.push(`câble ${from} → ${to} : élément « ${src.element} » inconnu`)
    else if (!s.type.outputs.includes(src.port))
      errors.push(
        `câble ${from} → ${to} : ${s.type.name} n'a pas de sortie « ${src.port} » (sorties : ${s.type.outputs.join(', ') || 'aucune'})`,
      )
    if (!d) errors.push(`câble ${from} → ${to} : élément « ${dst.element} » inconnu`)
    else if (!hasInput(d, dst.port))
      errors.push(
        `câble ${from} → ${to} : ${d.type.name} n'a pas d'entrée « ${dst.port} » (entrées : ${[...Object.keys(d.handlers), ...BUILTIN_INPUTS].join(', ')})`,
      )

    const list = wiresFrom.get(from) ?? []
    list.push({ element: dst.element, input: dst.port })
    wiresFrom.set(from, list)
  }

  if (errors.length > 0) {
    throw new Error(`Scénario « ${scenario.id} » invalide :\n  - ${errors.join('\n  - ')}`)
  }

  // -------------------------------------------------------------------------

  /** Contrôle d'accès sur l'entrée initiale (celle qui vient de l'extérieur). */
  function checkAccess(input: EngineInput): InputResult | null {
    const c = compiled.get(input.element)
    if (!c) return { ok: false, message: `Élément inconnu : ${input.element}` }

    if (input.from.kind === 'player') {
      const allowed = c.def.allow?.includes(input.from.role) ?? false
      // Un joueur ne peut jamais activer/désactiver un élément lui-même.
      if (!allowed || BUILTIN_INPUTS.includes(input.input)) {
        return { ok: false, message: 'Action non autorisée' }
      }
    }

    if (!hasInput(c, input.input)) {
      return { ok: false, message: `Entrée inconnue : ${input.element}.${input.input}` }
    }
    return null
  }

  /** Livre une entrée à un élément. Les sorties émises sont mises en file. */
  function deliver(
    state: EngineState,
    item: EngineInput,
    queue: EngineInput[],
    effects: Effect[],
    trace: TraceEntry[],
  ): InputResult | void {
    const c = compiled.get(item.element)
    const rt = state[item.element]
    if (!c || !rt) return { ok: false, message: `Élément inconnu : ${item.element}` }

    trace.push({
      kind: 'input',
      element: item.element,
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
      id: item.element,
      config: c.def.config,
      state: rt.data,
      from: item.from,
      emit(output, payload) {
        if (!c.type.outputs.includes(output)) {
          throw new Error(`${item.element} (${c.type.name}) émet une sortie non déclarée : ${output}`)
        }
        trace.push({ kind: 'output', element: item.element, output })
        const wire = `${item.element}.${output}`
        for (const target of wiresFrom.get(wire) ?? []) {
          queue.push({ ...target, payload, from: { kind: 'wire', from: wire } })
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

      // Puis on suit les câbles jusqu'à ce que plus rien ne bouge (FIFO).
      let signals = 1
      while (queue.length > 0) {
        if (++signals > MAX_SIGNALS) {
          throw new Error(`Plus de ${MAX_SIGNALS} signaux pour une seule action : boucle dans les câbles ?`)
        }
        deliver(next, queue.shift()!, queue, effects, trace)
      }

      return { state: next, effects, trace, result }
    },

    view(state, role): ElementView[] {
      const views: ElementView[] = []
      for (const [id, c] of compiled) {
        const rt = state[id]
        if (!rt) continue

        // Le MJ voit tout, y compris l'état brut et les éléments inactifs.
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

function parsePort(value: string): { element: string; port: string } | null {
  const dot = value.indexOf('.')
  if (dot <= 0 || dot === value.length - 1) return null
  return { element: value.slice(0, dot), port: value.slice(dot + 1) }
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
    case 'wire':
      return actor.from
  }
}

/** Ligne lisible pour les logs : 'master(tab-1) → alarmPanel.submit' ou 'alarmPanel.solved ⚡'. */
export function formatTrace(entry: TraceEntry): string {
  if (entry.kind === 'output') return `${entry.element}.${entry.output} ⚡`
  return `${entry.from} → ${entry.element}.${entry.input}`
}
