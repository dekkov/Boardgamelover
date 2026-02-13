import { supabase } from '../lib/supabase'
import { updateGameState } from './tables'

export async function submitMove(
  tableId: string,
  gameId: string,
  move: Record<string, any>,
  currentState: Record<string, any>,
  applyMoveFn: (state: any, playerId: string, move: any) => any,
  validateMoveFn: (state: any, playerId: string, move: any) => boolean,
  checkWinFn: (state: any) => string | null
): Promise<Record<string, any>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validate move
  if (!validateMoveFn(currentState, user.id, move)) {
    throw new Error('Invalid move')
  }

  // Apply move
  const newState = applyMoveFn(currentState, user.id, move)
  const winner = checkWinFn(newState)

  // Record the move
  const { data: moveCount } = await supabase
    .from('game_moves')
    .select('id', { count: 'exact' })
    .eq('table_id', tableId)

  await supabase.from('game_moves').insert({
    table_id: tableId,
    user_id: user.id,
    move_data: move,
    move_number: (moveCount?.length || 0) + 1,
  })

  // Update game state
  await updateGameState(tableId, newState, winner ? 'finished' : undefined)

  return newState
}
