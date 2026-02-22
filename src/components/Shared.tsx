import React, { useState } from 'react';
import { MessageSquare, LogOut, User, Search, Bell, Dice5, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useActiveTable } from '../hooks/useActiveTable';
import { AuthModal } from './auth/AuthModal';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuthContext();
  const activeTable = useActiveTable();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('📱 Layout render - user:', user?.id, 'profile:', profile, 'loading:', loading)
  }, [user, profile, loading])

  // Only show banner if we have an active table AND we are NOT on the table page
  const showBanner = activeTable && !location.pathname.includes(`/table/${activeTable.id}`);

  const navLinks = [
    { label: 'Play Now', path: '/', comingSoon: false },
    { label: 'Games', path: '/games', comingSoon: false },
    { label: 'Community', path: '/community', comingSoon: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Persistent Banner */}
      {showBanner && (
        <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between sticky top-0 z-[60] shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span className="font-bold">You are in an active table</span>
          </div>
          <button
            onClick={() => navigate(`/table/${activeTable.id}`)}
            className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-bold transition-colors"
          >
            Return to Game
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="relative flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Dice5 size={18} className="text-white" />
                </div>
                BoardGamePlat
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map(link => {
                  const isActive = (link.label === 'Play Now' && location.pathname === '/') ||
                    (link.label === 'Games' && location.pathname === '/games') ||
                    (link.label === 'Community' && location.pathname.startsWith('/community'));

                  if (link.comingSoon) {
                    return (
                      <button
                        key={link.label}
                        onClick={() => toast.info(`${link.label} is coming soon!`)}
                        className="px-3 py-1.5 rounded-full text-sm font-medium text-slate-400 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-default"
                      >
                        {link.label}
                        <span className="text-[10px] bg-slate-200 text-slate-500 rounded-full px-1.5 py-0.5 font-semibold leading-none">Soon</span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={link.label}
                      to={link.path!}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Input - Desktop */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search coming soon..."
                  disabled
                  className="w-48 bg-slate-100 rounded-full pl-9 pr-4 py-1.5 text-sm text-slate-500 placeholder-slate-400 cursor-not-allowed opacity-75"
                />
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => toast.info('Notifications coming soon!')}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                title="Coming Soon"
              >
                <Bell size={18} />
              </button>

              {loading ? (
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                        {(profile?.display_name || profile?.username || 'U').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-slate-600 hidden sm:block font-medium">
                      {profile?.display_name || profile?.username || 'User'}
                    </span>
                  </Link>
                  <button
                    onClick={signOut}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <User size={16} />
                  Sign In
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
              {navLinks.map(link => {
                if (link.comingSoon) {
                  return (
                    <button
                      key={link.label}
                      onClick={() => {
                        toast.info(`${link.label} is coming soon!`);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-400 transition-colors flex items-center gap-2"
                    >
                      {link.label}
                      <span className="text-[10px] bg-slate-200 text-slate-500 rounded-full px-1.5 py-0.5 font-semibold leading-none">Soon</span>
                    </button>
                  );
                }
                return (
                  <Link
                    key={link.label}
                    to={link.path!}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}

export function ChatPanel({
  messages,
  onSend,
  className = "",
}: {
  messages: { id: string; profile?: { username: string; display_name: string | null }; user_id?: string; message?: string; playerName?: string; text?: string; created_at?: string }[];
  onSend: (msg: string) => void;
  className?: string;
}) {
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <div className={`flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ${className}`}>
      <div className="bg-slate-50 border-b border-slate-200 text-slate-800 p-3 font-bold text-sm flex items-center gap-2">
        <MessageSquare size={16} className="text-blue-600" />
        Table Chat
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 && (
          <p className="text-slate-400 italic text-center mt-4">No messages yet...</p>
        )}
        {messages.map((msg) => {
          const timestamp = msg.created_at ? new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
          return (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-blue-600">
                  {msg.profile?.display_name || msg.profile?.username || msg.playerName || 'Unknown'}
                </span>
                {timestamp && <span className="text-[10px] text-slate-400">{timestamp}</span>}
              </div>
              <span className="text-sm text-slate-700 leading-6">{msg.message || msg.text}</span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-2 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-700"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
