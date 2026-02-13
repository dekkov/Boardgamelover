import { TablePlayerWithProfile } from '../types'

export interface GameComponentProps {
  gameState: any
  players: TablePlayerWithProfile[]
  currentUserId: string
  isMyTurn: boolean
  onMove: (move: any) => Promise<void>
}

export interface BackendPlugin {
  createInitialState: (players: { user_id: string; seat_position: number | null }[], config?: any) => any
  validateMove: (state: any, playerId: string, move: any) => boolean
  applyMove: (state: any, playerId: string, move: any) => any
  checkWinCondition: (state: any) => string | null
  getGameStatus: (state: any) => string
}

export interface GamePluginManifest {
  gameId: string
  name: string
  version: string
  minPlayers: number
  maxPlayers: number
}
