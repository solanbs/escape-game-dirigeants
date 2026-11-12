import {
    CodeRequest,
    CodeResult,
    DoorEvent,
    IotCommandResult,
    IotPort,
    IotSnapshot,
    IotStatus,
    Unsubscribe
} from "./port.js";
import {
    CommandId,
    CueName, GatewayId,
    IOT_EVENTS,
    IOT_NAMESPACE, IotCommand,
    IotCommandAck,
    IotDeviceState,
    IotEvent,
    IotHello,
    IotWelcome
} from "@escape/shared/iot";
import {Namespace, Server, Socket} from "socket.io";
import {createRegistry} from "./registry.js";
import {logger} from "../logger.js";
import {randomUUID} from "node:crypto";

type PendingCommand = {
    commandId: CommandId
    gatewayId: GatewayId
    command: IotCommand
    resolve: (ack: IotCommandAck) => void
    reject: (error: Error) => void
    timer: NodeJS.Timeout
    sentAt: number
}

export class socketAdapter implements IotPort {
    private iot: Namespace
    private readonly registry= createRegistry()
    private readonly sockets = new Map<GatewayId, Socket>
    private readonly pending = new Map<CommandId, PendingCommand>
    private readonly doorHandlers = new Set<(event: DoorEvent) => void>
    private codeHandler?: (request: CodeRequest) => Promise<CodeResult>

    private started: boolean = false

    constructor(io: Server) {
        this.iot = io.of(IOT_NAMESPACE)
        this.iot.use(this.authenticate)
    }

    cue(name: CueName): Promise<IotCommandResult> {
        const iotCommandResult: IotCommandResult = {ok: true}
        return Promise.resolve(iotCommandResult);
    }

    getSnapshot(): IotSnapshot {
        return this.registry.snapshot()
    }

    onCode(handler: (request: CodeRequest) => Promise<CodeResult>): Unsubscribe {
        if (this.codeHandler) {
            throw new Error("onCode handler already registered")
        }
        this.codeHandler = handler
        return () => {
            if (this.codeHandler === handler) {
                this.codeHandler = undefined
            }
        }
    }

    onDoor(handler: (event: DoorEvent) => void): Unsubscribe {
        this.doorHandlers.add(handler)
        return () => {
            this.doorHandlers.delete(handler)
        }
    }

    onGatewayStatus(handler: (status: IotStatus) => void): Unsubscribe {
        return this.registry.onStatus(handler)
    }

    private handleHello(socket: Socket, hello: IotHello) {
        if (hello.gatewayId && hello.at && hello.state) {
            logger.info({socketId: socket.id, gatewayId: hello.gatewayId}, "Gateway connected")
            const currentEntry = this.registry.get(hello.gatewayId)
            let lastState
            if (currentEntry) {
                lastState = {lights: currentEntry.state.lights, audio: currentEntry.state.audio}
            }
            this.registry.markOnline(hello.gatewayId, socket.id, hello.at, hello.state)
            const iotWelcome: IotWelcome = {
                sessionId: randomUUID(),
                desiredState: lastState ?? {lights: null, audio: null},
                at: Date.now()
            }
            socket.emit(IOT_EVENTS.WELCOME, iotWelcome)
            this.sockets.set(hello.gatewayId, socket)
        }
    }

    private handleCommandAck(socket: Socket, ack: IotCommandAck) {
        logger.debug({socketId: socket.id, ack}, "Command ACK received")
    }

    private async handleEvent(socket: Socket, event: IotEvent) {
        logger.debug({socketId: socket.id, event}, "Event received")
    }

    private handleState(socket: Socket, state: IotDeviceState) {
        logger.debug({socketId: socket.id, state}, "State received")
    }

    private handleDisconnect(socket: Socket, reason: string) {
        const gatewayId = this.registry.getGatewayId(socket.id)
        if (gatewayId) {
            logger.info({socketId: socket.id, gatewayId, reason}, "Gateway disconnected")
            this.sockets.delete(gatewayId)
            this.registry.markOffline(gatewayId, socket.id, Date.now())
        }
    }

    private authenticate(socket: Socket, next: (err?: any) => void) {
        const token = socket.handshake.auth.token
        if (token !== process.env.IOT_GATEWAY_TOKEN) {
            next(new Error('Authentication error'))
            return
        }
        next()
    }

    private onConnection(socket: Socket) {
        logger.debug({socketId: socket.id}, "Gateway connected on /iot")

        socket.on(IOT_EVENTS.HELLO, (hello: IotHello) => this.handleHello(socket, hello))
        socket.on(IOT_EVENTS.COMMAND_ACK, (ack: IotCommandAck) => this.handleCommandAck(socket, ack))
        socket.on(IOT_EVENTS.EVENT, (event: IotEvent) => this.handleEvent(socket, event))
        socket.on(IOT_EVENTS.STATE, (state: IotDeviceState) => this.handleState(socket, state))

        socket.on('disconnect', (reason) => this.handleDisconnect(socket, reason))
    }

    start(): Promise<void> {
        if (this.started) return Promise.resolve(undefined);
        this.started = true
        logger.debug(`socket.io server started on namespace ${IOT_NAMESPACE}`)

        this.iot.on('connection', this.onConnection)

        return Promise.resolve(undefined);
    }

    private rejectAllPendingCommands(error: Error) {

    }

    async  stop(): Promise<void> {
        if (!this.started) return Promise.resolve(undefined);
        this.started = false
        this.iot.removeAllListeners('connection')
        this.iot.disconnectSockets(true)
        this.rejectAllPendingCommands(new Error('iot adapter stopped'))
        this.doorHandlers.clear()
        this.codeHandler = undefined
        return Promise.resolve(undefined);
    }

}