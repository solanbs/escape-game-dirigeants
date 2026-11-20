import { defineElement, type Ctx, type Handlers } from '../engine/types.js'

type Config = {
  /** Noms des entrées à attendre. Chacun devient une entrée de l'élément. */
  of: string[]
}

type State = {
  received: string[]
  done: boolean
}

/**
 * Porte logique « ET » : émet `done` quand toutes ses entrées ont été reçues.
 * Sert aux énigmes en parallèle.
 *
 * Exemple : config { of: ['root', 'plans'] }
 *   → entrées `root` et `plans`, sortie `done`
 */
export const AllOf = defineElement<Config, State>({
  name: 'AllOf',
  outputs: ['done'],

  init: () => ({ received: [], done: false }),

  // Les entrées dépendent de la config, d'où une fonction.
  inputs: (config) => {
    const handlers: Handlers<Config, State> = {}
    for (const name of config.of) {
      handlers[name] = (ctx: Ctx<Config, State>) => {
        if (!ctx.state.received.includes(name)) ctx.state.received.push(name)
        if (!ctx.state.done && config.of.every((n) => ctx.state.received.includes(n))) {
          ctx.state.done = true
          ctx.emit('done')
        }
      }
    }
    return handlers
  },
})
