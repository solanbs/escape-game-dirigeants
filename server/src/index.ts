import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { pinoHttp } from 'pino-http'
import type { AnswerRequest } from '@escape/shared'
import { logger } from './logger.js'
import { createRealtime } from './realtime.js'
import { handleAnswer } from './game.js'
import {createIot} from "./iot/index.js";
import {randomUUID} from "node:crypto";
import {IotDesiredState} from "@escape/shared/iot";

const here = dirname(fileURLToPath(import.meta.url))
const clientDist = join(here, '../../client/dist')

const PORT = Number(process.env.PORT ?? 3000)
const isProd = process.env.NODE_ENV === 'production'

const app = express()

// temporary session ID and desiredState for iot testing
let sessionId = randomUUID()
let desiredState: IotDesiredState = {
    lights: null,
    audio: null,
}

app.use(express.json())
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error'
      if (res.statusCode >= 400) return 'warn'
      return 'debug'
    },
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
)

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
export const realtime = createRealtime(httpServer)
export const iot = createIot(realtime.io, {
  getDesiredState: () => desiredState,
  getSessionId: () => sessionId,
})

// Test manuel : IOT_AUDIO_SMOKE_TEST=1 joue une piste 5 s après la connexion du gateway.
if (process.env.IOT_AUDIO_SMOKE_TEST === '1') {
  const smokeTrack = process.env.IOT_AUDIO_SMOKE_TRACK ?? 'alarm.mp3'
  let scheduled = false

  const unsubscribe = iot.port.onGatewayStatus((status) => {
    if (!status.online || scheduled) return
    scheduled = true
    unsubscribe()

    logger.info({track: smokeTrack}, 'smoke audio: gateway connecté, lecture dans 5s')

    setTimeout(() => {
      void iot.admin.playAudio(smokeTrack, {volume: 60, loop: false}).then(
        (result) => logger.info({result}, 'smoke audio: résultat'),
        (err) => logger.error({err}, 'smoke audio: erreur'),
      )
    }, 5000)

    setTimeout(() => {
      logger.info({snapshot: iot.port.getSnapshot()}, 'smoke audio: état à +7s')
    }, 7000)

    setTimeout(() => {
      logger.info({snapshot: iot.port.getSnapshot()}, 'smoke audio: état à +10s')
    }, 10000)

    // La fin de lecture n'émet pas de STATE : un stop force la remontée de l'état final.
    setTimeout(() => {
      void iot.admin.stopAudio().then((result) => {
        logger.info({result}, 'smoke audio: stop')
        setTimeout(() => {
          logger.info({snapshot: iot.port.getSnapshot()}, 'smoke audio: état après stop')
        }, 500)
      })
    }, 20000)
  })
}

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
  logger.info(
    { port: PORT, env: isProd ? 'production' : 'development' },
    `serveur prêt sur http://localhost:${PORT}`,
  )
})
void iot.port.start()

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info({ signal }, 'arrêt en cours')
    void (async () => {
      await iot.port.stop()
      await realtime.close()
      httpServer.close(() => process.exit(0))
    })()
    })
}
