-- ====================================================================
-- CP Bot License Table Setup
-- ====================================================================
-- What this script does:
-- Creates the `cp_bot_licenses` table to sync license states from
-- automationalchemists.com via webhook.
-- 
-- How to use:
-- Run this script once, manually, in the Supabase SQL Editor of the
-- project that needs to sync license status.
-- ====================================================================

-- 1. Create the licenses table
-- Uses "IF NOT EXISTS" so it is safe to run multiple times.
CREATE TABLE IF NOT EXISTS public.cp_bot_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The user_id is nullable because a user might purchase before creating an account
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
-- This ensures that table access is strictly controlled by policies.
ALTER TABLE public.cp_bot_licenses ENABLE ROW LEVEL SECURITY;

-- 3. Create SELECT policy for authenticated users
-- This allows logged-in users to read their own license status.
-- They can only read a row if the user_id matches their own auth.uid().
-- We drop the policy first to prevent errors if the script is re-run.
DROP POLICY IF EXISTS "Users can read own cp_bot_license" ON public.cp_bot_licenses;
CREATE POLICY "Users can read own cp_bot_license"
ON public.cp_bot_licenses
FOR SELECT
TO authenticated
USING (
    (SELECT auth.uid()) = user_id
);

-- NOTE: 
-- There are NO policies for INSERT, UPDATE, or DELETE.
-- This intentionally prevents clients from modifying their own license status.
-- The server-side webhook will bypass RLS by using the Service Role Key
-- to securely insert and update records.
