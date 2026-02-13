import { useState, useEffect, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getTable } from '../api/tables'
import { TableWithDetails, TablePlayerWithProfile, ChatMessageWithProfile } from '../types'

export function useTableRealtime(tableId: string | undefined) {
  const [table, setTable] = useState<TableWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchTable = useCallback(async () => {
    if (!tableId) return
    try {
      setLoading(true)
      const data = await getTable(tableId)
      setTable(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tableId])

  useEffect(() => {
    if (!tableId) return

    fetchTable()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`table:${tableId}`)
      // Table updates (status, game_state)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_tables',
        filter: `id=eq.${tableId}`,
      }, (payload) => {
        setTable(prev => prev ? { ...prev, ...payload.new } as TableWithDetails : null)
      })
      // Player joins
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'table_players',
        filter: `table_id=eq.${tableId}`,
      }, async () => {
        // Refetch players with profiles
        const { data: players } = await supabase
          .from('table_players')
          .select('*, profile:profiles(*)')
          .eq('table_id', tableId)
          .order('seat_position', { ascending: true })
        setTable(prev => prev ? { ...prev, players: (players || []) as TablePlayerWithProfile[] } : null)
      })
      // Player leaves
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'table_players',
        filter: `table_id=eq.${tableId}`,
      }, async () => {
        const { data: players } = await supabase
          .from('table_players')
          .select('*, profile:profiles(*)')
          .eq('table_id', tableId)
          .order('seat_position', { ascending: true })
        setTable(prev => prev ? { ...prev, players: (players || []) as TablePlayerWithProfile[] } : null)
      })
      // New chat messages
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `table_id=eq.${tableId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('chat_messages')
          .select('*, profile:profiles(*)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          setTable(prev => prev ? {
            ...prev,
            messages: [...prev.messages, data as ChatMessageWithProfile],
          } : null)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [tableId, fetchTable])

  return { table, loading, error, refetch: fetchTable }
}

export function usePresence(tableId: string | undefined, userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!tableId || !userId) return

    const channel = supabase.channel(`presence:${tableId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = new Set<string>()
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => users.add(p.user_id))
        })
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => { channel.unsubscribe() }
  }, [tableId, userId])

  return onlineUsers
}
