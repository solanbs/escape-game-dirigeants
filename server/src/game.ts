import { SOCKET_EVENTS } from '@escape/shared'
import type { AnswerRequest, AnswerResult } from '@escape/shared'
import type { Emit } from './realtime.js'

/**
 * Moteur de jeu — squelette.
 *
 * C'est le SEUL endroit qui connaît les réponses. Le front ne reçoit jamais
 * la solution, il envoie une proposition et lit la réponse.
 *
 * Le scénario réel (liste d'énigmes, indices, progression par équipe)
 * remplacera ce tableau quand il sera écrit.
 */
const SOLUTIONS: Record<string, string> = {
  'puzzle-1': 'admin',
}

export function handleAnswer(input: AnswerRequest, emit: Emit): AnswerResult {
  const expected = SOLUTIONS[input.puzzleId]

  if (!expected) {
    return { ok: false, message: 'Énigme inconnue' }
  }

  if (input.value.trim().toLowerCase() !== expected) {
    return { ok: false, message: 'Mauvaise réponse' }
  }

  const at = Date.now()
  emit(SOCKET_EVENTS.PUZZLE_SOLVED, { puzzleId: input.puzzleId, teamId: input.teamId, at })
  emit(SOCKET_EVENTS.IOT_TRIGGER, { target: 'relay', action: 'on', at })

  return { ok: true, message: 'Énigme résolue' }
}
