-- ==============================================================================
-- 033_rollback.sql
-- Drops the 12 administrative functions introduced in Migration 033.
-- Run in the Supabase SQL Editor if you ever need to roll back Part D admin RPCs.
-- ==============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DROP FUNCTION IF EXISTS public.admin_trial_get_offer(text);
DROP FUNCTION IF EXISTS public.admin_trial_update_offer(text, boolean, int, int, int, boolean);
DROP FUNCTION IF EXISTS public.admin_trial_list_claims(text, text, int, int);
DROP FUNCTION IF EXISTS public.admin_trial_extend(uuid, int);
DROP FUNCTION IF EXISTS public.admin_trial_revoke(uuid);
DROP FUNCTION IF EXISTS public.admin_trial_reset_claim(uuid);
DROP FUNCTION IF EXISTS public.admin_blocked_domains_list();
DROP FUNCTION IF EXISTS public.admin_blocked_domain_add(text);
DROP FUNCTION IF EXISTS public.admin_blocked_domain_remove(text);
DROP FUNCTION IF EXISTS public.admin_price_overrides_list(text);
DROP FUNCTION IF EXISTS public.admin_price_override_create(text, text, text, int, numeric, timestamptz, text);
DROP FUNCTION IF EXISTS public.admin_price_override_revoke(uuid);

COMMIT;
