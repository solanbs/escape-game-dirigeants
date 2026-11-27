import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'vitest'
import { loadConfig, ScenarioError } from '../src/modules/scenario-loader/index.js'

const dirs: string[] = []

/** Crée un dossier de scénario temporaire avec ce config.yaml. */
function scenarioWith(configYaml: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'scenario-'))
  dirs.push(dir)
  writeFileSync(join(dir, 'config.yaml'), configYaml)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const valid = `
roles:
  master:
    mot_de_passe: "m"
    ecran: bureau
    joueurs: { min: 1, max: 1 }
  ops:
    mot_de_passe: "o"
    ecran: bureau
    joueurs: { min: 1, max: 6 }
`

/** Vérifie que loadConfig refuse le fichier avec un message contenant `expected`. */
function assertRejected(configYaml: string, expected: RegExp) {
  assert.throws(
    () => loadConfig(scenarioWith(configYaml)),
    (err: unknown) => {
      assert.ok(err instanceof ScenarioError)
      assert.match(err.message, /config\.yaml/)
      assert.match(err.message, expected)
      return true
    },
  )
}

describe('loadConfig', () => {
  it('lit une config correcte', () => {
    const config = loadConfig(scenarioWith(valid))
    assert.deepEqual(Object.keys(config.roles), ['master', 'ops'])
    assert.deepEqual(config.roles.ops, { motDePasse: 'o', ecran: 'bureau', joueurs: { min: 1, max: 6 } })
  })

  it('lit le scénario de démonstration du dépôt', () => {
    const config = loadConfig(join(import.meta.dirname, '../../scenarios/demo'))
    assert.ok(config.roles.master && config.roles.ops)
  })

  it('refuse un dossier sans config.yaml', () => {
    assert.throws(() => loadConfig(join(tmpdir(), 'nexiste-pas')), /fichier introuvable/)
  })

  it('refuse un YAML mal formé', () => {
    assertRejected('roles: [oups', /YAML invalide/)
  })

  it('refuse un mot de passe manquant', () => {
    assertRejected(valid.replace('mot_de_passe: "o"', ''), /roles\.ops\.mot_de_passe/)
  })

  it('refuse deux rôles avec le même mot de passe', () => {
    assertRejected(valid.replace('mot_de_passe: "o"', 'mot_de_passe: "m"'), /même mot de passe/)
  })

  it('refuse min plus grand que max', () => {
    assertRejected(valid.replace('{ min: 1, max: 6 }', '{ min: 7, max: 6 }'), /min \(7\) est plus grand que max \(6\)/)
  })

  it('refuse un rôle « gm » : le MJ n’est pas un rôle', () => {
    assertRejected(valid.replace('  ops:', '  gm:'), /le MJ n'est pas un rôle/)
  })

  it('refuse un champ inconnu (faute de frappe)', () => {
    assertRejected(valid.replace('ecran: bureau\n    joueurs: { min: 1, max: 6 }', 'ecrna: bureau\n    joueurs: { min: 1, max: 6 }'), /roles\.ops/)
  })
})
