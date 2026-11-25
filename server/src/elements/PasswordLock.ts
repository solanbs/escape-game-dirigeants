import { defineElement } from '../engine/types.js'

type Config = {
  /** Texte affiché au-dessus du champ de saisie. */
  label: string
  /** Réponse attendue. Un tableau = plusieurs variantes acceptées. */
  answer: string | string[]
  /** Par défaut, la casse et les espaces autour sont ignorés. */
  caseSensitive?: boolean
}

type State = {
  solved: boolean
  attempts: number
}

/**
 * Champ de saisie protégé : mot de passe, code d'alarme, identifiants…
 *
 * Entrée  : submit(valeur)
 * Sorties : solved (une seule fois), failed (à chaque erreur)
 */
export const PasswordLock = defineElement<Config, State>({
  name: 'PasswordLock',
  outputs: ['solved', 'failed'],

  init: () => ({ solved: false, attempts: 0 }),

  inputs: {
    submit(ctx, payload) {
      if (typeof payload !== 'string') return { ok: false, message: 'Valeur invalide' }
      if (ctx.state.solved) return { ok: true, message: 'Déjà déverrouillé' }

      ctx.state.attempts += 1

      if (matches(payload, ctx.config)) {
        ctx.state.solved = true
        ctx.emit('solved')
        return { ok: true, message: 'Accès accepté' }
      }

      ctx.emit('failed')
      return { ok: false, message: 'Accès refusé' }
    },
  },

  // Surtout pas `answer` ici : la vue part vers les tablettes.
  view: (state, config) => ({
    label: config.label,
    solved: state.solved,
    attempts: state.attempts,
  }),
})

function matches(value: string, config: Config): boolean {
  const norm = (s: string) => (config.caseSensitive ? s.trim() : s.trim().toLowerCase())
  const answers = Array.isArray(config.answer) ? config.answer : [config.answer]
  return answers.some((answer) => norm(answer) === norm(value))
}
