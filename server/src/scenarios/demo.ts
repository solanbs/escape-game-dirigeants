/**
 * Scénario D'EXEMPLE, pour comprendre le moteur. Ce n'est pas le vrai scénario.
 *
 * Il s'inspire des étapes 4 à 6 de docs/scenario.md (Carbona Racing Team), simplifiées.
 * Les mots de passe sont des valeurs bidon.
 *
 *   Alarme ──► Session de Maël ──┬──► outil Shell
 *                                ├──► Mot de passe root ──┐
 *                                └──► Chemin des plans ───┴─► (les deux) ──► outil Exfiltration
 *
 * Il montre : un enchaînement séquentiel, deux énigmes en parallèle (AllOf),
 * des applications qui se débloquent, un cue IoT, une notification, et des
 * nœuds visibles selon le rôle.
 */
import { AllOf, App, IotCue, Notify, PasswordLock, node, type Scenario } from '../modules/timeline/index.js'

export const demoScenario: Scenario = {
  id: 'demo',
  title: 'Exemple : intrusion chez Carbona Racing Team',

  nodes: {
    // --- Applications passives, disponibles dès le début pour tout le monde -------
    browser: node(App, {
      config: { title: 'Navigateur', app: 'Browser' },
      visibleTo: ['master', 'ops'],
    }),
    cracker: node(App, {
      config: { title: 'Cracker de hash', app: 'Cracker' },
      visibleTo: ['master', 'ops'],
    }),

    // --- Étape A : l'alarme ----------------------------------------------------
    alarmPanel: node(PasswordLock, {
      config: { label: "Boîtier d'alarme SuperSecure", answer: 'SuperSecure1234' },
      allow: ['master'], // seul le master peut saisir
      visibleTo: ['master'],
    }),
    alarmOffCue: node(IotCue, {
      config: { cue: 'alarm-off' }, // lumières d'ambiance + arrêt de la sirène ; seul le MJ le voit
    }),
    alarmOffMessage: node(Notify, {
      config: { to: ['master', 'ops'], message: 'Alarme désactivée. Vous pouvez fouiller les bureaux.' },
    }),

    // --- Étape B : la session de Maël (inactive tant que l'alarme sonne) -------
    maelSession: node(PasswordLock, {
      enabled: false,
      // Format des identifiants (docs/infos.md) : nom + initiale du prénom.
      config: { label: 'Session Windows de Maël Morin', answer: 'morinm:Carbona2024' },
      allow: ['master'],
      visibleTo: ['master'],
    }),
    shell: node(App, {
      enabled: false,
      config: { title: 'Shell distant', app: 'Shell' },
      visibleTo: ['master'],
    }),

    // --- Étape C : deux énigmes en parallèle -----------------------------------
    rootPassword: node(PasswordLock, {
      enabled: false,
      config: { label: 'Mot de passe root', answer: 'gtfobins' },
      allow: ['master'],
      visibleTo: ['master'],
    }),
    plansPath: node(PasswordLock, {
      enabled: false,
      config: { label: 'Chemin des plans aéro', answer: '/srv/aero/plans.zip', caseSensitive: true },
      allow: ['master'],
      visibleTo: ['master'],
    }),
    readyToExfil: node(AllOf, {
      config: { of: ['root', 'plans'] },
    }),
    exfil: node(App, {
      enabled: false,
      config: { title: 'Exfiltration', app: 'Exfil' },
      visibleTo: ['master'],
    }),
  },

  // C'est ici que se trouve TOUT le déroulé de la partie.
  links: [
    ['alarmPanel.solved', 'alarmOffCue.play'],
    ['alarmPanel.solved', 'alarmOffMessage.send'],
    ['alarmPanel.solved', 'maelSession.enable'],

    ['maelSession.solved', 'shell.enable'],
    ['maelSession.solved', 'rootPassword.enable'],
    ['maelSession.solved', 'plansPath.enable'],

    ['rootPassword.solved', 'readyToExfil.root'],
    ['plansPath.solved', 'readyToExfil.plans'],
    ['readyToExfil.done', 'exfil.enable'],
  ],
}
