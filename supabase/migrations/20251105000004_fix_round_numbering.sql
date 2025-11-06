-- Fix round numbering: migrate from 0-indexed to 1-indexed rounds
-- Existing matches with round=0 should become round=1, round=1 becomes round=2, etc.

-- Only update if there are matches with round=0 (indicates 0-indexed system)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.matches WHERE round = 0) THEN
    -- Increment all match rounds by 1
    UPDATE public.matches
    SET round = round + 1;

    -- Increment current_round in events by 1 (if not null and >= 0)
    UPDATE public.events
    SET current_round = current_round + 1
    WHERE current_round IS NOT NULL AND current_round >= 0;
  END IF;
END $$;

COMMENT ON COLUMN public.matches.round IS 'Round number (1-indexed: rounds start at 1, not 0)';
COMMENT ON COLUMN public.events.current_round IS 'Current active round (1-indexed: rounds start at 1, not 0)';
