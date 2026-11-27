import {createServer} from 'node:net'
import {describe, expect, it, vi} from 'vitest'
import {createDevices} from '../../src/devices/index.js'
import {makeConfig, makeLogger} from '../helpers.js'

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      if (!address || typeof address === 'string') {
        probe.close()
        reject(new Error('port introuvable'))
        return
      }
      probe.close(() => resolve(address.port))
    })
  })
}

async function postCode(port: number, code: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      return await fetch(`http://127.0.0.1:${port}/devices/keypad-main/events`, {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-device-token': 'secret'},
        body: JSON.stringify({type: 'code', code}),
      })
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
  throw new Error('serveur HTTP devices jamais prêt')
}

describe('devices/index', () => {
  it('garde les entrées factices par défaut', () => {
    const devices = createDevices(makeConfig(), makeLogger())

    expect('toggle' in devices.door).toBe(true)
    expect('pushCode' in devices.keypad).toBe(true)
  })

  it('branche porte et clavier sur un seul bus HTTP', async () => {
    const port = await freePort()
    const logger = makeLogger()
    const devices = createDevices(
      makeConfig({
        deviceHttp: {host: '127.0.0.1', port, token: 'secret'},
        door: {driver: 'http'},
        keypad: {driver: 'http'},
      }),
      logger,
    )
    const codes: string[] = []
    const states: string[] = []
    devices.keypad.onCode((code) => codes.push(code))
    devices.door.onChange((state) => states.push(state))

    try {
      const res = await postCode(port, '1234')
      expect(res.status).toBe(202)
      expect(codes).toEqual(['1234'])

      const doorRes = await fetch(`http://127.0.0.1:${port}/devices/door-main/events`, {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-device-token': 'secret'},
        body: JSON.stringify({type: 'door', state: 'open'}),
      })
      expect(doorRes.status).toBe(202)
      expect(states).toEqual(['open'])
      expect(devices.door.getState()).toBe('open')
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled()
    } finally {
      await devices.door.close?.()
      await devices.keypad.close?.()
    }
  })

  it('n accepte pas un driver http sans jeton', () => {
    expect(() =>
      createDevices(
        makeConfig({door: {driver: 'http'}, deviceHttp: {host: '127.0.0.1', port: 8080}}),
        makeLogger(),
      ),
    ).toThrow('IOT_DEVICE_TOKEN is required when a device driver is http')
  })
})
