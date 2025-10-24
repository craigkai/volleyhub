-- Add support for mix-and-match and King & Queen tournaments
-- This migration creates the necessary tables and columns for tracking individual players
-- and their performance across different team compositions

-- Create players table
CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" bigserial PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "name" text NOT NULL,
    "event_id" bigint REFERENCES "public"."events"(id) ON DELETE CASCADE,
    "email" text,
    "gender" text,
    "skill_level" integer,
    "state" text DEFAULT 'active'
);

-- Create player_teams junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS "public"."player_teams" (
    "id" bigserial PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "player_id" bigint REFERENCES "public"."players"(id) ON DELETE CASCADE,
    "team_id" bigint REFERENCES "public"."teams"(id) ON DELETE CASCADE,
    "position" text,
    UNIQUE(player_id, team_id)
);

-- Create player_stats table for individual performance tracking
CREATE TABLE IF NOT EXISTS "public"."player_stats" (
    "id" bigserial PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "player_id" bigint REFERENCES "public"."players"(id) ON DELETE CASCADE,
    "event_id" bigint REFERENCES "public"."events"(id) ON DELETE CASCADE,
    "match_id" bigint REFERENCES "public"."matches"(id) ON DELETE CASCADE,
    "points_scored" integer DEFAULT 0,
    "points_allowed" integer DEFAULT 0,
    "win" boolean DEFAULT false
);

-- Add new columns to events table for tournament type configuration
ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS "tournament_type" text DEFAULT 'fixed-teams';

ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS "team_size" integer DEFAULT 2;

-- Add new columns to teams table for temporary/rotating teams
ALTER TABLE "public"."teams"
ADD COLUMN IF NOT EXISTS "is_temporary" boolean DEFAULT false;

ALTER TABLE "public"."teams"
ADD COLUMN IF NOT EXISTS "round" integer;

ALTER TABLE "public"."teams"
ADD COLUMN IF NOT EXISTS "team_size" integer;

-- Enable RLS on new tables
ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."player_teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."player_stats" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players table
-- Allow public read access
CREATE POLICY "Enable read access for all users" ON "public"."players"
FOR SELECT USING (true);

-- Allow authenticated users to insert players
CREATE POLICY "Enable insert for authenticated users" ON "public"."players"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update players
CREATE POLICY "Enable update for authenticated users" ON "public"."players"
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete players
CREATE POLICY "Enable delete for authenticated users" ON "public"."players"
FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for player_teams table
-- Allow public read access
CREATE POLICY "Enable read access for all users" ON "public"."player_teams"
FOR SELECT USING (true);

-- Allow authenticated users to manage player_teams
CREATE POLICY "Enable insert for authenticated users" ON "public"."player_teams"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON "public"."player_teams"
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON "public"."player_teams"
FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for player_stats table
-- Allow public read access
CREATE POLICY "Enable read access for all users" ON "public"."player_stats"
FOR SELECT USING (true);

-- Allow authenticated users to manage player_stats
CREATE POLICY "Enable insert for authenticated users" ON "public"."player_stats"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON "public"."player_stats"
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON "public"."player_stats"
FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "players_event_id_idx" ON "public"."players"("event_id");
CREATE INDEX IF NOT EXISTS "players_state_idx" ON "public"."players"("state");
CREATE INDEX IF NOT EXISTS "player_teams_player_id_idx" ON "public"."player_teams"("player_id");
CREATE INDEX IF NOT EXISTS "player_teams_team_id_idx" ON "public"."player_teams"("team_id");
CREATE INDEX IF NOT EXISTS "player_stats_player_id_idx" ON "public"."player_stats"("player_id");
CREATE INDEX IF NOT EXISTS "player_stats_event_id_idx" ON "public"."player_stats"("event_id");
CREATE INDEX IF NOT EXISTS "player_stats_match_id_idx" ON "public"."player_stats"("match_id");
