import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthContext } from '../contexts/AuthContext'
import { getForumPosts, createForumPost } from '../api/forum'
import { ForumPostWithDetails } from '../types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '../components/ui/dialog'

const GAME_FILTERS: { label: string; value: string | null | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'General', value: null },
  { label: 'Werewolf', value: 'werewolf' },
  { label: 'Love Letter', value: 'love-letter' },
  { label: 'Counter Clash', value: 'counter-clash' },
]

const GAME_COLORS: Record<string, string> = {
  'werewolf': 'bg-purple-100 text-purple-700',
  'love-letter': 'bg-pink-100 text-pink-700',
  'counter-clash': 'bg-blue-100 text-blue-700',
}

const GAME_NAMES: Record<string, string> = {
  'werewolf': 'Werewolf',
  'love-letter': 'Love Letter',
  'counter-clash': 'Counter Clash',
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function CommunityPage() {
  const { user } = useAuthContext()
  const [posts, setPosts] = useState<ForumPostWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null | undefined>(undefined)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postGameId, setPostGameId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [filter])

  async function loadPosts() {
    setLoading(true)
    try {
      const data = await getForumPosts(filter)
      setPosts(data)
    } catch (err) {
      console.error('❌ Failed to load forum posts:', err)
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitPost(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    try {
      await createForumPost(title, content, postGameId || undefined)
      toast.success('Thread posted!')
      setDialogOpen(false)
      setTitle('')
      setContent('')
      setPostGameId('')
      loadPosts()
    } catch (err) {
      console.error('❌ Failed to create post:', err)
      toast.error('Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare size={24} className="text-green-600" />
          <h1 className="text-2xl font-bold text-slate-800">Community Forum</h1>
        </div>
        {user && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                <Plus size={16} />
                New Thread
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Thread</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitPost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Thread title..."
                    maxLength={200}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Game Tag (optional)</label>
                  <select
                    value={postGameId}
                    onChange={e => setPostGameId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">General</option>
                    <option value="werewolf">Werewolf</option>
                    <option value="love-letter">Love Letter</option>
                    <option value="counter-clash">Counter Clash</option>
                  </select>
                </div>
                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !title.trim() || !content.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    {submitting ? 'Posting...' : 'Post Thread'}
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap mb-6">
        {GAME_FILTERS.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <MessageSquare size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No posts yet</p>
          <p className="text-slate-400 text-sm mt-1">
            {user ? 'Be the first to start a discussion!' : 'Sign in to start a discussion'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <Link
              key={post.id}
              to={`/community/${post.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {post.game_id && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GAME_COLORS[post.game_id] || 'bg-slate-100 text-slate-600'}`}>
                        {GAME_NAMES[post.game_id] || post.game_id}
                      </span>
                    )}
                    <h3 className="font-semibold text-slate-800 truncate">{post.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{post.profile?.display_name || post.profile?.username || 'Unknown'}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(post.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-xs shrink-0">
                  <MessageSquare size={12} />
                  <span>{post.reply_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
