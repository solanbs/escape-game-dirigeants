import {EventEmitter} from 'node:events'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {createMpvAudio, type SpawnFn, type SpawnedProcess} from '../../src/devices/mpv.js'
import type {Logger} from '../../src/logger.js'

class FakeProcess extends EventEmitter implements SpawnedProcess {
  pid = 4242
  stderr = undefined

  kill = vi.fn((signal?: NodeJS.Signals) => {
    if (signal === 'SIGTERM' || signal === 'SIGKILL') {
      queueMicrotask(() => this.emit('close', null, signal))
    }
    return true
  })
}

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, {recursive: true, force: true})
  }
})

function setup(options: {device?: string; spawnProcess?: SpawnFn} = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'escape-audio-'))
  dirs.push(dir)
  writeFileSync(path.join(dir, 'alarm.mp3'), 'fake')
  writeFileSync(path.join(dir, 'ambiance.mp3'), 'fake')

  const children: FakeProcess[] = []
  const calls: Array<{command: string; args: readonly string[]}> = []
  const defaultSpawn: SpawnFn = (command, args) => {
    const child = new FakeProcess()
    children.push(child)
    calls.push({command, args})
    queueMicrotask(() => child.emit('spawn'))
    return child
  }
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  } as unknown as Logger

  const audio = createMpvAudio({
    audioDir: dir,
    device: options.device,
    logger,
    spawnProcess: options.spawnProcess ?? defaultSpawn,
  })

  return {audio, dir, children, calls, logger}
}

describe('devices/audio mpv', () => {
  it('construit la ligne de commande et expose l état de lecture', async () => {
    const {audio, dir, calls} = setup({device: 'alsa/hw:1,0'})

    await audio.play({track: 'alarm.mp3', volume: 80, loop: true})

    expect(calls).toHaveLength(1)
    expect(calls[0].command).toBe('mpv')
    expect(calls[0].args).toEqual([
      '--no-config',
      '--no-video',
      '--ao=alsa',
      '--audio-device=alsa/hw:1,0',
      '--volume=80',
      '--loop-file=inf',
      path.join(dir, 'alarm.mp3'),
    ])
    expect(audio.getState()).toEqual({
      track: 'alarm.mp3',
      volume: 80,
      loop: true,
      status: 'playing',
    })
  })

  it('applique volume 70 et loop-file=no par défaut, sans audio-device', async () => {
    const {audio, calls} = setup()

    await audio.play({track: 'ambiance.mp3'})

    expect(calls[0].args).not.toContain('--audio-device=alsa/default')
    expect(calls[0].args).toContain('--volume=70')
    expect(calls[0].args).toContain('--loop-file=no')
  })

  it('refuse un chemin de pistes échappant au dossier configuré', async () => {
    const {audio, calls} = setup()

    await expect(audio.play({track: '../secret.mp3'})).rejects.toThrow('invalid audio track')
    await expect(audio.play({track: '/etc/passwd'})).rejects.toThrow('invalid audio track')
    expect(calls).toHaveLength(0)
  })

  it('refuse une piste absente', async () => {
    const {audio} = setup()

    await expect(audio.play({track: 'inconnue.mp3'})).rejects.toThrow(
      'audio track not found: inconnue.mp3',
    )
    expect(audio.getState()).toBeNull()
  })

  it('arrête le processus lancé et efface l état', async () => {
    const {audio, children} = setup()

    await audio.play({track: 'alarm.mp3'})
    await audio.stop()

    expect(children[0].kill).toHaveBeenCalledWith('SIGTERM')
    expect(audio.getState()).toBeNull()
  })

  it('ignore la fermeture d un ancien processus après une nouvelle lecture', async () => {
    const {audio, children} = setup()

    await audio.play({track: 'alarm.mp3', loop: true})
    await audio.play({track: 'ambiance.mp3', loop: true})
    await new Promise((resolve) => setImmediate(resolve))

    children[0].emit('close', null, 'SIGTERM')
    expect(audio.getState()?.track).toBe('ambiance.mp3')
    expect(audio.getState()?.status).toBe('playing')

    children[1].emit('close', 0, null)
    expect(audio.getState()).toBeNull()
  })

  it('marque l état comme failed quand mpv ne démarre pas', async () => {
    const spawnProcess: SpawnFn = () => {
      throw new Error('spawn mpv ENOENT')
    }
    const {audio} = setup({spawnProcess})

    await expect(audio.play({track: 'alarm.mp3'})).rejects.toThrow('spawn mpv ENOENT')
    expect(audio.getState()).toMatchObject({track: 'alarm.mp3', status: 'failed'})
  })

  it('rejette une erreur émise avant le spawn effectif', async () => {
    const spawnProcess: SpawnFn = () => {
      const child = new FakeProcess()
      queueMicrotask(() => child.emit('error', new Error('permission refusée')))
      return child
    }
    const {audio} = setup({spawnProcess})

    await expect(audio.play({track: 'alarm.mp3'})).rejects.toThrow(
      'impossible de démarrer mpv: permission refusée',
    )
    expect(audio.getState()?.status).toBe('failed')
  })
})
