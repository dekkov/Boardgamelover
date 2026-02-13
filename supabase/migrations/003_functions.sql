-- Database Functions

-- Atomic table join with validation
CREATE OR REPLACE FUNCTION join_table(p_table_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_table game_tables%ROWTYPE;
  v_player_count INT;
  v_already_joined BOOLEAN;
  v_seat INT;
BEGIN
  -- Get table info
  SELECT * INTO v_table FROM game_tables WHERE id = p_table_id;

  IF v_table IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Table not found');
  END IF;

  IF v_table.status != 'waiting' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Game already started');
  END IF;

  -- Check if already joined
  SELECT EXISTS(
    SELECT 1 FROM table_players
    WHERE table_id = p_table_id AND user_id = p_user_id
  ) INTO v_already_joined;

  IF v_already_joined THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already in table');
  END IF;

  -- Check player count
  SELECT COUNT(*) INTO v_player_count FROM table_players WHERE table_id = p_table_id;

  IF v_player_count >= v_table.max_players THEN
    RETURN jsonb_build_object('success', false, 'error', 'Table is full');
  END IF;

  -- Get next seat position
  v_seat := v_player_count;

  -- Insert player
  INSERT INTO table_players (table_id, user_id, is_host, seat_position)
  VALUES (p_table_id, p_user_id, v_player_count = 0, v_seat);

  RETURN jsonb_build_object('success', true, 'seat_position', v_seat);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Host reassignment function (called when host leaves)
CREATE OR REPLACE FUNCTION reassign_host()
RETURNS TRIGGER AS $$
DECLARE
  v_was_host BOOLEAN;
  v_table_id UUID;
  v_next_player UUID;
BEGIN
  v_was_host := OLD.is_host;
  v_table_id := OLD.table_id;

  IF v_was_host THEN
    -- Find next player by join order
    SELECT user_id INTO v_next_player
    FROM table_players
    WHERE table_id = v_table_id
    ORDER BY joined_at ASC
    LIMIT 1;

    IF v_next_player IS NOT NULL THEN
      -- Promote next player to host
      UPDATE table_players SET is_host = true
      WHERE table_id = v_table_id AND user_id = v_next_player;

      UPDATE game_tables SET host_id = v_next_player
      WHERE id = v_table_id;
    ELSE
      -- No players left, mark table as finished
      UPDATE game_tables SET status = 'finished'
      WHERE id = v_table_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_player_leave
  AFTER DELETE ON table_players
  FOR EACH ROW EXECUTE FUNCTION reassign_host();

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE table_players;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
