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
    IotCommandAck, IotDesiredState,
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

export function createSocketAdapter(
    io: Server,
    deps: {
        getDesiredState: () => IotDesiredState
        getSessionId: () => string
    },
): IotPort {
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

    async function cue(name: CueName): Promise<IotCommandResult> {
        const gatewayId = getMainGatewayId()
        if (!gatewayId) {
            return {ok: false, error: "No gateway connected"}
        }

        const command: IotCommand = {commandId: randomUUID(), type: 'cue', cue: name}

        try {
            await sendCommand(gatewayId, command)
            return {ok: true}
        } catch (error) {
            return {
                ok: false,
                error: (error instanceof Error ? error.message : String(error))
            }
        }
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

    return {
        start,
        stop,
        cue,
        onDoor,
        onCode,
        getSnapshot,
        onGatewayStatus,
    }
}
