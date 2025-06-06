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

-- Seed admin user if they exist in auth.users and aren't already in public.users
INSERT INTO public.users (id, name, is_admin, approved, approved_at)
SELECT id, 'Root', true, true, now()
FROM auth.users
WHERE email = 'root@ceal.dev'
  AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.users.id
  );
