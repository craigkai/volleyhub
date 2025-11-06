-- Convert round numbering from 0-indexed to 1-indexed
-- This migration ensures existing matches that were stored with round=0, 1, 2, etc.
-- are updated to round=1, 2, 3, etc. to match the UI expectations

-- Increment all existing match rounds by 1
UPDATE "public"."matches"
SET "round" = "round" + 1
WHERE "round" >= 0;

-- Update the default value for new matches to start at 1 instead of 0
ALTER TABLE "public"."matches"
ALTER COLUMN "round" SET DEFAULT 1;

-- Also increment current_round in events table to match the new indexing
UPDATE "public"."events"
SET "current_round" = "current_round" + 1
WHERE "current_round" IS NOT NULL AND "current_round" >= 0;

COMMENT ON COLUMN "public"."matches"."round" IS 'Round number (1-indexed, starting at 1)';
COMMENT ON COLUMN "public"."events"."current_round" IS 'Current active round number (1-indexed, starting at 1)';
