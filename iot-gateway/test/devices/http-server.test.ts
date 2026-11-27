import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  createDeviceHttpServer,
  type DeviceHttpServer,
  type DeviceHttpServerOptions,
} from '../../src/devices/http-server.js'

const servers: DeviceHttpServer[] = []

async function setup(options: Partial<DeviceHttpServerOptions> = {}) {
  const server = createDeviceHttpServer({
    host: '127.0.0.1',
    port: 0,
    token: 'secret',
    ...options,
  })
  servers.push(server)
  await server.ready
  return {server, base: `http://127.0.0.1:${server.port}`}
}

function post(
  base: string,
  path: string,
  body: unknown,
  options: {token?: string; contentType?: string} = {},
) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'content-type': options.contentType ?? 'application/json',
      'x-device-token': options.token ?? 'secret',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

afterEach(async () => {
  for (const server of servers.splice(0)) {
    await server.close()
  }
})

describe('devices/http-server', () => {
  it('exige le jeton partagé sur toutes les routes', async () => {
    const {base} = await setup()

    const missing = await fetch(`${base}/devices/keypad-main/state`)
    expect(missing.status).toBe(401)

    const wrong = await post(base, '/devices/keypad-main/events', {type: 'code', code: '1234'}, {
      token: 'mauvais',
    })
    expect(wrong.status).toBe(401)
    expect(await wrong.json()).toEqual({error: 'unauthorized'})
  })

  it('route un événement vers le bon device et le bon type', async () => {
    const {base, server} = await setup()
    const keypad = vi.fn()
    const door = vi.fn()
    const offKeypad = server.onEvent('keypad-main', 'code', keypad)
    const offDoor = server.onEvent('door-main', 'door', door)

    const res = await post(base, '/devices/keypad-main/events', {type: 'code', code: '1234'})

    expect(res.status).toBe(202)
    expect(await res.json()).toEqual({ok: true})
    expect(keypad).toHaveBeenCalledWith({code: '1234'})
    expect(door).not.toHaveBeenCalled()

    offKeypad()
    offDoor()
    await post(base, '/devices/keypad-main/events', {type: 'code', code: '9999'})
    expect(keypad).toHaveBeenCalledTimes(1)
  })

  it('refuse un device, un type ou une route inconnus', async () => {
    const {base, server} = await setup()
    server.onEvent('keypad-main', 'code', vi.fn())

    const unknownDevice = await post(base, '/devices/inconnu/events', {type: 'code', code: '1'})
    const unknownType = await post(base, '/devices/keypad-main/events', {type: 'mouvement'})
    const unknownRoute = await fetch(`${base}/autre`, {
      headers: {'x-device-token': 'secret'},
    })

    expect(unknownDevice.status).toBe(404)
    expect(unknownType.status).toBe(404)
    expect(unknownRoute.status).toBe(404)
  })

  it('valide le corps des requêtes', async () => {
    const {base} = await setup()

    const invalidJson = await post(base, '/devices/keypad-main/events', '{')
    const invalidShape = await post(base, '/devices/keypad-main/events', ['code'])
    const missingType = await post(base, '/devices/keypad-main/events', {code: '1234'})
    const wrongContentType = await post(base, '/devices/keypad-main/events', {type: 'code'}, {
      contentType: 'text/plain',
    })
    const tooLarge = await post(base, '/devices/keypad-main/events', {
      type: 'code',
      code: 'x'.repeat(5000),
    })

    expect(invalidJson.status).toBe(400)
    expect(invalidShape.status).toBe(400)
    expect(missingType.status).toBe(400)
    expect(wrongContentType.status).toBe(415)
    expect(tooLarge.status).toBe(413)
  })

  it('expose un état générique par device', async () => {
    const {base, server} = await setup()
    server.setState('door-main', {connected: true})

    const res = await fetch(`${base}/devices/door-main/state`, {
      headers: {'x-device-token': 'secret'},
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({state: {connected: true}})
    expect(server.getState('door-main')).toEqual({connected: true})

    const unknown = await fetch(`${base}/devices/inconnu/state`, {
      headers: {'x-device-token': 'secret'},
    })
    expect(unknown.status).toBe(404)
  })

  it('ferme le serveur plusieurs fois sans erreur', async () => {
    const {server} = await setup()
    await expect(server.close()).resolves.toBeUndefined()
    await expect(server.close()).resolves.toBeUndefined()
  })
})
