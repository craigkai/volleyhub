-- Force PostgREST to refresh its schema cache
-- This is needed when migrations have been applied but PostgREST hasn't picked up the changes

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Also explicitly ensure tournament_type column is dropped if it exists
ALTER TABLE IF EXISTS public.events
DROP COLUMN IF EXISTS tournament_type;
