-- ==============================================================================
-- Verification Script for Migration 033: Admin Controls (Part D)
-- ==============================================================================
-- Run in the Supabase SQL Editor after applying 033_admin_trial_controls.sql.
-- Returns ONE jsonb_pretty object verifying:
-- 1. Each of the 12 admin functions exists with exactly 1 overload.
-- 2. Each function has prosecdef = true (SECURITY DEFINER).
-- 3. Each function has search_path explicitly set to public, pg_temp.
-- 4. Execution privilege is true for authenticated, and false for anon and public.
-- ==============================================================================

WITH admin_functions AS (
  SELECT unnest(ARRAY[
    'admin_trial_get_offer(text)',
    'admin_trial_update_offer(text,boolean,integer,integer,integer,boolean)',
    'admin_trial_list_claims(text,text,integer,integer)',
    'admin_trial_extend(uuid,integer)',
    'admin_trial_revoke(uuid)',
    'admin_trial_reset_claim(uuid)',
    'admin_blocked_domains_list()',
    'admin_blocked_domain_add(text)',
    'admin_blocked_domain_remove(text)',
    'admin_price_overrides_list(text)',
    'admin_price_override_create(text,text,text,integer,numeric,timestamp with time zone,text)',
    'admin_price_override_revoke(uuid)'
  ]) AS full_sig
),
inspected AS (
  SELECT
    af.full_sig,
    (regproc_data.oid IS NOT NULL) AS exists,
    (
      SELECT count(*)
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = split_part(split_part(af.full_sig, '(', 1), '.', -1)
    ) AS overload_count,
    COALESCE(p.prosecdef, false) AS is_security_definer,
    COALESCE('search_path=public, pg_temp' = ANY(p.proconfig), false) AS search_path_set,
    has_function_privilege('authenticated', af.full_sig, 'EXECUTE') AS authenticated_executable,
    has_function_privilege('anon', af.full_sig, 'EXECUTE') AS anon_executable,
    has_function_privilege('public', af.full_sig, 'EXECUTE') AS public_executable
  FROM admin_functions af
  LEFT JOIN LATERAL (
    SELECT c.oid
    FROM pg_proc c
    JOIN pg_namespace n ON c.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.oid = (to_regprocedure('public.' || af.full_sig))
  ) regproc_data ON true
  LEFT JOIN pg_proc p ON p.oid = regproc_data.oid
)
SELECT jsonb_pretty(
  jsonb_build_object(
    'total_functions_checked', count(*),
    'all_exist', bool_and(exists),
    'all_have_single_overload', bool_and(overload_count = 1),
    'all_security_definer', bool_and(is_security_definer),
    'all_search_path_secure', bool_and(search_path_set),
    'all_authenticated_allowed', bool_and(authenticated_executable),
    'all_anon_forbidden', bool_and(NOT anon_executable),
    'all_public_forbidden', bool_and(NOT public_executable),
    'functions', jsonb_agg(
      jsonb_build_object(
        'signature', full_sig,
        'exists', exists,
        'overload_count', overload_count,
        'is_security_definer', is_security_definer,
        'search_path_set', search_path_set,
        'authenticated_can_execute', authenticated_executable,
        'anon_can_execute', anon_executable,
        'public_can_execute', public_executable
      )
      ORDER BY full_sig
    )
  )
) AS verification_result
FROM inspected;
