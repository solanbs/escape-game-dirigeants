import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { createEngine } from '../src/engine/engine.js'
import { registry } from '../src/elements/index.js'
import { MemorySessionRepo } from '../src/persistence/MemorySessionRepo.js'
import { demoScenario } from '../src/scenarios/demo.js'
import { GameError, SessionManager } from '../src/session/SessionManager.js'
import { makeSessionId } from '../src/session/sessionId.js'
import { fakeOutputs, gm, master, ops, silentLog } from './helpers.js'

const engine = createEngine(demoScenario, registry)
const fixedNow = () => new Date(2026, 10, 9, 14, 30)

function setup() {
  const repo = new MemorySessionRepo()
  const { outputs, calls } = fakeOutputs()
  const game = new SessionManager(engine, repo, outputs, silentLog, fixedNow)
  const play = (from: typeof master, element: string, input: string, payload?: unknown) =>
    game.dispatch({ element, input, payload, from })
  const visible = (role: 'master' | 'ops' | 'gm') => game.viewFor(role).elements.map((e) => e.id)
  return { repo, calls, game, play, visible }
}

describe('id de session', () => {
  it('date + heure + nom d’équipe', () => {
    assert.equal(makeSessionId(fixedNow(), "Les Élèves d'Été !"), '2026-11-09_14h30_les-eleves-d-ete')
  })
})

describe('cycle de vie', () => {
  let t: ReturnType<typeof setup>
  beforeEach(() => {
    t = setup()
  })

  it('refuse les actions tant que la partie n’a pas démarré', () => {
    t.game.create('Les Requins')
    assert.equal(t.play(master, 'alarmPanel', 'submit', 'SuperSecure1234').ok, false)
    assert.deepEqual(t.visible('master'), [])
  })

  it('une seule partie ouverte à la fois', () => {
    t.game.create('A')
    assert.throws(() => t.game.create('B'), GameError)
    t.game.end()
    assert.doesNotThrow(() => t.game.create('B'))
  })

  it('en pause, seuls les joueurs sont bloqués', () => {
    t.game.create('A')
    t.game.start()
    t.game.pause()
    assert.deepEqual(t.play(master, 'alarmPanel', 'submit', 'x'), { ok: false, message: 'Partie en pause' })
    assert.equal(t.play(gm, 'shell', 'enable').ok, true)
  })

  it('reprend la session active au redémarrage', () => {
    t.game.create('A')
    t.game.start()
    t.play(master, 'alarmPanel', 'submit', 'SuperSecure1234')

    const restarted = new SessionManager(engine, t.repo, fakeOutputs().outputs, silentLog, fixedNow)
    assert.equal(restarted.info?.id, '2026-11-09_14h30_a')
    assert.ok(restarted.viewFor('master').elements.some((e) => e.id === 'maelSession'))
  })
})

describe('scénario de démo, de bout en bout', () => {
  it('alarme → session de Maël → (root + plans) → exfiltration', () => {
    const { game, play, visible, calls, repo } = setup()
    game.create('Les Requins')
    game.start()

    assert.deepEqual(visible('master'), ['browser', 'cracker', 'alarmPanel'])
    assert.deepEqual(visible('ops'), ['browser', 'cracker'])

    // L'opé n'a pas le champ à l'écran ; une commande forgée est quand même refusée.
    assert.equal(play(ops, 'alarmPanel', 'submit', 'SuperSecure1234').ok, false)
    assert.equal(play(master, 'alarmPanel', 'submit', 'mauvais').ok, false)
    assert.equal(play(master, 'alarmPanel', 'submit', 'supersecure1234').ok, true)

    assert.deepEqual(calls.iot, [{ deviceId: 'alarme-01', action: 'off' }])
    assert.equal(calls.notify.length, 1)
    assert.ok(visible('master').includes('maelSession'))

    play(master, 'maelSession', 'submit', 'm.morin:Ferrari2024')
    assert.ok(visible('master').includes('shell'))

    // Énigmes parallèles : une seule ne suffit pas.
    play(master, 'rootPassword', 'submit', 'gtfobins')
    assert.ok(!visible('master').includes('exfil'))
    play(master, 'plansPath', 'submit', '/srv/aero/plans.zip')
    assert.ok(visible('master').includes('exfil'))

    // Les opé n'ont jamais vu les outils offensifs.
    assert.deepEqual(visible('ops'), ['browser', 'cracker'])

    // Tout est journalisé sous l'id de session.
    assert.ok((repo.journal.get('2026-11-09_14h30_les-requins')?.length ?? 0) > 10)
  })
})
