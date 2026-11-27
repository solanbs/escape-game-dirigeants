/**
 * Point d'entrée du serveur : crée les modules et les branche entre eux.
 * Aucune logique de jeu ici (cf. docs/plan-back.md, étape 0).
 */
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { pinoHttp } from 'pino-http'
import { Server } from 'socket.io'
import type { IotDesiredState } from '@escape/shared/iot'
import { logger } from './logger.js'
import { attachConnections, createSeats } from './modules/connections/index.js'
import { createIot } from './modules/iot/index.js'
import { loadConfig, ScenarioError, type ScenarioConfig } from './modules/scenario-loader/index.js'

const here = dirname(fileURLToPath(import.meta.url))
/** Racine du dépôt (le même chemin depuis server/src en dev et server/dist en prod). */
const repoRoot = join(here, '../..')
const clientDist = join(repoRoot, 'client/dist')

const PORT = Number(process.env.PORT ?? 3000)
const isProd = process.env.NODE_ENV === 'production'

// ---------------------------------------------------------------------------
// Dossier de scénario : lu et vérifié avant tout le reste.
// Une erreur dans un fichier → le serveur refuse de démarrer, avec le fichier à corriger.
// ---------------------------------------------------------------------------

const scenarioDirSetting = process.env.SCENARIO_DIR ?? 'scenarios/demo'
const scenarioDir = isAbsolute(scenarioDirSetting) ? scenarioDirSetting : join(repoRoot, scenarioDirSetting)

let config: ScenarioConfig
try {
  config = loadConfig(scenarioDir)
} catch (err) {
  if (!(err instanceof ScenarioError)) throw err
  logger.fatal(`scénario invalide, démarrage annulé\n${err.message}`)
  process.exit(1)
}
logger.info({ scenario: scenarioDir, roles: Object.keys(config.roles) }, 'scénario chargé')

// ---------------------------------------------------------------------------
// Valeurs IoT temporaires, pour tester le gateway.
// Remplacées par la vraie session à l'étape 10 du plan (raccordement IoT).
// ---------------------------------------------------------------------------

const sessionId = randomUUID()
const desiredState: IotDesiredState = {
  lights: null,
  audio: null,
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const app = express()

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

app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() })
})

// ---------------------------------------------------------------------------
// Temps réel (Socket.IO) + modules
// Namespace principal : les tablettes (connections). Namespace /iot : le gateway (iot).
// ---------------------------------------------------------------------------

const httpServer = createServer(app)
const io = new Server(httpServer)

attachConnections(io, { config, seats: createSeats(config), log: logger })

const iot = createIot(io, {
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
      await new Promise<void>((resolve) => io.close(() => resolve()))
      httpServer.close(() => process.exit(0))
    })()
  })
}
