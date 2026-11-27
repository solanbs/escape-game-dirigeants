import path from 'node:path'
import {describe, expect, it} from 'vitest'
import {readConfig} from '../src/config.js'

describe('readConfig', () => {
  it('exige un token', () => {
    expect(() => readConfig({})).toThrow('IOT_GATEWAY_TOKEN is required')
    expect(() => readConfig({IOT_GATEWAY_TOKEN: ''})).toThrow('IOT_GATEWAY_TOKEN is required')
  })

  it('applique les valeurs par défaut', () => {
    expect(readConfig({IOT_GATEWAY_TOKEN: 'secret'})).toEqual({
      gatewayId: 'gateway-local',
      serverUrl: 'http://localhost:3000',
      token: 'secret',
      version: '0.1.0',
      logLevel: 'debug',
      fakeInput: false,
      audio: {
        driver: 'fake',
        dir: path.resolve('audio'),
        device: undefined,
        command: 'mpv',
      },
      deviceHttp: {
        host: '0.0.0.0',
        port: 8080,
        token: undefined,
      },
      door: {driver: 'fake'},
      keypad: {driver: 'fake'},
    })
  })

  it('lit et nettoie les variables fournies', () => {
    const config = readConfig({
      IOT_GATEWAY_TOKEN: 'secret',
      IOT_GATEWAY_ID: '  gw-1  ',
      IOT_SERVER_URL: '  http://serveur:3000  ',
      IOT_GATEWAY_VERSION: '  2.0.0  ',
    })

    expect(config).toMatchObject({
      gatewayId: 'gw-1',
      serverUrl: 'http://serveur:3000',
      version: '2.0.0',
    })
  })

  it('ignore les valeurs vides et retire le niveau de log explicite', () => {
    const config = readConfig({
      IOT_GATEWAY_TOKEN: 'secret',
      IOT_GATEWAY_ID: '   ',
      IOT_SERVER_URL: '',
      IOT_GATEWAY_VERSION: '\t',
      LOG_LEVEL: 'info',
    })

    expect(config).toMatchObject({
      gatewayId: 'gateway-local',
      serverUrl: 'http://localhost:3000',
      version: '0.1.0',
      logLevel: 'info',
    })
  })

  it('choisit le niveau de log selon LOG_LEVEL et NODE_ENV', () => {
    expect(readConfig({IOT_GATEWAY_TOKEN: 't', LOG_LEVEL: 'debug'}).logLevel).toBe('debug')
    expect(readConfig({IOT_GATEWAY_TOKEN: 't', LOG_LEVEL: 'info'}).logLevel).toBe('info')
    expect(readConfig({IOT_GATEWAY_TOKEN: 't', NODE_ENV: 'production'}).logLevel).toBe('info')
    expect(readConfig({IOT_GATEWAY_TOKEN: 't', NODE_ENV: 'development'}).logLevel).toBe('debug')
    expect(
      readConfig({IOT_GATEWAY_TOKEN: 't', LOG_LEVEL: 'trace', NODE_ENV: 'production'}).logLevel,
    ).toBe('info')
  })

  it('n active les entrées factices que pour 1 ou true', () => {
    for (const value of ['1', 'true']) {
      expect(readConfig({IOT_GATEWAY_TOKEN: 't', IOT_FAKE_INPUT: value}).fakeInput).toBe(true)
    }

    for (const value of ['0', 'false', 'TRUE', 'yes', '']) {
      expect(readConfig({IOT_GATEWAY_TOKEN: 't', IOT_FAKE_INPUT: value}).fakeInput).toBe(false)
    }
  })

  it('lit la configuration audio du gateway', () => {
    const config = readConfig({
      IOT_GATEWAY_TOKEN: 't',
      IOT_AUDIO_DRIVER: ' mpv ',
      IOT_AUDIO_DIR: '  /audio/pistes  ',
      IOT_AUDIO_DEVICE: ' alsa/hw:1,0 ',
      IOT_AUDIO_COMMAND: ' /usr/bin/mpv ',
    })

    expect(config.audio).toEqual({
      driver: 'mpv',
      dir: '/audio/pistes',
      device: 'alsa/hw:1,0',
      command: '/usr/bin/mpv',
    })
  })

  it('laisse le device audio vide et refuse un driver inconnu', () => {
    expect(readConfig({IOT_GATEWAY_TOKEN: 't', IOT_AUDIO_DEVICE: '   '}).audio.device).toBeUndefined()
    expect(() => readConfig({IOT_GATEWAY_TOKEN: 't', IOT_AUDIO_DRIVER: 'bluetooth'})).toThrow(
      'IOT_AUDIO_DRIVER must be fake or mpv',
    )
  })

  it('lit la configuration du bus HTTP devices', () => {
    const config = readConfig({
      IOT_GATEWAY_TOKEN: 't',
      IOT_DEVICES_HTTP_HOST: ' 127.0.0.1 ',
      IOT_DEVICES_HTTP_PORT: ' 9090 ',
      IOT_DEVICE_TOKEN: ' secret-appareils ',
      IOT_DOOR_DRIVER: ' http ',
      IOT_KEYPAD_DRIVER: 'http',
    })

    expect(config.deviceHttp).toEqual({host: '127.0.0.1', port: 9090, token: 'secret-appareils'})
    expect(config.door).toEqual({driver: 'http'})
    expect(config.keypad).toEqual({driver: 'http'})
  })

  it('exige un jeton et un port valide dès qu un driver http est actif', () => {
    expect(() =>
      readConfig({IOT_GATEWAY_TOKEN: 't', IOT_DOOR_DRIVER: 'http'}),
    ).toThrow('IOT_DEVICE_TOKEN is required when a device driver is http')
    expect(() =>
      readConfig({IOT_GATEWAY_TOKEN: 't', IOT_KEYPAD_DRIVER: 'http'}),
    ).toThrow('IOT_DEVICE_TOKEN is required when a device driver is http')
    expect(() =>
      readConfig({IOT_GATEWAY_TOKEN: 't', IOT_DEVICES_HTTP_PORT: '70000'}),
    ).toThrow('IOT_DEVICES_HTTP_PORT must be an integer between 1 and 65535')
    expect(() => readConfig({IOT_GATEWAY_TOKEN: 't', IOT_DEVICES_HTTP_PORT: 'abc'})).toThrow(
      'IOT_DEVICES_HTTP_PORT must be an integer between 1 and 65535',
    )
  })

  it('refuse un driver de device inconnu', () => {
    expect(() => readConfig({IOT_GATEWAY_TOKEN: 't', IOT_DOOR_DRIVER: 'gpio'})).toThrow(
      'IOT_DOOR_DRIVER must be fake or http',
    )
    expect(() => readConfig({IOT_GATEWAY_TOKEN: 't', IOT_KEYPAD_DRIVER: 'mqtt'})).toThrow(
      'IOT_KEYPAD_DRIVER must be fake or http',
    )
  })
})
