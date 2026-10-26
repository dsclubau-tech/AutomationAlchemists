-- ==============================================================================
-- Verification Script for Migration 034: Card-Required Trial Architecture
-- ==============================================================================
-- Run in the Supabase SQL Editor after applying 034_card_trial_identity.sql.
-- Returns ONE formatted JSON object verifying:
-- 1. Tables trial_identities and trial_denials exist with RLS enabled, 0 policies,
--    and zero privileges for anon, authenticated, public.
-- 2. New RPCs (trial_eligibility_for, finalize_card_trial, mirror_cancel_at_period_end)
--    exist with single overloads, are SECURITY DEFINER, search_path = public, pg_temp,
--    and executable strictly by service_role (forbidden to anon, authenticated, public).
-- 3. process_stripe_webhook_event and check_product_subscription each have EXACTLY
--    one overload in the public namespace.
-- 4. claim_free_trial, get_trial_status, and admin_trial_extend retain expected grants.
-- ==============================================================================

WITH table_checks AS (
  SELECT
    t.table_name,
    c.relrowsecurity AS rls_enabled,
    (SELECT count(*) FROM pg_policy pol WHERE pol.polrelid = c.oid) AS policy_count,
    has_table_privilege('anon', 'public.' || t.table_name, 'SELECT, INSERT, UPDATE, DELETE') AS anon_accessible,
    has_table_privilege('authenticated', 'public.' || t.table_name, 'SELECT, INSERT, UPDATE, DELETE') AS authenticated_accessible,
    has_table_privilege('public', 'public.' || t.table_name, 'SELECT, INSERT, UPDATE, DELETE') AS public_accessible
  FROM (VALUES ('trial_identities'), ('trial_denials')) AS t(table_name)
  JOIN pg_class c ON c.relname = t.table_name
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
),
functions_to_check AS (
  SELECT * FROM (VALUES
    ('trial_eligibility_for(uuid,text)', 'service_role_only'),
    ('finalize_card_trial(uuid,text,text,text,text,timestamp with time zone)', 'service_role_only'),
    ('mirror_cancel_at_period_end(text,boolean)', 'service_role_only'),
    ('claim_free_trial(text)', 'authenticated_only'),
    ('get_trial_status(text)', 'authenticated_only'),
    ('admin_trial_extend(uuid,integer)', 'authenticated_only'),
    ('process_stripe_webhook_event(text,text,uuid,text,text,text,text,text,numeric,timestamp with time zone,timestamp with time zone,integer,text)', 'service_and_postgres'),
    ('check_product_subscription(text)', 'existing_gate')
  ) AS f(full_sig, category)
),
inspected_funcs AS (
  SELECT
    fc.full_sig,
    fc.category,
    (regproc_data.oid IS NOT NULL) AS exists,
    (
      SELECT count(*)
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = split_part(split_part(fc.full_sig, '(', 1), '.', -1)
    ) AS overload_count,
    COALESCE(p.prosecdef, false) AS is_security_definer,
    COALESCE('search_path=public, pg_temp' = ANY(p.proconfig), false) AS search_path_set,
    has_function_privilege('service_role', 'public.' || fc.full_sig, 'EXECUTE') AS service_role_can_execute,
    has_function_privilege('authenticated', 'public.' || fc.full_sig, 'EXECUTE') AS authenticated_can_execute,
    has_function_privilege('anon', 'public.' || fc.full_sig, 'EXECUTE') AS anon_can_execute,
    has_function_privilege('public', 'public.' || fc.full_sig, 'EXECUTE') AS public_can_execute
  FROM functions_to_check fc
  LEFT JOIN LATERAL (
    SELECT c.oid
    FROM pg_proc c
    JOIN pg_namespace n ON c.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.oid = (to_regprocedure('public.' || fc.full_sig))
  ) regproc_data ON true
  LEFT JOIN pg_proc p ON p.oid = regproc_data.oid
)
SELECT jsonb_pretty(
  jsonb_build_object(
    'tables_verified', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'table', table_name,
          'rls_enabled', rls_enabled,
          'policy_count', policy_count,
          'anon_forbidden', NOT anon_accessible,
          'authenticated_forbidden', NOT authenticated_accessible,
          'public_forbidden', NOT public_accessible
        )
      ) FROM table_checks
    ),
    'single_overload_guarantee', (
      SELECT jsonb_build_object(
        'process_stripe_webhook_event_overloads', (
          SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' AND p.proname = 'process_stripe_webhook_event'
        ),
        'check_product_subscription_overloads', (
          SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' AND p.proname = 'check_product_subscription'
        ),
        'all_checked_funcs_single_overload', bool_and(overload_count = 1)
      ) FROM inspected_funcs
    ),
    'functions_verified', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'signature', full_sig,
          'category', category,
          'exists', exists,
          'overload_count', overload_count,
          'is_security_definer', is_security_definer,
          'search_path_set', search_path_set,
          'service_role_executable', service_role_can_execute,
          'authenticated_executable', authenticated_can_execute,
          'anon_forbidden', NOT anon_can_execute,
          'public_forbidden', NOT public_can_execute
        )
        ORDER BY full_sig
      ) FROM inspected_funcs
    )
  )
) AS verification_result;
