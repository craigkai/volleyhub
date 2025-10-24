-- Remove the incorrect self-referencing foreign key constraint on matches.id
-- This constraint serves no purpose as a primary key shouldn't reference itself

-- Drop the incorrect constraint
ALTER TABLE "public"."matches" DROP CONSTRAINT IF EXISTS "public_matches_id_fkey";
