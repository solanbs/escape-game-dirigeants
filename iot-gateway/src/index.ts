import { createInterface } from 'node:readline'
import { readConfig } from './config.js'
import type { FakeDoorSensor, FakeKeypad } from './devices/fake.js'
import { createDevices } from './devices/index.js'
import { createGateway } from './gateway.js'
import { createLogger } from './logger.js'
import { createState } from './state.js'
import { createSocketTransport } from './transport/socket.js'

type ShutdownReason = NodeJS.Signals | 'error'

const config = readConfig()
const logger = createLogger(config.logLevel)
const devices = createDevices(config, logger)
const state = createState(devices)
const transport = createSocketTransport(config, logger)
const gateway = createGateway({ config, transport, devices, state, logger })

let shuttingDown = false

async function shutdown(reason: ShutdownReason): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true

  logger.info({ reason }, 'arrêt en cours')

  const forceExit = setTimeout(() => {
    logger.error('arrêt forcé')
    process.exit(1)
  }, 3000)
  forceExit.unref()

  try {
    await gateway.stop()
    clearTimeout(forceExit)
    process.exit(0)
  } catch (err) {
    logger.error({ err }, 'échec de l’arrêt')
    process.exit(1)
  }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown(signal)
  })
}

if (config.fakeInput) {
  const rl = createInterface({
    input: process.stdin,
    terminal: Boolean(process.stdin.isTTY),
  })

  rl.on('line', (line) => {
    const value = line.trim()

    if (value === 'door' && 'toggle' in devices.door) {
      ;(devices.door as FakeDoorSensor).toggle()
      return
    }

    if (value.startsWith('code:') && 'pushCode' in devices.keypad) {
      ;(devices.keypad as FakeKeypad).pushCode(value.slice('code:'.length).trim())
      return
    }

    logger.info('commandes stdin : door | code:1234')
  })

  logger.info('entrées factices activées : door | code:1234')
}

await gateway.start()
