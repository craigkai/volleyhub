-- Add format field to distinguish between individual and fixed-teams tournaments
-- This allows us to have Individual 2v2, Individual 3v3, etc.

DO $$ BEGIN
    CREATE TYPE event_format AS ENUM ('individual', 'fixed-teams');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS "format" event_format DEFAULT 'fixed-teams';

-- Migrate existing events:
-- Previously, team_size = 1 was used to indicate "individual/mix-and-match" format
-- Now we have a separate 'format' field and team_size means match size (players per side)
-- So if team_size was 1, set format='individual' and team_size=2 (assuming 2v2 matches)
UPDATE "public"."events"
SET
  "format" = 'individual',
  "team_size" = 2
WHERE "team_size" = 1;

COMMENT ON COLUMN "public"."events"."format" IS 'Tournament format: individual (players compete with different partners each round) or fixed-teams (pre-defined teams)';
COMMENT ON COLUMN "public"."events"."team_size" IS 'Number of players per side in matches (2 for 2v2, 3 for 3v3, etc.)';
