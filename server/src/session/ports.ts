/**
 * Ce dont le SessionManager a besoin du monde extérieur, sous forme
 * d'interfaces. Il ne connaît ni Socket.IO, ni MQTT, ni SQLite :
 * les vraies implémentations sont branchées dans index.ts, et les tests
 * en fournissent de fausses.
 */
import type { Role, SessionInfo } from '@escape/shared'
import type { EngineState, TraceEntry } from '../engine/types.js'

/** Une session = ses infos publiques + l'état du moteur. */
export type Session = SessionInfo & { state: EngineState }

/** Les sorties du jeu. */
export interface Outputs {
  /** L'état a changé : recalculer et envoyer la vue de chaque rôle. */
  pushViews(): void
  /** Message ponctuel (toast) pour certains rôles. */
  notify(to: Role[], message: string): void
  /** Ordre à un appareil IoT. */
  iot(deviceId: string, action: string): void
}

/** Stockage des sessions et de leur journal. */
export interface SessionRepo {
  /** La session non terminée, s'il y en a une (reprise après redémarrage). */
  loadActive(): Session | null
  save(session: Session): void
  appendTrace(sessionId: string, at: number, trace: TraceEntry[]): void
}
