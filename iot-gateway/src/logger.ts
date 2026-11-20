import pino, { type Logger as PinoLogger } from 'pino'
import type { LogLevel } from './config.js'

export type Logger = PinoLogger

/**
 * Logger du gateway, aligné sur celui du serveur.
 *
 * Format lisible par défaut (dev comme prod) : c'est ce qu'on lit dans
 * `docker compose logs -f`. Pour retrouver du JSON brut (analyse, export),
 * lancer avec LOG_FORMAT=json.
 */
export function createLogger(level: LogLevel): Logger {
  const asJson = process.env.LOG_FORMAT === 'json'

  return pino({
    level,
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
}
