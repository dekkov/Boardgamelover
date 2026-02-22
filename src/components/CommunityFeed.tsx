import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getForumPosts } from '../api/forum';
import { ForumPostWithDetails } from '../types';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CommunityFeed() {
  const [posts, setPosts] = useState<ForumPostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getForumPosts()
      .then(data => setPosts(data.slice(0, 3)))
      .catch(err => console.error('❌ CommunityFeed: Failed to load posts:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-green-600" />
          <h3 className="font-bold text-slate-800">Community</h3>
        </div>
        <Link to="/community" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
          View all →
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-slate-500">No posts yet</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to start a discussion!</p>
          </div>
        ) : (
          posts.map(post => (
            <Link
              key={post.id}
              to={`/community/${post.id}`}
              className="block p-3 hover:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-medium text-slate-700 truncate">{post.title}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span>{post.profile?.display_name || post.profile?.username}</span>
                <span>·</span>
                <span>{post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}</span>
                <span>·</span>
                <span>{formatRelativeTime(post.created_at)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
