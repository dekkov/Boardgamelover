-- Migration 006: Fix search_path security warnings
-- Sets explicit search_path for all functions to prevent search_path manipulation attacks

-- Fix update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix join_table RPC function
CREATE OR REPLACE FUNCTION public.join_table(p_table_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_player_count int;
  v_max_players int;
  v_game_id text;
  v_table jsonb;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get table info
  SELECT game_id, max_players INTO v_game_id, v_max_players
  FROM game_tables
  WHERE id = p_table_id AND status = 'waiting';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Table not found or already started';
  END IF;

  -- Check if already joined
  IF EXISTS (SELECT 1 FROM table_players WHERE table_id = p_table_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Already joined this table';
  END IF;

  -- Check table capacity
  SELECT COUNT(*) INTO v_player_count
  FROM table_players
  WHERE table_id = p_table_id;

  IF v_player_count >= v_max_players THEN
    RAISE EXCEPTION 'Table is full';
  END IF;

  -- Add player
  INSERT INTO table_players (table_id, user_id, seat_position)
  VALUES (p_table_id, v_user_id, v_player_count);

  -- Return updated table with players
  SELECT jsonb_build_object(
    'id', t.id,
    'game_id', t.game_id,
    'status', t.status,
    'game_state', t.game_state,
    'players', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'user_id', tp.user_id,
            'seat_position', tp.seat_position,
            'is_host', tp.is_host,
            'profile', jsonb_build_object(
              'username', p.username,
              'display_name', p.display_name,
              'avatar_url', p.avatar_url
            )
          )
          ORDER BY tp.seat_position
        )
        FROM table_players tp
        LEFT JOIN profiles p ON p.id = tp.user_id
        WHERE tp.table_id = t.id
      ),
      '[]'::jsonb
    )
  ) INTO v_table
  FROM game_tables t
  WHERE t.id = p_table_id;

  RETURN v_table;
END;
$$;

-- Fix reassign_host trigger function
CREATE OR REPLACE FUNCTION public.reassign_host()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table_id uuid;
  v_new_host_id uuid;
BEGIN
  v_table_id := OLD.table_id;

  -- Only reassign if the leaving player was the host
  IF OLD.is_host THEN
    -- Find the next player (lowest seat_position)
    SELECT user_id INTO v_new_host_id
    FROM table_players
    WHERE table_id = v_table_id
      AND user_id != OLD.user_id
    ORDER BY seat_position
    LIMIT 1;

    -- If there's another player, make them host
    IF v_new_host_id IS NOT NULL THEN
      UPDATE table_players
      SET is_host = true
      WHERE table_id = v_table_id AND user_id = v_new_host_id;

      -- Also update the host_id in game_tables
      UPDATE game_tables
      SET host_id = v_new_host_id
      WHERE id = v_table_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.join_table(uuid) TO authenticated;
