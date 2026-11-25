/**
 * Démo dans le terminal : joue une partie complète du scénario d'exemple,
 * sans réseau ni front, pour voir le moteur tourner.
 *
 *   npm run demo
 */
import { pino } from 'pino'
import pretty from 'pino-pretty'
import type { Role } from '@escape/shared'
import { createEngine } from '../src/engine/engine.js'
import type { Actor } from '../src/engine/types.js'
import { registry } from '../src/elements/index.js'
import { MemorySessionRepo } from '../src/persistence/MemorySessionRepo.js'
import { demoScenario } from '../src/scenarios/demo.js'
import type { Outputs } from '../src/session/ports.js'
import { SessionManager } from '../src/session/SessionManager.js'

// Logger synchrone pour que les logs s'affichent dans l'ordre avec les console.log.
const log = pino(
  { level: 'debug' },
  pretty({ sync: true, colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' }),
)

// Fausses sorties : à la place de Socket.IO et du module IoT, on affiche.
const outputs: Outputs = {
  pushViews: () => {},
  notify: (to, message) => console.log(`   📣 toast pour [${to.join(', ')}] : ${message}`),
  cue: (name) => console.log(`   🔌 IoT : cue « ${name} » (lumières + son)`),
}

const engine = createEngine(demoScenario, registry)
const repo = new MemorySessionRepo()
const game = new SessionManager(engine, repo, outputs, log)

const master: Actor = { kind: 'player', role: 'master', deviceId: 'tab-fixe-1' }
const ops: Actor = { kind: 'player', role: 'ops', deviceId: 'tab-1' }
const gm: Actor = { kind: 'gm' }

function step(title: string) {
  console.log(`\n━━━ ${title}`)
}

function play(from: Actor, element: string, input: string, payload?: unknown) {
  const r = game.dispatch({ element, input, payload, from })
  console.log(`   ${r.ok ? '✅' : '❌'} ${r.message ?? 'ok'}`)
}

function show(role: Role) {
  const ids = game.viewFor(role).elements.map((e) => (e.enabled ? e.id : `(${e.id})`))
  console.log(`   👁  ${role.padEnd(6)} voit : ${ids.join(', ') || '(rien)'}`)
}

// ---------------------------------------------------------------------------

step('Le MJ crée la session')
game.create('Les Requins')
show('master')

step('Une tablette essaie avant le début → refusé')
play(master, 'alarmPanel', 'submit', 'SuperSecure1234')

step('Le MJ lance la partie')
game.start()
show('master')
show('ops')

// L'opé n'a pas ce champ à l'écran (visibleTo: ['master']). On simule un
// joueur qui forge la commande à la main depuis les outils de développement :
// le serveur doit refuser quand même (allow: ['master']).
step("Triche : une opé forge à la main une commande vers le boîtier d'alarme")
console.log("   (l'opé n'a pas ce champ à l'écran ; on simule un emit depuis les devtools)")
play(ops, 'alarmPanel', 'submit', 'SuperSecure1234')

step('Le master se trompe de code')
play(master, 'alarmPanel', 'submit', 'admin')

step('Le master saisit le bon code → cue « alarm-off », toast, session de Maël débloquée')
play(master, 'alarmPanel', 'submit', 'supersecure1234')
show('master')

step('Le master ouvre la session de Maël → shell + 2 énigmes en parallèle')
play(master, 'maelSession', 'submit', 'morinm:Carbona2024')
show('master')

step('Mot de passe root trouvé (il manque encore les plans)')
play(master, 'rootPassword', 'submit', 'gtfobins')
show('master')

step('Chemin des plans trouvé → AllOf complet → outil Exfiltration')
play(master, 'plansPath', 'submit', '/srv/aero/plans.zip')
show('master')
show('ops')

step('Le MJ voit tout (entre parenthèses : éléments inactifs)')
show('gm')

step('Le MJ met en pause : les joueurs sont bloqués, pas le MJ')
game.pause()
play(master, 'alarmPanel', 'submit', 'x')
play(gm, 'alarmOffCue', 'play')
game.resume()

step('Fin de partie')
game.end()
const journal = repo.journal.get(game.info!.id) ?? []
console.log(`   📜 ${journal.length} signaux dans le journal de « ${game.info!.id} »\n`)
