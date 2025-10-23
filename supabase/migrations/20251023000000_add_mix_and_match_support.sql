-- Migration: Add Mix-and-Match and King & Queen Tournament Support
-- Description: Adds player tracking, player-team relationships, and individual stats

-- 1. Create players table
CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" bigserial PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now(),
    "name" text NOT NULL,
    "event_id" bigint REFERENCES "public"."events"(id) ON DELETE CASCADE,
    "email" text,
    "phone" text,
    "gender" text,
    "skill_level" integer,
    "state" text DEFAULT 'active'
);

CREATE INDEX idx_players_event ON "public"."players"(event_id);
CREATE INDEX idx_players_state ON "public"."players"(state);

COMMENT ON TABLE "public"."players" IS 'Individual players in mix-and-match tournaments';
COMMENT ON COLUMN "public"."players"."gender" IS 'Used for King & Queen tournaments: male, female, other';
COMMENT ON COLUMN "public"."players"."skill_level" IS 'Optional 1-10 skill rating for balanced pairing';
COMMENT ON COLUMN "public"."players"."state" IS 'Player status: active, withdrawn, etc.';

-- 2. Create player_teams junction table (many-to-many: players <-> teams)
CREATE TABLE IF NOT EXISTS "public"."player_teams" (
    "id" bigserial PRIMARY KEY,
    "player_id" bigint REFERENCES "public"."players"(id) ON DELETE CASCADE,
    "team_id" bigint REFERENCES "public"."teams"(id) ON DELETE CASCADE,
    "position" text,
    "created_at" timestamp with time zone DEFAULT now(),
    UNIQUE(player_id, team_id)
);

CREATE INDEX idx_player_teams_player ON "public"."player_teams"(player_id);
CREATE INDEX idx_player_teams_team ON "public"."player_teams"(team_id);

COMMENT ON TABLE "public"."player_teams" IS 'Junction table linking players to teams. Supports any team size (2v2, 3v3, 6v6, etc.)';
COMMENT ON COLUMN "public"."player_teams"."position" IS 'Optional position: setter, outside, middle, libero, etc.';

-- 3. Add tournament type and team size to events table
ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS "tournament_type" text DEFAULT 'fixed-teams',
ADD COLUMN IF NOT EXISTS "team_size" integer DEFAULT 2;

COMMENT ON COLUMN "public"."events"."tournament_type" IS 'Tournament format: fixed-teams, mix-and-match, king-and-queen';
COMMENT ON COLUMN "public"."events"."team_size" IS 'Default team size for the tournament: 2 (doubles), 3, 4, 6 (indoor), etc.';

-- 4. Modify teams table to support temporary teams and team size
ALTER TABLE "public"."teams"
ADD COLUMN IF NOT EXISTS "is_temporary" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "round" integer,
ADD COLUMN IF NOT EXISTS "team_size" integer;

CREATE INDEX idx_teams_round ON "public"."teams"(round);
CREATE INDEX idx_teams_is_temporary ON "public"."teams"(is_temporary);

COMMENT ON COLUMN "public"."teams"."is_temporary" IS 'True for teams generated per-round in mix-and-match tournaments';
COMMENT ON COLUMN "public"."teams"."round" IS 'Which round this team was created for (for temporary teams)';
COMMENT ON COLUMN "public"."teams"."team_size" IS 'Expected number of players on this team';

-- 5. Create player_stats table for individual performance tracking
CREATE TABLE IF NOT EXISTS "public"."player_stats" (
    "id" bigserial PRIMARY KEY,
    "player_id" bigint REFERENCES "public"."players"(id) ON DELETE CASCADE,
    "event_id" bigint REFERENCES "public"."events"(id) ON DELETE CASCADE,
    "match_id" bigint REFERENCES "public"."matches"(id) ON DELETE CASCADE,
    "points_scored" integer DEFAULT 0,
    "points_allowed" integer DEFAULT 0,
    "win" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    UNIQUE(player_id, match_id)
);

CREATE INDEX idx_player_stats_player ON "public"."player_stats"(player_id);
CREATE INDEX idx_player_stats_event ON "public"."player_stats"(event_id);
CREATE INDEX idx_player_stats_match ON "public"."player_stats"(match_id);

COMMENT ON TABLE "public"."player_stats" IS 'Individual player performance per match for standings calculation';
COMMENT ON COLUMN "public"."player_stats"."win" IS 'Did this player win this match?';

-- 6. Add RLS policies for players table
ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players are viewable by event participants"
ON "public"."players"
FOR SELECT
USING (
    event_id IN (
        SELECT id FROM "public"."events" WHERE owner = auth.uid()
    )
);

CREATE POLICY "Players can be created by event owners"
ON "public"."players"
FOR INSERT
WITH CHECK (
    event_id IN (
        SELECT id FROM "public"."events" WHERE owner = auth.uid()
    )
);

CREATE POLICY "Players can be updated by event owners"
ON "public"."players"
FOR UPDATE
USING (
    event_id IN (
        SELECT id FROM "public"."events" WHERE owner = auth.uid()
    )
);

CREATE POLICY "Players can be deleted by event owners"
ON "public"."players"
FOR DELETE
USING (
    event_id IN (
        SELECT id FROM "public"."events" WHERE owner = auth.uid()
    )
);

-- 7. Add RLS policies for player_teams table
ALTER TABLE "public"."player_teams" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player teams are viewable by event participants"
ON "public"."player_teams"
FOR SELECT
USING (
    player_id IN (
        SELECT id FROM "public"."players"
        WHERE event_id IN (
            SELECT id FROM "public"."events" WHERE owner = auth.uid()
        )
    )
);

CREATE POLICY "Player teams can be managed by event owners"
ON "public"."player_teams"
FOR ALL
USING (
    player_id IN (
        SELECT id FROM "public"."players"
        WHERE event_id IN (
            SELECT id FROM "public"."events" WHERE owner = auth.uid()
        )
    )
);

-- 8. Add RLS policies for player_stats table
ALTER TABLE "public"."player_stats" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player stats are viewable by event participants"
ON "public"."player_stats"
FOR SELECT
USING (
    event_id IN (
        SELECT id FROM "public"."events" WHERE owner = auth.uid()
    )
);

CREATE POLICY "Player stats can be managed by event owners"
ON "public"."player_stats"
FOR ALL
USING (
    event_id IN (
        SELECT id FROM "public"."events" WHERE owner = auth.uid()
    )
);

-- 9. Add check constraint for King & Queen even team size
ALTER TABLE "public"."events"
ADD CONSTRAINT check_king_queen_even_team_size
CHECK (
    tournament_type != 'king-and-queen' OR team_size % 2 = 0
);

COMMENT ON CONSTRAINT check_king_queen_even_team_size ON "public"."events"
IS 'King & Queen requires even team size (equal males and females)';
