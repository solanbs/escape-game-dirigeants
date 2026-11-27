import type { TraceEntry } from '../timeline/index.js'
import type { Session, SessionRepo } from '../session/index.js'

/**
 * Stockage en mémoire : perdu au redémarrage.
 * Suffisant pour les tests et la démo ; SQLite implémentera la même interface.
 */
export class MemorySessionRepo implements SessionRepo {
  readonly sessions = new Map<string, Session>()
  readonly journal = new Map<string, { at: number; entry: TraceEntry }[]>()

  loadActive(): Session | null {
    for (const session of this.sessions.values()) {
      if (session.status !== 'ended') return structuredClone(session)
    }
    return null
  }

  save(session: Session): void {
    this.sessions.set(session.id, structuredClone(session))
  }

  appendTrace(sessionId: string, at: number, trace: TraceEntry[]): void {
    const list = this.journal.get(sessionId) ?? []
    for (const entry of trace) list.push({ at, entry })
    this.journal.set(sessionId, list)
  }
}
