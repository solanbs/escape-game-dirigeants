/**
 * Fausse tablette, pour tester le serveur sans front.
 *
 *   npm run tablette -w @escape/server -- ops123              (mot de passe d'un rôle)
 *   npm run tablette -w @escape/server -- --token <jeton>     (reconnexion)
 *
 * Variables : SERVER_URL (défaut http://localhost:3000).
 * Reste connectée jusqu'à Ctrl+C. Si le serveur redémarre, elle se reconnecte
 * avec son jeton, comme le fera une vraie tablette.
 */
import { io } from 'socket.io-client'
import type { AuthPayload, Welcome } from '@escape/shared'

const args = process.argv.slice(2)
const url = process.env.SERVER_URL ?? 'http://localhost:3000'

let auth: AuthPayload
if (args[0] === '--token' && args[1]) auth = { token: args[1] }
else if (args[0] && !args[0].startsWith('--')) auth = { password: args[0] }
else {
  console.error('usage : tablette.ts <mot de passe>   ou   tablette.ts --token <jeton>')
  process.exit(2)
}

const heure = () => new Date().toLocaleTimeString('fr-FR')
const socket = io(url, { auth, reconnectionDelayMax: 2000 })

socket.on('welcome', (welcome: Welcome) => {
  console.log(`[${heure()}] ✅ connectée : rôle « ${welcome.role} », écran « ${welcome.ecran} »`)
  console.log(`            jeton : ${welcome.token}`)
  // Les reconnexions suivantes utilisent le jeton, pas le mot de passe.
  socket.auth = { token: welcome.token }
})

const password = 'password' in auth ? auth.password : undefined

socket.on('connect_error', (err) => {
  // Erreur réseau (serveur arrêté…) : Socket.IO réessaie tout seul.
  if ((socket as unknown as { active: boolean }).active) {
    console.log(`[${heure()}] … serveur injoignable, nouvelle tentative`)
    return
  }

  // Jeton refusé (par exemple après un redémarrage du serveur) : on revient au
  // mot de passe, comme le front reviendra à l'écran de connexion.
  if (err.message === 'jeton inconnu' && password) {
    console.log(`[${heure()}] ↩️  jeton refusé, reconnexion avec le mot de passe`)
    socket.auth = { password }
    socket.connect()
    return
  }

  console.log(`[${heure()}] ❌ refusée : ${err.message}`)
  process.exit(1)
})

socket.on('disconnect', (reason) => {
  console.log(`[${heure()}] ⚠️  déconnectée (${reason}), nouvelle tentative…`)
})

socket.onAny((event: string, ...payload: unknown[]) => {
  if (event !== 'welcome') console.log(`[${heure()}] 📨 ${event}`, ...payload)
})

process.on('SIGINT', () => {
  socket.disconnect()
  process.exit(0)
})
