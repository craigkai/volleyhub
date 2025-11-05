-- Migration: Unified Team Model
-- This migration restructures the database to use a single unified model where:
-- - All "playing units" are teams (whether 1-person or multi-person)
-- - Matches reference multiple teams per side via junction table
-- - No separate players, player_teams, or player_stats tables needed

-- Step 1: Create match_teams junction table
CREATE TABLE IF NOT EXISTS "public"."match_teams" (
    "id" bigserial PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "match_id" bigint NOT NULL REFERENCES "public"."matches"(id) ON DELETE CASCADE,
    "team_id" bigint NOT NULL REFERENCES "public"."teams"(id) ON DELETE CASCADE,
    "side" text NOT NULL CHECK (side IN ('home', 'away')),
    UNIQUE(match_id, team_id)  -- A team cannot appear twice in the same match
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS "match_teams_match_id_idx" ON "public"."match_teams"("match_id");
CREATE INDEX IF NOT EXISTS "match_teams_team_id_idx" ON "public"."match_teams"("team_id");
CREATE INDEX IF NOT EXISTS "match_teams_side_idx" ON "public"."match_teams"("side");

-- Step 3: Add team_size column to teams (defaults to 1 for player-teams)
ALTER TABLE "public"."teams"
ADD COLUMN IF NOT EXISTS "team_size" integer DEFAULT 1;

-- Step 4: Remove is_temporary and round columns (no longer needed)
-- These were only needed for the old temporary team approach
ALTER TABLE "public"."teams"
DROP COLUMN IF EXISTS "is_temporary",
DROP COLUMN IF EXISTS "round";

-- Step 5: Drop player-related tables (we're using teams for everything now)
DROP TABLE IF EXISTS "public"."player_stats" CASCADE;
DROP TABLE IF EXISTS "public"."player_teams" CASCADE;
DROP TABLE IF EXISTS "public"."players" CASCADE;

-- Step 6: Update events table columns
-- Remove tournament_type since the model is now unified
ALTER TABLE "public"."events"
DROP COLUMN IF EXISTS "tournament_type";

-- Step 7: Migrate existing match data to use match_teams junction table
-- For existing matches with team1/team2, create corresponding match_teams entries
INSERT INTO "public"."match_teams" (match_id, team_id, side)
SELECT id, team1, 'home'
FROM "public"."matches"
WHERE team1 IS NOT NULL
ON CONFLICT (match_id, team_id) DO NOTHING;

INSERT INTO "public"."match_teams" (match_id, team_id, side)
SELECT id, team2, 'away'
FROM "public"."matches"
WHERE team2 IS NOT NULL
ON CONFLICT (match_id, team_id) DO NOTHING;

-- Step 8: Mark team1/team2 columns as deprecated (keep for now for backward compatibility)
-- We can remove these in a future migration once all code is updated
COMMENT ON COLUMN "public"."matches"."team1" IS 'DEPRECATED: Use match_teams table instead';
COMMENT ON COLUMN "public"."matches"."team2" IS 'DEPRECATED: Use match_teams table instead';

-- Step 9: Enable RLS on match_teams
ALTER TABLE "public"."match_teams" ENABLE ROW LEVEL SECURITY;

-- Step 10: RLS Policies for match_teams table
-- Allow public read access
CREATE POLICY "Enable read access for all users" ON "public"."match_teams"
FOR SELECT USING (true);

-- Allow authenticated users to insert match_teams
CREATE POLICY "Enable insert for authenticated users" ON "public"."match_teams"
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM matches m
        JOIN events e ON e.id = m.event_id
        WHERE m.id = match_id
        AND (e.owner = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE is_admin = true))
    )
);

-- Allow event owners and admins to update match_teams
CREATE POLICY "Enable update for event owners" ON "public"."match_teams"
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM matches m
        JOIN events e ON e.id = m.event_id
        WHERE m.id = match_id
        AND (e.owner = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE is_admin = true))
    )
);

-- Allow event owners and admins to delete match_teams
CREATE POLICY "Enable delete for event owners" ON "public"."match_teams"
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM matches m
        JOIN events e ON e.id = m.event_id
        WHERE m.id = match_id
        AND (e.owner = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE is_admin = true))
    )
);
