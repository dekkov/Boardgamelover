import React from 'react'
import type { GameComponentProps } from '../../src/types/plugin'

// ==========================================
// Types
// ==========================================

type Role = 'werewolf' | 'seer' | 'medic' | 'villager'
type Phase =
  | 'ROLE_REVEAL'
  | 'NIGHT_WEREWOLF'
  | 'NIGHT_SEER'
  | 'NIGHT_MEDIC'
  | 'DAY_ANNOUNCE'
  | 'DAY_DISCUSSION'
  | 'DAY_VOTE'
  | 'VOTE_RESULT'
  | 'GAME_OVER'

interface WerewolfState {
  phase: Phase
  round: number
  roles: Record<string, Role>
  alive: Record<string, boolean>
  playerOrder: string[]
  nightActions: {
    werewolfTarget: string | null
    werewolfVotes: Record<string, string>
    seerTarget: string | null
    seerResult: Role | null
    medicTarget: string | null
  }
  dayActions: {
    killedTonight: string | null
    votes: Record<string, string | null>
    votingComplete: boolean
    eliminatedToday: string | null
    isTie: boolean
  }
  readyPlayers: string[]
  seerKnowledge: Record<string, Role>
  winner: 'villagers' | 'werewolves' | null
  log: Array<{ round: number; event: string }>
}

// ==========================================
// Helpers
// ==========================================

const ROLE_INFO: Record<Role, { label: string; emoji: string; description: string; color: string }> = {
  werewolf: {
    label: 'Werewolf',
    emoji: '\uD83D\uDC3A',
    description: 'Each night, choose a villager to eliminate. Stay hidden during the day.',
    color: 'text-red-400',
  },
  seer: {
    label: 'Seer',
    emoji: '\uD83D\uDD2E',
    description: 'Each night, learn the true role of one player. Use this knowledge wisely.',
    color: 'text-purple-400',
  },
  medic: {
    label: 'Medic',
    emoji: '\uD83D\uDC89',
    description: 'Each night, protect one player from elimination. You can protect yourself.',
    color: 'text-green-400',
  },
  villager: {
    label: 'Villager',
    emoji: '\uD83C\uDFE0',
    description: 'Work together during the day to identify and vote out the werewolves.',
    color: 'text-blue-400',
  },
}

function getPlayerName(playerId: string, players: GameComponentProps['players']): string {
  const p = players.find(pl => pl.user_id === playerId)
  return p?.profile?.display_name || p?.profile?.username || playerId.slice(0, 8)
}

// ==========================================
// Sub-Components
// ==========================================

function PlayerList({
  state,
  players,
  currentUserId,
}: {
  state: WerewolfState
  players: GameComponentProps['players']
  currentUserId: string
}) {
  const myRole = state.roles[currentUserId]
  const isDead = !state.alive[currentUserId]

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Players</h3>
      {state.playerOrder.map(id => {
        const alive = state.alive[id]
        const name = getPlayerName(id, players)
        const isMe = id === currentUserId
        const role = state.roles[id]

        // Show roles to: werewolves see fellow werewolves, seer sees checked players, dead see all, game over shows all
        let showRole = false
        let roleLabel = ''
        if (state.phase === 'GAME_OVER' || isDead) {
          showRole = true
          roleLabel = ROLE_INFO[role].emoji
        } else if (isMe) {
          showRole = true
          roleLabel = ROLE_INFO[role].emoji
        } else if (myRole === 'werewolf' && role === 'werewolf') {
          showRole = true
          roleLabel = ROLE_INFO[role].emoji
        } else if (myRole === 'seer' && state.seerKnowledge[id]) {
          showRole = true
          roleLabel = ROLE_INFO[state.seerKnowledge[id]].emoji
        }

        return (
          <div
            key={id}
            className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
              !alive ? 'opacity-40 line-through' : ''
            } ${isMe ? 'bg-white/10 font-semibold' : ''}`}
          >
            <span className="w-5 text-center">{showRole ? roleLabel : '\u2753'}</span>
            <span className={alive ? 'text-slate-200' : 'text-slate-500'}>{name}</span>
            {isMe && <span className="text-xs text-slate-500">(you)</span>}
            {!alive && <span className="text-xs text-red-400 ml-auto">dead</span>}
          </div>
        )
      })}
    </div>
  )
}

function ReadyButton({
  state,
  currentUserId,
  onMove,
  label = 'Ready',
}: {
  state: WerewolfState
  currentUserId: string
  onMove: GameComponentProps['onMove']
  label?: string
}) {
  const isReady = state.readyPlayers.includes(currentUserId)
  const living = state.playerOrder.filter(id => state.alive[id])
  const readyCount = state.readyPlayers.filter(id => living.includes(id)).length

  return (
    <div className="text-center space-y-2">
      <button
        onClick={() => onMove({ type: 'READY_CONTINUE' })}
        disabled={isReady}
        className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${
          isReady
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {isReady ? 'Waiting...' : label}
      </button>
      <p className="text-sm text-slate-400">
        {readyCount} / {living.length} ready
      </p>
    </div>
  )
}

function TargetSelector({
  targets,
  players,
  onSelect,
  label,
  buttonColor = 'bg-red-600 hover:bg-red-500',
}: {
  targets: string[]
  players: GameComponentProps['players']
  onSelect: (targetId: string) => void
  label: string
  buttonColor?: string
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300 font-semibold">{label}</p>
      <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
        {targets.map(id => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`px-4 py-3 rounded-lg font-medium text-white transition-all ${buttonColor} shadow`}
          >
            {getPlayerName(id, players)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// Phase Renderers
// ==========================================

function RoleRevealPhase({
  state,
  currentUserId,
  onMove,
}: {
  state: WerewolfState
  currentUserId: string
  onMove: GameComponentProps['onMove']
}) {
  const myRole = state.roles[currentUserId]
  const info = ROLE_INFO[myRole]

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
      <p className="text-sm uppercase tracking-widest text-slate-400">Your secret role is...</p>
      <div className="text-8xl">{info.emoji}</div>
      <h2 className={`text-4xl font-black ${info.color}`}>{info.label}</h2>
      <p className="text-slate-300 max-w-sm">{info.description}</p>
      {myRole === 'werewolf' && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 max-w-sm">
          <p className="text-red-300 text-sm">
            Fellow werewolves are marked with {ROLE_INFO.werewolf.emoji} in the player list.
          </p>
        </div>
      )}
      <ReadyButton state={state} currentUserId={currentUserId} onMove={onMove} label="Ready to begin" />
    </div>
  )
}

function NightWerewolfPhase({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: WerewolfState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  const isWerewolf = state.roles[currentUserId] === 'werewolf' && state.alive[currentUserId]
  const hasVoted = !!state.nightActions.werewolfVotes[currentUserId]

  if (!isWerewolf) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <div className="text-6xl animate-pulse">\uD83C\uDF19</div>
        <h2 className="text-2xl font-bold text-indigo-300">The village sleeps...</h2>
        <p className="text-slate-400">Werewolves are choosing their victim.</p>
      </div>
    )
  }

  if (hasVoted) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <div className="text-6xl">\uD83D\uDC3A</div>
        <h2 className="text-2xl font-bold text-red-400">Vote submitted</h2>
        <p className="text-slate-400">Waiting for other werewolves...</p>
      </div>
    )
  }

  const targets = state.playerOrder.filter(
    id => state.alive[id] && state.roles[id] !== 'werewolf'
  )

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="text-6xl">\uD83D\uDC3A</div>
      <h2 className="text-2xl font-bold text-red-400">Choose your victim</h2>
      <TargetSelector
        targets={targets}
        players={players}
        onSelect={(target) => onMove({ type: 'WEREWOLF_KILL', target })}
        label="Select a player to attack:"
        buttonColor="bg-red-700 hover:bg-red-600"
      />
    </div>
  )
}

function NightSeerPhase({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: WerewolfState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  const isSeer = state.roles[currentUserId] === 'seer' && state.alive[currentUserId]

  if (!isSeer) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <div className="text-6xl animate-pulse">\uD83C\uDF19</div>
        <h2 className="text-2xl font-bold text-indigo-300">The village sleeps...</h2>
        <p className="text-slate-400">The Seer gazes into the crystal ball.</p>
      </div>
    )
  }

  const targets = state.playerOrder.filter(
    id => state.alive[id] && id !== currentUserId
  )

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="text-6xl">\uD83D\uDD2E</div>
      <h2 className="text-2xl font-bold text-purple-400">Seer's Vision</h2>
      {Object.keys(state.seerKnowledge).length > 0 && (
        <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3 max-w-sm">
          <p className="text-xs text-purple-300 font-semibold mb-1">Previous visions:</p>
          {Object.entries(state.seerKnowledge).map(([id, role]) => (
            <p key={id} className="text-sm text-purple-200">
              {getPlayerName(id, players)} is {ROLE_INFO[role].emoji} {ROLE_INFO[role].label}
            </p>
          ))}
        </div>
      )}
      <TargetSelector
        targets={targets}
        players={players}
        onSelect={(target) => onMove({ type: 'SEER_CHECK', target })}
        label="Choose a player to investigate:"
        buttonColor="bg-purple-700 hover:bg-purple-600"
      />
    </div>
  )
}

function NightMedicPhase({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: WerewolfState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  const isMedic = state.roles[currentUserId] === 'medic' && state.alive[currentUserId]

  if (!isMedic) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <div className="text-6xl animate-pulse">\uD83C\uDF19</div>
        <h2 className="text-2xl font-bold text-indigo-300">The village sleeps...</h2>
        <p className="text-slate-400">The Medic is making their rounds.</p>
      </div>
    )
  }

  const targets = state.playerOrder.filter(id => state.alive[id])

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="text-6xl">\uD83D\uDC89</div>
      <h2 className="text-2xl font-bold text-green-400">Medic's Protection</h2>
      <TargetSelector
        targets={targets}
        players={players}
        onSelect={(target) => onMove({ type: 'MEDIC_SAVE', target })}
        label="Choose a player to protect tonight:"
        buttonColor="bg-green-700 hover:bg-green-600"
      />
    </div>
  )
}

function DayAnnouncePhase({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: WerewolfState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  const killed = state.dayActions.killedTonight

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
      <div className="text-6xl">\u2600\uFE0F</div>
      <h2 className="text-2xl font-bold text-amber-400">Dawn breaks...</h2>
      {killed ? (
        <div className="space-y-2">
          <p className="text-xl text-red-300">
            <span className="font-bold">{getPlayerName(killed, players)}</span> was found dead.
          </p>
          <p className="text-slate-400">They were a {ROLE_INFO[state.roles[killed]].emoji} {ROLE_INFO[state.roles[killed]].label}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xl text-green-300 font-bold">No one died last night!</p>
          <p className="text-slate-400">The medic saved someone, or the wolves missed.</p>
        </div>
      )}
      {state.alive[currentUserId] && (
        <ReadyButton state={state} currentUserId={currentUserId} onMove={onMove} label="Continue" />
      )}
    </div>
  )
}

function DayDiscussionPhase({
  state,
  currentUserId,
  onMove,
}: {
  state: WerewolfState
  currentUserId: string
  onMove: GameComponentProps['onMove']
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
      <div className="text-6xl">\uD83D\uDCAC</div>
      <h2 className="text-2xl font-bold text-amber-400">Day Discussion</h2>
      <p className="text-slate-300 max-w-md">
        Use the chat to discuss who you think the werewolves are. When ready, vote to move to the elimination vote.
      </p>
      <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-3 max-w-sm">
        <p className="text-amber-300 text-sm">Round {state.round} - Day Phase</p>
      </div>
      {state.alive[currentUserId] && (
        <ReadyButton state={state} currentUserId={currentUserId} onMove={onMove} label="Ready to Vote" />
      )}
    </div>
  )
}

function DayVotePhase({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: WerewolfState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  const hasVoted = state.dayActions.votes[currentUserId] !== undefined
  const living = state.playerOrder.filter(id => state.alive[id])
  const votedCount = living.filter(id => state.dayActions.votes[id] !== undefined).length

  if (!state.alive[currentUserId]) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <div className="text-6xl">\uD83D\uDDF3\uFE0F</div>
        <h2 className="text-2xl font-bold text-amber-400">Village Vote</h2>
        <p className="text-slate-400">You are dead. Watching the vote...</p>
        <p className="text-sm text-slate-500">{votedCount} / {living.length} voted</p>
      </div>
    )
  }

  if (hasVoted) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <div className="text-6xl">\uD83D\uDDF3\uFE0F</div>
        <h2 className="text-2xl font-bold text-amber-400">Vote cast</h2>
        <p className="text-slate-400">Waiting for others to vote...</p>
        <p className="text-sm text-slate-500">{votedCount} / {living.length} voted</p>
      </div>
    )
  }

  const targets = living.filter(id => id !== currentUserId)

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="text-6xl">\uD83D\uDDF3\uFE0F</div>
      <h2 className="text-2xl font-bold text-amber-400">Village Vote</h2>
      <TargetSelector
        targets={targets}
        players={players}
        onSelect={(target) => onMove({ type: 'CAST_VOTE', target })}
        label="Vote to eliminate:"
        buttonColor="bg-amber-700 hover:bg-amber-600"
      />
      <button
        onClick={() => onMove({ type: 'SKIP_VOTE' })}
        className="px-4 py-2 rounded-lg text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 transition-all text-sm"
      >
        Abstain from voting
      </button>
      <p className="text-sm text-slate-500">{votedCount} / {living.length} voted</p>
    </div>
  )
}

function VoteResultPhase({
  state,
  currentUserId,
  players,
  onMove,
}: {
  state: WerewolfState
  currentUserId: string
  players: GameComponentProps['players']
  onMove: GameComponentProps['onMove']
}) {
  const living = state.playerOrder.filter(id => state.alive[id])

  // Build vote tally for display
  const tally: Record<string, string[]> = {}
  const abstainers: string[] = []
  for (const id of living) {
    const target = state.dayActions.votes[id]
    if (target === null || target === undefined) {
      abstainers.push(id)
    } else {
      if (!tally[target]) tally[target] = []
      tally[target].push(id)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
      <div className="text-6xl">\uD83D\uDCDC</div>
      <h2 className="text-2xl font-bold text-amber-400">Vote Results</h2>

      <div className="space-y-2 max-w-md w-full">
        {Object.entries(tally)
          .sort(([, a], [, b]) => b.length - a.length)
          .map(([target, voters]) => (
            <div key={target} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2">
              <span className="text-slate-200 font-medium">{getPlayerName(target, players)}</span>
              <span className="text-amber-400 font-bold">{voters.length} vote{voters.length !== 1 ? 's' : ''}</span>
            </div>
          ))}
        {abstainers.length > 0 && (
          <p className="text-sm text-slate-500">{abstainers.length} abstained</p>
        )}
      </div>

      {state.dayActions.eliminatedToday ? (
        <div className="space-y-1">
          <p className="text-xl text-red-300">
            <span className="font-bold">{getPlayerName(state.dayActions.eliminatedToday, players)}</span> is eliminated!
          </p>
          <p className="text-slate-400">
            They were a {ROLE_INFO[state.roles[state.dayActions.eliminatedToday]].emoji}{' '}
            {ROLE_INFO[state.roles[state.dayActions.eliminatedToday]].label}.
          </p>
        </div>
      ) : (
        <p className="text-xl text-slate-300 font-bold">Tie vote — no one is eliminated.</p>
      )}

      {state.alive[currentUserId] && (
        <ReadyButton state={state} currentUserId={currentUserId} onMove={onMove} label="Continue" />
      )}
    </div>
  )
}

function GameOverPhase({
  state,
  players,
  currentUserId,
}: {
  state: WerewolfState
  players: GameComponentProps['players']
  currentUserId: string
}) {
  const isWerewolf = state.roles[currentUserId] === 'werewolf'
  const didWin =
    (state.winner === 'werewolves' && isWerewolf) ||
    (state.winner === 'villagers' && !isWerewolf)

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
      <div className="text-8xl">{state.winner === 'werewolves' ? '\uD83D\uDC3A' : '\uD83C\uDF1E'}</div>
      <h2 className="text-3xl font-black text-amber-400">
        {state.winner === 'werewolves' ? 'Werewolves Win!' : 'Villagers Win!'}
      </h2>
      <p className={`text-xl font-bold ${didWin ? 'text-green-400' : 'text-red-400'}`}>
        {didWin ? 'Victory!' : 'Defeat!'}
      </p>

      <div className="space-y-2 max-w-md w-full">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">All Roles Revealed</h3>
        {state.playerOrder.map(id => (
          <div
            key={id}
            className={`flex items-center justify-between rounded-lg px-4 py-2 ${
              state.alive[id] ? 'bg-white/5' : 'bg-white/5 opacity-50'
            }`}
          >
            <span className={`font-medium ${id === currentUserId ? 'text-amber-300' : 'text-slate-200'}`}>
              {getPlayerName(id, players)} {id === currentUserId ? '(you)' : ''}
            </span>
            <span className={ROLE_INFO[state.roles[id]].color}>
              {ROLE_INFO[state.roles[id]].emoji} {ROLE_INFO[state.roles[id]].label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-500">Game lasted {state.round} round{state.round !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ==========================================
// Main Component
// ==========================================

export default function WerewolfGame({
  gameState,
  currentUserId,
  onMove,
  players,
}: GameComponentProps) {
  const state = gameState as WerewolfState
  const isNight = state.phase.startsWith('NIGHT_')
  const isDead = !state.alive[currentUserId]

  const bgClass = isNight
    ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950'
    : state.phase === 'GAME_OVER'
    ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900'
    : 'bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950'

  function renderPhase() {
    switch (state.phase) {
      case 'ROLE_REVEAL':
        return <RoleRevealPhase state={state} currentUserId={currentUserId} onMove={onMove} />
      case 'NIGHT_WEREWOLF':
        return <NightWerewolfPhase state={state} currentUserId={currentUserId} players={players} onMove={onMove} />
      case 'NIGHT_SEER':
        return <NightSeerPhase state={state} currentUserId={currentUserId} players={players} onMove={onMove} />
      case 'NIGHT_MEDIC':
        return <NightMedicPhase state={state} currentUserId={currentUserId} players={players} onMove={onMove} />
      case 'DAY_ANNOUNCE':
        return <DayAnnouncePhase state={state} currentUserId={currentUserId} players={players} onMove={onMove} />
      case 'DAY_DISCUSSION':
        return <DayDiscussionPhase state={state} currentUserId={currentUserId} onMove={onMove} />
      case 'DAY_VOTE':
        return <DayVotePhase state={state} currentUserId={currentUserId} players={players} onMove={onMove} />
      case 'VOTE_RESULT':
        return <VoteResultPhase state={state} currentUserId={currentUserId} players={players} onMove={onMove} />
      case 'GAME_OVER':
        return <GameOverPhase state={state} players={players} currentUserId={currentUserId} />
      default:
        return <p className="text-white">Unknown phase: {state.phase}</p>
    }
  }

  return (
    <div className={`flex h-full rounded-xl border-2 border-slate-700 shadow-inner overflow-hidden ${bgClass}`}>
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r border-slate-700/50 bg-black/20 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">Round {state.round}</p>
          <p className={`text-sm font-bold ${isNight ? 'text-indigo-400' : 'text-amber-400'}`}>
            {state.phase.replace(/_/g, ' ')}
          </p>
        </div>

        <PlayerList state={state} players={players} currentUserId={currentUserId} />

        {isDead && state.phase !== 'GAME_OVER' && (
          <div className="mt-auto bg-red-900/30 border border-red-700/40 rounded-lg p-2 text-center">
            <p className="text-red-300 text-xs font-bold">You are dead</p>
            <p className="text-red-400/60 text-xs">Spectating</p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderPhase()}
      </div>
    </div>
  )
}
