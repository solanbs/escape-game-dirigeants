import pino from 'pino'

/**
 * Logger unique du serveur.
 *
 * Format lisible par défaut (dev comme prod) : c'est ce qu'on lit dans
 * `docker compose logs -f`. Pour retrouver du JSON brut (analyse, export),
 * lancer avec LOG_FORMAT=json.
 *
 * Niveau : LOG_LEVEL (debug par défaut en dev, info en prod).
 */

const isProd = process.env.NODE_ENV === 'production'
const asJson = process.env.LOG_FORMAT === 'json'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  transport: asJson
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: process.env.NO_COLOR === undefined,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
})
