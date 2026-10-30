import pino from 'pino'

const isProd = process.env.NODE_ENV === 'production'

/**
 * Logger unique du serveur.
 *
 * - prod : JSON sur stdout (capturé par Docker).
 * - dev  : même chose, formaté par pino-pretty (devDependency uniquement).
 *
 * Le niveau se règle avec LOG_LEVEL (debug par défaut en dev, info en prod).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
})
