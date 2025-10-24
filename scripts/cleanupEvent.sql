-- Cleanup script for event_id = 1
-- This will delete all teams, matches, and player_teams records
-- but keep the event and players intact

-- Start transaction
BEGIN;

-- Delete all matches for event_id = 1
DELETE FROM matches WHERE event_id = 1;

-- Delete all player_teams records for teams in event_id = 1
DELETE FROM player_teams
WHERE team_id IN (
  SELECT id FROM teams WHERE event_id = 1
);

-- Delete all teams for event_id = 1
DELETE FROM teams WHERE event_id = 1;

-- Reset the current_round to 0
UPDATE events SET current_round = 0 WHERE id = 1;

-- Commit transaction
COMMIT;

-- Verify cleanup
SELECT
  'Event' as type,
  COUNT(*) as count
FROM events
WHERE id = 1

UNION ALL

SELECT
  'Players' as type,
  COUNT(*) as count
FROM players
WHERE event_id = 1

UNION ALL

SELECT
  'Teams' as type,
  COUNT(*) as count
FROM teams
WHERE event_id = 1

UNION ALL

SELECT
  'Matches' as type,
  COUNT(*) as count
FROM matches
WHERE event_id = 1

UNION ALL

SELECT
  'Player Teams' as type,
  COUNT(*) as count
FROM player_teams
WHERE team_id IN (
  SELECT id FROM teams WHERE event_id = 1
);
