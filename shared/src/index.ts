/**
 * Contrat partagé entre le serveur, le front et les objets connectés.
 * Aucune logique ici : uniquement des types et des noms d'événements.
 */

// ---------------------------------------------------------------------------
// Modèles
// ---------------------------------------------------------------------------

export type Team = {
  id: string
  name: string
}

export type PuzzleState = {
  id: string
  solved: boolean
  solvedAt: number | null
}

export type AnswerRequest = {
  teamId: string
  puzzleId: string
  value: string
}

export type AnswerResult = {
  ok: boolean
  message: string
  nextPuzzleId?: string
}

// ---------------------------------------------------------------------------
// Événements temps réel
// ---------------------------------------------------------------------------

export const SOCKET_EVENTS = {
  READY: 'ready',
  PUZZLE_SOLVED: 'puzzle:solved',
  HINT: 'hint',
  IOT_TRIGGER: 'iot:trigger',
} as const

export type PuzzleSolvedPayload = {
  puzzleId: string
  teamId: string
  at: number
}

export type HintPayload = {
  puzzleId: string
  text: string
}

/** Événements émis par le serveur vers les clients. */
export type ServerEvents = {
  [SOCKET_EVENTS.READY]: (payload: { ok: true; at: number }) => void
  [SOCKET_EVENTS.PUZZLE_SOLVED]: (payload: PuzzleSolvedPayload) => void
  [SOCKET_EVENTS.HINT]: (payload: HintPayload) => void
}

/** Événements émis par les clients vers le serveur. */
export type ClientEvents = {
  hello: (payload: { role: 'player' | 'iot'; teamId?: string }) => void
}

export type ServerEventName = keyof ServerEvents
