-- Fix: Enable full row data in DELETE events for real-time subscriptions
-- By default, PostgreSQL only sends the primary key in DELETE events.
-- We need the table_id column to filter DELETE events properly.

ALTER TABLE table_players REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
