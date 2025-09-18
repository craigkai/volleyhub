-- Fix event_id type from UUID to BIGINT to match events table
ALTER TABLE push_subscriptions ALTER COLUMN event_id TYPE BIGINT USING event_id::text::bigint;