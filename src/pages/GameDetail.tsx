import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AVAILABLE_GAMES, PLAYABLE_GAME_IDS, GameTable } from '../types';
import { Users, Clock, Play, Share2, RefreshCw } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuthContext } from '../contexts/AuthContext';
import { AuthModal } from '../components/auth/AuthModal';
import { createTable, getPublicTables, joinTable } from '../api/tables';
import { toast } from 'sonner';

export function GameDetailPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [publicTables, setPublicTables] = useState<GameTable[]>([]);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const game = AVAILABLE_GAMES.find(g => g.gameId === gameId);

  const fetchPublicTables = useCallback(async () => {
    if (gameId) {
      try {
        const tables = await getPublicTables(gameId);
        console.log('📋 Fetched public tables:', tables);
        setPublicTables(tables);
      } catch (err) {
        console.error('Failed to fetch public tables:', err);
      }
    }
  }, [gameId]);

  // Fetch tables when gameId changes OR when navigating to this page
  useEffect(() => {
    fetchPublicTables();
  }, [gameId, location.key, fetchPublicTables]) // location.key changes on every navigation

  if (!game) {
    return <div className="p-8 text-center text-slate-600">Game not found</div>;
  }

  const isPlayable = PLAYABLE_GAME_IDS.includes(game.gameId);

  const handleCreateLobby = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setCreating(true);
    try {
      const table = await createTable(game.gameId);
      navigate(`/table/${table.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create table');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinPublic = async (tableId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      await joinTable(tableId);
      navigate(`/table/${tableId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to join table');
    }
  };

  const handleRefresh = async () => {
    if (!gameId) return;

    setRefreshing(true);
    try {
      await fetchPublicTables();
      toast.success('Tables refreshed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh tables');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          {/* Header Banner */}
          <div className="relative h-64 md:h-80 w-full">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
            <ImageWithFallback src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
          </div>

          <div className="p-8 -mt-20 relative z-20">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Cover & Actions */}
              <div className="w-full md:w-72 flex-shrink-0 space-y-6">
                <div className="rounded-xl overflow-hidden shadow-lg border-4 border-slate-200 bg-slate-100 aspect-[3/4]">
                   <ImageWithFallback src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-3">
                  {isPlayable ? (
                    <button
                      onClick={handleCreateLobby}
                      disabled={creating}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                      <Play size={20} fill="currentColor" />
                      {creating ? 'Creating...' : 'Create Table'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        disabled
                        className="w-full py-3 bg-slate-300 text-slate-500 font-bold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <Play size={20} fill="currentColor" />
                        Create Table
                      </button>
                      <p className="text-center text-sm text-amber-600 font-medium bg-amber-50 rounded-lg py-2 border border-amber-200">
                        This game is coming soon!
                      </p>
                    </div>
                  )}
                </div>

                {/* Public Lobbies - only shown for playable games */}
                {isPlayable && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Open Tables</h3>
                      <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                        title="Refresh tables"
                      >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    {publicTables.length > 0 ? (
                      publicTables.map((t: any) => (
                        <button
                          key={t.id}
                          onClick={() => handleJoinPublic(t.id)}
                          className="w-full py-3 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-sm transition-colors border border-slate-200"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold">{t.host?.display_name || t.host?.username || 'Unknown'}</span>
                            <span className="text-blue-600 font-bold flex items-center gap-1 text-xs">
                              <Share2 size={12} /> Join
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Users size={12} />
                            <span>{t.playerCount || 0}/{t.max_players} players</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 py-2">No open tables. Create one!</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Info */}
              <div className="flex-1 space-y-8 pt-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-2">{game.name}</h1>
                  <p className="text-blue-600 font-medium text-lg">By {game.author}</p>
                </div>

                {/* Stats Bar */}
                <div className="flex flex-wrap gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Players</p>
                      <p className="font-bold text-slate-800">{game.minPlayers} - {game.maxPlayers}</p>
                    </div>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Time</p>
                      <p className="font-bold text-slate-800">~{game.avgTime} min</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">About the Game</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {game.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Tags</h3>
                  <div className="flex gap-2">
                     {game.tags.map(tag => (
                       <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                         {tag}
                       </span>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    </div>
  );
}
