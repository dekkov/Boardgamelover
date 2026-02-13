# 🎲 Board Game Web Platform — Full Design Document (MVP)

## 1. Project Description

### Goal

Build a **browser-based board game platform** where users can:

- Browse and search games  
- View a **detailed description page** for each game  
- Create **private** or join **public** lobbies  
- Wait in a **lobby (table room)** with chat  
- Host starts the session  
- All players transition into a **game room**  
- Platform shows **game status + chat**  
- Each **game plugin controls its own rules and UI**

This is a **platform-first MVP** — focus is on:

✔ Lobbies  
✔ Real-time tables  
✔ Chat  
✔ Navigation between pages  
✔ Game plugin system  

NOT on full game rules yet.

---

## 2. Core Philosophy

### 🧩 Platform vs Game Responsibilities

| Platform Handles | Game Plugin Handles |
|------------------|--------------------|
| Tables & lobbies | Game rules |
| Player presence | Turn logic (or no turns) |
| Chat | Game board rendering |
| Navigation | Legal move validation |
| State syncing | Win conditions |
| UI layout around game | Game-specific UI |

**Important:**  
The platform does **NOT enforce turn-based-only**.  
Each game decides how turns/phases work.

---

## 3. Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + Radix UI
- Socket.IO client (planned)

### Backend
- Node.js + Express/Fastify (planned)
- Socket.IO server (planned)
- In-memory store (MVP - currently mock service)
- Database: Supabase/PostgreSQL (integration in progress)

---

## 4. Global Navigation Rules

Navigation NEVER equals leaving a table.

| Action | Effect |
|--------|--------|
| Home button | Navigate only |
| Back to Lobby | Navigate only |
| Leave Table button | Actually leave |

### Persistent Banner (When in a Table)

If a user navigates away from a table:

> **“You are in an active table: [Game Name] — Return”**

Appears on all pages until they leave.

---

# 🌐 PAGE STRUCTURE & DESIGN

---

## 5. Homepage `/`

### Purpose
Discover games (BGA-style browsing)

### Layout

**Top Navigation**
- Logo
- Search bar
- (Later: profile)

**Main Sections**
- Featured game banner
- Game rows:
  - New
  - Trending
  - Recommended

### Game Card Design
- Cover image
- Name
- Player count icon
- Avg time icon
- Tags (e.g. Strategy, Bluffing)
- **Discover** button

### Functionality
- Search filters games
- Clicking a card → `/games/[gameId]`

---

## 6. Game Description Page `/games/[gameId]`

### Purpose
Show detailed game info + entry point to play

### Content
- Name
- Author / designer
- Description
- Rules section / link
- Player count (min–max)
- Average play time
- Tags / type / complexity

### Play Section

Buttons:
- **Create Private Lobby**
- **Join Public Lobby**

### Functionality

| Action | Result |
|--------|--------|
| Create Private | New table → lobby page |
| Join Public | Join existing or create → lobby page |

---

## 7. Lobby Page `/table/[tableId]`

### Purpose
Waiting room before game starts

### Layout

**Top Bar**
- Home (navigation only)
- Game Name
- Table ID
- Status badge (Waiting / In Game)

**Left Panel**
- Player slots (min–max from game config)
- Host indicator
- Invite link (private only)
- **Start Game** button (host only)

**Right Panel**
- Chat

**Footer**
- **Leave Table** button

### Functionality
- Real-time player list
- Host reassigned if host leaves
- Start enabled when enough players
- Start → server creates initial game state → redirect to game room

---

## 8. Game Room Page `/table/[tableId]/play`

### Purpose
Actual gameplay screen

### Layout

**Top Bar**
- Home (navigation)
- Back to Lobby (navigation)
- Game Name + Table ID

**Left Sidebar (Platform)**
- Game status:
  - Phase
  - Current player (if game uses turns)

**Center (Plugin-Owned)**
- Game board
- Game actions
- Game-specific UI

**Right Sidebar (Platform)**
- Chat panel

**Footer**
- **Leave Table**

---

## 9. Server-Authoritative Model (MVP Version)

We implement **the structure**, not full rules yet.

### Server Owns
- Table state
- Player list
- Game state object

### Client Flow
1. Client sends move
2. Server updates state
3. Server broadcasts updated state
4. Clients re-render

### Dummy Plugin for MVP
A simple “counter game” to prove pipeline works.

---

# 🧠 GAME PLUGIN SYSTEM

## 10. Plugin Folder Structure

/games
/gameId
game.json
frontend.tsx
backend.js


## game.json

```json
{
  "gameId": "werewolf",
  "name": "Werewolf",
  "minPlayers": 5,
  "maxPlayers": 10,
  "avgTime": 30,
  "tags": ["Bluffing", "Party"],
  "description": "...",
  "rules": "markdown or URL"
}

# Backend Interface
createInitialState(players)
validateMove(state, playerId, move)
applyMove(state, playerId, move)
getStatus(state)
isGameOver(state)

# Frontend Interface
<GameRenderer
   state={state}
   you={playerInfo}
   sendMove={sendMove}
/>

# Real-time Events
| Event         | Purpose      |
| ------------- | ------------ |
| table_join    | Join table   |
| table_leave   | Leave table  |
| chat_send     | Send message |
| start_game    | Host starts  |
| submit_move   | Game action  |
| request_state | Resync       |

| Event          | Purpose             |
| -------------- | ------------------- |
| table_snapshot | Full table info     |
| player_joined  | Update players      |
| chat_message   | Chat                |
| game_started   | Move to play screen |
| state_updated  | New game state      |
| move_rejected  | Invalid move        |

# Data Model

table: tableId
gameId
visibility (public/private)
status (waiting/in_game/finished)
players[]
gameState
createdAt
inviteCode

playerId (UUID)
displayName (Guest####)

# Design Style

Background textures: wood or felt

Cards resemble board game boxes

Buttons are bold and friendly

Sidebars look like tabletop accessories

Chat styled like a notebook panel

