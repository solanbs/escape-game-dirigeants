import type { Role } from '@escape/shared'
import { defineElement } from '../engine/types.js'

type Config = {
  to: Role[]
  message: string
}

/**
 * Affiche un message ponctuel (toast) sur les tablettes des rôles visés.
 *
 * Entrée : send
 */
export const Notify = defineElement<Config, Record<string, never>>({
  name: 'Notify',
  outputs: [],
  init: () => ({}),
  inputs: {
    send(ctx) {
      ctx.effect({ type: 'notify', to: ctx.config.to, message: ctx.config.message })
    },
  },
})
