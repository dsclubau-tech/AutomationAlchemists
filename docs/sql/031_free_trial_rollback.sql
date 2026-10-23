-- ==============================================================================
-- Rollback for Migration 031: Free Trial and User Price Overrides
-- ==============================================================================
-- Drops new functions, policies, tables, and permissions in dependency order.
--
-- NOTE ON SUBSCRIPTIONS.IS_TRIAL:
-- The column `subscriptions.is_trial` is NOT dropped automatically by this script
-- to prevent accidental data loss or blocking locks on the live subscriptions table.
-- If you need to drop it manually after ensuring no trial rows exist:
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS is_trial;
--
-- NOTE ON TRIAL_OFFERS COLUMNS:
-- If rolling back individual columns rather than the entire table:
--   ALTER TABLE public.trial_offers DROP COLUMN IF EXISTS slots_reserved;
--   ALTER TABLE public.trial_offers DROP COLUMN IF EXISTS require_confirmed_email;
-- ==============================================================================

BEGIN;

-- 1. Drop Functions
DROP FUNCTION IF EXISTS public.claim_free_trial(text);
DROP FUNCTION IF EXISTS public.get_trial_status(text);
DROP FUNCTION IF EXISTS public.get_trial_public(text);
DROP FUNCTION IF EXISTS public.normalize_email(text);

-- 2. Drop Policies
DROP POLICY IF EXISTS user_price_overrides_select_own ON public.user_price_overrides;
DROP POLICY IF EXISTS trial_claims_select_own ON public.trial_claims;

-- 3. Drop Tables (in foreign key dependency order)
DROP TABLE IF EXISTS public.user_price_overrides;
DROP TABLE IF EXISTS public.trial_claims;
DROP TABLE IF EXISTS public.trial_offers;
DROP TABLE IF EXISTS public.blocked_email_domains;

COMMIT;
