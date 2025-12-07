-- Run this script in your Supabase Dashboard SQL Editor to make the user an admin
-- This is required because the security policy prevents client-side admin assignment

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'dsclub.au@outlook.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was assigned
SELECT * FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dsclub.au@outlook.com');
