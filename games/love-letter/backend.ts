// ==========================================
// Love Letter Game - Backend Logic
// ==========================================

// Card values and their names/counts
// Guard(1)x5, Priest(2)x2, Baron(3)x2, Handmaid(4)x2,
// Prince(5)x2, King(6)x1, Countess(7)x1, Princess(8)x1

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
  // Multi-round
  tokens: Record<string, number>
  tokensToWin: number
  gameWinner: string | null

  // Round state
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

  // Resolution state
  pendingEffect: PendingEffect | null
  priestReveal: { viewerId: string; targetId: string; card: number } | null
  baronResult: { winnerId: string | null; loserId: string | null; card1: number; card2: number } | null

  roundNumber: number
  roundWinner: string | null
  readyPlayers: string[]
  log: string[]
}

// ==========================================
// Card Definitions
// ==========================================

export const CARD_NAMES: Record<number, string> = {
  1: 'Guard',
  2: 'Priest',
  3: 'Baron',
  4: 'Handmaid',
  5: 'Prince',
  6: 'King',
  7: 'Countess',
  8: 'Princess',
}

export const CARD_COUNTS: Record<number, number> = {
  1: 5, 2: 2, 3: 2, 4: 2, 5: 2, 6: 1, 7: 1, 8: 1,
}

export const CARD_EFFECTS: Record<number, string> = {
  1: 'Name a non-Guard card; if target has it, they are out.',
  2: 'Look at another player\'s hand.',
  3: 'Compare hands; lower value is out.',
  4: 'Immune until your next turn.',
  5: 'Choose a player to discard and draw.',
  6: 'Trade hands with another player.',
  7: 'Must discard if holding King or Prince.',
  8: 'If discarded, you are out.',
}

// Cards that require a target
const TARGET_CARDS = [1, 2, 3, 5, 6]

// ==========================================
// Helpers
// ==========================================

function createDeck(): number[] {
  const deck: number[] = []
  for (const [val, count] of Object.entries(CARD_COUNTS)) {
    for (let i = 0; i < count; i++) {
      deck.push(Number(val))
    }
  }
  return shuffle(deck)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function alivePlayers(state: LoveLetterState): string[] {
  return state.playerOrder.filter(id => !state.eliminated.includes(id))
}

function currentPlayerId(state: LoveLetterState): string {
  return state.playerOrder[state.currentPlayerIndex]
}

function validTargets(state: LoveLetterState, actingPlayer: string, card: number): string[] {
  const alive = alivePlayers(state)
  if (card === 5) {
    // Prince can target self
    return alive.filter(id => !state.protected.includes(id) || id === actingPlayer)
  }
  // All other targeting cards can only target others
  return alive.filter(id => id !== actingPlayer && !state.protected.includes(id))
}

function hasNoValidTargets(state: LoveLetterState, actingPlayer: string, card: number): boolean {
  return validTargets(state, actingPlayer, card).length === 0
}

function mustPlayCountess(hand: number[]): boolean {
  if (!hand.includes(7)) return false
  return hand.includes(5) || hand.includes(6)
}

function advanceTurn(state: LoveLetterState): LoveLetterState {
  let s = { ...state }

  // Clear protection for current player (their protection expires at start of their next turn)
  // Protection is cleared at the START of their next turn, so we clear it now for the player
  // who just finished their turn — they'll get it back if they play Handmaid again

  // Check round end conditions
  const alive = alivePlayers(s)

  // Only 1 player left
  if (alive.length === 1) {
    return endRound(s, alive[0])
  }

  // Deck empty — round ends after this turn
  if (s.deck.length === 0) {
    return endRoundByComparison(s)
  }

  // Move to next alive player
  let nextIndex = (s.currentPlayerIndex + 1) % s.playerOrder.length
  while (s.eliminated.includes(s.playerOrder[nextIndex])) {
    nextIndex = (nextIndex + 1) % s.playerOrder.length
  }

  // Remove protection from the next player (protection lasts until start of their next turn)
  const nextPlayerId = s.playerOrder[nextIndex]
  const newProtected = s.protected.filter(id => id !== nextPlayerId)

  // Auto-draw for next player
  const newDeck = [...s.deck]
  const drawnCard = newDeck.pop()!
  const newHands = { ...s.hands, [nextPlayerId]: [...s.hands[nextPlayerId], drawnCard] }

  s = {
    ...s,
    currentPlayerIndex: nextIndex,
    protected: newProtected,
    phase: 'PLAY_CARD',
    pendingEffect: null,
    priestReveal: null,
    baronResult: null,
    drawnCard: true,
    deck: newDeck,
    hands: newHands,
  }

  // Check if deck is now empty after drawing — the round continues,
  // but if the deck was the last card, round ends after this player's turn
  // (handled when advanceTurn is called again)

  // Check Countess rule: if hand has Countess + King/Prince, must play Countess
  // This is validated in validateMove, not forced here

  return s
}

function endRound(state: LoveLetterState, winnerId: string): LoveLetterState {
  const newTokens = { ...state.tokens, [winnerId]: (state.tokens[winnerId] || 0) + 1 }
  const tokensNeeded = state.tokensToWin

  if (newTokens[winnerId] >= tokensNeeded) {
    return {
      ...state,
      tokens: newTokens,
      roundWinner: winnerId,
      gameWinner: winnerId,
      phase: 'GAME_OVER',
      pendingEffect: null,
      priestReveal: null,
      baronResult: null,
      log: [...state.log, `${winnerId} wins round ${state.roundNumber} and the game!`],
    }
  }

  return {
    ...state,
    tokens: newTokens,
    roundWinner: winnerId,
    phase: 'ROUND_OVER',
    pendingEffect: null,
    priestReveal: null,
    baronResult: null,
    readyPlayers: [],
    log: [...state.log, `${winnerId} wins round ${state.roundNumber} and earns a token of affection.`],
  }
}

function endRoundByComparison(state: LoveLetterState): LoveLetterState {
  const alive = alivePlayers(state)

  // Highest hand value wins
  let maxVal = -1
  let candidates: string[] = []
  for (const id of alive) {
    const handVal = state.hands[id][0] || 0
    if (handVal > maxVal) {
      maxVal = handVal
      candidates = [id]
    } else if (handVal === maxVal) {
      candidates.push(id)
    }
  }

  if (candidates.length === 1) {
    return endRound(state, candidates[0])
  }

  // Tiebreaker: highest total discard value
  let maxDiscard = -1
  let winner = candidates[0]
  for (const id of candidates) {
    const total = (state.discards[id] || []).reduce((a, b) => a + b, 0)
    if (total > maxDiscard) {
      maxDiscard = total
      winner = id
    }
  }

  return endRound(state, winner)
}

function eliminatePlayer(state: LoveLetterState, playerId: string): LoveLetterState {
  const hand = state.hands[playerId] || []
  const newDiscards = { ...state.discards, [playerId]: [...(state.discards[playerId] || []), ...hand] }
  const newHands = { ...state.hands, [playerId]: [] }
  const newEliminated = [...state.eliminated, playerId]
  const newProtected = state.protected.filter(id => id !== playerId)

  return {
    ...state,
    hands: newHands,
    discards: newDiscards,
    eliminated: newEliminated,
    protected: newProtected,
    log: [...state.log, `${playerId} is knocked out of the round.`],
  }
}

function setupRound(state: LoveLetterState, firstPlayerId: string): LoveLetterState {
  const deck = createDeck()
  const removedCard = deck.pop()!

  // For 2-player games, remove 3 cards face-up
  const faceUpRemoved: number[] = []
  if (state.playerOrder.length === 2) {
    for (let i = 0; i < 3; i++) {
      faceUpRemoved.push(deck.pop()!)
    }
  }

  // Deal one card to each player
  const hands: Record<string, number[]> = {}
  const discards: Record<string, number[]> = {}
  for (const id of state.playerOrder) {
    hands[id] = [deck.pop()!]
    discards[id] = []
  }

  // Find index of first player
  const firstIndex = state.playerOrder.indexOf(firstPlayerId)

  // Auto-draw for first player
  const drawnCard = deck.pop()!
  hands[firstPlayerId].push(drawnCard)

  return {
    ...state,
    phase: 'PLAY_CARD',
    deck,
    removedCard,
    faceUpRemoved,
    hands,
    discards,
    eliminated: [],
    protected: [],
    currentPlayerIndex: firstIndex,
    drawnCard: true,
    pendingEffect: null,
    priestReveal: null,
    baronResult: null,
    roundWinner: null,
    readyPlayers: [],
    roundNumber: state.roundNumber + 1,
    log: [...state.log, `Round ${state.roundNumber + 1} begins.`],
  }
}

// ==========================================
// Exported Plugin Interface
// ==========================================

export const createInitialState = (
  players: { user_id: string; seat_position: number | null }[]
): LoveLetterState => {
  const playerIds = players.map(p => p.user_id)
  const deck = createDeck()
  const removedCard = deck.pop()!

  // For 2-player games, remove 3 cards face-up
  const faceUpRemoved: number[] = []
  if (playerIds.length === 2) {
    for (let i = 0; i < 3; i++) {
      faceUpRemoved.push(deck.pop()!)
    }
  }

  const hands: Record<string, number[]> = {}
  const discards: Record<string, number[]> = {}
  const tokens: Record<string, number> = {}
  for (const id of playerIds) {
    hands[id] = [deck.pop()!]
    discards[id] = []
    tokens[id] = 0
  }

  // Auto-draw for first player
  const firstPlayer = playerIds[0]
  hands[firstPlayer].push(deck.pop()!)

  return {
    tokens,
    tokensToWin: 2,
    gameWinner: null,
    phase: 'PLAY_CARD',
    deck,
    removedCard,
    faceUpRemoved,
    hands,
    discards,
    eliminated: [],
    protected: [],
    playerOrder: playerIds,
    currentPlayerIndex: 0,
    drawnCard: true,
    pendingEffect: null,
    priestReveal: null,
    baronResult: null,
    roundNumber: 1,
    roundWinner: null,
    readyPlayers: [],
    log: ['Round 1 begins.'],
  }
}

export const validateMove = (state: LoveLetterState, playerId: string, move: any): boolean => {
  if (state.gameWinner) return false
  if (!state.playerOrder.includes(playerId)) return false

  switch (move.type) {
    case 'PLAY_CARD': {
      if (state.phase !== 'PLAY_CARD') return false
      if (currentPlayerId(state) !== playerId) return false
      if (state.eliminated.includes(playerId)) return false
      const hand = state.hands[playerId]
      if (!hand || hand.length !== 2) return false
      if (move.cardIndex !== 0 && move.cardIndex !== 1) return false

      // Countess rule: must play Countess if holding King or Prince
      if (mustPlayCountess(hand) && hand[move.cardIndex] !== 7) return false

      return true
    }

    case 'SELECT_TARGET': {
      if (state.phase !== 'SELECT_TARGET') return false
      if (!state.pendingEffect || state.pendingEffect.playerId !== playerId) return false
      if (state.eliminated.includes(move.targetId)) return false
      if (!state.playerOrder.includes(move.targetId)) return false

      const card = state.pendingEffect.card
      // Prince can target self
      if (card === 5) {
        if (state.protected.includes(move.targetId) && move.targetId !== playerId) return false
      } else {
        if (move.targetId === playerId) return false
        if (state.protected.includes(move.targetId)) return false
      }
      return true
    }

    case 'GUARD_GUESS': {
      if (state.phase !== 'RESOLVE_GUARD') return false
      if (!state.pendingEffect || state.pendingEffect.playerId !== playerId) return false
      // Cannot guess Guard (1)
      if (move.guess < 2 || move.guess > 8) return false
      return true
    }

    case 'ACKNOWLEDGE': {
      // Dismiss priest reveal or baron result
      if (state.phase !== 'RESOLVE_PRIEST' && state.phase !== 'RESOLVE_BARON') return false
      if (state.phase === 'RESOLVE_PRIEST' && state.priestReveal?.viewerId !== playerId) return false
      if (state.phase === 'RESOLVE_BARON') {
        // Both players in a baron comparison should acknowledge, but only the acting player needs to
        if (!state.pendingEffect || state.pendingEffect.playerId !== playerId) return false
      }
      return true
    }

    case 'READY_NEXT_ROUND': {
      if (state.phase !== 'ROUND_OVER') return false
      if (state.readyPlayers.includes(playerId)) return false
      return true
    }

    default:
      return false
  }
}

export const applyMove = (state: LoveLetterState, playerId: string, move: any): LoveLetterState => {
  let s = JSON.parse(JSON.stringify(state)) as LoveLetterState

  switch (move.type) {
    case 'PLAY_CARD': {
      const hand = s.hands[playerId]
      const cardIndex = move.cardIndex as number
      const playedCard = hand[cardIndex]
      const remainingCard = hand[1 - cardIndex]

      // Update hand and discards
      s.hands[playerId] = [remainingCard]
      s.discards[playerId] = [...s.discards[playerId], playedCard]
      s.log = [...s.log, `${playerId} plays ${CARD_NAMES[playedCard]}.`]

      // Princess: playing her eliminates you
      if (playedCard === 8) {
        s = eliminatePlayer(s, playerId)
        return advanceTurn(s)
      }

      // Handmaid: gain protection
      if (playedCard === 4) {
        s.protected = [...s.protected, playerId]
        return advanceTurn(s)
      }

      // Countess: no effect
      if (playedCard === 7) {
        return advanceTurn(s)
      }

      // Cards that need a target
      if (TARGET_CARDS.includes(playedCard)) {
        // Check if there are valid targets
        if (hasNoValidTargets(s, playerId, playedCard)) {
          s.log = [...s.log, `No valid targets — ${CARD_NAMES[playedCard]} has no effect.`]
          return advanceTurn(s)
        }

        // If only one valid target, auto-select for Prince targeting self
        const targets = validTargets(s, playerId, playedCard)
        if (playedCard === 5 && targets.length === 1 && targets[0] === playerId) {
          // Must target self — auto-resolve
          return resolvePrinceEffect(s, playerId, playerId)
        }

        s.phase = 'SELECT_TARGET'
        s.pendingEffect = { card: playedCard, playerId }
        return s
      }

      // Should not reach here
      return advanceTurn(s)
    }

    case 'SELECT_TARGET': {
      const effect = s.pendingEffect!
      const targetId = move.targetId as string

      switch (effect.card) {
        case 1: // Guard — need guess next
          s.phase = 'RESOLVE_GUARD'
          s.pendingEffect = { ...effect, targetId }
          return s

        case 2: // Priest — reveal target's card to acting player
          s.priestReveal = {
            viewerId: effect.playerId,
            targetId,
            card: s.hands[targetId][0],
          }
          s.phase = 'RESOLVE_PRIEST'
          s.pendingEffect = { ...effect, targetId }
          s.log = [...s.log, `${effect.playerId} peeks at ${targetId}'s hand.`]
          return s

        case 3: { // Baron — compare hands
          const card1 = s.hands[effect.playerId][0]
          const card2 = s.hands[targetId][0]
          let winnerId: string | null = null
          let loserId: string | null = null

          if (card1 > card2) {
            winnerId = effect.playerId
            loserId = targetId
          } else if (card2 > card1) {
            winnerId = targetId
            loserId = effect.playerId
          }
          // Tie: nothing happens

          s.baronResult = { winnerId, loserId, card1, card2 }
          s.phase = 'RESOLVE_BARON'
          s.pendingEffect = { ...effect, targetId }

          if (loserId) {
            s = eliminatePlayer(s, loserId)
            s.log = [...s.log, `Baron comparison: ${loserId} is knocked out.`]
          } else {
            s.log = [...s.log, `Baron comparison: tie — no one is eliminated.`]
          }
          return s
        }

        case 5: // Prince
          return resolvePrinceEffect(s, effect.playerId, targetId)

        case 6: { // King — swap hands
          const myCard = s.hands[effect.playerId][0]
          const theirCard = s.hands[targetId][0]
          s.hands[effect.playerId] = [theirCard]
          s.hands[targetId] = [myCard]
          s.log = [...s.log, `${effect.playerId} trades hands with ${targetId}.`]
          return advanceTurn(s)
        }

        default:
          return advanceTurn(s)
      }
    }

    case 'GUARD_GUESS': {
      const effect = s.pendingEffect!
      const targetId = effect.targetId!
      const guess = move.guess as number
      const targetCard = s.hands[targetId][0]

      s.pendingEffect = { ...effect, guardGuess: guess }

      if (targetCard === guess) {
        s.log = [...s.log, `Guard guess correct! ${targetId} had the ${CARD_NAMES[guess]}.`]
        s = eliminatePlayer(s, targetId)
      } else {
        s.log = [...s.log, `Guard guess wrong — ${targetId} does not have the ${CARD_NAMES[guess]}.`]
      }

      return advanceTurn(s)
    }

    case 'ACKNOWLEDGE': {
      // Dismiss info overlay, advance turn
      return advanceTurn(s)
    }

    case 'READY_NEXT_ROUND': {
      const newReady = [...s.readyPlayers, playerId]
      s.readyPlayers = newReady

      // Check if all players are ready
      if (newReady.length >= s.playerOrder.length) {
        // Start new round — previous round winner goes first
        const firstPlayer = s.roundWinner || s.playerOrder[0]
        s = setupRound(s, firstPlayer)
      }

      return s
    }

    default:
      return s
  }
}

function resolvePrinceEffect(state: LoveLetterState, actingPlayer: string, targetId: string): LoveLetterState {
  let s = { ...state }
  const discardedCard = s.hands[targetId][0]

  // Target discards their hand
  s.discards = { ...s.discards, [targetId]: [...s.discards[targetId], discardedCard] }

  // If target discarded Princess, they're eliminated
  if (discardedCard === 8) {
    s.hands = { ...s.hands, [targetId]: [] }
    s.eliminated = [...s.eliminated, targetId]
    s.protected = s.protected.filter(id => id !== targetId)
    s.log = [...s.log, `${targetId} discards the Princess and is knocked out!`]
    return advanceTurn(s)
  }

  // Draw a new card (or the removed card if deck is empty)
  if (s.deck.length > 0) {
    const newDeck = [...s.deck]
    const newCard = newDeck.pop()!
    s.hands = { ...s.hands, [targetId]: [newCard] }
    s.deck = newDeck
  } else {
    // Draw the removed card
    s.hands = { ...s.hands, [targetId]: [s.removedCard] }
  }

  s.log = [...s.log, `${targetId} discards ${CARD_NAMES[discardedCard]} and draws a new card.`]
  return advanceTurn(s)
}

export const checkWinCondition = (state: LoveLetterState): string | null => {
  return state.gameWinner
}

export const getGameStatus = (state: LoveLetterState): string =>
  state.gameWinner ? 'finished' : 'in_progress'
