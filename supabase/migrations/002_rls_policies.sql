-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- PROFILES
-- Anyone can read profiles
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup flow)
CREATE POLICY "profiles_self_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- GAME_TABLES
-- Anyone can read public tables
CREATE POLICY "tables_public_read" ON game_tables
  FOR SELECT USING (true);

-- Authenticated users can create tables
CREATE POLICY "tables_authenticated_create" ON game_tables
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Host can update their table
CREATE POLICY "tables_host_update" ON game_tables
  FOR UPDATE USING (auth.uid() = host_id);

-- Players in the table can also update game_state (for moves)
CREATE POLICY "tables_player_update" ON game_tables
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM table_players
      WHERE table_players.table_id = game_tables.id
      AND table_players.user_id = auth.uid()
    )
  );

-- TABLE_PLAYERS
-- Anyone can view players at a table
CREATE POLICY "players_public_read" ON table_players
  FOR SELECT USING (true);

-- Authenticated users can join tables
CREATE POLICY "players_authenticated_join" ON table_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave tables (delete their own record)
CREATE POLICY "players_self_leave" ON table_players
  FOR DELETE USING (auth.uid() = user_id);

-- Host can remove players
CREATE POLICY "players_host_remove" ON table_players
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM game_tables
      WHERE game_tables.id = table_players.table_id
      AND game_tables.host_id = auth.uid()
    )
  );

-- CHAT_MESSAGES
-- Table members can read messages
CREATE POLICY "messages_member_read" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM table_players
      WHERE table_players.table_id = chat_messages.table_id
      AND table_players.user_id = auth.uid()
    )
  );

-- Table members can send messages
CREATE POLICY "messages_member_insert" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM table_players
      WHERE table_players.table_id = chat_messages.table_id
      AND table_players.user_id = auth.uid()
    )
  );

-- GAME_MOVES
-- Table members can read moves
CREATE POLICY "moves_member_read" ON game_moves
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM table_players
      WHERE table_players.table_id = game_moves.table_id
      AND table_players.user_id = auth.uid()
    )
  );

-- Table members can insert moves
CREATE POLICY "moves_member_insert" ON game_moves
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM table_players
      WHERE table_players.table_id = game_moves.table_id
      AND table_players.user_id = auth.uid()
    )
  );
