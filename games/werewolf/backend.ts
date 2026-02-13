// ==========================================
// Werewolf Game - Backend Logic
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
    votes: Record<string, string | null> // null = abstain
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
// Role Distribution
// ==========================================

function assignRoles(playerIds: string[]): Record<string, Role> {
  const count = playerIds.length
  const roles: Role[] = []

  if (count <= 6) {
    roles.push('werewolf')
    roles.push('seer')
    for (let i = 2; i < count; i++) roles.push('villager')
  } else if (count === 7) {
    roles.push('werewolf')
    roles.push('seer')
    roles.push('medic')
    for (let i = 3; i < count; i++) roles.push('villager')
  } else {
    roles.push('werewolf', 'werewolf')
    roles.push('seer')
    roles.push('medic')
    for (let i = 4; i < count; i++) roles.push('villager')
  }

  // Shuffle
  const shuffled = [...roles]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const assignment: Record<string, Role> = {}
  playerIds.forEach((id, idx) => {
    assignment[id] = shuffled[idx]
  })
  return assignment
}

// ==========================================
// Win Condition Helpers
// ==========================================

function checkWin(state: WerewolfState): 'villagers' | 'werewolves' | null {
  const livingPlayers = state.playerOrder.filter(id => state.alive[id])
  const livingWerewolves = livingPlayers.filter(id => state.roles[id] === 'werewolf')
  const livingNonWerewolves = livingPlayers.filter(id => state.roles[id] !== 'werewolf')

  if (livingWerewolves.length === 0) return 'villagers'
  if (livingWerewolves.length >= livingNonWerewolves.length) return 'werewolves'
  return null
}

function getLivingPlayersWithRole(state: WerewolfState, role: Role): string[] {
  return state.playerOrder.filter(id => state.alive[id] && state.roles[id] === role)
}

function allLivingPlayers(state: WerewolfState): string[] {
  return state.playerOrder.filter(id => state.alive[id])
}

// ==========================================
// Phase Transition Helpers
// ==========================================

function nextNightPhaseAfterWerewolf(state: WerewolfState): Phase {
  const livingSeer = getLivingPlayersWithRole(state, 'seer')
  if (livingSeer.length > 0) return 'NIGHT_SEER'
  return nextNightPhaseAfterSeer(state)
}

function nextNightPhaseAfterSeer(state: WerewolfState): Phase {
  const livingMedic = getLivingPlayersWithRole(state, 'medic')
  if (livingMedic.length > 0) return 'NIGHT_MEDIC'
  return 'DAY_ANNOUNCE'
}

function resolveNight(state: WerewolfState): WerewolfState {
  const { werewolfTarget, medicTarget } = state.nightActions
  let killedTonight: string | null = null

  if (werewolfTarget && werewolfTarget !== medicTarget) {
    killedTonight = werewolfTarget
  }

  return {
    ...state,
    dayActions: {
      killedTonight,
      votes: {},
      votingComplete: false,
      eliminatedToday: null,
      isTie: false,
    },
    readyPlayers: [],
  }
}

function resolveVotes(state: WerewolfState): WerewolfState {
  const living = allLivingPlayers(state)
  const tally: Record<string, number> = {}

  for (const voterId of living) {
    const target = state.dayActions.votes[voterId]
    if (target) {
      tally[target] = (tally[target] || 0) + 1
    }
  }

  let maxVotes = 0
  let maxTargets: string[] = []
  for (const [target, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count
      maxTargets = [target]
    } else if (count === maxVotes) {
      maxTargets.push(target)
    }
  }

  const isTie = maxTargets.length !== 1
  const eliminated = isTie ? null : maxTargets[0]

  return {
    ...state,
    dayActions: {
      ...state.dayActions,
      votingComplete: true,
      eliminatedToday: eliminated,
      isTie,
    },
    readyPlayers: [],
  }
}

// ==========================================
// Exported Plugin Interface
// ==========================================

export const createInitialState = (
  players: { user_id: string; seat_position: number | null }[]
): WerewolfState => {
  const playerIds = players.map(p => p.user_id)
  const roles = assignRoles(playerIds)
  const alive: Record<string, boolean> = {}
  playerIds.forEach(id => { alive[id] = true })

  return {
    phase: 'ROLE_REVEAL',
    round: 1,
    roles,
    alive,
    playerOrder: playerIds,
    nightActions: {
      werewolfTarget: null,
      werewolfVotes: {},
      seerTarget: null,
      seerResult: null,
      medicTarget: null,
    },
    dayActions: {
      killedTonight: null,
      votes: {},
      votingComplete: false,
      eliminatedToday: null,
      isTie: false,
    },
    readyPlayers: [],
    seerKnowledge: {},
    winner: null,
    log: [{ round: 1, event: 'Game started. Roles assigned.' }],
  }
}

export const validateMove = (state: WerewolfState, playerId: string, move: any): boolean => {
  if (state.winner) return false
  if (!state.alive[playerId] && move.type !== 'READY_CONTINUE') return false
  if (!state.playerOrder.includes(playerId)) return false

  switch (move.type) {
    case 'READY_CONTINUE': {
      const validPhases: Phase[] = ['ROLE_REVEAL', 'DAY_ANNOUNCE', 'DAY_DISCUSSION', 'VOTE_RESULT']
      if (!validPhases.includes(state.phase)) return false
      if (state.readyPlayers.includes(playerId)) return false
      // Dead players can ready during ROLE_REVEAL only (game hasn't started yet)
      if (!state.alive[playerId] && state.phase !== 'ROLE_REVEAL') return false
      return true
    }

    case 'WEREWOLF_KILL': {
      if (state.phase !== 'NIGHT_WEREWOLF') return false
      if (state.roles[playerId] !== 'werewolf') return false
      if (!state.alive[playerId]) return false
      if (state.nightActions.werewolfVotes[playerId]) return false
      if (!move.target || !state.alive[move.target]) return false
      if (state.roles[move.target] === 'werewolf') return false
      return true
    }

    case 'SEER_CHECK': {
      if (state.phase !== 'NIGHT_SEER') return false
      if (state.roles[playerId] !== 'seer') return false
      if (!state.alive[playerId]) return false
      if (!move.target || !state.alive[move.target]) return false
      if (move.target === playerId) return false
      return true
    }

    case 'MEDIC_SAVE': {
      if (state.phase !== 'NIGHT_MEDIC') return false
      if (state.roles[playerId] !== 'medic') return false
      if (!state.alive[playerId]) return false
      if (!move.target || !state.alive[move.target]) return false
      return true
    }

    case 'CAST_VOTE': {
      if (state.phase !== 'DAY_VOTE') return false
      if (!state.alive[playerId]) return false
      if (state.dayActions.votes[playerId] !== undefined) return false
      if (!move.target || !state.alive[move.target]) return false
      return true
    }

    case 'SKIP_VOTE': {
      if (state.phase !== 'DAY_VOTE') return false
      if (!state.alive[playerId]) return false
      if (state.dayActions.votes[playerId] !== undefined) return false
      return true
    }

    default:
      return false
  }
}

export const applyMove = (state: WerewolfState, playerId: string, move: any): WerewolfState => {
  let s = { ...state }

  switch (move.type) {
    case 'READY_CONTINUE': {
      const newReady = [...s.readyPlayers, playerId]
      s = { ...s, readyPlayers: newReady }

      const requiredPlayers = allLivingPlayers(s)
      const allReady = requiredPlayers.every(id => newReady.includes(id))

      if (allReady) {
        switch (s.phase) {
          case 'ROLE_REVEAL':
            s = {
              ...s,
              phase: 'NIGHT_WEREWOLF',
              readyPlayers: [],
              nightActions: {
                werewolfTarget: null,
                werewolfVotes: {},
                seerTarget: null,
                seerResult: null,
                medicTarget: null,
              },
              log: [...s.log, { round: s.round, event: 'Night falls. Werewolves awaken.' }],
            }
            break

          case 'DAY_ANNOUNCE': {
            const winner = checkWin(s)
            if (winner) {
              s = {
                ...s,
                phase: 'GAME_OVER',
                winner,
                readyPlayers: [],
                log: [...s.log, { round: s.round, event: `${winner === 'villagers' ? 'Villagers' : 'Werewolves'} win!` }],
              }
            } else {
              s = {
                ...s,
                phase: 'DAY_DISCUSSION',
                readyPlayers: [],
                log: [...s.log, { round: s.round, event: 'Day discussion begins.' }],
              }
            }
            break
          }

          case 'DAY_DISCUSSION':
            s = {
              ...s,
              phase: 'DAY_VOTE',
              readyPlayers: [],
              dayActions: { ...s.dayActions, votes: {} },
              log: [...s.log, { round: s.round, event: 'Voting begins.' }],
            }
            break

          case 'VOTE_RESULT': {
            // Apply elimination if there was one
            const eliminated = s.dayActions.eliminatedToday
            if (eliminated) {
              s = {
                ...s,
                alive: { ...s.alive, [eliminated]: false },
                log: [...s.log, { round: s.round, event: `${eliminated} was eliminated by vote.` }],
              }
            }

            const winner = checkWin(s)
            if (winner) {
              s = {
                ...s,
                phase: 'GAME_OVER',
                winner,
                readyPlayers: [],
                log: [...s.log, { round: s.round, event: `${winner === 'villagers' ? 'Villagers' : 'Werewolves'} win!` }],
              }
            } else {
              s = {
                ...s,
                phase: 'NIGHT_WEREWOLF',
                round: s.round + 1,
                readyPlayers: [],
                nightActions: {
                  werewolfTarget: null,
                  werewolfVotes: {},
                  seerTarget: null,
                  seerResult: null,
                  medicTarget: null,
                },
                log: [...s.log, { round: s.round + 1, event: 'Night falls again. Werewolves awaken.' }],
              }
            }
            break
          }
        }
      }
      return s
    }

    case 'WEREWOLF_KILL': {
      const newVotes = { ...s.nightActions.werewolfVotes, [playerId]: move.target }
      const livingWerewolves = getLivingPlayersWithRole(s, 'werewolf')
      const allVoted = livingWerewolves.every(id => newVotes[id])

      // Resolve werewolf target: majority or first target if all agree
      let werewolfTarget = s.nightActions.werewolfTarget
      if (allVoted) {
        const tally: Record<string, number> = {}
        for (const target of Object.values(newVotes)) {
          tally[target] = (tally[target] || 0) + 1
        }
        let maxCount = 0
        let maxTarget = move.target
        for (const [t, c] of Object.entries(tally)) {
          if (c > maxCount) {
            maxCount = c
            maxTarget = t
          }
        }
        werewolfTarget = maxTarget
      }

      s = {
        ...s,
        nightActions: { ...s.nightActions, werewolfVotes: newVotes, werewolfTarget },
      }

      if (allVoted) {
        s = { ...s, phase: nextNightPhaseAfterWerewolf(s) }
        if (s.phase === 'DAY_ANNOUNCE') {
          s = resolveNight(s)
          if (s.dayActions.killedTonight) {
            s = {
              ...s,
              alive: { ...s.alive, [s.dayActions.killedTonight]: false },
              log: [...s.log, { round: s.round, event: `Someone was killed during the night.` }],
            }
          } else {
            s = { ...s, log: [...s.log, { round: s.round, event: 'No one died during the night.' }] }
          }
        }
      }
      return s
    }

    case 'SEER_CHECK': {
      const targetRole = s.roles[move.target]
      const newKnowledge = { ...s.seerKnowledge, [move.target]: targetRole }

      s = {
        ...s,
        nightActions: { ...s.nightActions, seerTarget: move.target, seerResult: targetRole },
        seerKnowledge: newKnowledge,
        phase: nextNightPhaseAfterSeer(s),
      }

      if (s.phase === 'DAY_ANNOUNCE') {
        s = resolveNight(s)
        if (s.dayActions.killedTonight) {
          s = {
            ...s,
            alive: { ...s.alive, [s.dayActions.killedTonight]: false },
            log: [...s.log, { round: s.round, event: `Someone was killed during the night.` }],
          }
        } else {
          s = { ...s, log: [...s.log, { round: s.round, event: 'No one died during the night.' }] }
        }
      }
      return s
    }

    case 'MEDIC_SAVE': {
      s = {
        ...s,
        nightActions: { ...s.nightActions, medicTarget: move.target },
        phase: 'DAY_ANNOUNCE',
      }
      s = resolveNight(s)
      if (s.dayActions.killedTonight) {
        s = {
          ...s,
          alive: { ...s.alive, [s.dayActions.killedTonight]: false },
          log: [...s.log, { round: s.round, event: `Someone was killed during the night.` }],
        }
      } else {
        s = { ...s, log: [...s.log, { round: s.round, event: 'No one died during the night.' }] }
      }
      return s
    }

    case 'CAST_VOTE': {
      const newVotes = { ...s.dayActions.votes, [playerId]: move.target }
      s = { ...s, dayActions: { ...s.dayActions, votes: newVotes } }

      const living = allLivingPlayers(s)
      const allVoted = living.every(id => newVotes[id] !== undefined)
      if (allVoted) {
        s = resolveVotes(s)
        s = { ...s, phase: 'VOTE_RESULT' }
      }
      return s
    }

    case 'SKIP_VOTE': {
      const newVotes = { ...s.dayActions.votes, [playerId]: null }
      s = { ...s, dayActions: { ...s.dayActions, votes: newVotes } }

      const living = allLivingPlayers(s)
      const allVoted = living.every(id => newVotes[id] !== undefined)
      if (allVoted) {
        s = resolveVotes(s)
        s = { ...s, phase: 'VOTE_RESULT' }
      }
      return s
    }

    default:
      return s
  }
}

export const checkWinCondition = (state: WerewolfState): string | null => {
  if (state.winner === 'villagers') return 'villagers'
  if (state.winner === 'werewolves') return 'werewolves'
  return null
}

export const getGameStatus = (state: WerewolfState): string =>
  state.winner ? 'finished' : 'in_progress'
