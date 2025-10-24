-- Fix the "Admin can read all" RLS policy for users table
-- The original policy was checking if the row's is_admin is true,
-- instead of checking if the current user is an admin

-- Drop the broken policy
DROP POLICY IF EXISTS "Admin can read all" ON public.users;

-- Create the correct policy that checks if the current logged-in user is an admin
CREATE POLICY "Admin can read all"
ON public.users
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR current_user_is_admin()
);
