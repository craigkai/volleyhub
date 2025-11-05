-- Fix player_teams DELETE policy to allow deletion through team ownership
-- The previous policy checked through players, which doesn't work well for cleanup operations
-- This new policy checks through the team's event ownership, which is more appropriate

-- Drop the problematic DELETE policy
DROP POLICY IF EXISTS "Enable delete for event owners and admins" ON "public"."player_teams";

-- Create a better DELETE policy that checks team ownership
CREATE POLICY "Enable delete for event owners and admins" ON "public"."player_teams"
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT e.owner
    FROM events e
    JOIN teams t ON t.event_id = e.id
    WHERE t.id = player_teams.team_id
  ) OR current_user_is_admin()
);
