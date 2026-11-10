/**
 * Contrat filaire entre le serveur et l'iot-gateway.
 */

export const IOT_NAMESPACE = '/iot'

export const IOT_EVENTS = {
    HELLO: 'iot:hello',
    WELCOME: 'iot:welcome',
    COMMAND: 'iot:command',
    COMMAND_ACK: 'iot:command-ack',
    EVENT: 'iot:event',
    EVENT_ACK: 'iot:event-ack',
    STATE: 'iot:state',
} as const

export type CommandId = string
export type EventId = string
export type GatewayId = string
export type DeviceId = string

export type CueName =
    | 'alarm'
    | 'alarm-off'
    | 'success'
    | 'failure'
    | 'ambiance'

/** volume : 0-100 */
export type IotAudioRequest = {
    track: string
    volume?: number
    loop?: boolean
}

export type IotAudioState = {
    track: string
    volume: number
    loop: boolean
    status: 'stopped' | 'playing' | 'failed'
}

// ---------------------------------------------------------------------------
// Commandes serveur → gateway
// ---------------------------------------------------------------------------

export type IotCommand =
    | { commandId: CommandId; type: 'cue'; cue: CueName }
    | { commandId: CommandId; type: 'light'; action: 'on' | 'off' }
    | { commandId: CommandId; type: 'light'; action: 'scene'; scene: string }
    | {
        commandId: CommandId
        type: 'audio'
        action: 'play'
        audio: IotAudioRequest
    }
    | { commandId: CommandId; type: 'audio'; action: 'stop' }

export type IotCommandAck =
    | {
    commandId: CommandId
    ok: true
    outputs: IotOutputState
}
    | {
    commandId: CommandId
    ok: false
    error: string
    outputs?: IotOutputState
}

// ---------------------------------------------------------------------------
// Événements gateway → serveur
// ---------------------------------------------------------------------------

export type IotEvent =
    | { eventId: EventId; type: 'door'; deviceId: DeviceId; state: 'open' | 'closed'; at: number }
    | { eventId: EventId; type: 'code'; deviceId: DeviceId; code: string; at: number }

export type IotEventAck =
    | {
    eventId: EventId
    ok: true
    result: {
        type: 'code'
        accepted: boolean
        display: string
    }
}
    | {
    eventId: EventId
    ok: false
    error: string
}

// ---------------------------------------------------------------------------
// État et cycle de vie
// ---------------------------------------------------------------------------

export type IotOutputState = {
    lights: string | null
    audio: IotAudioState | null
}

export type IotInputState = {
    door: 'open' | 'closed'
}

export type IotDeviceState = IotOutputState & IotInputState

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

export type IotDesiredState = {
    lights: string | null
    audio: IotAudioRequest | null
}

export type IotWelcome = {
    sessionId: string
    desiredState: IotDesiredState
    at: number
}
