import type {
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
    IOT_EVENTS,
    IOT_NAMESPACE,
} from "@escape/shared/iot";
import type {
    CommandId,
    CueName,
    GatewayId,
    IotCommand,
    IotCommandAck,
    IotCommandPayload,
    IotDesiredState,
    IotDeviceState,
    IotEvent,
    IotHello,
    IotWelcome
} from "@escape/shared/iot";
import type {Namespace, Server, Socket} from "socket.io";
import {createRegistry} from "./registry.js";
import {CUES} from "./cues.js";
import {logger} from "../logger.js";
import {randomUUID} from "node:crypto";
import type {IotAdminPort} from "./admin-port.js";

type PendingCommand = {
    commandId: CommandId
    gatewayId: GatewayId
    command: IotCommand
    resolve: (ack: IotCommandAck) => void
    reject: (error: Error) => void
    timer: NodeJS.Timeout
    sentAt: number
}

export type IotDeps = {
    getDesiredState: () => IotDesiredState
    getSessionId: () => string
}

export type IotAdapter = {
    port: IotPort
    admin: IotAdminPort
}

export function createSocketAdapter(
    io: Server,
    deps: IotDeps,
): IotAdapter {
    const iot: Namespace = io.of(IOT_NAMESPACE)
    const registry = createRegistry()
    const sockets = new Map<GatewayId, Socket>()
    const pending = new Map<CommandId, PendingCommand>()

    const doorHandlers = new Set<(event: DoorEvent) => void>()
    let codeHandler: ((request: CodeRequest) => Promise<CodeResult>) | undefined

    let started: boolean = false

    function sendCommand(gatewayId: GatewayId, command: IotCommand, timeoutMs = 5000): Promise<IotCommandAck> {
        const socket = sockets.get(gatewayId)
        if (!socket) {
            return Promise.reject(new Error(`Gateway ${gatewayId} is offline`))
        }

        return new Promise<IotCommandAck>((resolve, reject) => {
            const timer = setTimeout(() => {
                pending.delete(command.commandId)
                reject(new Error(`Command ${command.commandId} timed out`))
            }, timeoutMs)

            pending.set(command.commandId, {
                commandId: command.commandId,
                gatewayId,
                command,
                resolve,
                reject,
                timer,
                sentAt: Date.now()
            })

            try {
                socket.emit(IOT_EVENTS.COMMAND, command)
            } catch (err) {
                clearTimeout(timer)
                pending.delete(command.commandId)
                reject(err)
            }
        })
    }

    function getMainGatewayId(): GatewayId | undefined {
        for (const [gatewayId, socket] of sockets) {
            if (socket) {
                return gatewayId
            }
        }
        return undefined
    }

    async function execute(command: IotCommandPayload): Promise<IotCommandResult> {
        const gatewayId = getMainGatewayId()
        if (!gatewayId) {
            return {ok: false, error: "No gateway connected"}
        }

        const fullCommand = {
            ...command,
            commandId: randomUUID(),
        } as IotCommand

        try {
            await sendCommand(gatewayId, fullCommand)
            return {ok: true}
        } catch (error) {
            return {
                ok: false,
                error: (error instanceof Error ? error.message : String(error))
            }
        }
    }

    async function cue(name: CueName): Promise<IotCommandResult> {
        const commands = CUES[name]
        if (!commands) {
            return {ok: false, error: `Unknown cue: ${name}`}
        }

        const results = await Promise.all(commands.map((command) => execute(command)))
        const failure = results.find((result) => !result.ok)

        if (failure) {
            return {
                ok: false,
                error: `Cue ${name}: ${failure.error ?? "unknown error"}`
            }
        }

        return {ok: true}
    }

    function getSnapshot(): IotSnapshot {
        return registry.snapshot()
    }

    function onCode(handler: (request: CodeRequest) => Promise<CodeResult>): Unsubscribe {
        if (codeHandler) {
            throw new Error("onCode handler already registered")
        }
        codeHandler = handler
        return () => {
            if (codeHandler === handler) {
                codeHandler = undefined
            }
        }
    }

    function onDoor(handler: (event: DoorEvent) => void): Unsubscribe {
        doorHandlers.add(handler)
        return () => {
            doorHandlers.delete(handler)
        }
    }

    function onGatewayStatus(handler: (status: IotStatus) => void): Unsubscribe {
        return registry.onStatus(handler)
    }

    function handleHello(socket: Socket, hello: IotHello) {
        if (hello.gatewayId && hello.at && hello.state) {
            logger.info({socketId: socket.id, gatewayId: hello.gatewayId}, "Gateway connected")

            const previousSocket = sockets.get(hello.gatewayId)
            sockets.set(hello.gatewayId, socket)
            registry.markOnline(hello.gatewayId, socket.id, Date.now(), hello.state)

            if (previousSocket && previousSocket.id !== socket.id) {
                previousSocket.disconnect(true)
            }

            const iotWelcome: IotWelcome = {
                sessionId: deps.getSessionId(),
                desiredState: deps.getDesiredState(),
                at: Date.now()
            }
            socket.emit(IOT_EVENTS.WELCOME, iotWelcome)

        }
    }

    function handleCommandAck(socket: Socket, ack: IotCommandAck) {
        logger.debug({socketId: socket.id, ack}, "Command ACK received")

        const gatewayId = registry.getGatewayId(socket.id)
        if (!gatewayId) return
        registry.touch(gatewayId, Date.now())

        const pendingCommand = pending.get(ack.commandId)
        if (!pendingCommand) {
            logger.warn({commandId: ack.commandId, gatewayId}, "Unknown or duplicate command ACK received")
            return
        }

        if (pendingCommand.gatewayId !== gatewayId) {
            logger.warn({
                commandId: ack.commandId,
                gatewayId,
                expectedGatewayId: pendingCommand.gatewayId
            }, "Command ACK received from wrong gateway")
            return
        }
        pending.delete(ack.commandId)
        clearTimeout(pendingCommand.timer)
        if (ack.outputs) {
            registry.setOutputState(gatewayId, ack.outputs)
        }
        if (ack.ok) {
            pendingCommand.resolve(ack)
        } else {
            pendingCommand.reject(new Error(ack.error ?? "Unknown error"))
        }
    }

    async function handleEvent(socket: Socket, event: IotEvent) {
        logger.debug({socketId: socket.id, event}, "Event received")
        const gatewayId = registry.getGatewayId(socket.id)
        if (!gatewayId) return
        registry.touch(gatewayId, Date.now())

        switch (event.type) {
            case 'door':
                registry.setInputState(gatewayId, {door: event.state})
                const doorEvent: DoorEvent = {
                    deviceId: event.deviceId,
                    state: event.state,
                    at: event.at
                }
                for (const handler of doorHandlers) {
                    try {
                        handler(doorEvent)
                    } catch (err) {
                        logger.error({err}, "Error in door handler")
                    }
                }
                break
            case 'code':
                if (codeHandler) {
                    try {
                        const result: CodeResult = await codeHandler({
                            deviceId: event.deviceId,
                            code: event.code,
                            at: event.at
                        })
                        socket.emit(IOT_EVENTS.EVENT_ACK, {
                            eventId: event.eventId,
                            ok: true,
                            result: {
                                type: 'code',
                                accepted: result.accepted,
                                display: result.display
                            }
                        })
                    } catch (err) {
                        logger.error({err}, "Error in code handler")
                        socket.emit(IOT_EVENTS.EVENT_ACK, {
                            eventId: event.eventId,
                            ok: false,
                            error: (err as Error).message
                        })
                    }
                } else {
                    logger.warn("No code handler registered")
                    socket.emit(IOT_EVENTS.EVENT_ACK, {
                        eventId: event.eventId,
                        ok: false,
                        error: "No code handler registered"
                    })
                }
                break
        }
    }

    function handleState(socket: Socket, state: IotDeviceState) {
        logger.debug({socketId: socket.id, state}, "State received")
        const gatewayId = registry.getGatewayId(socket.id)
        if (!gatewayId) {
            return
        }
        registry.touch(gatewayId, Date.now())
        registry.setState(gatewayId, state)
    }

    function rejectPendingForGateway(gatewayId: GatewayId, error: Error) {
        for (const [commandId, pendingCommand] of pending) {
            if (pendingCommand.gatewayId === gatewayId) {
                pending.delete(commandId)
                clearTimeout(pendingCommand.timer)
                pendingCommand.reject(error)
            }
        }
    }

    function handleDisconnect(socket: Socket, reason: string) {
        const gatewayId = registry.getGatewayId(socket.id)
        if (!gatewayId) return

        logger.info({socketId: socket.id, gatewayId, reason}, "Gateway disconnected")
        if (sockets.get(gatewayId) === socket) {
            sockets.delete(gatewayId)
        }
        registry.markOffline(gatewayId, socket.id, Date.now())
        rejectPendingForGateway(gatewayId, new Error(`Gateway ${gatewayId} disconnected: ${reason}`))
    }

    function authenticate(socket: Socket, next: (err?: Error) => void) {
        const expected = process.env.IOT_GATEWAY_TOKEN

        if (!expected) {
            next(new Error('IOT_GATEWAY_TOKEN is not configured'))
            return
        }

        if (socket.handshake.auth?.token !== expected) {
            next(new Error('unauthorized'))
            return
        }

        next()
    }

    function onConnection(socket: Socket) {
        logger.debug({socketId: socket.id}, "Gateway connected on /iot")

        socket.on(IOT_EVENTS.HELLO, (hello: IotHello) => handleHello(socket, hello))
        socket.on(IOT_EVENTS.COMMAND_ACK, (ack: IotCommandAck) => handleCommandAck(socket, ack))
        socket.on(IOT_EVENTS.EVENT, (event: IotEvent) => handleEvent(socket, event).catch(err => {
            logger.error({socketId: socket.id, err}, "Error handling event")
        }))
        socket.on(IOT_EVENTS.STATE, (state: IotDeviceState) => handleState(socket, state))

        socket.on('disconnect', (reason) => handleDisconnect(socket, reason))
    }

    function start(): Promise<void> {
        if (started) return Promise.resolve(undefined);
        started = true
        iot.on('connection', onConnection)

        logger.info(`socket.io server started on namespace ${IOT_NAMESPACE}`)

        return Promise.resolve(undefined);
    }

    function rejectAllPendingCommands(error: Error) {
        for (const [commandId, pendingCommand] of pending) {
            pending.delete(commandId)
            clearTimeout(pendingCommand.timer)
            pendingCommand.reject(error)
        }
    }

    async function stop(): Promise<void> {
        if (!started) return Promise.resolve(undefined);
        started = false
        iot.off('connection', onConnection)
        iot.disconnectSockets(true)
        rejectAllPendingCommands(new Error('iot adapter stopped'))
        doorHandlers.clear()
        codeHandler = undefined

        logger.info(`socket.io server stopped on namespace ${IOT_NAMESPACE}`)
        return Promise.resolve(undefined);
    }

    iot.use(authenticate)

    async function setLight(scene: string): Promise<IotCommandResult> {
        if (!scene.trim()) {
            return {ok: false, error: "scene is required"}
        }

        return execute({type: 'light', action: 'scene', scene})
    }

    async function playAudio(
        track: string,
        opts?: { volume?: number; loop?: boolean },
    ): Promise<IotCommandResult> {
        if (!track.trim()) {
            return {ok: false, error: "track is required"}
        }

        if (
            opts?.volume !== undefined &&
            (!Number.isFinite(opts.volume) || opts.volume < 0 || opts.volume > 100)
        ) {
            return {ok: false, error: "volume must be between 0 and 100"}
        }

        return execute({
            type: 'audio',
            action: 'play',
            audio: {track, volume: opts?.volume, loop: opts?.loop}
        })
    }

    async function stopAudio(): Promise<IotCommandResult> {
        return execute({type: 'audio', action: 'stop'})
    }

    return {
        port: {
            start,
            stop,
            cue,
            onDoor,
            onCode,
            getSnapshot,
            onGatewayStatus,
        },
        admin: {
            setLight,
            playAudio,
            stopAudio,
        }
    }
}
