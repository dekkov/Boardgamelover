import { supabase } from '../lib/supabase'
import { AVAILABLE_GAMES, GameTable, TablePlayerWithProfile, TableWithDetails } from '../types'

export async function createTable(
  gameId: string,
  visibility: 'public' | 'private' = 'public'
): Promise<GameTable> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const gameConfig = AVAILABLE_GAMES.find(g => g.gameId === gameId)
  if (!gameConfig) throw new Error('Game not found')

  const { data: table, error } = await supabase
    .from('game_tables')
    .insert({
      game_id: gameId,
      host_id: user.id,
      status: 'waiting',
      visibility,
      max_players: gameConfig.maxPlayers,
      game_state: {},
    })
    .select()
    .single()

  if (error) throw error

  // Auto-join as host
  const { error: joinError } = await supabase.from('table_players').insert({
    table_id: table.id,
    user_id: user.id,
    is_host: true,
    seat_position: 0,
  })
  if (joinError) throw joinError

  return table as GameTable
}

export async function joinTable(tableId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('join_table', {
    p_table_id: tableId,
    p_user_id: user.id,
  })

  if (error) throw error
  if (data && !data.success) throw new Error(data.error || 'Failed to join table')
}

export async function leaveTable(tableId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  console.log('🔧 leaveTable API: Starting for user', user.id, 'table', tableId);

  // Remove player from table
  const { error, count } = await supabase
    .from('table_players')
    .delete({ count: 'exact' })
    .eq('table_id', tableId)
    .eq('user_id', user.id)

  console.log('🔧 leaveTable API: Delete result - error:', error, 'count:', count);

  if (error) {
    console.error('❌ leaveTable API: Delete failed:', error);
    throw error;
  }

  if (count === 0) {
    console.warn('⚠️ leaveTable API: No records were deleted! Player may not be in table.');
  }

  // Check if table is now empty
  const { data: remainingPlayers, error: selectError } = await supabase
    .from('table_players')
    .select('id')
    .eq('table_id', tableId)

  console.log('🔧 leaveTable API: Remaining players:', remainingPlayers?.length || 0);

  if (selectError) {
    console.error('❌ leaveTable API: Failed to check remaining players:', selectError);
  }

  // If no players left, delete the table (will cascade delete chat_messages and game_moves)
  if (!remainingPlayers || remainingPlayers.length === 0) {
    console.log('🗑️ leaveTable API: Table is empty, deleting table:', tableId);
    const { error: deleteError, count: deleteCount } = await supabase
      .from('game_tables')
      .delete({ count: 'exact' })
      .eq('id', tableId)

    if (deleteError) {
      console.error('❌ leaveTable API: Failed to delete table:', deleteError);
      throw deleteError; // Throw error so caller knows deletion failed
    } else {
      console.log('✅ leaveTable API: Table deleted. Rows affected:', deleteCount);
    }
  } else {
    console.log('ℹ️ leaveTable API: Table still has players, not deleting');
  }

  console.log('✅ leaveTable API: Complete');
}

export async function getTable(tableId: string): Promise<TableWithDetails | null> {
  const { data: table, error } = await supabase
    .from('game_tables')
    .select('*')
    .eq('id', tableId)
    .single()

  if (error || !table) return null

  const { data: players } = await supabase
    .from('table_players')
    .select('*, profile:profiles(*)')
    .eq('table_id', tableId)
    .order('seat_position', { ascending: true })

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*, profile:profiles(*)')
    .eq('table_id', tableId)
    .order('created_at', { ascending: true })

  return {
    ...table,
    players: (players || []) as TablePlayerWithProfile[],
    messages: (messages || []) as any[],
  } as TableWithDetails
}

export async function getPublicTables(gameId?: string): Promise<any[]> {
  let query = supabase
    .from('game_tables')
    .select(`
      *,
      host:profiles!game_tables_host_id_fkey(username, display_name),
      table_players(id)
    `)
    .eq('status', 'waiting')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  if (gameId) {
    query = query.eq('game_id', gameId)
  }

  const { data, error } = await query
  if (error) throw error

  // Add player count to each table
  return (data || []).map(table => ({
    ...table,
    playerCount: table.table_players?.length || 0
  }))
}

export async function startGame(tableId: string, initialGameState: Record<string, any>): Promise<void> {
  const { error } = await supabase
    .from('game_tables')
    .update({
      status: 'in_game',
      game_state: initialGameState,
    })
    .eq('id', tableId)

  if (error) throw error
}

export async function updateGameState(tableId: string, gameState: Record<string, any>, status?: string): Promise<void> {
  const update: any = { game_state: gameState }
  if (status) update.status = status

  const { error } = await supabase
    .from('game_tables')
    .update(update)
    .eq('id', tableId)

  if (error) throw error
}

export async function findActiveTableForUser(userId: string): Promise<GameTable | null> {
  const { data: playerRecords } = await supabase
    .from('table_players')
    .select('table_id')
    .eq('user_id', userId)

  if (!playerRecords?.length) return null

  const tableIds = playerRecords.map(p => p.table_id)

  const { data: tables } = await supabase
    .from('game_tables')
    .select('*')
    .in('id', tableIds)
    .in('status', ['waiting', 'in_game'])
    .order('created_at', { ascending: false })
    .limit(1)

  return (tables?.[0] as GameTable) || null
}
