import type {CueName, IotCommandPayload} from '@escape/shared/iot'

/**
 * Définition des cues côté serveur.
 *
 * Le gateway ne connaît pas ces noms : il reçoit uniquement des commandes
 * matérielles précises (scène de lumière, lecture ou arrêt audio).
 */
export const CUES: Record<CueName, readonly IotCommandPayload[]> = {
    alarm: [
        {type: 'light', action: 'scene', scene: 'alarm'},
        {
            type: 'audio',
            action: 'play',
            audio: {track: 'alarm.mp3', volume: 80, loop: true},
        },
    ],

    'alarm-off': [
        {type: 'light', action: 'scene', scene: 'ambiance'},
        {type: 'audio', action: 'stop'},
    ],

    success: [
        {type: 'light', action: 'scene', scene: 'success'},
        {
            type: 'audio',
            action: 'play',
            audio: {track: 'success.mp3', volume: 70, loop: false},
        },
    ],

    failure: [
        {type: 'light', action: 'scene', scene: 'failure'},
        {
            type: 'audio',
            action: 'play',
            audio: {track: 'failure.mp3', volume: 70, loop: false},
        },
    ],

    ambiance: [
        {type: 'light', action: 'scene', scene: 'ambiance'},
        {
            type: 'audio',
            action: 'play',
            audio: {track: 'ambiance.mp3', volume: 40, loop: true},
        },
    ],
}
