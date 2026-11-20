/**
 * Chef d'orchestre d'une partie.
 *
 * - garde la session courante (une seule à la fois) et son cycle de vie ;
 * - refuse les actions des joueurs si la partie n'est pas en cours ;
 * - appelle le moteur, sauvegarde, journalise ;
 * - transmet les effets du moteur aux sorties (Socket.IO, MQTT…).
 *
 * Toutes les entrées du jeu (tablettes, MJ, IoT, timers) passent par `dispatch`.
 */
import type { Logger } from 'pino'
import type { Role, SessionInfo, SessionStatus, ViewState } from '@escape/shared'
import { describeActor, formatTrace } from '../engine/engine.js'
import type { Effect, Engine, EngineInput, InputResult } from '../engine/types.js'
import type { Outputs, Session, SessionRepo } from './ports.js'
import { makeSessionId } from './sessionId.js'

/** Erreur « normale » (mauvais usage), à renvoyer telle quelle au MJ. */
export class GameError extends Error {}

export class SessionManager {
  private session: Session | null
  private log: Logger

  constructor(
    private readonly engine: Engine,
    private readonly repo: SessionRepo,
    private readonly out: Outputs,
    private readonly baseLog: Logger,
    private readonly now: () => Date = () => new Date(),
  ) {
    // Reprise après redémarrage du serveur.
    this.session = repo.loadActive()
    this.log = this.session ? this.sessionLog(this.session) : baseLog
    if (this.session) this.log.info({ status: this.session.status }, 'session reprise')
  }

  // -------------------------------------------------------------------------
  // Lecture
  // -------------------------------------------------------------------------

  get info(): SessionInfo | null {
    if (!this.session) return null
    const { state: _state, ...info } = this.session
    return info
  }

  /** Vue complète pour un rôle : c'est ce qui part vers les tablettes. */
  viewFor(role: Role): ViewState {
    const s = this.session
    const visible = s && (role === 'gm' || s.status === 'running' || s.status === 'paused')
    return {
      role,
      session: this.info,
      elements: visible ? this.engine.view(s.state, role) : [],
    }
  }

  // -------------------------------------------------------------------------
  // Cycle de vie (commandes du MJ)
  // -------------------------------------------------------------------------

  create(teamName: string): SessionInfo {
    const name = teamName.trim()
    if (!name) throw new GameError("Nom d'équipe requis")
    if (this.session && this.session.status !== 'ended') {
      throw new GameError(`Une partie est déjà ouverte (${this.session.id}), terminez-la d'abord`)
    }

    const now = this.now()
    this.session = {
      id: makeSessionId(now, name),
      teamName: name,
      status: 'lobby',
      createdAt: now.getTime(),
      startedAt: null,
      endedAt: null,
      state: this.engine.init(),
    }
    this.log = this.sessionLog(this.session)
    this.log.info({ scenario: this.engine.scenario.id }, 'session créée')
    this.commit()
    return this.info!
  }

  start() {
    this.transition(['lobby'], 'running')
  }

  pause() {
    this.transition(['running'], 'paused')
  }

  resume() {
    this.transition(['paused'], 'running')
  }

  end() {
    this.transition(['lobby', 'running', 'paused'], 'ended')
  }

  // -------------------------------------------------------------------------
  // Point d'entrée unique du jeu
  // -------------------------------------------------------------------------

  dispatch(input: EngineInput): InputResult {
    const s = this.session
    if (!s || s.status === 'ended') return { ok: false, message: 'Aucune partie en cours' }

    // Le MJ peut agir à tout moment, les autres seulement pendant la partie.
    if (s.status !== 'running' && input.from.kind !== 'gm') {
      return { ok: false, message: s.status === 'paused' ? 'Partie en pause' : "La partie n'a pas commencé" }
    }

    let run
    try {
      run = this.engine.run(s.state, input)
    } catch (err) {
      // Bug de scénario ou d'élément : on annule l'action, l'état reste intact.
      this.log.error({ err, input }, 'erreur du moteur, action annulée')
      return { ok: false, message: 'Erreur interne' }
    }

    const who = describeActor(input.from)
    const what = `${input.element}.${input.input}`

    // Refusé avant même d'entrer dans le moteur (droits, élément inconnu…).
    if (run.trace.length === 0) {
      this.log.warn({ from: who, command: what }, `refusé : ${run.result.message}`)
      return run.result
    }

    this.log.info({ from: who, command: what, ok: run.result.ok }, run.result.message ?? 'action')
    for (const entry of run.trace) this.log.debug(formatTrace(entry))

    s.state = run.state
    this.repo.appendTrace(s.id, this.now().getTime(), run.trace)
    for (const effect of run.effects) this.apply(effect)
    this.commit()

    return run.result
  }

  // -------------------------------------------------------------------------

  private apply(effect: Effect) {
    switch (effect.type) {
      case 'iot':
        this.out.iot(effect.deviceId, effect.action)
        break
      case 'notify':
        this.out.notify(effect.to, effect.message)
        break
    }
  }

  private transition(from: SessionStatus[], to: SessionStatus) {
    const s = this.session
    if (!s) throw new GameError('Aucune session')
    if (!from.includes(s.status)) {
      throw new GameError(`Impossible de passer de « ${s.status} » à « ${to} »`)
    }

    s.status = to
    if (to === 'running' && s.startedAt === null) s.startedAt = this.now().getTime()
    if (to === 'ended') s.endedAt = this.now().getTime()

    this.log.info({ status: to }, 'changement de statut')
    this.commit()
  }

  /** Sauvegarde + envoi des nouvelles vues. */
  private commit() {
    if (this.session) this.repo.save(this.session)
    this.out.pushViews()
  }

  private sessionLog(s: Session): Logger {
    return this.baseLog.child({ session: s.id, team: s.teamName })
  }
}
