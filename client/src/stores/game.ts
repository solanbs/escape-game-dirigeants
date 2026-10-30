import { reactive } from 'vue'
import { SOCKET_EVENTS } from '@escape/shared'
import { api } from '@/services/api'
import { socket } from '@/services/socket'

/**
 * État de jeu côté front.
 *
 * Volontairement simple (reactive au lieu de Pinia) : si l'état grossit
 * (fenêtres ouvertes, apps, progression détaillée), on migre vers Pinia
 * sans changer les composants, qui n'utilisent que `game` et `connect()`.
 */
export const game = reactive({
  connected: false,
  lastMessage: '',
  events: [] as string[],
})

function log(entry: string) {
  game.events.unshift(`${new Date().toLocaleTimeString()} — ${entry}`)
  game.events = game.events.slice(0, 20)
}

export function connect() {
  socket.on('connect', () => {
    game.connected = true
    socket.emit('hello', { role: 'player' })
  })

  socket.on('disconnect', () => {
    game.connected = false
  })

  socket.on(SOCKET_EVENTS.READY, ({ at }) => {
    log(`serveur prêt (${new Date(at).toLocaleTimeString()})`)
  })

  socket.on(SOCKET_EVENTS.PUZZLE_SOLVED, ({ puzzleId }) => {
    log(`énigme résolue : ${puzzleId}`)
  })

  socket.on(SOCKET_EVENTS.HINT, ({ text }) => {
    log(`indice : ${text}`)
  })

  socket.on(SOCKET_EVENTS.IOT_TRIGGER, ({ target, action }) => {
    log(`iot → ${target} ${action}`)
  })

  socket.connect()
}

/** Bouton de démonstration : envoie une réponse que le serveur connaît. */
export async function testAnswer() {
  try {
    const result = await api.answer({ teamId: 'demo', puzzleId: 'puzzle-1', value: 'admin' })
    game.lastMessage = result.message
    if (!result.ok) log(result.message)
  } catch (error) {
    game.lastMessage = 'API injoignable'
    log(String(error))
  }
}
