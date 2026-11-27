import type { CueName } from '@escape/shared/iot'
import { defineNode } from '../types.js'

type Config = {
  /** Cue IoT à jouer (défini dans server/src/iot/cues.ts : lumières + son). */
  cue: CueName
}

type State = {
  /** Nombre de fois où le cue a été joué pendant la partie. */
  played: number
}

/**
 * Déclenche un cue IoT (ambiance lumineuse et sonore).
 *
 * Entrée : play
 * Le nœud ne parle pas au matériel : il demande un effet `cue`, que la
 * session transmet au module IoT (IotPort.cue).
 */
export const IotCue = defineNode<Config, State>({
  name: 'IotCue',
  outputs: [],

  init: () => ({ played: 0 }),

  inputs: {
    play(ctx) {
      ctx.state.played += 1
      ctx.effect({ type: 'cue', name: ctx.config.cue })
    },
  },
})
