export const createInitialState = (players: { user_id: string; seat_position: number | null }[]) => ({
  count: 0,
  target: 10,
  lastPlayerId: null as string | null,
  winner: null as string | null,
  playerIds: players.map(p => p.user_id),
})

export const validateMove = (state: any, playerId: string, move: any): boolean => {
  if (state.winner) return false
  if (move.type !== 'INCREMENT') return false
  return state.playerIds.includes(playerId)
}

export const applyMove = (state: any, playerId: string, move: any): any => {
  const newCount = state.count + 1
  return {
    ...state,
    count: newCount,
    lastPlayerId: playerId,
    winner: newCount >= state.target ? playerId : null,
  }
}

export const checkWinCondition = (state: any): string | null => state.winner

export const getGameStatus = (state: any): string =>
  state.winner ? 'finished' : 'in_progress'
