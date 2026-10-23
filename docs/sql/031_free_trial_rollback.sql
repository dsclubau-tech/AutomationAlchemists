-- ==============================================================================
-- Rollback for Migration 031: Free Trial and User Price Overrides
-- ==============================================================================
-- Drops new functions and tables in dependency order.
--
-- NOTE ON SUBSCRIPTIONS.IS_TRIAL:
-- The column `subscriptions.is_trial` is NOT dropped automatically by this script
-- to prevent accidental data loss or blocking locks on the live subscriptions table.
-- If you need to drop it manually after ensuring no trial rows exist:
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS is_trial;
--
-- OPTIONAL PRE-ROLLBACK STEP (EXPIRE ACTIVE TRIALS):
-- If any trial subscriptions are active, you can expire them with:
--   UPDATE public.subscriptions SET status = 'expired' WHERE is_trial = true;
-- WARNING: Export public.trial_claims FIRST if any exist, because dropping
-- trial_claims permanently erases the one-trial-per-email memory, allowing users
-- to claim another trial in the future if re-enabled.
-- ==============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- 1. Drop Functions (IF EXISTS with argument types)
DROP FUNCTION IF EXISTS public.claim_free_trial(text);
DROP FUNCTION IF EXISTS public.get_trial_status(text);
DROP FUNCTION IF EXISTS public.get_trial_public(text);
DROP FUNCTION IF EXISTS public.normalize_email(text);

-- 2. Drop Tables CASCADE (dropping tables automatically drops associated RLS policies)
DROP TABLE IF EXISTS public.user_price_overrides CASCADE;
DROP TABLE IF EXISTS public.trial_claims CASCADE;
DROP TABLE IF EXISTS public.trial_offers CASCADE;
DROP TABLE IF EXISTS public.blocked_email_domains CASCADE;

COMMIT;
