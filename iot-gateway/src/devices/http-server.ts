import { timingSafeEqual } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { Logger } from '../logger.js'
import type { Unsubscribe } from './types.js'

/** Erreur avec un statut HTTP, pour distinguer les erreurs de payload des erreurs internes. */
export class HttpDeviceError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpDeviceError'
  }
}

export type DeviceEventHandler = (payload: Record<string, unknown>) => void

/**
 * Bus HTTP générique pour les devices (ESP32).
 *
 * Le serveur ne connaît aucun device : il route `POST /devices/:id/events`
 * vers les abonnements `(deviceId, type)` et garde un état par device pour
 * `GET /devices/:id/state`. Chaque driver enregistre son propre canal.
 */
export type DeviceHttpServer = {
  /** Port effectif, utile quand le port 0 est demandé (tests). */
  port: number
  /** Résolue quand le serveur écoute, rejetée si l'écoute échoue. */
  ready: Promise<void>
  onEvent(deviceId: string, type: string, handler: DeviceEventHandler): Unsubscribe
  setState(deviceId: string, state: unknown): void
  getState(deviceId: string): unknown
  /** Fermeture idempotente : plusieurs drivers peuvent partager le serveur. */
  close(): Promise<void>
}

export type DeviceHttpServerOptions = {
  host?: string
  port?: number
  token: string
  logger?: Logger
  maxBodyBytes?: number
}

function channelKey(deviceId: string, type: string): string {
  return JSON.stringify([deviceId, type])
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(data),
  })
  res.end(data)
}

function sameToken(actual: string, expected: string): boolean {
  const left = Buffer.from(actual)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

async function readJsonBody(req: IncomingMessage, maxBodyBytes: number): Promise<Record<string, unknown>> {
  const contentType = req.headers['content-type'] ?? ''
  if (typeof contentType !== 'string' || !contentType.toLowerCase().startsWith('application/json')) {
    throw new HttpDeviceError(415, 'content-type must be application/json')
  }

  const chunks: Buffer[] = []
  let size = 0

  const body = await new Promise<string>((resolve, reject) => {
    let settled = false

    req.on('data', (chunk: Buffer) => {
      if (settled) return
      size += chunk.length
      if (size > maxBodyBytes) {
        settled = true
        reject(new HttpDeviceError(413, 'body too large'))
        req.resume()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (settled) return
      settled = true
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', (err) => {
      if (settled) return
      settled = true
      reject(err)
    })
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    throw new HttpDeviceError(400, 'invalid JSON')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new HttpDeviceError(400, 'body must be a JSON object')
  }
  return parsed as Record<string, unknown>
}

function readType(body: Record<string, unknown>): string {
  if (typeof body.type !== 'string' || !body.type.trim()) {
    throw new HttpDeviceError(400, 'type is required')
  }
  return body.type.trim()
}

export function createDeviceHttpServer(options: DeviceHttpServerOptions): DeviceHttpServer {
  const host = options.host ?? '0.0.0.0'
  const port = options.port ?? 8080
  const maxBodyBytes = options.maxBodyBytes ?? 4096
  const logger = options.logger
  const handlers = new Map<string, Set<DeviceEventHandler>>()
  const states = new Map<string, unknown>()
  let closing: Promise<void> | null = null

  let resolveReady!: () => void
  let rejectReady!: (error: Error) => void
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })
  // Le serveur peut être créé sans que personne n'attende `ready` (production).
  void ready.catch(() => {})

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const header = req.headers['x-device-token']
    if (typeof header !== 'string' || !sameToken(header, options.token)) {
      throw new HttpDeviceError(401, 'unauthorized')
    }

    const parts = new URL(req.url ?? '/', 'http://localhost').pathname
      .split('/')
      .filter(Boolean)

    if (parts.length === 3 && parts[0] === 'devices' && parts[2] === 'events' && req.method === 'POST') {
      const deviceId = decodeURIComponent(parts[1])
      const body = await readJsonBody(req, maxBodyBytes)
      const type = readType(body)
      const registered = handlers.get(channelKey(deviceId, type))
      if (!registered?.size) {
        throw new HttpDeviceError(404, `unknown device event: ${deviceId}:${type}`)
      }

      const payload = { ...body }
      delete payload.type
      for (const handler of registered) handler(payload)

      sendJson(res, 202, { ok: true })
      return
    }

    if (parts.length === 3 && parts[0] === 'devices' && parts[2] === 'state' && req.method === 'GET') {
      const deviceId = decodeURIComponent(parts[1])
      if (!states.has(deviceId)) {
        throw new HttpDeviceError(404, `unknown device: ${deviceId}`)
      }
      sendJson(res, 200, { state: states.get(deviceId) })
      return
    }

    throw new HttpDeviceError(404, 'not found')
  }

  const server = createServer((req, res) => {
    void handle(req, res).catch((err: unknown) => {
      const status = err instanceof HttpDeviceError ? err.status : 500
      const message = err instanceof Error ? err.message : String(err)
      if (status === 500) {
        logger?.error({ err }, 'requête device HTTP impossible')
      }
      if (!res.headersSent) {
        sendJson(res, status, { error: message })
      } else {
        res.destroy()
      }
    })
  })

  server.on('error', (err) => {
    logger?.error({ err }, 'serveur HTTP devices en erreur')
    rejectReady(err)
  })
  server.listen(port, host, () => {
    const address = server.address()
    if (address && typeof address === 'object') api.port = address.port
    resolveReady()
  })

  const api: DeviceHttpServer = {
    port,
    ready,
    onEvent(deviceId, type, handler) {
      const key = channelKey(deviceId, type)
      let registered = handlers.get(key)
      if (!registered) {
        registered = new Set()
        handlers.set(key, registered)
      }
      registered.add(handler)
      return () => {
        registered.delete(handler)
        if (!registered.size) handlers.delete(key)
      }
    },
    setState(deviceId, state) {
      states.set(deviceId, state)
    },
    getState(deviceId) {
      return states.get(deviceId)
    },
    async close() {
      if (closing) return closing
      closing = (async () => {
        try {
          await ready
        } catch {
          return
        }
        await new Promise<void>((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()))
        })
      })()
      return closing
    },
  }

  return api
}
