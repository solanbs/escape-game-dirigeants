import {afterEach, describe, expect, it, vi} from 'vitest'
import {createHttpDoor} from '../../src/devices/door-http.js'
import {createDeviceHttpServer, type DeviceHttpServer} from '../../src/devices/http-server.js'
import {createHttpKeypad} from '../../src/devices/keypad-http.js'
import {makeLogger} from '../helpers.js'

const servers: DeviceHttpServer[] = []

async function setup() {
  const logger = makeLogger()
  const server = createDeviceHttpServer({host: '127.0.0.1', port: 0, token: 'secret', logger})
  servers.push(server)
  await server.ready
  const base = `http://127.0.0.1:${server.port}`
  return {base, logger, server, door: createHttpDoor({server, logger}), keypad: createHttpKeypad({server, logger})}
}

function send(base: string, deviceId: string, body: unknown) {
  return fetch(`${base}/devices/${deviceId}/events`, {
    method: 'POST',
    headers: {'content-type': 'application/json', 'x-device-token': 'secret'},
    body: JSON.stringify(body),
  })
}

afterEach(async () => {
  for (const server of servers.splice(0)) {
    await server.close()
  }
})

describe('devices/http door', () => {
  it('notifie les changements et conserve le dernier état', async () => {
    const {base, door} = await setup()
    const handler = vi.fn()
    door.onChange(handler)

    expect(door.getState()).toBe('closed')

    const opened = await send(base, 'door-main', {type: 'door', state: 'open'})
    expect(opened.status).toBe(202)
    expect(door.getState()).toBe('open')
    expect(handler).toHaveBeenCalledExactlyOnceWith('open')

    await send(base, 'door-main', {type: 'door', state: 'open'})
    expect(handler).toHaveBeenCalledTimes(1)

    await send(base, 'door-main', {type: 'door', state: 'closed'})
    expect(door.getState()).toBe('closed')
    expect(handler).toHaveBeenLastCalledWith('closed')
  })

  it('refuse un état invalide', async () => {
    const {base, door} = await setup()
    const handler = vi.fn()
    door.onChange(handler)

    const res = await send(base, 'door-main', {type: 'door', state: 'entrouvert'})

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({error: 'state must be open or closed'})
    expect(door.getState()).toBe('closed')
    expect(handler).not.toHaveBeenCalled()
  })

  it('permet de se désabonner', async () => {
    const {base, door} = await setup()
    const handler = vi.fn()
    const unsubscribe = door.onChange(handler)

    unsubscribe()
    await send(base, 'door-main', {type: 'door', state: 'open'})

    expect(handler).not.toHaveBeenCalled()
    expect(door.getState()).toBe('open')
  })
})

describe('devices/http keypad', () => {
  it('transmet les codes reçus', async () => {
    const {base, keypad} = await setup()
    const handler = vi.fn()
    keypad.onCode(handler)

    const res = await send(base, 'keypad-main', {type: 'code', code: ' 1234 '})

    expect(res.status).toBe(202)
    expect(handler).toHaveBeenCalledExactlyOnceWith('1234')
  })

  it('refuse un code vide et n appelle pas les handlers', async () => {
    const {base, keypad} = await setup()
    const handler = vi.fn()
    keypad.onCode(handler)

    const res = await send(base, 'keypad-main', {type: 'code', code: '   '})

    expect(res.status).toBe(400)
    expect(handler).not.toHaveBeenCalled()
  })

  it('ne transmet pas l affichage au device mais n échoue pas', async () => {
    const {logger, keypad} = await setup()

    await expect(keypad.display('ACCÉDÉ')).resolves.toBeUndefined()
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({text: 'ACCÉDÉ'}),
      'affichage clavier (non transmis au device)',
    )
  })
})
