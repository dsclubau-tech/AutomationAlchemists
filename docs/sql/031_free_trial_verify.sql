-- ==============================================================================
-- Verification Scripts for Migration 031: Free Trial & User Price Overrides
-- ==============================================================================
-- NOTE: The Supabase SQL Editor displays only ONE result per execution.
-- This file contains TWO independently executable scripts:
--
-- SCRIPT 1 (READ-ONLY):
-- - Single SELECT returning a single jsonb_pretty(...) object.
-- - Verifies tables, columns, RLS flags, role privileges, function metadata,
--   seed values, email normalization tests, and subscription schema integrity.
--
-- SCRIPT 2 (ATOMIC SELF-ROLLING-BACK TEST HARNESS):
-- - Single DO $$ ... $$ block that CANNOT commit.
-- - Tests live claim workflow, idempotency, role-based privilege enforcement,
--   and slot math updates under impersonation.
-- - Ends with an UNCONDITIONAL RAISE EXCEPTION containing the full jsonb results,
--   guaranteeing all mutations are rolled back automatically.
-- ==============================================================================


-- ==============================================================================
-- SCRIPT 1: READ-ONLY SCHEMA & PRIVILEGE VERIFICATION
-- ==============================================================================
-- Run this in the Supabase SQL Editor. It performs zero writes and returns
-- a single formatted JSON object validating all migration 031 objects.

SELECT jsonb_pretty(
  jsonb_build_object(
    'objects_exist', jsonb_build_object(
      'subscriptions_is_trial_column_exists', EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'subscriptions' 
          AND column_name = 'is_trial'
      ),
      'subscriptions_with_is_trial_true_count', (
        SELECT count(*) FROM public.subscriptions WHERE is_trial = true
      ),
      'tables', (
        SELECT jsonb_object_agg(t.table_name, true)
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_name IN ('trial_offers', 'trial_claims', 'user_price_overrides', 'blocked_email_domains')
      )
    ),
    'row_level_security', (
      SELECT jsonb_object_agg(relname, rowsecurity)
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace
        AND relname IN ('trial_offers', 'trial_claims', 'user_price_overrides', 'blocked_email_domains')
    ),
    'privileges', (
      SELECT jsonb_object_agg(
        cand.rolname,
        CASE 
          WHEN pr.rolname IS NULL THEN jsonb_build_object('role_exists', false)
          ELSE jsonb_build_object(
            'role_exists', true,
            'table_privileges', (
              SELECT jsonb_object_agg(
                tbl,
                jsonb_build_object(
                  'select', has_table_privilege(pr.rolname, 'public.' || tbl, 'SELECT'),
                  'insert', has_table_privilege(pr.rolname, 'public.' || tbl, 'INSERT'),
                  'update', has_table_privilege(pr.rolname, 'public.' || tbl, 'UPDATE'),
                  'delete', has_table_privilege(pr.rolname, 'public.' || tbl, 'DELETE')
                )
              )
              FROM unnest(ARRAY['trial_offers', 'trial_claims', 'user_price_overrides', 'blocked_email_domains']) AS tbl
            ),
            'function_privileges', (
              SELECT jsonb_object_agg(
                fn,
                has_function_privilege(pr.rolname, 'public.' || fn, 'EXECUTE')
              )
              FROM unnest(ARRAY[
                'normalize_email(text)',
                'get_trial_public(text)',
                'get_trial_status(text)',
                'claim_free_trial(text)'
              ]) AS fn
            )
          )
        END
      )
      FROM (VALUES ('anon'), ('authenticated'), ('listflow_app')) AS cand(rolname)
      LEFT JOIN pg_roles pr ON pr.rolname = cand.rolname
    ),
    'function_definitions', (
      SELECT jsonb_object_agg(
        p.proname,
        jsonb_build_object(
          'prosecdef', p.prosecdef,
          'proconfig', p.proconfig
        )
      )
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname IN ('get_trial_public', 'get_trial_status', 'claim_free_trial', 'normalize_email')
    ),
    'rccp_offer_row', (
      SELECT to_jsonb(o)
      FROM public.trial_offers o
      WHERE o.tool_slug = 'rccp'
    ),
    'blocked_domain_count', (
      SELECT count(*) FROM public.blocked_email_domains
    ),
    'normalize_email_tests', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'input', t.test_input,
          'expected', t.expected_output,
          'actual', public.normalize_email(t.test_input),
          'passed', (public.normalize_email(t.test_input) IS NOT DISTINCT FROM t.expected_output)
        )
      )
      FROM (
        VALUES 
          ('Dsclub.Au+x@Gmail.com', 'dsclubau@gmail.com'),
          ('A.B+c@googlemail.com', 'ab@gmail.com'),
          ('Name+tag@Example.com', 'name@example.com'),
          ('first.last@example.com', 'first.last@example.com'),
          (' Test@X.COM ', 'test@x.com'),
          ('no-at-sign', NULL::text),
          ('', NULL::text),
          ('a+b@googlemail.com', 'a@gmail.com')
      ) AS t(test_input, expected_output)
    ),
    'existing_subscriptions_integrity', jsonb_build_object(
      'indexes', (
        SELECT jsonb_agg(indexname ORDER BY indexname)
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'subscriptions'
      ),
      'has_trg_subscription_history', EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
          AND c.relname = 'subscriptions' 
          AND t.tgname = 'trg_subscription_history'
      )
    )
  )
) AS script_1_verification_result;


-- ==============================================================================
-- SCRIPT 2: ATOMIC SELF-ROLLING-BACK TEST HARNESS
-- ==============================================================================
-- Run this block separately in the Supabase SQL Editor.
-- NOTE: It uses RAISE EXCEPTION at the end to guarantee that ALL mutations
-- (the offer enable, claims, and subscriptions created) are rolled back 100%.
-- Look at the error output: the full results JSON is rendered in the error message.

DO $$
DECLARE
  v_test_user_id uuid := '50ef4d35-c7aa-47fe-bbb0-68c74afd6a3c';
  v_test_user_email text;
  v_step1 jsonb;
  v_step2 jsonb;
  v_step3 jsonb;
  v_step4 jsonb;
  v_step5 jsonb;
  v_direct_select_count int;
  v_step6_passed boolean;
  v_step6_msg text;
  v_step7_public jsonb;
  v_step7_anon_public_passed boolean;
  v_step7_anon_public_msg text;
  v_step7_anon_claim_passed boolean;
  v_step7_anon_claim_msg text;
  v_step7_anon_status_passed boolean;
  v_step7_anon_status_msg text;
  v_created_sub record;
  v_created_sub_found boolean := false;
  v_created_claim record;
  v_created_claim_found boolean := false;
  v_owner_public jsonb;
  v_results jsonb;
  v_dummy_json jsonb;
BEGIN
  -- 1. Precondition Assertions
  SELECT email INTO v_test_user_email
  FROM auth.users
  WHERE id = v_test_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Precondition failed: Test user % does not exist in auth.users', v_test_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = v_test_user_id AND product_slug = 'cpbot') THEN
    RAISE EXCEPTION 'Precondition failed: Test user % already has a subscription row for cpbot', v_test_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.trial_claims WHERE user_id = v_test_user_id) THEN
    RAISE EXCEPTION 'Precondition failed: Test user % already has a trial_claims row', v_test_user_id;
  END IF;

  -- 2. As Owner: Enable offer, slot_cap 500, slots_reserved 59, require_confirmed_email false
  UPDATE public.trial_offers
  SET enabled = true,
      slot_cap = 500,
      slots_reserved = 59,
      require_confirmed_email = false
  WHERE tool_slug = 'rccp';

  -- 3. Impersonate test user
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_test_user_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_test_user_id::text, true);
  SET LOCAL ROLE authenticated;

  -- Step 1: get_trial_public('rccp')
  EXECUTE 'SELECT public.get_trial_public(''rccp'')' INTO v_step1;

  -- Step 2: get_trial_status('rccp') before claim
  EXECUTE 'SELECT public.get_trial_status(''rccp'')' INTO v_step2;

  -- Step 3: claim_free_trial('rccp') first attempt
  EXECUTE 'SELECT public.claim_free_trial(''rccp'')' INTO v_step3;

  -- Step 4: claim_free_trial('rccp') second attempt (idempotency check)
  EXECUTE 'SELECT public.claim_free_trial(''rccp'')' INTO v_step4;

  -- Step 5: get_trial_status('rccp') after claim
  EXECUTE 'SELECT public.get_trial_status(''rccp'')' INTO v_step5;

  -- Step 6: Direct SELECT on trial_claims as authenticated (must be refused)
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.trial_claims' INTO v_direct_select_count;
    v_step6_passed := false;
    v_step6_msg := 'Security hole: direct SELECT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    v_step6_passed := true;
    v_step6_msg := 'Refused with insufficient_privilege as expected';
  END;

  -- Step 7: Anon role privilege checks
  SET LOCAL ROLE anon;

  -- 7a. get_trial_public as anon (must succeed)
  BEGIN
    EXECUTE 'SELECT public.get_trial_public(''rccp'')' INTO v_step7_public;
    v_step7_anon_public_passed := (v_step7_public IS NOT NULL);
    v_step7_anon_public_msg := 'Execution succeeded as expected';
  EXCEPTION WHEN OTHERS THEN
    v_step7_anon_public_passed := false;
    v_step7_anon_public_msg := SQLERRM;
  END;

  -- 7b. claim_free_trial as anon (must be refused with insufficient_privilege)
  BEGIN
    EXECUTE 'SELECT public.claim_free_trial(''rccp'')' INTO v_dummy_json;
    v_step7_anon_claim_passed := false;
    v_step7_anon_claim_msg := 'Security hole: claim_free_trial unexpectedly succeeded for anon';
  EXCEPTION WHEN insufficient_privilege THEN
    v_step7_anon_claim_passed := true;
    v_step7_anon_claim_msg := 'Refused with insufficient_privilege as expected';
  END;

  -- 7c. get_trial_status as anon (must be refused with insufficient_privilege)
  BEGIN
    EXECUTE 'SELECT public.get_trial_status(''rccp'')' INTO v_dummy_json;
    v_step7_anon_status_passed := false;
    v_step7_anon_status_msg := 'Security hole: get_trial_status unexpectedly succeeded for anon';
  EXCEPTION WHEN insufficient_privilege THEN
    v_step7_anon_status_passed := true;
    v_step7_anon_status_msg := 'Refused with insufficient_privilege as expected';
  END;

  -- 4. Reset role to read created records as owner
  RESET ROLE;

  SELECT id, user_id, email, product_slug, status, is_trial, current_period_end
  INTO v_created_sub
  FROM public.subscriptions
  WHERE user_id = v_test_user_id AND product_slug = 'cpbot';
  v_created_sub_found := FOUND;

  SELECT id, tool_slug, user_id, email_normalized, trial_ends_at, subscription_id
  INTO v_created_claim
  FROM public.trial_claims
  WHERE user_id = v_test_user_id AND tool_slug = 'rccp';
  v_created_claim_found := FOUND;

  v_owner_public := public.get_trial_public('rccp');

  -- 5. Compile full test results
  v_results := jsonb_build_object(
    'test_user', jsonb_build_object('id', v_test_user_id, 'email', v_test_user_email),
    'step1_public_before', jsonb_build_object(
      'result', v_step1,
      'passed', ((v_step1->>'slots_taken')::int = 59 AND (v_step1->>'slots_left')::int = 441)
    ),
    'step2_status_before', jsonb_build_object(
      'result', v_step2,
      'passed', ((v_step2->>'eligible')::boolean = true AND v_step2->>'reason' = 'ok')
    ),
    'step3_claim_first', jsonb_build_object(
      'result', v_step3,
      'passed', ((v_step3->>'ok')::boolean = true)
    ),
    'step4_claim_second_idempotent', jsonb_build_object(
      'result', v_step4,
      'passed', ((v_step4->>'ok')::boolean = false AND v_step4->>'reason' = 'already_claimed')
    ),
    'step5_status_after_claim', jsonb_build_object(
      'result', v_step5,
      'passed', (
        (v_step5->>'already_claimed')::boolean = true
        AND (v_step5->'claim'->>'ends_at') IS NOT NULL
        AND v_step5->>'reason' = 'already_claimed'
      )
    ),
    'step6_authenticated_direct_select_refused', jsonb_build_object(
      'passed', v_step6_passed,
      'message', v_step6_msg
    ),
    'step7_anon_privileges', jsonb_build_object(
      'public_function_allowed', jsonb_build_object('passed', v_step7_anon_public_passed, 'message', v_step7_anon_public_msg),
      'claim_function_refused', jsonb_build_object('passed', v_step7_anon_claim_passed, 'message', v_step7_anon_claim_msg),
      'status_function_refused', jsonb_build_object('passed', v_step7_anon_status_passed, 'message', v_step7_anon_status_msg)
    ),
    'step8_owner_verified_records', jsonb_build_object(
      'subscription_row', CASE 
        WHEN v_created_sub_found THEN jsonb_build_object(
          'id', v_created_sub.id,
          'product_slug', v_created_sub.product_slug,
          'is_trial', v_created_sub.is_trial,
          'status', v_created_sub.status,
          'current_period_end', v_created_sub.current_period_end,
          'passed', (
            v_created_sub.product_slug = 'cpbot'
            AND v_created_sub.is_trial = true
            AND v_created_sub.status = 'active'
            AND v_created_sub.current_period_end > (now() + interval '29 days')
          )
        )
        ELSE jsonb_build_object('found', false, 'passed', false)
      END,
      'trial_claim_row', CASE 
        WHEN v_created_claim_found THEN jsonb_build_object(
          'id', v_created_claim.id,
          'tool_slug', v_created_claim.tool_slug,
          'user_id', v_created_claim.user_id,
          'subscription_id', v_created_claim.subscription_id,
          'passed', (
            v_created_claim.tool_slug = 'rccp'
            AND v_created_claim.subscription_id = v_created_sub.id
          )
        )
        ELSE jsonb_build_object('found', false, 'passed', false)
      END,
      'slot_math_after_claim', jsonb_build_object(
        'result', v_owner_public,
        'passed', ((v_owner_public->>'slots_taken')::int = 60 AND (v_owner_public->>'slots_left')::int = 440)
      )
    )
  );

  -- 6. Unconditional intentional exception to roll back all mutations completely
  RAISE EXCEPTION 'VERIFY_RESULT (this error is intentional; everything was rolled back): %', jsonb_pretty(v_results);

END $$;
