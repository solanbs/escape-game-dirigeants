import {createSocketAdapter} from "./socket-adapter.js";
import {IotDesiredState} from "@escape/shared/iot";
import {IotPort} from "./port.js";
import {Server} from "socket.io";

export function createIot(io: Server, deps: {
    getDesiredState: () => IotDesiredState,
    getSessionId: () => string;
}): IotPort {
    return createSocketAdapter(io, deps);
}
