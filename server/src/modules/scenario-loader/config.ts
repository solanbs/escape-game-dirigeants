/**
 * Lecture et vérification de config.yaml : les rôles, leurs mots de passe,
 * leur écran et le nombre de joueurs (docs/architecture.md, section 5.5).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { load } from 'js-yaml'
import { z } from 'zod'
import { ScenarioError } from './errors.js'

export type RoleConfig = {
  motDePasse: string
  ecran: string
  joueurs: { min: number; max: number }
}

export type ScenarioConfig = {
  roles: Record<string, RoleConfig>
}

/** Le MJ n'est pas un rôle : ces noms sont refusés pour éviter toute confusion. */
const RESERVED_ROLES = ['gm', 'mj']

const RoleSchema = z
  .object({
    mot_de_passe: z.string().min(1, 'mot_de_passe vide'),
    ecran: z.string().min(1, 'ecran vide'),
    joueurs: z.object({
      min: z.number().int().min(0),
      max: z.number().int().min(1),
    }),
  })
  .strict()

const ConfigSchema = z
  .object({
    roles: z.record(z.string().regex(/^[a-z][a-z0-9_-]*$/, 'nom de rôle invalide (minuscules, chiffres, - et _)'), RoleSchema),
  })
  .strict()

export function loadConfig(dir: string): ScenarioConfig {
  const file = join(dir, 'config.yaml')
  const raw = readYaml(file)

  const parsed = ConfigSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ScenarioError(
      file,
      parsed.error.issues.map((issue) => `${issue.path.join('.') || '(racine)'} : ${issue.message}`),
    )
  }

  const problems: string[] = []
  const roles = parsed.data.roles
  const names = Object.keys(roles)

  if (names.length === 0) problems.push('roles : au moins un rôle est nécessaire')

  const byPassword = new Map<string, string>()
  for (const [name, role] of Object.entries(roles)) {
    if (RESERVED_ROLES.includes(name)) {
      problems.push(`roles.${name} : le MJ n'est pas un rôle (son mot de passe est GM_PASSWORD dans .env)`)
    }
    if (role.joueurs.min > role.joueurs.max) {
      problems.push(`roles.${name}.joueurs : min (${role.joueurs.min}) est plus grand que max (${role.joueurs.max})`)
    }
    const other = byPassword.get(role.mot_de_passe)
    if (other) problems.push(`roles.${name} : même mot de passe que roles.${other}`)
    else byPassword.set(role.mot_de_passe, name)
  }

  if (problems.length > 0) throw new ScenarioError(file, problems)

  return {
    roles: Object.fromEntries(
      Object.entries(roles).map(([name, role]) => [
        name,
        { motDePasse: role.mot_de_passe, ecran: role.ecran, joueurs: role.joueurs },
      ]),
    ),
  }
}

function readYaml(file: string): unknown {
  let text: string
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    throw new ScenarioError(file, ['fichier introuvable'])
  }
  try {
    return load(text)
  } catch (err) {
    throw new ScenarioError(file, [`YAML invalide : ${(err as Error).message.split('\n')[0]}`])
  }
}
