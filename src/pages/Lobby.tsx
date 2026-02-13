import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AVAILABLE_GAMES } from '../types';
import { ChatPanel } from '../components/Shared';
import { Users, Copy, Play, ArrowLeft, LogOut } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useTableRealtime, usePresence } from '../hooks/useTableRealtime';
import { joinTable, leaveTable as apiLeaveTable, startGame } from '../api/tables';
import { sendChatMessage } from '../api/chat';
import { pluginLoader } from '../lib/pluginLoader';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function LobbyPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { table, loading, error } = useTableRealtime(tableId);
  const onlineUsers = usePresence(tableId, user?.id);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const isLeavingRef = React.useRef(false);

  // Auto-join if not already in table
  useEffect(() => {
    if (!tableId || !user || !table || isLeavingRef.current) return
    const isInTable = table.players.some(p => p.user_id === user.id)
    if (!isInTable && table.status === 'waiting' && !joining) {
      setJoining(true)
      joinTable(tableId)
        .catch(err => toast.error(err.message))
        .finally(() => setJoining(false))
    }
  }, [tableId, user, table?.players.length])

  // Redirect to game room if game starts
  useEffect(() => {
    if (table?.status === 'in_game') {
      navigate(`/table/${tableId}/play`);
    }
  }, [table?.status, tableId, navigate]);

  if (loading || !table) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500">Loading Lobby...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-center">
        <div className="space-y-4">
          <p className="text-red-500 text-lg">{error}</p>
          <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-700">Go Home</button>
        </div>
      </div>
    );
  }

  const game = AVAILABLE_GAMES.find(g => g.gameId === table.game_id);
  const currentPlayerRecord = table.players.find(p => p.user_id === user?.id);
  const isHost = currentPlayerRecord?.is_host;
  const canStart = table.players.length >= (game?.minPlayers || 1);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleLeave = async () => {
    if (!tableId || !user || leaving) return;

    isLeavingRef.current = true;
    setLeaving(true);
    toast.loading('Leaving table...', { id: 'leave-table' });

    try {
      console.log('🚪 Leaving table:', tableId);
      await apiLeaveTable(tableId);
      console.log('✅ API leave completed');

      // Poll to verify we've been removed from the table before navigating
      const maxAttempts = 10;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data } = await supabase
          .from('table_players')
          .select('id')
          .eq('table_id', tableId)
          .eq('user_id', user.id)
          .maybeSingle();

        console.log(`🔍 Poll attempt ${i + 1}: player record =`, data);

        if (!data) {
          // Successfully removed from table
          console.log('✅ Verified removal from table, navigating home');
          toast.success('Left table', { id: 'leave-table' });
          navigate('/');
          return;
        }
      }

      // If we get here, polling timed out but still navigate
      console.warn('⚠️ Polling timed out, but navigating anyway');
      toast.success('Left table', { id: 'leave-table' });
      navigate('/');
    } catch (err: any) {
      console.error('❌ Failed to leave table:', err);
      toast.error(err.message || 'Failed to leave table', { id: 'leave-table' });
      isLeavingRef.current = false;
      setLeaving(false);
    }
  };

  const handleStartGame = async () => {
    if (!tableId || !table) return;
    try {
      const plugin = await pluginLoader.loadBackendPlugin(table.game_id);
      const initialState = plugin.createInitialState(
        table.players.map(p => ({ user_id: p.user_id, seat_position: p.seat_position }))
      );
      await startGame(tableId, initialState);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start game');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!tableId) return;
    try {
      await sendChatMessage(tableId, text);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-slate-50 h-[calc(100vh-64px)] flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={handleLeave} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {game?.name} <span className="text-slate-400 font-normal">#{table.id.substring(0, 6)}</span>
              </h1>
              <div className="flex items-center gap-2 text-sm">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 <span className="text-green-600 font-medium uppercase tracking-wide">Waiting for players</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
               onClick={handleCopyLink}
               className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Copy size={16} />
              Invite
            </button>
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium flex items-center gap-2 transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={16} />
              {leaving ? 'Leaving...' : 'Leave Table'}
            </button>
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  canStart
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Play size={16} />
                Start Game
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Panel: Players */}
          <div className="w-1/3 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} />
                Players ({table.players.length}/{game?.maxPlayers})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {table.players.map(player => (
                 <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                   <div className="flex items-center gap-3">
                     <div className="relative">
                       <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                         {(player.profile?.display_name || player.profile?.username || '?').substring(0,2).toUpperCase()}
                       </div>
                       {onlineUsers.has(player.user_id) && (
                         <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                       )}
                     </div>
                     <span className={player.user_id === user?.id ? 'text-blue-600 font-bold' : 'text-slate-700'}>
                       {player.profile?.display_name || player.profile?.username || 'Unknown'}
                       {player.user_id === user?.id && ' (You)'}
                     </span>
                   </div>
                   {player.is_host && (
                     <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium">HOST</span>
                   )}
                 </div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: Math.max(0, (game?.maxPlayers || 0) - table.players.length) }).map((_, i) => (
                <div key={i} className="p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 text-center text-sm bg-slate-50">
                  Empty Slot
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Chat */}
          <div className="flex-1 flex flex-col h-full">
             <ChatPanel messages={table.messages} onSend={handleSendMessage} className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
