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
})
