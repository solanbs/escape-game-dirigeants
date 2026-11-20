import { defineElement } from '../engine/types.js'

type Config = {
  /** Id de l'appareil côté MQTT : escape/dev/<deviceId>/cmd */
  deviceId: string
}

type State = {
  /** null = jamais commandé depuis le début de la partie. */
  on: boolean | null
}

/**
 * Représente un actionneur physique (relais, sirène, ventouse magnétique…).
 *
 * Entrées : on, off
 * L'élément ne parle pas MQTT : il demande un effet `iot`, que la
 * passerelle MQTT traduira en message.
 */
export const IotRelay = defineElement<Config, State>({
  name: 'IotRelay',
  outputs: [],

  init: () => ({ on: null }),

  inputs: {
    on(ctx) {
      ctx.state.on = true
      ctx.effect({ type: 'iot', deviceId: ctx.config.deviceId, action: 'on' })
    },
    off(ctx) {
      ctx.state.on = false
      ctx.effect({ type: 'iot', deviceId: ctx.config.deviceId, action: 'off' })
    },
  },

  view: (state, config) => ({ deviceId: config.deviceId, on: state.on }),
})
