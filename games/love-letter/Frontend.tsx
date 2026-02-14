import React, { useState } from 'react'
import type { GameComponentProps } from '../../src/types/plugin'
import { CARD_NAMES, CARD_COUNTS, CARD_EFFECTS } from './backend'

// ==========================================
// Types
// ==========================================

type Phase =
  | 'DRAW'
  | 'PLAY_CARD'
  | 'SELECT_TARGET'
  | 'RESOLVE_GUARD'
  | 'RESOLVE_PRIEST'
  | 'RESOLVE_BARON'
  | 'ROUND_OVER'
  | 'GAME_OVER'

interface PendingEffect {
  card: number
  playerId: string
  targetId?: string
  guardGuess?: number
}

interface LoveLetterState {
  tokens: Record<string, number>
  tokensToWin: number
  gameWinner: string | null
  phase: Phase
  deck: number[]
  removedCard: number
  faceUpRemoved: number[]
  hands: Record<string, number[]>
  discards: Record<string, number[]>
  eliminated: string[]
  protected: string[]
  playerOrder: string[]
  currentPlayerIndex: number
  drawnCard: boolean
  pendingEffect: PendingEffect | null
  priestReveal: { viewerId: string; targetId: string; card: number } | null
  baronResult: { winnerId: string | null; loserId: string | null; card1: number; card2: number } | null
  roundNumber: number
  roundWinner: string | null
  readyPlayers: string[]
  log: string[]
}

// ==========================================
// Helpers
// ==========================================

function getPlayerName(playerId: string, players: GameComponentProps['players']): string {
  const p = players.find(pl => pl.user_id === playerId)
  return p?.profile?.display_name || p?.profile?.username || playerId.slice(0, 6)
}

function currentPlayerId(state: LoveLetterState): string {
  return state.playerOrder[state.currentPlayerIndex]
}

// Card value to a thematic color
const CARD_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: '#4a3728', border: '#8B7355', text: '#D4C4A8' },
  2: { bg: '#2d3a4e', border: '#5B7BA3', text: '#B8D0E8' },
  3: { bg: '#3d2b2b', border: '#8B4545', text: '#D4A8A8' },
  4: { bg: '#2b3d2b', border: '#458B45', text: '#A8D4A8' },
  5: { bg: '#3d3a2b', border: '#8B8545', text: '#D4D0A8' },
  6: { bg: '#3d2b3a', border: '#8B4585', text: '#D4A8D0' },
  7: { bg: '#2b2b3d', border: '#45458B', text: '#A8A8D4' },
  8: { bg: '#4a2b3d', border: '#B8458B', text: '#F0C8E0' },
}

// ==========================================
// Card Component (CSS-only)
// ==========================================

function Card({
  value,
  faceDown = false,
  small = false,
  clickable = false,
  selected = false,
  disabled = false,
  shielded = false,
  onClick,
}: {
  value: number
  faceDown?: boolean
  small?: boolean
  clickable?: boolean
  selected?: boolean
  disabled?: boolean
  shielded?: boolean
  onClick?: () => void
}) {
  const w = small ? 'w-12' : 'w-20'
  const h = small ? 'h-16' : 'h-28'

  if (faceDown) {
    return (
      <div
        className={`${w} ${h} rounded-lg relative shrink-0`}
        style={{
          background: 'repeating-linear-gradient(45deg, #5B1A1A, #5B1A1A 4px, #6B2A2A 4px, #6B2A2A 8px)',
          border: '2px solid #D4AF37',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 0 12px rgba(212,175,55,0.1)',
        }}
      >
        <div className="absolute inset-1 rounded border border-amber-700/30" />
        {shielded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg opacity-70">&#x1F6E1;</span>
          </div>
        )}
      </div>
    )
  }

  const colors = CARD_COLORS[value] || CARD_COLORS[1]

  return (
    <div
      onClick={clickable && !disabled ? onClick : undefined}
      className={`${w} ${h} rounded-lg relative shrink-0 transition-all duration-200 ${
        clickable && !disabled ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : ''
      } ${selected ? 'ring-2 ring-amber-400 -translate-y-2 shadow-xl shadow-amber-500/20' : ''} ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
      style={{
        background: colors.bg,
        border: `2px solid ${selected ? '#D4AF37' : colors.border}`,
        boxShadow: selected
          ? '0 4px 16px rgba(212,175,55,0.3)'
          : '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {/* Value badge */}
      <div
        className={`absolute top-1 left-1 ${small ? 'w-4 h-4 text-[10px]' : 'w-6 h-6 text-xs'} rounded-full flex items-center justify-center font-black`}
        style={{ background: '#D4AF37', color: '#2a1a0a' }}
      >
        {value}
      </div>
      {/* Card name */}
      <div className="absolute inset-0 flex items-center justify-center px-1">
        <span
          className={`${small ? 'text-[8px]' : 'text-xs'} font-bold text-center leading-tight`}
          style={{ color: colors.text, fontFamily: 'Georgia, serif' }}
        >
          {CARD_NAMES[value]}
        </span>
      </div>
      {shielded && (
        <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
          <span className={small ? 'text-xs' : 'text-sm'}>&#x1F6E1;</span>
        </div>
      )}
    </div>
  )
}

// ==========================================
// Deck Pile
// ==========================================

function DeckPile({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-16 h-24 rounded-lg relative"
        style={{
          background: 'repeating-linear-gradient(45deg, #5B1A1A, #5B1A1A 4px, #6B2A2A 4px, #6B2A2A 8px)',
          border: '2px solid #D4AF37',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5), 3px 3px 0 #3a0a0a, 5px 5px 0 #2a0505',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-amber-400/60 text-2xl font-serif font-bold">{count}</span>
        </div>
      </div>
      <span className="text-[10px] text-amber-300/60 font-medium">Deck</span>
    </div>
  )
}

// ==========================================
// Opponent Area
// ==========================================

function OpponentArea({
  playerId,
  state,
  players,
  position,
}: {
  playerId: string
  state: LoveLetterState
  players: GameComponentProps['players']
  position: 'top' | 'left' | 'right'
}) {
  const name = getPlayerName(playerId, players)
  const isEliminated = state.eliminated.includes(playerId)
  const isProtected = state.protected.includes(playerId)
  const isCurrent = currentPlayerId(state) === playerId
  const tokenCount = state.tokens[playerId] || 0
  const discards = state.discards[playerId] || []
  const handSize = (state.hands[playerId] || []).length

  // Show hand face-up if round is over or game is over
  const showHand = state.phase === 'ROUND_OVER' || state.phase === 'GAME_OVER'

  return (
    <div className={`flex flex-col items-center gap-1 ${isEliminated ? 'opacity-40' : ''}`}>
      {/* Name + tokens */}
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
        isCurrent ? 'bg-amber-600/40 text-amber-200 ring-1 ring-amber-500/50' : 'bg-black/30 text-amber-100/80'
      }`}>
        <span>{name}</span>
        {tokenCount > 0 && (
          <span className="flex gap-0.5">
            {Array.from({ length: tokenCount }).map((_, i) => (
              <span key={i} className="text-red-400">&#x2764;</span>
            ))}
          </span>
        )}
        {isEliminated && <span className="text-red-400 text-[10px]">OUT</span>}
        {isProtected && <span>&#x1F6E1;</span>}
      </div>

      {/* Hand (face-down unless revealed) */}
      <div className="flex gap-1">
        {!isEliminated && handSize > 0 && (
          showHand ? (
            state.hands[playerId].map((card, i) => (
              <Card key={i} value={card} small />
            ))
          ) : (
            Array.from({ length: handSize }).map((_, i) => (
              <Card key={i} value={0} faceDown small shielded={isProtected} />
            ))
          )
        )}
      </div>

      {/* Discards */}
      {discards.length > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {discards.map((card, i) => (
            <Card key={i} value={card} small />
          ))}
        </div>
      )}
    </div>
  )
}

// ==========================================
// Card Reference Toggle Panel
// ==========================================

function CardReferencePanel({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-12 rounded-r-lg flex items-center justify-center transition-all"
        style={{
          background: 'rgba(212,175,55,0.2)',
          border: '1px solid rgba(212,175,55,0.3)',
          left: isOpen ? '268px' : '2px',
        }}
        title="Card Reference"
      >
        <span className="text-amber-300 text-sm">{isOpen ? '\u2039' : '\u203A'}</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="absolute left-0 top-0 bottom-0 z-20 w-[268px] overflow-y-auto"
          style={{
            background: 'rgba(15,10,5,0.95)',
            borderRight: '1px solid rgba(212,175,55,0.3)',
          }}
        >
          <div className="p-3">
            <h3 className="text-amber-400 font-bold text-sm mb-3 font-serif">Card Reference</h3>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(val => (
                <div key={val} className="flex gap-2 items-start p-2 rounded" style={{ background: 'rgba(212,175,55,0.05)' }}>
                  <Card value={val} small />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-200 text-xs font-bold">{CARD_NAMES[val]}</span>
                      <span className="text-amber-500/60 text-[10px]">x{CARD_COUNTS[val]}</span>
                    </div>
                    <p className="text-amber-100/50 text-[10px] leading-tight mt-0.5">{CARD_EFFECTS[val]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ==========================================
// Action Banner
// ==========================================

function ActionBanner({
  state,
  currentUserId,
  players,
}: {
  state: LoveLetterState
  currentUserId: string
  players: GameComponentProps['players']
}) {
  const isMyTurn = currentPlayerId(state) === currentUserId
  const currentName = getPlayerName(currentPlayerId(state), players)

  let message = ''
  let subMessage = ''

  switch (state.phase) {
    case 'PLAY_CARD':
      if (isMyTurn) {
        message = 'Your turn — play a card'
        if (state.hands[currentUserId]?.length === 2) {
          const hand = state.hands[currentUserId]
          if (hand.includes(7) && (hand.includes(5) || hand.includes(6))) {
            subMessage = 'You must play the Countess!'
          }
        }
      } else {
        message = `${currentName}'s turn`
      }
      break
    case 'SELECT_TARGET':
      if (state.pendingEffect?.playerId === currentUserId) {
        message = `Select a target for ${CARD_NAMES[state.pendingEffect.card]}`
      } else {
        message = `${currentName} is choosing a target...`
      }
      break
    case 'RESOLVE_GUARD':
      if (state.pendingEffect?.playerId === currentUserId) {
        message = 'Name a card (not Guard)'
      } else {
        message = `${currentName} is making a guess...`
      }
      break
    case 'RESOLVE_PRIEST':
      if (state.priestReveal?.viewerId === currentUserId) {
        message = 'Peek at their card'
      } else {
        message = `${currentName} is peeking at a card...`
      }
      break
    case 'RESOLVE_BARON':
      if (state.pendingEffect?.playerId === currentUserId) {
        message = 'Baron comparison'
      } else {
        message = 'Baron comparison in progress...'
      }
      break
    case 'ROUND_OVER':
      message = `Round ${state.roundNumber} over!`
      subMessage = state.roundWinner
        ? `${getPlayerName(state.roundWinner, players)} wins the round`
        : ''
      break
    case 'GAME_OVER':
      message = 'Game Over!'
      subMessage = state.gameWinner
        ? `${getPlayerName(state.gameWinner, players)} wins!`
        : ''
      break
  }

  return (
    <div
      className="text-center py-2 px-4 shrink-0"
      style={{
        background: isMyTurn && state.phase !== 'ROUND_OVER' && state.phase !== 'GAME_OVER'
          ? 'rgba(212,175,55,0.15)'
          : 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(212,175,55,0.2)',
      }}
    >
      <p className="text-amber-200 font-bold text-sm font-serif">{message}</p>
      {subMessage && <p className="text-amber-400/70 text-xs">{subMessage}</p>}
    </div>
  )
}

// ==========================================
// Round Info Panel
// ==========================================

function RoundInfoPanel({
  state,
  players,
}: {
  state: LoveLetterState
  players: GameComponentProps['players']
}) {
  const alive = state.playerOrder.filter(id => !state.eliminated.includes(id))

  return (
    <div
      className="w-40 shrink-0 p-3 flex flex-col gap-3 overflow-y-auto"
      style={{
        background: 'rgba(0,0,0,0.2)',
        borderLeft: '1px solid rgba(212,175,55,0.15)',
      }}
    >
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold mb-1">Round</h4>
        <p className="text-amber-200 font-bold text-lg font-serif">{state.roundNumber}</p>
      </div>

      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold mb-1">Tokens to Win</h4>
        <p className="text-amber-200 text-sm">{state.tokensToWin}</p>
      </div>

      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold mb-2">Scoreboard</h4>
        <div className="space-y-1.5">
          {state.playerOrder.map(id => (
            <div key={id} className="flex items-center justify-between text-xs">
              <span className={`truncate mr-1 ${state.eliminated.includes(id) ? 'text-red-400/50 line-through' : 'text-amber-100/80'}`}>
                {getPlayerName(id, players)}
              </span>
              <span className="flex gap-0.5 shrink-0">
                {Array.from({ length: state.tokens[id] || 0 }).map((_, i) => (
                  <span key={i} className="text-red-400 text-xs">&#x2764;</span>
                ))}
                {(state.tokens[id] || 0) === 0 && <span className="text-amber-700/40">0</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold mb-1">Alive</h4>
        <p className="text-amber-200 text-sm">{alive.length} / {state.playerOrder.length}</p>
      </div>

      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold mb-1">Deck</h4>
        <p className="text-amber-200 text-sm">{state.deck.length} cards</p>
      </div>

      {/* Face-up removed cards (2-player) */}
      {state.faceUpRemoved && state.faceUpRemoved.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold mb-1">Set Aside</h4>
          <div className="flex gap-0.5 flex-wrap">
            {state.faceUpRemoved.map((card, i) => (
              <Card key={i} value={card} small />
            ))}
          </div>
        </div>
      )}

      {/* Recent log */}
      <div className="mt-auto">
        <h4 className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold mb-1">Log</h4>
        <div className="space-y-0.5 max-h-32 overflow-y-auto">
          {state.log.slice(-6).map((entry, i) => (
            <p key={i} className="text-[10px] text-amber-100/40 leading-tight">{entry}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// Target Selector Overlay
// ==========================================

function TargetSelector({
  state,
  players,
  currentUserId,
  onMove,
}: {
  state: LoveLetterState
  players: GameComponentProps['players']
  currentUserId: string
  onMove: GameComponentProps['onMove']
}) {
  if (state.phase !== 'SELECT_TARGET' || state.pendingEffect?.playerId !== currentUserId) return null

  const card = state.pendingEffect.card
  const alive = state.playerOrder.filter(id => !state.eliminated.includes(id))
  const targets = card === 5
    ? alive.filter(id => !state.protected.includes(id) || id === currentUserId)
    : alive.filter(id => id !== currentUserId && !state.protected.includes(id))

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ background: '#1a0f0a', border: '2px solid #D4AF37' }}>
        <h3 className="text-amber-300 font-bold text-lg font-serif mb-1 text-center">
          {CARD_NAMES[card]} — Choose Target
        </h3>
        <p className="text-amber-100/50 text-xs text-center mb-4">{CARD_EFFECTS[card]}</p>
        <div className="grid grid-cols-2 gap-2">
          {targets.map(id => (
            <button
              key={id}
              onClick={() => onMove({ type: 'SELECT_TARGET', targetId: id })}
              className="px-4 py-3 rounded-lg font-medium text-sm transition-all"
              style={{
                background: id === currentUserId ? '#2b3d2b' : '#3d2b2b',
                border: '1px solid rgba(212,175,55,0.3)',
                color: '#D4C4A8',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#D4AF37'
                e.currentTarget.style.background = id === currentUserId ? '#3a4d3a' : '#4d3a3a'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'
                e.currentTarget.style.background = id === currentUserId ? '#2b3d2b' : '#3d2b2b'
              }}
            >
              {getPlayerName(id, players)}
              {id === currentUserId && ' (self)'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// Guard Guess Modal
// ==========================================

function GuardGuessModal({
  state,
  currentUserId,
  onMove,
}: {
  state: LoveLetterState
  currentUserId: string
  onMove: GameComponentProps['onMove']
}) {
  if (state.phase !== 'RESOLVE_GUARD' || state.pendingEffect?.playerId !== currentUserId) return null

  const guessableCards = [2, 3, 4, 5, 6, 7, 8]

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-xl p-6 max-w-lg w-full mx-4" style={{ background: '#1a0f0a', border: '2px solid #D4AF37' }}>
        <h3 className="text-amber-300 font-bold text-lg font-serif mb-1 text-center">Guard — Name a Card</h3>
        <p className="text-amber-100/50 text-xs text-center mb-4">
          If the target has this card, they are eliminated.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {guessableCards.map(val => (
            <button
              key={val}
              onClick={() => onMove({ type: 'GUARD_GUESS', guess: val })}
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:scale-105"
              style={{
                background: CARD_COLORS[val].bg,
                border: `1px solid ${CARD_COLORS[val].border}`,
              }}
            >
              <span className="text-lg font-black" style={{ color: '#D4AF37' }}>{val}</span>
              <span className="text-[10px] font-bold" style={{ color: CARD_COLORS[val].text, fontFamily: 'Georgia, serif' }}>
                {CARD_NAMES[val]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// Priest Reveal Overlay
// ==========================================

function PriestRevealOverlay({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: LoveLetterState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  if (state.phase !== 'RESOLVE_PRIEST' || state.priestReveal?.viewerId !== currentUserId) return null

  const { targetId, card } = state.priestReveal

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-xl p-6 max-w-sm w-full mx-4 text-center" style={{ background: '#1a0f0a', border: '2px solid #D4AF37' }}>
        <h3 className="text-amber-300 font-bold text-lg font-serif mb-3">Priest — Peek</h3>
        <p className="text-amber-100/60 text-sm mb-4">
          {getPlayerName(targetId, players)}'s hand:
        </p>
        <div className="flex justify-center mb-4">
          <Card value={card} />
        </div>
        <button
          onClick={() => onMove({ type: 'ACKNOWLEDGE' })}
          className="px-6 py-2 rounded-lg font-bold text-sm transition-all"
          style={{ background: '#D4AF37', color: '#1a0f0a' }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}

// ==========================================
// Baron Reveal Overlay
// ==========================================

function BaronRevealOverlay({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: LoveLetterState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  if (state.phase !== 'RESOLVE_BARON' || state.pendingEffect?.playerId !== currentUserId) return null
  if (!state.baronResult) return null

  const { winnerId, loserId, card1, card2 } = state.baronResult
  const targetId = state.pendingEffect.targetId!

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-xl p-6 max-w-md w-full mx-4 text-center" style={{ background: '#1a0f0a', border: '2px solid #D4AF37' }}>
        <h3 className="text-amber-300 font-bold text-lg font-serif mb-4">Baron — Comparison</h3>
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-amber-100/80 text-xs font-bold">You</span>
            <Card value={card1} />
            {winnerId === currentUserId && <span className="text-green-400 text-xs font-bold">Winner</span>}
            {loserId === currentUserId && <span className="text-red-400 text-xs font-bold">Eliminated</span>}
          </div>
          <span className="text-amber-500 text-2xl font-serif font-bold">vs</span>
          <div className="flex flex-col items-center gap-2">
            <span className="text-amber-100/80 text-xs font-bold">{getPlayerName(targetId, players)}</span>
            <Card value={card2} />
            {winnerId === targetId && <span className="text-green-400 text-xs font-bold">Winner</span>}
            {loserId === targetId && <span className="text-red-400 text-xs font-bold">Eliminated</span>}
          </div>
        </div>
        {!winnerId && <p className="text-amber-100/60 text-sm mb-3">Tie — no one is eliminated.</p>}
        <button
          onClick={() => onMove({ type: 'ACKNOWLEDGE' })}
          className="px-6 py-2 rounded-lg font-bold text-sm transition-all"
          style={{ background: '#D4AF37', color: '#1a0f0a' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ==========================================
// Round Over Overlay
// ==========================================

function RoundOverOverlay({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: LoveLetterState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  if (state.phase !== 'ROUND_OVER') return null

  const isReady = state.readyPlayers.includes(currentUserId)
  const readyCount = state.readyPlayers.length
  const totalPlayers = state.playerOrder.length

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-xl p-6 max-w-md w-full mx-4 text-center" style={{ background: '#1a0f0a', border: '2px solid #D4AF37' }}>
        <h3 className="text-amber-300 font-bold text-2xl font-serif mb-2">Round {state.roundNumber} Complete</h3>
        {state.roundWinner && (
          <p className="text-amber-100 text-lg mb-4">
            <span className="font-bold">{getPlayerName(state.roundWinner, players)}</span> earns a token of affection!
            <span className="text-red-400 ml-1">&#x2764;</span>
          </p>
        )}

        {/* Show all hands */}
        <div className="space-y-2 mb-4">
          <h4 className="text-amber-500/60 text-xs font-bold uppercase tracking-wider">Final Hands</h4>
          {state.playerOrder.map(id => {
            const hand = state.hands[id] || []
            const isOut = state.eliminated.includes(id)
            return (
              <div key={id} className={`flex items-center justify-between px-3 py-1.5 rounded ${isOut ? 'opacity-40' : ''}`}
                style={{ background: 'rgba(212,175,55,0.05)' }}>
                <span className="text-amber-100/80 text-sm">
                  {getPlayerName(id, players)}
                  {id === currentUserId && ' (you)'}
                </span>
                <div className="flex items-center gap-2">
                  {isOut ? (
                    <span className="text-red-400 text-xs">Out</span>
                  ) : hand.length > 0 ? (
                    <div className="flex gap-1">
                      {hand.map((card, i) => <Card key={i} value={card} small />)}
                    </div>
                  ) : null}
                  <span className="text-red-400 text-xs ml-1">
                    {Array.from({ length: state.tokens[id] || 0 }).map((_, i) => (
                      <span key={i}>&#x2764;</span>
                    ))}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => onMove({ type: 'READY_NEXT_ROUND' })}
          disabled={isReady}
          className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
            isReady ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'
          }`}
          style={{
            background: isReady ? '#555' : '#D4AF37',
            color: isReady ? '#999' : '#1a0f0a',
          }}
        >
          {isReady ? 'Waiting...' : 'Next Round'}
        </button>
        <p className="text-amber-500/50 text-xs mt-2">{readyCount} / {totalPlayers} ready</p>
      </div>
    </div>
  )
}

// ==========================================
// Game Over Overlay
// ==========================================

function GameOverOverlay({
  state,
  currentUserId,
  players,
}: {
  state: LoveLetterState
  currentUserId: string
  players: GameComponentProps['players']
}) {
  if (state.phase !== 'GAME_OVER') return null

  const isWinner = state.gameWinner === currentUserId

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-xl p-8 max-w-md w-full mx-4 text-center" style={{
        background: isWinner
          ? 'linear-gradient(135deg, #2a1a0a 0%, #3d2b1a 50%, #2a1a0a 100%)'
          : '#1a0f0a',
        border: `2px solid ${isWinner ? '#D4AF37' : '#8B7355'}`,
        boxShadow: isWinner ? '0 0 40px rgba(212,175,55,0.2)' : 'none',
      }}>
        <div className="text-5xl mb-3">{isWinner ? '\u2764\uFE0F' : '\uD83D\uDC8C'}</div>
        <h2 className="text-amber-300 font-black text-3xl font-serif mb-2">
          {isWinner ? 'Victory!' : 'Game Over'}
        </h2>
        {state.gameWinner && (
          <p className="text-amber-100 text-lg mb-4">
            {isWinner
              ? 'Your love letter reached the Princess!'
              : `${getPlayerName(state.gameWinner, players)}'s letter reached the Princess first.`}
          </p>
        )}

        {/* Final scores */}
        <div className="space-y-1.5 mb-4">
          <h4 className="text-amber-500/60 text-xs font-bold uppercase tracking-wider">Final Scores</h4>
          {state.playerOrder
            .sort((a, b) => (state.tokens[b] || 0) - (state.tokens[a] || 0))
            .map(id => (
              <div key={id} className="flex items-center justify-between px-3 py-1.5 rounded"
                style={{ background: id === state.gameWinner ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.03)' }}>
                <span className={`text-sm ${id === state.gameWinner ? 'text-amber-300 font-bold' : 'text-amber-100/70'}`}>
                  {getPlayerName(id, players)}
                  {id === currentUserId && ' (you)'}
                </span>
                <span className="flex gap-0.5">
                  {Array.from({ length: state.tokens[id] || 0 }).map((_, i) => (
                    <span key={i} className="text-red-400">&#x2764;</span>
                  ))}
                </span>
              </div>
            ))}
        </div>

        <p className="text-amber-500/40 text-xs">Game lasted {state.roundNumber} round{state.roundNumber !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}

// ==========================================
// Player Hand Area
// ==========================================

function PlayerHandArea({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: LoveLetterState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const hand = state.hands[currentUserId] || []
  const discards = state.discards[currentUserId] || []
  const isMyTurn = currentPlayerId(state) === currentUserId
  const canPlay = state.phase === 'PLAY_CARD' && isMyTurn && hand.length === 2
  const isEliminated = state.eliminated.includes(currentUserId)
  const isProtected = state.protected.includes(currentUserId)
  const tokenCount = state.tokens[currentUserId] || 0

  // Check Countess rule
  const countessForced = canPlay && hand.includes(7) && (hand.includes(5) || hand.includes(6))
  const forcedIndex = countessForced ? hand.indexOf(7) : -1

  const handleCardClick = (index: number) => {
    if (!canPlay) return
    if (countessForced && index !== forcedIndex) return

    if (selectedIndex === index) {
      // Confirm play
      onMove({ type: 'PLAY_CARD', cardIndex: index })
      setSelectedIndex(null)
    } else {
      setSelectedIndex(index)
    }
  }

  // Reset selection when hand changes
  React.useEffect(() => {
    setSelectedIndex(null)
  }, [hand.length, state.phase])

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Player label */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          isMyTurn ? 'bg-amber-600/40 text-amber-200 ring-1 ring-amber-500/50' : 'bg-black/30 text-amber-100/80'
        }`}>
          You
          {tokenCount > 0 && (
            <span className="ml-1">
              {Array.from({ length: tokenCount }).map((_, i) => (
                <span key={i} className="text-red-400">&#x2764;</span>
              ))}
            </span>
          )}
          {isProtected && <span className="ml-1">&#x1F6E1;</span>}
          {isEliminated && <span className="ml-1 text-red-400">OUT</span>}
        </span>
      </div>

      {/* Discards */}
      {discards.length > 0 && (
        <div className="flex gap-1 mb-1">
          {discards.map((card, i) => (
            <Card key={i} value={card} small />
          ))}
        </div>
      )}

      {/* Hand */}
      {!isEliminated && hand.length > 0 && (
        <div className="flex gap-3 items-end">
          {hand.map((card, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Card
                value={card}
                clickable={canPlay && (!countessForced || i === forcedIndex)}
                selected={selectedIndex === i}
                disabled={countessForced && i !== forcedIndex}
                onClick={() => handleCardClick(i)}
              />
              {selectedIndex === i && (
                <span className="text-[10px] text-amber-400 font-bold animate-pulse">Click to play</span>
              )}
            </div>
          ))}
        </div>
      )}

      {isEliminated && (
        <p className="text-red-400/60 text-xs font-medium">You have been eliminated this round</p>
      )}
    </div>
  )
}

// ==========================================
// Game Table (Central Area)
// ==========================================

function GameTable({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: LoveLetterState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  const opponents = state.playerOrder.filter(id => id !== currentUserId)
  const playerCount = state.playerOrder.length

  // Position opponents based on count
  const getOpponentLayout = () => {
    if (playerCount === 2) {
      return (
        <div className="flex justify-center">
          <OpponentArea playerId={opponents[0]} state={state} players={players} position="top" />
        </div>
      )
    }
    if (playerCount === 3) {
      return (
        <div className="flex justify-around">
          <OpponentArea playerId={opponents[0]} state={state} players={players} position="left" />
          <OpponentArea playerId={opponents[1]} state={state} players={players} position="right" />
        </div>
      )
    }
    // 4 players
    return (
      <div className="flex justify-around items-start">
        <OpponentArea playerId={opponents[0]} state={state} players={players} position="left" />
        <OpponentArea playerId={opponents[1]} state={state} players={players} position="top" />
        <OpponentArea playerId={opponents[2]} state={state} players={players} position="right" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-4 min-h-0 overflow-hidden relative">
      {/* Opponents (top) */}
      <div className="shrink-0">
        {getOpponentLayout()}
      </div>

      {/* Center: Deck */}
      <div className="flex justify-center items-center py-2">
        <DeckPile count={state.deck.length} />
      </div>

      {/* Player hand (bottom) */}
      <div className="shrink-0">
        <PlayerHandArea
          state={state}
          currentUserId={currentUserId}
          players={players}
          onMove={onMove}
        />
      </div>

      {/* Overlays */}
      <TargetSelector state={state} players={players} currentUserId={currentUserId} onMove={onMove} />
      <GuardGuessModal state={state} currentUserId={currentUserId} onMove={onMove} />
      <PriestRevealOverlay state={state} currentUserId={currentUserId} players={players} onMove={onMove} />
      <BaronRevealOverlay state={state} currentUserId={currentUserId} players={players} onMove={onMove} />
      <RoundOverOverlay state={state} currentUserId={currentUserId} players={players} onMove={onMove} />
      <GameOverOverlay state={state} currentUserId={currentUserId} players={players} />
    </div>
  )
}

// ==========================================
// Main Component
// ==========================================

export default function LoveLetterGame({
  gameState,
  currentUserId,
  onMove,
  players,
}: GameComponentProps) {
  const state = gameState as LoveLetterState
  const [showCardRef, setShowCardRef] = useState(false)

  return (
    <div
      className="flex h-full rounded-xl overflow-hidden relative"
      style={{
        background: 'radial-gradient(ellipse at center, #4a1a1a 0%, #2a0a0a 60%, #1a0505 100%)',
        border: '2px solid #8B7355',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
      }}
    >
      {/* Damask pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(212,175,55,0.3) 20px, rgba(212,175,55,0.3) 21px),
            repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(212,175,55,0.3) 20px, rgba(212,175,55,0.3) 21px)`,
        }}
      />

      {/* Card reference panel */}
      <CardReferencePanel isOpen={showCardRef} onToggle={() => setShowCardRef(!showCardRef)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10" style={{ marginLeft: showCardRef ? '268px' : '0' }}>
        <ActionBanner state={state} currentUserId={currentUserId} players={players} />
        <GameTable state={state} currentUserId={currentUserId} players={players} onMove={onMove} />
      </div>

      {/* Round info panel */}
      <RoundInfoPanel state={state} players={players} />
    </div>
  )
}
