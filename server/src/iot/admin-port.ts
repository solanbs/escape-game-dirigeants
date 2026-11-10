import {IotCommandResult} from "./port.js";

export interface IotAdminPort {
    setLight(scene: string): Promise<IotCommandResult>
    playAudio(track: string, opts?: { volume?: number; loop?: boolean }): Promise<IotCommandResult>
    stopAudio(): Promise<IotCommandResult>
}
