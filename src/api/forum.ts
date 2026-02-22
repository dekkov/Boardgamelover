import { supabase } from '../lib/supabase'
import { ForumPost, ForumPostWithDetails, ForumReply, ForumReplyWithProfile } from '../types'

export async function getForumPosts(gameId?: string | null): Promise<ForumPostWithDetails[]> {
  let query = supabase
    .from('forum_posts')
    .select('*, profile:profiles(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (gameId === null) {
    query = query.is('game_id', null)
  } else if (gameId !== undefined) {
    query = query.eq('game_id', gameId)
  }

  const { data: posts, error } = await query
  if (error) throw error
  if (!posts || posts.length === 0) return []

  const postIds = posts.map(p => p.id)
  const { data: counts, error: countError } = await supabase
    .from('forum_replies')
    .select('post_id')
    .in('post_id', postIds)

  if (countError) throw countError

  const countMap: Record<string, number> = {}
  for (const row of (counts || [])) {
    countMap[row.post_id] = (countMap[row.post_id] || 0) + 1
  }

  return posts.map(p => ({
    ...p,
    reply_count: countMap[p.id] || 0,
  })) as ForumPostWithDetails[]
}

export async function createForumPost(title: string, content: string, gameId?: string): Promise<ForumPost> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('forum_posts')
    .insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      game_id: gameId || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as ForumPost
}

export async function getForumPost(postId: string): Promise<ForumPostWithDetails | null> {
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, profile:profiles(*)')
    .eq('id', postId)
    .single()

  if (error || !data) return null

  const { data: counts } = await supabase
    .from('forum_replies')
    .select('id')
    .eq('post_id', postId)

  return {
    ...data,
    reply_count: counts?.length || 0,
  } as ForumPostWithDetails
}

export async function getForumReplies(postId: string): Promise<ForumReplyWithProfile[]> {
  const { data, error } = await supabase
    .from('forum_replies')
    .select('*, profile:profiles(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as ForumReplyWithProfile[]
}

export async function createForumReply(postId: string, content: string): Promise<ForumReply> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('forum_replies')
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) throw error
  return data as ForumReply
}
