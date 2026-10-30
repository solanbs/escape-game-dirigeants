import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import type { AnswerRequest } from '@escape/shared'
import { createRealtime } from './realtime.js'
import { handleAnswer } from './game.js'

const here = dirname(fileURLToPath(import.meta.url))
const clientDist = join(here, '../../client/dist')

const PORT = Number(process.env.PORT ?? 3000)
const isProd = process.env.NODE_ENV === 'production'

const app = express()
app.use(express.json())

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() })
})

app.post('/api/answer', (req, res) => {
  const body = req.body as Partial<AnswerRequest>

  if (!body?.teamId || !body?.puzzleId || typeof body.value !== 'string') {
    res.status(400).json({ ok: false, message: 'teamId, puzzleId et value sont requis' })
    return
  }

  res.json(handleAnswer(body as AnswerRequest, realtime.emit))
})

// ---------------------------------------------------------------------------
// Serveur HTTP + temps réel
// ---------------------------------------------------------------------------

const httpServer = createServer(app)
const realtime = createRealtime(httpServer)

// ---------------------------------------------------------------------------
// Front statique (production uniquement : en dev, c'est Vite qui sert le front)
// ---------------------------------------------------------------------------

if (isProd) {
  app.use(express.static(clientDist))

  // Fallback SPA : toute route inconnue renvoie index.html.
  app.use((_req, res) => {
    res.sendFile(join(clientDist, 'index.html'))
  })
}

// ---------------------------------------------------------------------------
// Démarrage / arrêt propre
// ---------------------------------------------------------------------------

httpServer.listen(PORT, () => {
  console.log(`Serveur prêt sur http://localhost:${PORT} (${isProd ? 'production' : 'développement'})`)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`\n${signal} reçu, arrêt en cours...`)
    void realtime.close().then(() => {
      httpServer.close(() => process.exit(0))
    })
  })
}
