-- Add format field to distinguish between individual and fixed-teams tournaments
-- This allows us to have Individual 2v2, Individual 3v3, etc.

DO $$ BEGIN
    CREATE TYPE event_format AS ENUM ('individual', 'fixed-teams');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS "format" event_format DEFAULT 'fixed-teams';

-- Update existing events based on team_size
-- If team_size = 1, it was likely meant to be individual format
UPDATE "public"."events"
SET "format" = 'individual'
WHERE "team_size" = 1;

-- Set team_size to 2 for any individual events that had team_size = 1
-- (Individual format with 1v1 matches doesn't make sense)
UPDATE "public"."events"
SET "team_size" = 2
WHERE "format" = 'individual' AND "team_size" = 1;

COMMENT ON COLUMN "public"."events"."format" IS 'Tournament format: individual (players paired randomly each round) or fixed-teams (pre-defined teams)';
COMMENT ON COLUMN "public"."events"."team_size" IS 'Number of players per side in matches (2 for 2v2, 3 for 3v3, etc.)';
