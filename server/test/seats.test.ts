import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { createSeats } from '../src/modules/connections/index.js'
import type { ScenarioConfig } from '../src/modules/scenario-loader/index.js'

const config: ScenarioConfig = {
  roles: {
    master: { motDePasse: 'm', ecran: 'bureau', joueurs: { min: 1, max: 1 } },
    ops: { motDePasse: 'o', ecran: 'bureau', joueurs: { min: 1, max: 2 } },
  },
}

describe('places des tablettes', () => {
  it('le bon mot de passe donne le bon rôle et un jeton', () => {
    const seats = createSeats(config)
    const result = seats.login('o')
    assert.equal(result.ok, true)
    assert.equal(result.ok && result.role, 'ops')
    assert.ok(result.ok && result.token.length > 10)
  })

  it('un mot de passe inconnu est refusé', () => {
    assert.deepEqual(createSeats(config).login('azerty'), { ok: false, error: 'mot de passe inconnu' })
  })

  it('au-delà du maximum, refus ; une place libérée est reprise', () => {
    const seats = createSeats(config)
    const first = seats.login('m')
    assert.equal(first.ok, true)
    assert.deepEqual(seats.login('m'), { ok: false, error: 'nombre maximum de joueurs atteint' })

    if (first.ok) seats.leave(first.token)
    assert.equal(seats.login('m').ok, true)
  })

  it('les limites sont comptées par rôle', () => {
    const seats = createSeats(config)
    seats.login('m')
    assert.equal(seats.login('o').ok, true)
    assert.equal(seats.login('o').ok, true)
    assert.equal(seats.login('o').ok, false)
    assert.deepEqual(seats.connected(), { master: 1, ops: 2 })
  })

  it('un jeton connu redonne le rôle, même si le rôle est plein', () => {
    const seats = createSeats(config)
    const first = seats.login('m')
    assert.ok(first.ok)
    seats.leave(first.token) // la tablette redémarre…
    seats.login('m') // …et une autre prend la place entre-temps
    assert.deepEqual(seats.resume(first.token), { ok: true, role: 'master', token: first.token })
  })

  it('un jeton inconnu est refusé', () => {
    assert.deepEqual(createSeats(config).resume('faux'), { ok: false, error: 'jeton inconnu' })
  })

  it('deux connexions avec le même jeton ne comptent qu’une tablette', () => {
    const seats = createSeats(config)
    const first = seats.login('o')
    assert.ok(first.ok)
    seats.resume(first.token)
    assert.equal(seats.connected().ops, 1)
    seats.leave(first.token)
    assert.equal(seats.connected().ops, 1) // une connexion reste ouverte
    seats.leave(first.token)
    assert.equal(seats.connected().ops, 0)
  })
})
