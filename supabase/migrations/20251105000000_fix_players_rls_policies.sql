-- Fix overly permissive RLS policies for players, player_teams, and player_stats tables
-- These tables should only be modifiable by event owners or admins, not any authenticated user

-- First, drop the overly permissive policies

-- Players table
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."players";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."players";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."players";

-- Player_teams table
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."player_teams";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."player_teams";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."player_teams";

-- Player_stats table
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."player_stats";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."player_stats";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."player_stats";

-- Create new, properly scoped policies for players table
CREATE POLICY "Enable insert for event owners and admins" ON "public"."players"
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT e.owner FROM events e WHERE e.id = players.event_id
  ) OR current_user_is_admin()
);

CREATE POLICY "Enable update for event owners and admins" ON "public"."players"
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT e.owner FROM events e WHERE e.id = players.event_id
  ) OR current_user_is_admin()
);

CREATE POLICY "Enable delete for event owners and admins" ON "public"."players"
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT e.owner FROM events e WHERE e.id = players.event_id
  ) OR current_user_is_admin()
);

-- Create new, properly scoped policies for player_teams table
CREATE POLICY "Enable insert for event owners and admins" ON "public"."player_teams"
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT e.owner
    FROM events e
    JOIN players p ON p.event_id = e.id
    WHERE p.id = player_teams.player_id
  ) OR current_user_is_admin()
);

CREATE POLICY "Enable update for event owners and admins" ON "public"."player_teams"
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT e.owner
    FROM events e
    JOIN players p ON p.event_id = e.id
    WHERE p.id = player_teams.player_id
  ) OR current_user_is_admin()
);

CREATE POLICY "Enable delete for event owners and admins" ON "public"."player_teams"
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT e.owner
    FROM events e
    JOIN players p ON p.event_id = e.id
    WHERE p.id = player_teams.player_id
  ) OR current_user_is_admin()
);

-- Create new, properly scoped policies for player_stats table
CREATE POLICY "Enable insert for event owners and admins" ON "public"."player_stats"
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT e.owner FROM events e WHERE e.id = player_stats.event_id
  ) OR current_user_is_admin()
);

CREATE POLICY "Enable update for event owners and admins" ON "public"."player_stats"
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT e.owner FROM events e WHERE e.id = player_stats.event_id
  ) OR current_user_is_admin()
);

CREATE POLICY "Enable delete for event owners and admins" ON "public"."player_stats"
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT e.owner FROM events e WHERE e.id = player_stats.event_id
  ) OR current_user_is_admin()
);
