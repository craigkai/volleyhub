-- Add super admin support to existing RLS policies
-- Super admins (users with is_admin = true) can access all tournaments

-- Drop existing policies and recreate with super admin support
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."events";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."events";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."events";

-- Events policies with super admin support
CREATE POLICY "Enable read access for all users" ON "public"."events"
FOR SELECT USING (true);

CREATE POLICY "Enable update for event owners and super admins" ON "public"."events"
FOR UPDATE TO "authenticated"
USING (
  auth.uid() = owner
  OR
  auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
);

CREATE POLICY "Enable delete for event owners and super admins" ON "public"."events"
FOR DELETE TO "authenticated"
USING (
  auth.uid() = owner
  OR
  auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
);

-- Drop existing team policies
DROP POLICY IF EXISTS "Enable delete for users based on event owner" ON "public"."teams";
DROP POLICY IF EXISTS "Enable insert for authenticated users only where event owner" ON "public"."teams";

-- Teams policies with super admin support
CREATE POLICY "Enable insert for event owners and super admins" ON "public"."teams"
FOR INSERT TO "authenticated"
WITH CHECK (
  auth.uid() IN (SELECT owner FROM public.events WHERE id = teams.event_id)
  OR
  auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
);

CREATE POLICY "Enable delete for event owners and super admins" ON "public"."teams"
FOR DELETE TO "authenticated"
USING (
  auth.uid() IN (SELECT owner FROM public.events WHERE id = teams.event_id)
  OR
  auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
);

-- Drop existing match policies
DROP POLICY IF EXISTS "Enable delete for matches where auth'd user is owner of event" ON "public"."matches";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."matches";

-- Matches policies with super admin support
CREATE POLICY "Enable update for event owners and super admins" ON "public"."matches"
FOR UPDATE TO "authenticated"
USING (
  auth.uid() IN (SELECT owner FROM public.events WHERE id = matches.event_id)
  OR
  auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
);

CREATE POLICY "Enable delete for event owners and super admins" ON "public"."matches"
FOR DELETE TO "authenticated"
USING (
  auth.uid() IN (SELECT owner FROM public.events WHERE id = matches.event_id)
  OR
  auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
);