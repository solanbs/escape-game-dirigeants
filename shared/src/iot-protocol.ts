/**
 * Contrat filaire entre le serveur et l'iot-gateway.
 */

export const IOT_NAMESPACE = '/iot'

export const IOT_EVENTS = {
    HELLO: 'iot:hello',
    WELCOME: 'iot:welcome',
    COMMAND: 'iot:command',
    ACK: 'iot:ack',
    EVENT: 'iot:event',
    STATE: 'iot:state',
    STATUS: 'iot:status',
} as const

export type CommandId = string
export type EventId = string
export type GatewayId = string
export type DeviceId = string

export type CueName =
    | 'alarm'
    | 'alarm-off'
    | 'success'
    | 'intrusion'
    | 'ambiance'

// ---------------------------------------------------------------------------
// Commandes serveur → gateway
// ---------------------------------------------------------------------------

export type IotCommand =
    | { commandId: CommandId; type: 'cue'; cue: CueName }
    | { commandId: CommandId; type: 'light'; action: 'on' | 'off' | 'scene'; scene?: string }
    | { commandId: CommandId; type: 'audio'; action: 'play' | 'stop'; track?: string; volume?: number; loop?: boolean }
    | { commandId: CommandId; type: 'relay'; action: 'on' | 'off' }

export type IotAck = {
    commandId: CommandId
    ok: boolean
    state?: IotDeviceState
    error?: string
}

// ---------------------------------------------------------------------------
// Événements gateway → serveur
// ---------------------------------------------------------------------------

export type IotEvent =
    | { eventId: EventId; type: 'motion'; deviceId: DeviceId; state: 'detected' | 'clear'; at: number }
    | { eventId: EventId; type: 'door'; deviceId: DeviceId; state: 'open' | 'closed'; at: number }
    | { eventId: EventId; type: 'code'; deviceId: DeviceId; code: string; at: number }
    | { eventId: EventId; type: 'audio'; deviceId: DeviceId; state: 'started' | 'ended' | 'failed'; track: string; at: number }

// ---------------------------------------------------------------------------
// État et cycle de vie
// ---------------------------------------------------------------------------

export type IotDeviceState = {
    lights: string | null
    audio: string | null
    relay: 'on' | 'off'
    lastMotionAt: number | null
}

export type IotStateReport = {
    gatewayId: GatewayId
    state: IotDeviceState
    at: number
}

export type IotHello = {
    gatewayId: GatewayId
    version: string
    devices: DeviceId[]
    state: IotDeviceState
    at: number
}

export type IotWelcome = {
    sessionId: string
    desiredState: IotDeviceState
    at: number
}

export type IotGatewayStatus = {
    gatewayId: GatewayId
    online: boolean
    lastSeenAt: number
}