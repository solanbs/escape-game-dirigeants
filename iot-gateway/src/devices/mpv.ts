import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { IotAudioRequest, IotAudioState } from '@escape/shared/iot'
import type { Logger } from '../logger.js'
import type { AudioDevice } from './types.js'

/** Surface minimale de ChildProcess utilisée par le driver (facile à simuler en test). */
export type SpawnedProcess = {
  pid?: number
  kill(signal?: NodeJS.Signals): boolean
  once(event: 'spawn', listener: () => void): SpawnedProcess
  once(event: 'error', listener: (error: Error) => void): SpawnedProcess
  once(
    event: 'close',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void,
  ): SpawnedProcess
  on(event: 'error', listener: (error: Error) => void): SpawnedProcess
  on(
    event: 'close',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void,
  ): SpawnedProcess
  removeListener(event: string, listener: (...args: any[]) => void): SpawnedProcess
  stderr?: { on(event: 'data', listener: (chunk: Buffer) => void): unknown } | null
}

export type SpawnFn = (command: string, args: readonly string[]) => SpawnedProcess

export type MpvAudioOptions = {
  audioDir: string
  command?: string
  device?: string
  logger?: Logger
  spawnProcess?: SpawnFn
}

function assertAudio(request: IotAudioRequest): void {
  if (!request.track.trim()) throw new Error('track is required')
  if (
    request.volume !== undefined &&
    (!Number.isFinite(request.volume) || request.volume < 0 || request.volume > 100)
  ) {
    throw new Error('volume must be between 0 and 100')
  }
}

/** Le track est un nom de fichier, jamais un chemin fourni par le serveur. */
function resolveTrack(audioDir: string, track: string): string {
  if (path.isAbsolute(track) || path.basename(track) !== track || track.includes('\\')) {
    throw new Error('invalid audio track')
  }

  const dir = path.resolve(audioDir)
  const file = path.resolve(dir, track)
  if (!file.startsWith(`${dir}${path.sep}`)) {
    throw new Error('invalid audio track')
  }
  if (!existsSync(file)) {
    throw new Error(`audio track not found: ${track}`)
  }
  return file
}

function waitForSpawn(child: SpawnedProcess): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    function cleanup(): void {
      child.removeListener('spawn', onSpawn)
      child.removeListener('error', onError)
    }
    function onSpawn(): void {
      cleanup()
      resolve()
    }
    function onError(error: Error): void {
      cleanup()
      reject(error)
    }

    child.once('spawn', onSpawn)
    child.once('error', onError)
  })
}

function observeClose(child: SpawnedProcess): { promise: Promise<void>; isClosed(): boolean } {
  let closed = false

  const promise = new Promise<void>((resolve) => {
    function done(): void {
      closed = true
      child.removeListener('close', done)
      child.removeListener('error', done)
      resolve()
    }

    child.once('close', done)
    child.once('error', done)
  })

  return { promise, isClosed: () => closed }
}

function makeState(request: IotAudioRequest, status: IotAudioState['status']): IotAudioState {
  return {
    track: request.track,
    volume: request.volume ?? 70,
    loop: request.loop ?? false,
    status,
  }
}

/**
 * Lecteur audio pour une enceinte filaire/USB : mpv est lancé en ALSA direct,
 * sans configuration utilisateur, et reste attaché au seul processus créé.
 */
export function createMpvAudio(options: MpvAudioOptions): AudioDevice {
  const command = options.command ?? 'mpv'
  const audioDir = options.audioDir
  const logger = options.logger
  const spawnProcess: SpawnFn =
    options.spawnProcess ??
    ((cmd, args) => spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] }))

  let audio: IotAudioState | null = null
  let child: SpawnedProcess | null = null
  let generation = 0

  async function stop(): Promise<void> {
    generation += 1
    const current = child
    child = null
    audio = null
    if (!current) return

    const close = observeClose(current)
    try {
      current.kill('SIGTERM')
    } catch {
      // Le processus est déjà terminé.
    }

    const forceKill = setTimeout(() => {
      if (!close.isClosed()) {
        try {
          current.kill('SIGKILL')
        } catch {
          // Rien à faire, le processus est parti entre-temps.
        }
      }
    }, 1000)

    try {
      await close.promise
    } finally {
      clearTimeout(forceKill)
    }
  }

  return {
    async play(request: IotAudioRequest) {
      assertAudio(request)
      const file = resolveTrack(audioDir, request.track)

      await stop()
      const token = generation

      const args = ['--no-config', '--no-video', '--ao=alsa']
      if (options.device) args.push(`--audio-device=${options.device}`)
      args.push(`--volume=${request.volume ?? 70}`)
      args.push(`--loop-file=${request.loop ? 'inf' : 'no'}`)
      args.push(file)

      logger?.debug({ command, args, track: request.track }, 'lance mpv')

      let next: SpawnedProcess
      try {
        next = spawnProcess(command, args)
      } catch (err) {
        audio = makeState(request, 'failed')
        throw err
      }
      child = next

      try {
        await waitForSpawn(next)
      } catch (err) {
        if (token === generation) {
          child = null
          audio = makeState(request, 'failed')
        }
        const message = err instanceof Error ? err.message : String(err)
        throw new Error(`impossible de démarrer ${command}: ${message}`)
      }

      next.once('error', (err) => {
        if (token !== generation) return
        logger?.error({ err, track: request.track }, 'mpv en erreur')
        child = null
        audio = makeState(request, 'failed')
      })
      next.once('close', () => {
        if (token !== generation) return
        child = null
        audio = null
      })
      next.stderr?.on('data', (chunk) => {
        const output = chunk.toString().trim()
        if (output) logger?.debug({ output }, 'mpv')
      })

      audio = makeState(request, 'playing')
    },

    async stop() {
      await stop()
    },

    getState() {
      return audio ? { ...audio } : null
    },

    async close() {
      await stop()
    },
  }
}
