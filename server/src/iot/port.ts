import type { CueName, GatewayId, IotDeviceState } from '@escape/shared/iot'

export type Unsubscribe = () => void

// ---------------------------------------------------------------------------
// Événements exposés au jeu
// ---------------------------------------------------------------------------

export type MotionEvent = {
    deviceId: string
    state: 'detected' | 'clear'
    at: number
}

export type DoorEvent = {
    deviceId: string
    state: 'open' | 'closed'
    at: number
}

export type AudioEvent = {
    deviceId: string
    state: 'started' | 'ended' | 'failed'
    track: string
    at: number
}

// ---------------------------------------------------------------------------
// Requête/réponse clavier
// ---------------------------------------------------------------------------

export type CodeRequest = {
    deviceId: string
    code: string
    at: number
}

export type CodeResult = {
    ok: boolean
    display: string
    cue?: CueName
    error?: string
}

// ---------------------------------------------------------------------------
// Supervision
// ---------------------------------------------------------------------------

export type IotCommandResult = {
    ok: boolean
    error?: string
}

export type IotStatus = {
    gatewayId: GatewayId
    online: boolean
    lastSeenAt: number
}

export type IotSnapshot = {
    gateways: Array<{
        id: GatewayId
        online: boolean
        lastSeenAt: number
        state: IotDeviceState
    }>
}

// ---------------------------------------------------------------------------
// Port
// ---------------------------------------------------------------------------

export interface IotPort {
    start(): Promise<void>
    stop(): Promise<void>

    // Commandes : le serveur attend un résultat
    cue(name: CueName): Promise<IotCommandResult>

    // Notifications : le matériel pousse un événement
    onDoorOpened(handler: (event: DoorEvent) => void): Unsubscribe
    // Requête/réponse : le clavier attend un résultat
    onCode(handler: (request: CodeRequest) => Promise<CodeResult>): Unsubscribe

    // Supervision
    getSnapshot(): IotSnapshot
    onStatus(handler: (status: IotStatus) => void): Unsubscribe
}