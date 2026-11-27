/**
 * Protocole du moteur de jeu, partagé entre le serveur et le front.
 * Uniquement des types : aucune logique ici.
 */

// ---------------------------------------------------------------------------
// Rôles
// ---------------------------------------------------------------------------

/** Rôle d'un appareil. Le rôle appartient à l'appareil, pas au joueur. */
export type Role = 'master' | 'ops' | 'gm'

/** Rôles tenus par les joueurs (tout sauf le maître du jeu). */
export type PlayerRole = Exclude<Role, 'gm'>

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type SessionStatus = 'lobby' | 'running' | 'paused' | 'ended'

/** Informations publiques d'une session (sans l'état du moteur). */
export type SessionInfo = {
  /** Ex. '2026-11-09_14h30_les-requins'. Présent dans toutes les lignes de log. */
  id: string
  teamName: string
  status: SessionStatus
  createdAt: number
  startedAt: number | null
  endedAt: number | null
}

// ---------------------------------------------------------------------------
// Connexion
// ---------------------------------------------------------------------------

/** Ce qu'une tablette envoie à l'ouverture du socket : `io({ auth })`. */
export type AuthPayload = { password: string } | { token: string }

/** Envoyé par le serveur juste après une connexion acceptée. */
export type Welcome = {
  role: string
  /** L'écran que le front doit afficher pour ce rôle (config.yaml). */
  ecran: string
  /** Jeton de reconnexion : à renvoyer dans `auth` après un redémarrage. */
  token: string
}

// ---------------------------------------------------------------------------
// Commandes (client → serveur)
// ---------------------------------------------------------------------------

/** Une commande vise toujours « l'entrée X du nœud Y ». */
export type Command = {
  node: string
  input: string
  payload?: unknown
}

export type CommandResult = {
  ok: boolean
  message?: string
}

// ---------------------------------------------------------------------------
// Vues (serveur → client)
// ---------------------------------------------------------------------------

/** Ce qu'un client voit d'un nœud du scénario. */
export type NodeView = {
  id: string
  /** Type de nœud (PasswordLock, App…) : le front choisit son composant avec. */
  type: string
  enabled: boolean
  data: unknown
}

/** État complet envoyé à un client, déjà filtré pour son rôle. */
export type ViewState = {
  role: Role
  session: SessionInfo | null
  nodes: NodeView[]
}
