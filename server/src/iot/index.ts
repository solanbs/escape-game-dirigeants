import type {Server} from 'socket.io'
import {createSocketAdapter} from './socket-adapter.js'
import type {IotAdapter, IotDeps} from './socket-adapter.js'

export type {IotAdapter, IotDeps} from './socket-adapter.js'
export type {IotAdminPort} from './admin-port.js'
export type {
    IotCommandResult,
    IotPort,
    IotSnapshot,
    IotStatus,
    Unsubscribe,
} from './port.js'

export function createIot(io: Server, deps: IotDeps): IotAdapter {
    return createSocketAdapter(io, deps)
}
