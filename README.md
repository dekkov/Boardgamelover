# Board Game Web Platform

A browser-based multiplayer board game platform where users can browse games, create/join lobbies, and play games in real-time.

Live Demo: https://bga.trhoang220703.workers.dev/

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI components
- **Routing**: React Router DOM
- **Database & Auth**: Supabase (PostgreSQL + Auth + Realtime)
- **Deployment**: Cloudflare Workers (static SPA + Worker for security headers)
- **URL**: `bga.trhoang220703.workers.dev`

## Getting Started

```bash
npm install        # Install dependencies
npm run dev        # Start development server on port 3000
npm run build      # Build for production (outputs to /build)
```

## Architecture

### Directory Structure

```
src/
  api/              # Supabase data access (tables, chat, game moves)
  components/       # React components (auth/, ui/, GameRenderer, Shared)
  contexts/         # React Context providers (AuthContext)
  hooks/            # Custom hooks (useAuth, useTableRealtime, usePresence)
  lib/              # Utilities (supabase client, pluginLoader, validation)
  pages/            # Route pages (Home, GameDetail, Lobby, GameRoom)
  types/            # TypeScript types (database.types.ts, plugin.ts)
  worker.ts         # Cloudflare Worker for security headers
games/
  counter-clash/    # Simple MVP game (button-clicking race)
  werewolf/         # Social deduction game (5-10 players)
  love-letter/      # Card game of deduction and luck (2-4 players)
```

### Platform vs Game Plugin

| Platform Handles | Game Plugin Handles |
|---|---|
| Tables & lobbies | Game rules & logic |
| Player presence | Turn/phase management |
| Chat | Board rendering |
| Navigation & layout | Move validation |
| State syncing | Win conditions |

### Game Plugin System

Each game lives in `games/<gameId>/` with three files:

- **`game.json`** — Manifest (name, player counts, description)
- **`backend.ts`** — State machine (`createInitialState`, `validateMove`, `applyMove`, `checkWinCondition`, `getGameStatus`)
- **`Frontend.tsx`** — React component receiving `GameComponentProps` (gameState, players, currentUserId, onMove)

Plugins are loaded via Vite dynamic imports and cached in memory. Each game manages its own background, layout, and visual theme.

### Available Games

| Game | Players | Description |
|---|---|---|
| **Counter Clash** | 2-4 | Simple button-clicking race (MVP demo) |
| **Werewolf** | 5-10 | Social deduction with roles (werewolf, seer, medic, villager). 9-phase night/day cycle with voting |
| **Love Letter** | 2-4 | Card game of risk and deduction. 8 unique card types, multi-round play (2 tokens to win), BGA-style royal-themed UI |

### Core Pages

1. **Home (`/`)** — Browse and search games
2. **Game Detail (`/games/:gameId`)** — Game info, create/join lobbies
3. **Lobby (`/table/:tableId`)** — Waiting room with chat
4. **Game Room (`/table/:tableId/play`)** — Active gameplay

### Real-time

- **Supabase Realtime** for table/player/chat updates (postgres_changes)
- **Supabase Presence** for online user indicators
- Game state syncs automatically when any player makes a move

### Security

- Cloudflare Worker adds security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- Automatic Cloudflare DDoS protection (L3/4/7)
- Row Level Security (RLS) on all database tables
- Atomic table join via RPC to prevent race conditions

## Navigation Rules

- Navigation between pages does **not** leave a table
- Only explicit "Leave Table" action removes user from table
- Active table banner appears on all pages when user is in a table
