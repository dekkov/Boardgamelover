import { supabase } from '../lib/supabase'
import { ChatMessageWithProfile } from '../types'

export async function sendChatMessage(tableId: string, message: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('chat_messages').insert({
    table_id: tableId,
    user_id: user.id,
    message: message.trim(),
  })

  if (error) throw error
}

export async function getChatHistory(tableId: string): Promise<ChatMessageWithProfile[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, profile:profiles(*)')
    .eq('table_id', tableId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as ChatMessageWithProfile[]
}
