-- Add DELETE policy for game_tables
-- This was missing and preventing table cleanup

-- Allow anyone to delete empty tables (tables with no players)
-- This is needed for the cleanup logic in leaveTable()
CREATE POLICY "tables_delete_empty" ON game_tables
  FOR DELETE USING (
    NOT EXISTS (
      SELECT 1 FROM table_players
      WHERE table_players.table_id = game_tables.id
    )
  );

-- Also allow host to delete their own tables (optional, but useful)
CREATE POLICY "tables_host_delete" ON game_tables
  FOR DELETE USING (auth.uid() = host_id);
