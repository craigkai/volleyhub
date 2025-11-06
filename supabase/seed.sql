-- in supabase/seed.sql
insert into
auth.users (instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token)
values
( '00000000-0000-0000-0000-000000000000',
            uuid_generate_v4(),
            'authenticated',
            'authenticated',
            'root@ceal.dev',
            crypt ('njkdnbkjdbfhjf', gen_salt ('bf')),
            current_timestamp,
            current_timestamp,
            current_timestamp,
            '{"provider":"email","providers":["email"]}',
            '{}',
            current_timestamp,
            current_timestamp,
            '',
            '',
            '',
            '');

-- Seed admin user - update or insert if they exist in auth.users
-- The handle_new_user() trigger creates the user with is_admin=false, approved=false
-- So we need to UPDATE it to set the correct values
INSERT INTO public.users (id, name, is_admin, approved, approved_at)
SELECT id, 'root@ceal.dev', true, true, now()
FROM auth.users
WHERE email = 'root@ceal.dev'
ON CONFLICT (id) DO UPDATE
SET
  name = 'root@ceal.dev',
  is_admin = true,
  approved = true,
  approved_at = now();
