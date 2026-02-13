import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AVAILABLE_GAMES } from '../types';
import { ChatPanel } from '../components/Shared';
import { GameRenderer } from '../components/GameRenderer';
import { Flag } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useTableRealtime, usePresence } from '../hooks/useTableRealtime';
import { leaveTable as apiLeaveTable } from '../api/tables';
import { sendChatMessage } from '../api/chat';
import { submitMove } from '../api/game';
import { pluginLoader } from '../lib/pluginLoader';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function GameRoomPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { table, loading, error } = useTableRealtime(tableId);
  const onlineUsers = usePresence(tableId, user?.id);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const handleMove = useCallback(async (move: any) => {
    if (!table || !tableId || !user) return;

    try {
      const plugin = await pluginLoader.loadBackendPlugin(table.game_id);

      // Use submitMove API which records to game_moves table
      await submitMove(
        tableId,
        table.game_id,
        move,
        table.game_state,
        plugin.applyMove,
        plugin.validateMove,
        plugin.checkWinCondition
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to make move');
    }
  }, [table, tableId, user]);

  if (loading || !table) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500">Connecting to Game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-center">
        <div className="space-y-4">
          <p className="text-red-500 text-lg">{error}</p>
          <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-700">Go Home</button>
        </div>
      </div>
    );
  }

  const game = AVAILABLE_GAMES.find(g => g.gameId === table.game_id);

  const handleLeave = async () => {
    if (confirm("Are you sure you want to leave the game?")) {
      if (tableId && user) {
        try {
          await apiLeaveTable(tableId);

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

            if (!data) {
              // Successfully removed from table
              break;
            }
          }
        } catch {}
      }
      navigate('/');
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
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top Bar - Minimal */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-800 text-sm font-medium">
             Home
          </button>
          <div className="w-px h-4 bg-slate-200"></div>
          <span className="text-slate-800 font-bold">{game?.name}</span>
          <span className="text-slate-400 text-sm">Table #{table.id.substring(0, 6)}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile chat toggle */}
          <button
            onClick={() => setShowMobileChat(!showMobileChat)}
            className="md:hidden text-slate-500 hover:text-slate-800 text-sm"
          >
            Chat
          </button>
          <button onClick={handleLeave} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm flex items-center gap-1 font-medium transition-colors">
            <LogOutIcon size={14} /> Leave Table
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Game Info / Turn Order */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden md:flex">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Players</h3>
            <div className="space-y-2">
              {table.players.map(p => (
                <div key={p.id} className={`flex items-center gap-2 p-2 rounded ${
                  p.user_id === table.game_state.winner ? 'bg-yellow-50 border border-yellow-300' : 'bg-slate-50'
                }`}>
                   <div className="relative">
                     <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold">
                       {(p.profile?.display_name || p.profile?.username || '?').substring(0,1)}
                     </div>
                     {onlineUsers.has(p.user_id) && (
                       <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                     )}
                   </div>
                   <span className="text-sm text-slate-700 truncate">
                     {p.profile?.display_name || p.profile?.username || 'Unknown'}
                   </span>
                   {p.user_id === table.game_state.winner && <Flag size={14} className="text-yellow-500 ml-auto" />}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 flex-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Game Log</h3>
            <div className="text-xs text-slate-400 space-y-1 font-mono">
              <p>Game started...</p>
              {table.game_state.lastPlayerId && (
                <p>
                  {table.players.find(p => p.user_id === table.game_state.lastPlayerId)?.profile?.display_name || 'Someone'} made a move.
                </p>
              )}
              {table.game_state.winner && (
                <p className="text-blue-600 font-bold">
                  WINNER: {table.players.find(p => p.user_id === table.game_state.winner)?.profile?.display_name || 'Unknown'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Game Board — PRESERVED emerald/felt surface */}
        <div className="flex-1 bg-slate-100 relative flex flex-col overflow-hidden">
           {/* Wooden border effect */}
           <div className="absolute inset-0 border-[20px] border-[#3e2723] pointer-events-none opacity-50 z-0 hidden md:block"></div>

           <div className="relative z-10 flex-1 p-4 md:p-8 overflow-auto flex items-center justify-center">
             <div className="w-full max-w-4xl aspect-video bg-[#2c3e50] rounded-xl shadow-2xl overflow-hidden border-4 md:border-8 border-slate-700 relative">
                {/* Felt surface */}
                <div className="absolute inset-0 bg-emerald-900 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>

                {/* Game Content */}
                <div className="relative z-20 h-full p-4 md:p-6">
                   <GameRenderer
                      gameId={table.game_id}
                      gameState={table.game_state}
                      currentUserId={user?.id || ''}
                      isMyTurn={true}
                      onMove={handleMove}
                      players={table.players}
                   />
                </div>
             </div>
           </div>
        </div>

        {/* Right Sidebar: Chat (desktop) */}
        <div className="w-80 bg-white border-l border-slate-200 flex-col shrink-0 z-20 shadow-sm hidden md:flex">
           <ChatPanel messages={table.messages} onSend={handleSendMessage} className="h-full rounded-none border-0" />
        </div>
      </div>

      {/* Mobile chat overlay */}
      {showMobileChat && (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden" onClick={() => setShowMobileChat(false)}>
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-white rounded-t-xl" onClick={e => e.stopPropagation()}>
            <ChatPanel messages={table.messages} onSend={handleSendMessage} className="h-full rounded-none border-0" />
          </div>
        </div>
      )}
    </div>
  );
}

function LogOutIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
