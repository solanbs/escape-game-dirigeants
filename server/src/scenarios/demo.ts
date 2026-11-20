/**
 * Scénario D'EXEMPLE, pour comprendre le moteur. Ce n'est pas le vrai scénario.
 *
 * Il s'inspire des étapes 4 à 6 de docs/scenario.md, simplifiées.
 * Les mots de passe sont des valeurs bidon.
 *
 *   Alarme ──► Session de Maël ──┬──► outil Shell
 *                                ├──► Mot de passe root ──┐
 *                                └──► Chemin des plans ───┴─► (les deux) ──► outil Exfiltration
 *
 * Il montre : un enchaînement séquentiel, deux énigmes en parallèle (AllOf),
 * des outils qui se débloquent, un effet IoT, une notification, et des
 * éléments visibles selon le rôle.
 */
import { AllOf, IotRelay, Notify, PasswordLock, Tool } from '../elements/index.js'
import { element, type Scenario } from '../engine/types.js'

export const demoScenario: Scenario = {
  id: 'demo',
  title: 'Exemple : intrusion chez Racing Team',

  elements: {
    // --- Outils passifs, disponibles dès le début pour tout le monde -------
    browser: element(Tool, {
      config: { title: 'Navigateur', component: 'FakeGoogle' },
      visibleTo: ['master', 'ops'],
    }),
    cracker: element(Tool, {
      config: { title: 'Cracker de hash', component: 'Cracker' },
      visibleTo: ['master', 'ops'],
    }),

    // --- Étape A : l'alarme ----------------------------------------------------
    alarmPanel: element(PasswordLock, {
      config: { label: "Boîtier d'alarme SuperSecure", answer: 'SuperSecure1234' },
      allow: ['master'], // seul le master peut saisir
      visibleTo: ['master'],
    }),
    siren: element(IotRelay, {
      config: { deviceId: 'alarme-01' }, // pas de visibleTo : seul le MJ le voit
    }),
    alarmOffMessage: element(Notify, {
      config: { to: ['master', 'ops'], message: 'Alarme désactivée. Vous pouvez fouiller les bureaux.' },
    }),

    // --- Étape B : la session de Maël (inactive tant que l'alarme sonne) -------
    maelSession: element(PasswordLock, {
      enabled: false,
      config: { label: 'Session Windows de Maël Morin', answer: ['m.morin:Ferrari2024', 'mmorin:Ferrari2024'] },
      allow: ['master'],
      visibleTo: ['master'],
    }),
    shell: element(Tool, {
      enabled: false,
      config: { title: 'Shell distant', component: 'Shell' },
      visibleTo: ['master'],
    }),

    // --- Étape C : deux énigmes en parallèle -----------------------------------
    rootPassword: element(PasswordLock, {
      enabled: false,
      config: { label: 'Mot de passe root', answer: 'gtfobins' },
      allow: ['master'],
      visibleTo: ['master'],
    }),
    plansPath: element(PasswordLock, {
      enabled: false,
      config: { label: 'Chemin des plans aéro', answer: '/srv/aero/plans.zip', caseSensitive: true },
      allow: ['master'],
      visibleTo: ['master'],
    }),
    readyToExfil: element(AllOf, {
      config: { of: ['root', 'plans'] },
    }),
    exfil: element(Tool, {
      enabled: false,
      config: { title: 'Exfiltration', component: 'Exfil' },
      visibleTo: ['master'],
    }),
  },

  // C'est ici que se trouve TOUT le déroulé de la partie.
  wires: [
    ['alarmPanel.solved', 'siren.off'],
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
