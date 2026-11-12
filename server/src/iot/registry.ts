import type {GatewayId, IotDeviceState, IotInputState, IotOutputState} from '@escape/shared/iot'
import type {IotSnapshot, IotStatus, Unsubscribe} from "./port.js";
import {logger} from "../logger.js";

export type GatewayEntry = {
    id: GatewayId
    socketId: string | null
    online: boolean
    lastSeenAt: number
    offlineAt?: number
    state: IotDeviceState
}

export type Registry = {
    markOnline(id: GatewayId, socketId: string, at: number, state: IotDeviceState): void
    markOffline(id: GatewayId, socketId: string, at: number): void
    touch(id: GatewayId, at: number): void
    setOutputState(id: GatewayId, output: IotOutputState): void
    setInputState(id: GatewayId, input: IotInputState): void
    setState(id: GatewayId, state: IotDeviceState): void
    get(id: GatewayId): GatewayEntry | undefined
    getOnline(): GatewayEntry[]
    snapshot(): IotSnapshot
    onStatus(handler: (status: IotStatus) => void): Unsubscribe // Call getSnapshot() to get initial state
}

function notifyStatus(status: IotStatus, statusHandlers: Set<(status: IotStatus) => void>) {
    for (const handler of statusHandlers) {
        try {
            handler(status)
        } catch (err) {
            logger.error({err}, 'Error in status handler')
        }
    }
}

function cloneState(state: IotDeviceState): IotDeviceState {
    return {
        ...state,
        audio: state.audio ? {...state.audio} : null,
    }
}

function cloneGatewayEntry(entry: GatewayEntry): GatewayEntry {
    return {
        ...entry,
        state: cloneState(entry.state),
    }
}

function setStateInternal(gateways: Map<GatewayId, GatewayEntry>, id: GatewayId, state: IotDeviceState) {
    const gateway = gateways.get(id)
    if (!gateway) return
    gateway.state = cloneState(state)
}

export function createRegistry(): Registry {
    const gateways = new Map<GatewayId, GatewayEntry>()
    const statusHandlers = new Set<(status: IotStatus) => void>()

    return {
        markOnline(id, socketId, at, state) {
            const gateway = gateways.get(id)
            const wasOnline = gateway?.online ?? false

            if (!gateway) {
                gateways.set(id, {
                    id,
                    socketId,
                    online: true,
                    lastSeenAt: at,
                    state: cloneState(state),
                })
            } else {
                gateway.socketId = socketId
                gateway.online = true
                gateway.lastSeenAt = at
                gateway.offlineAt = undefined
                gateway.state = cloneState(state)
            }
            if (!wasOnline) {
                notifyStatus({gatewayId: id, online: true, lastSeenAt: at}, statusHandlers)
            }
        },
        markOffline(id, socketId, at) {
            const gateway = gateways.get(id)

            if (!gateway || !gateway.online) return
            if (gateway.socketId !== socketId) return

            gateway.socketId = null
            gateway.online = false
            gateway.offlineAt = at

            notifyStatus({gatewayId: id, online: false, lastSeenAt: gateway.lastSeenAt}, statusHandlers)
        },
        touch(id, at) {
            const gateway = gateways.get(id)
            if (!gateway) return
            gateway.lastSeenAt = at
        },
        setOutputState(id, output) {
            const gateway = gateways.get(id)
            if (!gateway) return
            gateway.state = {
                lights: output.lights,
                audio: output.audio ? {...output.audio} : null,
                door: gateway.state.door,
            }
        },
        setInputState(id, input) {
            const gateway = gateways.get(id)
            if (!gateway) return
            gateway.state = {
                lights: gateway.state.lights,
                audio: gateway.state.audio,
                door: input.door,
            }
        },
        setState(id, state) {
            setStateInternal(gateways, id, state)
        },
        get(id) {
            const gateway = gateways.get(id)
            return gateway ? cloneGatewayEntry(gateway) : undefined
        },
        getOnline() {
            return Array.from(gateways.values()).filter(g => g.online).map(cloneGatewayEntry)
        },
        snapshot() {
            const snapshot: IotSnapshot = {
                gateways: Array.from(gateways.values()).map(g => ({
                    id: g.id,
                    online: g.online,
                    lastSeenAt: g.lastSeenAt,
                    offlineAt: g.offlineAt,
                    state: cloneState(g.state),
                })),
            }
            return snapshot
        },
        onStatus(handler) {
            statusHandlers.add(handler)
            return () => {
                statusHandlers.delete(handler)
            }
        }
    }
}
