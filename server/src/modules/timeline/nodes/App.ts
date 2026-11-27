import { defineNode } from '../types.js'

type Config = {
  /** Nom affiché sous l'icône. */
  title: string
  /** Application à ouvrir côté front (Browser, Shell…). */
  app: string
}

/**
 * Application sur le bureau d'une tablette.
 *
 * Aucune entrée propre : on le débloque avec l'entrée `enable`, commune à
 * tous les nœuds. Une application déclarée `enabled: false` apparaît quand un
 * lien l'active.
 */
export const App = defineNode<Config, Record<string, never>>({
  name: 'App',
  outputs: [],
  init: () => ({}),
  inputs: {},
  view: (_state, config) => ({ title: config.title, app: config.app }),
})
