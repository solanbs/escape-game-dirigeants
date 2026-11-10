import type { CueName, GatewayId, DeviceId, IotDeviceState } from '@escape/shared/iot'

export type Unsubscribe = () => void

// ---------------------------------------------------------------------------
// Événements exposés au jeu
// ---------------------------------------------------------------------------

export type DoorEvent = {
    deviceId: DeviceId
    state: 'open' | 'closed'
    at: number
}

// ---------------------------------------------------------------------------
// Requête/réponse clavier
// ---------------------------------------------------------------------------

export type CodeRequest = {
    deviceId: DeviceId
    code: string
    at: number
}

export type CodeResult = {
    accepted: boolean
    display: string
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
    onDoor(handler: (event: DoorEvent) => void): Unsubscribe
    // Requête/réponse : le clavier attend un résultat
    onCode(handler: (request: CodeRequest) => Promise<CodeResult>): Unsubscribe

    // Supervision
    getSnapshot(): IotSnapshot
    onGatewayStatus(handler: (status: IotStatus) => void): Unsubscribe
}
