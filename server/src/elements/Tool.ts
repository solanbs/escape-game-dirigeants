import { defineElement } from '../engine/types.js'

type Config = {
  /** Nom affiché sous l'icône. */
  title: string
  /** Composant Vue à ouvrir côté front (FakeGoogle, Shell…). */
  component: string
}

/**
 * Outil sur le bureau d'une tablette.
 *
 * Aucune entrée propre : on le débloque avec l'entrée `enable`, commune à
 * tous les éléments. Un outil déclaré `enabled: false` apparaît quand un
 * câble l'active.
 */
export const Tool = defineElement<Config, Record<string, never>>({
  name: 'Tool',
  outputs: [],
  init: () => ({}),
  inputs: {},
  view: (_state, config) => ({ title: config.title, component: config.component }),
})
