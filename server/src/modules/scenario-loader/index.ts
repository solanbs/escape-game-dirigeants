/**
 * Module scenario-loader : lit le dossier de scénario et refuse de démarrer
 * s'il contient une erreur. Seule porte d'entrée du module.
 *
 * Étape 1 : config.yaml. Les pages (étape 2) et le déroulé (étape 4) suivront.
 */
export { loadConfig } from './config.js'
export type { RoleConfig, ScenarioConfig } from './config.js'
export { ScenarioError } from './errors.js'
