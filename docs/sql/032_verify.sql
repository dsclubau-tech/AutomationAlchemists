-- ==============================================================================
-- Verification Script for Migration 032
-- ==============================================================================
-- Run in the Supabase SQL Editor after applying 032_webhook_trial_conversion.sql.
-- Returns ONE jsonb_pretty object verifying:
-- 1. Exact overload count of public.process_stripe_webhook_event (must be exactly 1)
-- 2. Arguments, return type, security definer flag, and search_path of process_stripe_webhook_event
-- 3. Signature, return type, and execution grants of public.resolve_access_slug
--    (must be granted to postgres only; revoked from PUBLIC, anon, authenticated)
-- 4. Slug resolution test output for 'rccp' (expected 'cpbot') and unmapped tools
-- ==============================================================================

SELECT jsonb_pretty(
  jsonb_build_object(
    'process_stripe_webhook_event', (
      SELECT jsonb_build_object(
        'overload_count', count(*),
        'has_exactly_one_overload', (count(*) = 1),
        'functions', jsonb_agg(
          jsonb_build_object(
            'proname', p.proname,
            'arguments', pg_get_function_arguments(p.oid),
            'return_type', pg_get_function_result(p.oid),
            'prosecdef', p.prosecdef,
            'proconfig', p.proconfig
          )
        )
      )
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'process_stripe_webhook_event'
    ),
    'resolve_access_slug', (
      SELECT jsonb_build_object(
        'exists', (count(*) > 0),
        'signature', (
          SELECT pg_get_function_arguments(p.oid)
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' AND p.proname = 'resolve_access_slug'
          LIMIT 1
        ),
        'return_type', (
          SELECT pg_get_function_result(p.oid)
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' AND p.proname = 'resolve_access_slug'
          LIMIT 1
        ),
        'grants', jsonb_build_object(
          'postgres_can_execute', has_function_privilege('postgres', 'public.resolve_access_slug(text)', 'EXECUTE'),
          'anon_can_execute', has_function_privilege('anon', 'public.resolve_access_slug(text)', 'EXECUTE'),
          'authenticated_can_execute', has_function_privilege('authenticated', 'public.resolve_access_slug(text)', 'EXECUTE'),
          'service_role_can_execute', has_function_privilege('service_role', 'public.resolve_access_slug(text)', 'EXECUTE')
        ),
        'rccp_resolution', public.resolve_access_slug('rccp'),
        'orderbot_resolution', public.resolve_access_slug('orderbot')
      )
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'resolve_access_slug'
    )
  )
) AS verification_result;
