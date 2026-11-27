/**
 * Les places des tablettes, sans réseau (testable seul).
 *
 * - Un mot de passe donne un rôle (config.yaml).
 * - Une place = une tablette connectée. Au-delà de `joueurs.max`, refus.
 * - Une connexion acceptée reçoit un jeton. Avec ce jeton, la tablette retrouve
 *   son rôle après un redémarrage, sans repasser par la limite.
 */
import { randomUUID } from 'node:crypto'
import type { ScenarioConfig } from '../scenario-loader/index.js'

export type SeatResult =
  | { ok: true; role: string; token: string }
  | { ok: false; error: string }

export type Seats = {
  /** Première connexion : le mot de passe d'un rôle. */
  login(password: string): SeatResult
  /** Reconnexion : un jeton déjà donné par `login`. */
  resume(token: string): SeatResult
  /** Une connexion s'est fermée. Le jeton reste valable pour revenir. */
  leave(token: string): void
  /** Nombre de tablettes connectées par rôle. */
  connected(): Record<string, number>
}

export function createSeats(config: ScenarioConfig): Seats {
  /** jeton → rôle (tous les jetons donnés depuis le démarrage). */
  const roleOf = new Map<string, string>()
  /** jeton → nombre de connexions ouvertes avec ce jeton. */
  const openSockets = new Map<string, number>()

  /** Nombre de tablettes connectées pour un rôle (un jeton = une tablette). */
  function countConnected(role: string): number {
    let n = 0
    for (const [token, count] of openSockets) if (count > 0 && roleOf.get(token) === role) n++
    return n
  }

  function open(token: string) {
    openSockets.set(token, (openSockets.get(token) ?? 0) + 1)
  }

  return {
    login(password) {
      const role = Object.entries(config.roles).find(([, r]) => r.motDePasse === password)?.[0]
      if (!role) return { ok: false, error: 'mot de passe inconnu' }

      const max = config.roles[role]!.joueurs.max
      if (countConnected(role) >= max) return { ok: false, error: 'nombre maximum de joueurs atteint' }

      const token = randomUUID()
      roleOf.set(token, role)
      open(token)
      return { ok: true, role, token }
    },

    resume(token) {
      const role = roleOf.get(token)
      if (!role) return { ok: false, error: 'jeton inconnu' }
      open(token)
      return { ok: true, role, token }
    },

    leave(token) {
      const count = openSockets.get(token) ?? 0
      if (count <= 1) openSockets.delete(token)
      else openSockets.set(token, count - 1)
    },

    connected() {
      return Object.fromEntries(Object.keys(config.roles).map((role) => [role, countConnected(role)]))
    },
  }
}
