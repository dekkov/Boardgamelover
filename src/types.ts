
// ==========================================
// Database-aligned types
// ==========================================

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type TableStatus = 'waiting' | 'in_game' | 'finished';

export interface GameTable {
  id: string
  game_id: string
  host_id: string | null
  status: TableStatus
  visibility: 'public' | 'private'
  invite_code: string | null
  game_state: Record<string, any>
  max_players: number
  created_at: string
  updated_at: string
}

export interface TablePlayer {
  id: string
  table_id: string
  user_id: string
  is_host: boolean
  seat_position: number | null
  joined_at: string
}

export interface ChatMessage {
  id: string
  table_id: string
  user_id: string
  message: string
  created_at: string
}

export interface GameMove {
  id: string
  table_id: string
  user_id: string
  move_data: Record<string, any>
  move_number: number
  created_at: string
}

// ==========================================
// Joined/composite types
// ==========================================

export interface TablePlayerWithProfile extends TablePlayer {
  profile: Profile
}

export interface ChatMessageWithProfile extends ChatMessage {
  profile: Profile
}

export interface TableWithDetails extends GameTable {
  players: TablePlayerWithProfile[]
  messages: ChatMessageWithProfile[]
}

// ==========================================
// Legacy compatibility (for mock -> real transition)
// ==========================================

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Table {
  id: string;
  gameId: string;
  status: TableStatus;
  players: Player[];
  messages: { id: string; playerId: string; playerName: string; text: string; timestamp: number }[];
  gameState: any;
}

// ==========================================
// Game Configuration (static data)
// ==========================================

export interface GameConfig {
  gameId: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  avgTime: number;
  tags: string[];
  description: string;
  author: string;
  imageUrl: string;
}

// Game IDs that have a working frontend plugin (in games/<id>/Frontend.tsx)
export const PLAYABLE_GAME_IDS: string[] = ['counter-clash'];

export const AVAILABLE_GAMES: GameConfig[] = [
  {
    gameId: 'werewolf',
    name: 'Werewolf',
    minPlayers: 5,
    maxPlayers: 10,
    avgTime: 30,
    tags: ['Bluffing', 'Party'],
    description: 'A game of deception and deduction. Villagers must find the werewolves hiding among them before it is too late.',
    author: 'Party Games Inc.',
    imageUrl: 'https://images.unsplash.com/photo-1762838362179-1718fce76d22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJkJTIwZ2FtZSUyMGZhbnRhc3klMjBhcnR8ZW58MXx8fHwxNzcwOTIzNTM5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    gameId: 'counter-clash',
    name: 'Counter Clash',
    minPlayers: 2,
    maxPlayers: 4,
    avgTime: 5,
    tags: ['Strategy', 'Quick'],
    description: 'A simple MVP game where players compete to reach a target number first.',
    author: 'Platform Demo',
    imageUrl: 'https://images.unsplash.com/photo-1642284474435-aba7be889406?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWNlJTIwYW5kJTIwbWVlcGxlfGVufDF8fHx8MTc3MDkyMzUzOXww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    gameId: 'catan-clone',
    name: 'Settlers of Code',
    minPlayers: 3,
    maxPlayers: 4,
    avgTime: 60,
    tags: ['Strategy', 'Economy'],
    description: 'Build roads, settlements, and cities in this classic resource management game.',
    author: 'Board Masters',
    imageUrl: 'https://images.unsplash.com/photo-1758691031197-3ce709db9640?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjBwbGF5aW5nJTIwYm9hcmQlMjBnYW1lcyUyMGhhcHB5fGVufDF8fHx8MTc3MDkyMzUzOXww&ixlib=rb-4.1.0&q=80&w=1080',
  }
];
