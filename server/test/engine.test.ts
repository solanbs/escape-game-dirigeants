import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createEngine, createRegistry } from '../src/engine/engine.js'
import { defineElement, element, type Scenario } from '../src/engine/types.js'
import { AllOf, IotRelay, PasswordLock, Tool, registry } from '../src/elements/index.js'
import { gm, master, ops } from './helpers.js'

/** Petit scénario : un cadenas qui débloque un outil et coupe un relais. */
const scenario: Scenario = {
  id: 'test',
  title: 'test',
  elements: {
    lock: element(PasswordLock, {
      config: { label: 'Code', answer: 'secret' },
      allow: ['master'],
      visibleTo: ['master'],
    }),
    tool: element(Tool, {
      enabled: false,
      config: { title: 'Outil', component: 'X' },
      visibleTo: ['master', 'ops'],
    }),
    relay: element(IotRelay, { config: { deviceId: 'box-01' } }),
  },
  wires: [
    ['lock.solved', 'tool.enable'],
    ['lock.solved', 'relay.on'],
  ],
}

const engine = createEngine(scenario, registry)

describe('validation du scénario', () => {
  it('refuse un type inconnu', () => {
    const bad: Scenario = { id: 'bad', title: '', elements: { x: { type: 'Nope', config: {} } }, wires: [] }
    assert.throws(() => createEngine(bad, registry), /type inconnu « Nope »/)
  })

  it('refuse un câble vers une sortie ou une entrée qui n’existe pas', () => {
    const bad: Scenario = { ...scenario, wires: [['lock.opened', 'tool.enable'], ['lock.solved', 'tool.open']] }
    assert.throws(() => createEngine(bad, registry), (err: Error) => {
      assert.match(err.message, /pas de sortie « opened »/)
      assert.match(err.message, /pas d'entrée « open »/)
      return true
    })
  })
})

describe('propagation des signaux', () => {
  it('suit les câbles : bon code → outil débloqué + effet IoT', () => {
    const { state, effects, result } = engine.run(engine.init(), {
      element: 'lock',
      input: 'submit',
      payload: 'secret',
      from: master,
    })

    assert.deepEqual(result, { ok: true, message: 'Accès accepté' })
    assert.equal(state.tool?.enabled, true)
    assert.deepEqual(effects, [{ type: 'iot', deviceId: 'box-01', action: 'on' }])
  })

  it('mauvais code → rien ne se débloque', () => {
    const { state, effects, result } = engine.run(engine.init(), {
      element: 'lock',
      input: 'submit',
      payload: 'nope',
      from: master,
    })
    assert.equal(result.ok, false)
    assert.equal(state.tool?.enabled, false)
    assert.deepEqual(effects, [])
  })

  it("ne modifie jamais l'état reçu (fonction pure)", () => {
    const before = engine.init()
    const copy = structuredClone(before)
    engine.run(before, { element: 'lock', input: 'submit', payload: 'secret', from: master })
    assert.deepEqual(before, copy)
  })

  it('détecte une boucle de câbles', () => {
    const Echo = defineElement<null, null>({
      name: 'Echo',
      outputs: ['out'],
      init: () => null,
      inputs: { in: (ctx) => ctx.emit('out') },
    })
    const loop: Scenario = {
      id: 'loop',
      title: '',
      elements: { a: { type: 'Echo', config: null }, b: { type: 'Echo', config: null } },
      wires: [
        ['a.out', 'b.in'],
        ['b.out', 'a.in'],
      ],
    }
    const looping = createEngine(loop, createRegistry([Echo]))
    assert.throws(() => looping.run(looping.init(), { element: 'a', input: 'in', from: gm }), /boucle/)
  })
})

describe('droits', () => {
  it('une commande forgée par une opé vers un élément réservé au master est refusée', () => {
    const { result, trace } = engine.run(engine.init(), {
      element: 'lock',
      input: 'submit',
      payload: 'secret',
      from: ops,
    })
    assert.deepEqual(result, { ok: false, message: 'Action non autorisée' })
    assert.equal(trace.length, 0)
  })

  it('un joueur ne peut pas activer un élément lui-même', () => {
    const { result } = engine.run(engine.init(), { element: 'lock', input: 'enable', from: master })
    assert.equal(result.ok, false)
  })

  it('le MJ peut déclencher n’importe quelle entrée', () => {
    const { state } = engine.run(engine.init(), { element: 'tool', input: 'enable', from: gm })
    assert.equal(state.tool?.enabled, true)
  })

  it('un élément inactif ignore ses entrées', () => {
    const disabled = engine.run(engine.init(), { element: 'lock', input: 'disable', from: gm }).state
    const { result, state } = engine.run(disabled, {
      element: 'lock',
      input: 'submit',
      payload: 'secret',
      from: master,
    })
    assert.equal(result.ok, false)
    assert.equal(state.tool?.enabled, false)
  })
})

describe('vues par rôle', () => {
  it('chaque rôle ne voit que ses éléments actifs', () => {
    const solved = engine.run(engine.init(), {
      element: 'lock',
      input: 'submit',
      payload: 'secret',
      from: master,
    }).state

    const ids = (role: 'master' | 'ops' | 'gm') => engine.view(solved, role).map((v) => v.id)
    assert.deepEqual(ids('master'), ['lock', 'tool'])
    assert.deepEqual(ids('ops'), ['tool'])
    assert.deepEqual(ids('gm'), ['lock', 'tool', 'relay'])
  })

  it('la solution n’est jamais envoyée aux joueurs', () => {
    const views = JSON.stringify([engine.view(engine.init(), 'master'), engine.view(engine.init(), 'ops')])
    assert.ok(!views.includes('secret'))
  })
})

describe('éléments', () => {
  it('PasswordLock ignore la casse et les espaces, accepte des variantes', () => {
    const e = createEngine(
      {
        id: 'p',
        title: '',
        elements: { l: element(PasswordLock, { config: { label: '', answer: ['Abc', 'xyz'] }, allow: ['master'] }) },
        wires: [],
      },
      registry,
    )
    const submit = (v: string) => e.run(e.init(), { element: 'l', input: 'submit', payload: v, from: master }).result.ok
    assert.equal(submit('  aBC '), true)
    assert.equal(submit('XYZ'), true)
    assert.equal(submit('abd'), false)
  })

  it('AllOf émet done une seule fois, quand tout est reçu', () => {
    const Counter = defineElement<null, { n: number }>({
      name: 'Counter',
      outputs: [],
      init: () => ({ n: 0 }),
      inputs: { inc: (ctx) => void ctx.state.n++ },
    })
    const e = createEngine(
      {
        id: 'a',
        title: '',
        elements: {
          gate: element(AllOf, { config: { of: ['a', 'b'] } }),
          count: { type: 'Counter', config: null },
        },
        wires: [['gate.done', 'count.inc']],
      },
      createRegistry([AllOf, Counter]),
    )
    let s = e.init()
    for (const input of ['a', 'a', 'b', 'b']) s = e.run(s, { element: 'gate', input, from: gm }).state
    assert.deepEqual(s.count?.data, { n: 1 })
  })
})
