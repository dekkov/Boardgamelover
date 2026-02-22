import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthContext } from '../contexts/AuthContext'
import { getForumPost, getForumReplies, createForumReply } from '../api/forum'
import { ForumPostWithDetails, ForumReplyWithProfile, Profile } from '../types'
import { supabase } from '../lib/supabase'
import { GAME_COLORS, GAME_NAMES, formatTime } from '../lib/forumUtils'

function Avatar({ profile }: { profile: Pick<Profile, 'username' | 'display_name' | 'avatar_url'> }) {
  if (profile.avatar_url) {
    return <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
      {(profile.display_name || profile.username || 'U').substring(0, 2).toUpperCase()}
    </div>
  )
}

export function ForumThreadPage() {
  const { postId } = useParams<{ postId: string }>()
  const { user } = useAuthContext()
  const [post, setPost] = useState<ForumPostWithDetails | null>(null)
  const [replies, setReplies] = useState<ForumReplyWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const repliesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!postId) return
    loadData()
  }, [postId])

  // Real-time subscription for new replies
  useEffect(() => {
    if (!postId) return

    const channel = supabase
      .channel(`forum:${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'forum_replies',
        filter: `post_id=eq.${postId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('forum_replies')
          .select('*, profile:profiles(*)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          setReplies(prev => {
            if (prev.some(r => r.id === data.id)) return prev
            return [...prev, data as ForumReplyWithProfile]
          })
        }
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [postId])

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies.length])

  async function loadData() {
    setLoading(true)
    try {
      const [postData, repliesData] = await Promise.all([
        getForumPost(postId!),
        getForumReplies(postId!),
      ])
      setPost(postData)
      setReplies(repliesData)
    } catch (err) {
      console.error('❌ Failed to load thread:', err)
      toast.error('Failed to load thread')
    } finally {
      setLoading(false)
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyContent.trim() || !postId) return
    setSubmitting(true)
    try {
      await createForumReply(postId, replyContent)
      setReplyContent('')
      // Real-time subscription handles adding the reply to the list
    } catch (err) {
      console.error('❌ Failed to post reply:', err)
      toast.error('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="h-6 bg-slate-100 rounded animate-pulse w-32" />
        <div className="h-36 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-slate-500">Thread not found.</p>
        <Link to="/community" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          ← Back to Community
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/community"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Community
      </Link>

      {/* Original post */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <Avatar profile={post.profile} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800">
              {post.profile?.display_name || post.profile?.username}
            </p>
            <p className="text-xs text-slate-400">{formatTime(post.created_at)}</p>
          </div>
          {post.game_id && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${GAME_COLORS[post.game_id] || 'bg-slate-100 text-slate-600'}`}>
              {GAME_NAMES[post.game_id] || post.game_id}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-3">{post.title}</h1>
        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
          <MessageSquare size={14} />
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.length === 0 && (
          <p className="text-slate-400 text-sm py-4 text-center">No replies yet. Be the first to respond!</p>
        )}

        {replies.map(reply => (
          <div key={reply.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <Avatar profile={reply.profile} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-800">
                    {reply.profile?.display_name || reply.profile?.username}
                  </span>
                  <span className="text-xs text-slate-400">{formatTime(reply.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{reply.content}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={repliesEndRef} />
      </div>

      {/* Reply form */}
      {user ? (
        <form onSubmit={handleReply} className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Post a Reply</h3>
          <textarea
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !replyContent.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-sm"
            >
              <Send size={14} />
              {submitting ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-slate-500 text-sm">Sign in to post a reply</p>
        </div>
      )}
    </div>
  )
}
