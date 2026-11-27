/**
 * Erreur dans un fichier du dossier de scénario.
 * Le serveur refuse de démarrer et affiche ce message tel quel.
 */
export class ScenarioError extends Error {
  constructor(
    readonly file: string,
    readonly problems: string[],
  ) {
    super(`${file} :\n  - ${problems.join('\n  - ')}`)
    this.name = 'ScenarioError'
  }
}
