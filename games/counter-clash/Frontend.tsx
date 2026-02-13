import React from 'react'
import type { GameComponentProps } from '../../src/types/plugin'

export default function CounterClashGame({
  gameState,
  currentUserId,
  onMove,
  players,
}: GameComponentProps) {
  const lastPlayer = players.find(p => p.user_id === gameState.lastPlayerId)
  const winner = players.find(p => p.user_id === gameState.winner)

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-8 bg-gray-800 rounded-xl border-2 border-gray-700 shadow-inner">
      <div className="text-center">
        <h2 className="text-6xl font-black text-amber-500 drop-shadow-lg mb-2">{gameState.count}</h2>
        <p className="text-gray-400 uppercase tracking-widest text-sm font-bold">Current Count</p>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xl text-white">Target: <span className="font-bold text-green-400">{gameState.target}</span></p>
        {lastPlayer && (
          <p className="text-sm text-gray-400">
            Last update by: <span className="text-white font-bold">
              {lastPlayer.profile?.display_name || lastPlayer.profile?.username || 'Unknown'}
            </span>
          </p>
        )}
      </div>

      {winner ? (
        <div className="text-center space-y-4">
          <div className="w-48 h-48 rounded-full bg-amber-600 flex items-center justify-center border-4 border-amber-400">
            <span className="text-2xl font-black text-white">GAME OVER</span>
          </div>
          <p className="text-xl text-amber-400 font-bold">
            {winner.user_id === currentUserId ? 'You win!' : `${winner.profile?.display_name || winner.profile?.username} wins!`}
          </p>
        </div>
      ) : (
        <button
          onClick={() => onMove({ type: 'INCREMENT' })}
          className="w-48 h-48 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-2xl shadow-[0_10px_0_rgb(153,27,27)] active:shadow-none active:translate-y-[10px] transition-all flex items-center justify-center border-4 border-red-800"
        >
          PUSH ME
        </button>
      )}

      <div className="text-gray-500 text-sm max-w-xs text-center">
        Race to reach {gameState.target}! Click the button to increment the counter.
      </div>
    </div>
  )
}
