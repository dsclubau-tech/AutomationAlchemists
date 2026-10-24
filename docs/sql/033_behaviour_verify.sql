-- ==============================================================================
-- 033_behaviour_verify.sql
-- Non-destructive behavior verification for Migration 033: Admin Controls (Part D)
-- Run in the Supabase SQL Editor.
-- NOTE: Uses an intentional RAISE EXCEPTION at the end to guarantee that ALL
-- mutations are rolled back 100%. The JSON report is rendered in the error message.
-- ==============================================================================

DO $$
DECLARE
  v_non_admin_id uuid := '50ef4d35-c7aa-47fe-bbb0-68c74afd6a3c';
  v_admin_id uuid;
  v_admin_email text;
  v_results jsonb := jsonb_build_object();
  
  -- Reusable variables
  v_res jsonb;
  v_dummy_uuid uuid := gen_random_uuid();
  v_non_admin_results jsonb := jsonb_build_object();
  v_all_denied boolean := true;
  
  -- Fake claim variables
  v_fake_sub_id uuid;
  v_fake_claim_id uuid;
  v_converted_claim_id uuid;
  v_fake_override_id uuid;
  v_initial_end timestamptz;
  v_sub_row record;
  v_claim_row record;
  
  -- Blocked domain variables
  v_test_domain text := 'verify-test-' || substr(gen_random_uuid()::text, 1, 8) || '.com';
  v_domains_res jsonb;
  v_domain_found boolean;

  -- Task 3 verification variables
  v_expired_override_id uuid;
  v_new_override_id uuid;
  v_unrevoked_count int;
  v_old_row_revoked_at timestamptz;
  v_old_row_ends_at timestamptz;
  v_audit_test_domain text := 'audit-test-' || substr(gen_random_uuid()::text, 1, 8) || '.com';
  v_audit_count_add int;
  v_audit_count_remove int;

  -- Row leak baseline variables
  v_start_subs int;
  v_start_claims int;
  v_start_overrides int;
  v_start_domains int;
  v_end_subs int;
  v_end_claims int;
  v_end_overrides int;
  v_end_domains int;
BEGIN
  -- ----------------------------------------------------------------------------
  -- 0. SNAPSHOT BASELINE ROW COUNTS (AS TABLE OWNER)
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_start_subs FROM public.subscriptions;
  SELECT count(*) INTO v_start_claims FROM public.trial_claims;
  SELECT count(*) INTO v_start_overrides FROM public.user_price_overrides;
  SELECT count(*) INTO v_start_domains FROM public.blocked_email_domains;

  -- ----------------------------------------------------------------------------
  -- 1. IMPERSONATE NON-ADMIN TEST USER
  -- Must prove EVERY admin_ function refuses with 'not_admin' (SQLSTATE 42501).
  -- ----------------------------------------------------------------------------
  BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_non_admin_id::text, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;

    -- 1. admin_trial_get_offer
    BEGIN
      PERFORM public.admin_trial_get_offer('rccp');
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_get_offer}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_get_offer}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 2. admin_trial_update_offer
    BEGIN
      PERFORM public.admin_trial_update_offer('rccp', false, 14, 500, 0, false);
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_update_offer}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_update_offer}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 3. admin_trial_list_claims
    BEGIN
      PERFORM public.admin_trial_list_claims('rccp', NULL, 10, 0);
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_list_claims}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_list_claims}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 4. admin_trial_extend
    BEGIN
      PERFORM public.admin_trial_extend(v_dummy_uuid, 7);
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_extend}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_extend}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 5. admin_trial_revoke
    BEGIN
      PERFORM public.admin_trial_revoke(v_dummy_uuid);
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_revoke}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_revoke}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 6. admin_trial_reset_claim
    BEGIN
      PERFORM public.admin_trial_reset_claim(v_dummy_uuid);
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_reset_claim}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_trial_reset_claim}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 7. admin_blocked_domains_list
    BEGIN
      PERFORM public.admin_blocked_domains_list();
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_blocked_domains_list}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_blocked_domains_list}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 8. admin_blocked_domain_add
    BEGIN
      PERFORM public.admin_blocked_domain_add('temp-spam.com');
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_blocked_domain_add}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_blocked_domain_add}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 9. admin_blocked_domain_remove
    BEGIN
      PERFORM public.admin_blocked_domain_remove('temp-spam.com');
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_blocked_domain_remove}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_blocked_domain_remove}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 10. admin_price_overrides_list
    BEGIN
      PERFORM public.admin_price_overrides_list('rccp');
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_price_overrides_list}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_price_overrides_list}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 11. admin_price_override_create
    BEGIN
      PERFORM public.admin_price_override_create('test@example.com', 'rccp', 'fixed_price', 1000, NULL, NULL, 'test');
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_price_override_create}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_price_override_create}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    -- 12. admin_price_override_revoke
    BEGIN
      PERFORM public.admin_price_override_revoke(v_dummy_uuid);
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_price_override_revoke}', '"allowed_unexpected"');
      v_all_denied := false;
    EXCEPTION WHEN OTHERS THEN
      v_non_admin_results := jsonb_set(v_non_admin_results, '{admin_price_override_revoke}', to_jsonb(SQLERRM));
      IF SQLSTATE <> '42501' THEN v_all_denied := false; END IF;
    END;

    RESET ROLE;

    v_results := jsonb_set(v_results, '{non_admin_guard}', jsonb_build_object(
      'passed', v_all_denied,
      'details', v_non_admin_results
    ));
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    v_results := jsonb_set(v_results, '{non_admin_guard}', jsonb_build_object(
      'passed', false,
      'error', SQLERRM
    ));
  END;

  -- ----------------------------------------------------------------------------
  -- 2. LOOK UP ACTIVE ADMIN USER (AS TABLE OWNER)
  -- ----------------------------------------------------------------------------
  SELECT p.id, u.email INTO v_admin_id, v_admin_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_admin = true
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    v_results := jsonb_set(v_results, '{admin_tests}', jsonb_build_object(
      'skipped', true,
      'reason', 'No admin profile found in public.profiles'
    ));
  ELSE
    -- Impersonate admin user
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;

    -- --------------------------------------------------------------------------
    -- 2A: admin_trial_update_offer validation & success
    -- --------------------------------------------------------------------------
    BEGIN
      -- Validation 1: invalid days (< 1)
      v_res := public.admin_trial_update_offer('rccp', false, 0, 500, 0, false);
      IF (v_res->>'ok')::boolean = true OR (v_res->>'error') <> 'invalid_trial_days' THEN
        RAISE EXCEPTION 'Expected invalid_trial_days error, got %', v_res;
      END IF;

      -- Validation 2: invalid slot cap (< 0)
      v_res := public.admin_trial_update_offer('rccp', false, 14, -1, 0, false);
      IF (v_res->>'ok')::boolean = true OR (v_res->>'error') <> 'invalid_slot_cap' THEN
        RAISE EXCEPTION 'Expected invalid_slot_cap error, got %', v_res;
      END IF;

      -- Validation 3: cap below taken (slots_reserved = 1000, slot_cap = 500)
      v_res := public.admin_trial_update_offer('rccp', false, 14, 500, 1000, false);
      IF (v_res->>'ok')::boolean = true OR (v_res->>'error') <> 'cap_below_taken' THEN
        RAISE EXCEPTION 'Expected cap_below_taken error, got %', v_res;
      END IF;

      -- Valid update: save offer
      v_res := public.admin_trial_update_offer('rccp', false, 30, 500, 0, false);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'Failed valid update_offer: %', v_res;
      END IF;

      v_results := jsonb_set(v_results, '{admin_update_offer}', jsonb_build_object(
        'passed', true,
        'detail', 'Input validations enforced (invalid_trial_days, invalid_slot_cap, cap_below_taken) and valid update succeeded'
      ));
    EXCEPTION WHEN OTHERS THEN
      v_results := jsonb_set(v_results, '{admin_update_offer}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- --------------------------------------------------------------------------
    -- 2B: admin_trial_list_claims
    -- --------------------------------------------------------------------------
    BEGIN
      v_res := public.admin_trial_list_claims('rccp', NULL, 10, 0);
      IF (v_res->>'ok')::boolean = true AND jsonb_typeof(v_res->'claims') = 'array' THEN
        v_results := jsonb_set(v_results, '{admin_list_claims}', jsonb_build_object(
          'passed', true,
          'total_count', v_res->'total_count'
        ));
      ELSE
        v_results := jsonb_set(v_results, '{admin_list_claims}', jsonb_build_object('passed', false, 'detail', v_res));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_results := jsonb_set(v_results, '{admin_list_claims}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- --------------------------------------------------------------------------
    -- 2C: Fake claim lifecycle: extend -> revoke -> reset
    -- --------------------------------------------------------------------------
    BEGIN
      -- Step 0: Create fixture as table owner
      RESET ROLE;
      v_initial_end := now() + interval '7 days';

      INSERT INTO public.subscriptions (
        user_id, email, product_slug, status, is_trial, grant_reason, manually_granted, current_period_end
      ) VALUES (
        v_non_admin_id, 'fake-trial-verify@example.com', 'cpbot', 'active', true, 'free_trial', false, v_initial_end
      ) RETURNING id INTO v_fake_sub_id;

      INSERT INTO public.trial_claims (
        tool_slug, user_id, email_normalized, trial_ends_at, subscription_id
      ) VALUES (
        'rccp', v_non_admin_id, 'fake-trial-verify@example.com', v_initial_end, v_fake_sub_id
      ) RETURNING id INTO v_fake_claim_id;

      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      -- Step 1: Extend claim by 14 days (call as admin)
      v_res := public.admin_trial_extend(v_fake_claim_id, 14);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_trial_extend failed: %', v_res;
      END IF;

      -- Assert extend results as table owner
      RESET ROLE;
      SELECT current_period_end, status INTO v_sub_row FROM public.subscriptions WHERE id = v_fake_sub_id;
      SELECT trial_ends_at, revoked_at INTO v_claim_row FROM public.trial_claims WHERE id = v_fake_claim_id;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      IF v_sub_row.status <> 'active' THEN
        RAISE EXCEPTION 'After extend, subscription status expected active, got %', v_sub_row.status;
      END IF;
      IF v_sub_row.current_period_end IS DISTINCT FROM (v_res->>'new_ends_at')::timestamptz THEN
        RAISE EXCEPTION 'After extend, subscriptions.current_period_end (%) != returned new_ends_at (%)', v_sub_row.current_period_end, v_res->>'new_ends_at';
      END IF;
      IF v_claim_row.trial_ends_at IS DISTINCT FROM (v_res->>'new_ends_at')::timestamptz THEN
        RAISE EXCEPTION 'After extend, trial_claims.trial_ends_at (%) != returned new_ends_at (%)', v_claim_row.trial_ends_at, v_res->>'new_ends_at';
      END IF;
      IF abs(extract(epoch from (v_sub_row.current_period_end - (v_initial_end + interval '14 days')))) > 2 THEN
        RAISE EXCEPTION 'After extend, end time did not move by 14 days: % vs %', v_sub_row.current_period_end, (v_initial_end + interval '14 days');
      END IF;

      -- Step 2: Revoke claim (call as admin)
      v_res := public.admin_trial_revoke(v_fake_claim_id);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_trial_revoke failed: %', v_res;
      END IF;

      -- Assert revoke results as table owner
      RESET ROLE;
      SELECT current_period_end, status INTO v_sub_row FROM public.subscriptions WHERE id = v_fake_sub_id;
      SELECT trial_ends_at, revoked_at, revoked_reason INTO v_claim_row FROM public.trial_claims WHERE id = v_fake_claim_id;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      IF v_claim_row.revoked_at IS NULL OR v_claim_row.revoked_reason <> 'Revoked by admin' THEN
        RAISE EXCEPTION 'After revoke, claim revoked_at is NULL or reason wrong: revoked_at=%, reason=%', v_claim_row.revoked_at, v_claim_row.revoked_reason;
      END IF;
      IF v_sub_row.status <> 'canceled' THEN
        RAISE EXCEPTION 'After revoke, subscription status expected canceled, got %', v_sub_row.status;
      END IF;
      IF v_sub_row.current_period_end > now() THEN
        RAISE EXCEPTION 'After revoke, subscription current_period_end expected <= now(), got %', v_sub_row.current_period_end;
      END IF;

      -- Step 3: Reset claim (call as admin)
      v_res := public.admin_trial_reset_claim(v_fake_claim_id);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_trial_reset_claim failed: %', v_res;
      END IF;

      -- Assert reset results as table owner: claim and subscription completely deleted
      RESET ROLE;
      IF EXISTS (SELECT 1 FROM public.trial_claims WHERE id = v_fake_claim_id) THEN
        PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
        SET LOCAL ROLE authenticated;
        RAISE EXCEPTION 'Claim row still exists after reset';
      END IF;
      IF EXISTS (SELECT 1 FROM public.subscriptions WHERE id = v_fake_sub_id) THEN
        PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
        SET LOCAL ROLE authenticated;
        RAISE EXCEPTION 'Subscription row still exists after reset';
      END IF;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      -- Step 4: Test refusal on converted claim
      RESET ROLE;
      INSERT INTO public.trial_claims (
        tool_slug, user_id, email_normalized, trial_ends_at, converted_at
      ) VALUES (
        'rccp', v_non_admin_id, 'converted-claim@example.com', now() + interval '30 days', now()
      ) RETURNING id INTO v_converted_claim_id;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      -- Converted claim: extend refused
      v_res := public.admin_trial_extend(v_converted_claim_id, 7);
      IF (v_res->>'error') <> 'converted' THEN
        RAISE EXCEPTION 'Expected error converted on extending converted claim, got %', v_res;
      END IF;

      -- Converted claim: revoke refused
      v_res := public.admin_trial_revoke(v_converted_claim_id);
      IF (v_res->>'error') <> 'converted' THEN
        RAISE EXCEPTION 'Expected error converted on revoking converted claim, got %', v_res;
      END IF;

      -- Converted claim: reset refused
      v_res := public.admin_trial_reset_claim(v_converted_claim_id);
      IF (v_res->>'error') <> 'converted' THEN
        RAISE EXCEPTION 'Expected error converted on resetting converted claim, got %', v_res;
      END IF;

      -- Clean up converted claim fixture as table owner
      RESET ROLE;
      DELETE FROM public.trial_claims WHERE id = v_converted_claim_id;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      v_results := jsonb_set(v_results, '{admin_claim_lifecycle}', jsonb_build_object(
        'passed', true,
        'detail', 'Extend (+14d), revoke (status canceled), and reset (clean removal) succeeded; converted claims safely refused'
      ));
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      DELETE FROM public.trial_claims WHERE id IN (v_fake_claim_id, v_converted_claim_id);
      DELETE FROM public.subscriptions WHERE id = v_fake_sub_id;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;
      v_results := jsonb_set(v_results, '{admin_claim_lifecycle}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- --------------------------------------------------------------------------
    -- 2D: Price Overrides: create, validation, duplicate check, revoke
    -- --------------------------------------------------------------------------
    BEGIN
      -- Unknown user email -> user_not_found
      v_res := public.admin_price_override_create('unknown-user-nonexistent@example.com', 'rccp', 'fixed_price', 1000, NULL, NULL, 'test note');
      IF (v_res->>'error') <> 'user_not_found' THEN
        RAISE EXCEPTION 'Expected user_not_found error, got %', v_res;
      END IF;

      -- Low amount (< 50 cents) -> amount_too_low
      v_res := public.admin_price_override_create(v_admin_email, 'rccp', 'fixed_price', 40, NULL, NULL, 'test note');
      IF (v_res->>'error') <> 'amount_too_low' THEN
        RAISE EXCEPTION 'Expected amount_too_low error, got %', v_res;
      END IF;

      -- Valid creation
      v_res := public.admin_price_override_create(v_admin_email, 'rccp', 'fixed_price', 500, NULL, now() + interval '30 days', 'Partner discount');
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'Failed valid price override creation: %', v_res;
      END IF;
      v_fake_override_id := (v_res->>'override_id')::uuid;

      -- Revoke override
      v_res := public.admin_price_override_revoke(v_fake_override_id);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'Failed price override revoke: %', v_res;
      END IF;

      -- Clean up test fixture as table owner
      RESET ROLE;
      DELETE FROM public.user_price_overrides WHERE id = v_fake_override_id;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      v_results := jsonb_set(v_results, '{admin_price_overrides_basic}', jsonb_build_object(
        'passed', true,
        'detail', 'User lookup (user_not_found), constraint validation (amount_too_low), creation and revoke succeeded'
      ));
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      IF v_fake_override_id IS NOT NULL THEN
        DELETE FROM public.user_price_overrides WHERE id = v_fake_override_id;
      END IF;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;
      v_results := jsonb_set(v_results, '{admin_price_overrides_basic}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- --------------------------------------------------------------------------
    -- 2E: Price Overrides: EXPIRED un-revoked row auto-cleanup on new create
    -- --------------------------------------------------------------------------
    BEGIN
      -- Step 1: Insert an expired, un-revoked override directly as table owner
      RESET ROLE;
      INSERT INTO public.user_price_overrides (
        user_id, tool_slug, kind, amount_cents, currency, starts_at, ends_at, note, created_by, revoked_at
      ) VALUES (
        v_admin_id, 'rccp', 'fixed_price', 600, 'aud', now() - interval '30 days', now() - interval '1 day', 'Old expired', v_admin_id, NULL
      ) RETURNING id INTO v_expired_override_id;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      -- Step 2: Call admin_price_override_create for same user and tool -> must succeed
      v_res := public.admin_price_override_create(v_admin_email, 'rccp', 'fixed_price', 700, NULL, now() + interval '30 days', 'New active replacement');
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_price_override_create failed after expired row: %', v_res;
      END IF;
      v_new_override_id := (v_res->>'override_id')::uuid;

      -- Step 3: Verify old row is marked revoked with revoked_at = ends_at as table owner
      RESET ROLE;
      SELECT revoked_at, ends_at INTO v_old_row_revoked_at, v_old_row_ends_at
      FROM public.user_price_overrides
      WHERE id = v_expired_override_id;

      IF v_old_row_revoked_at IS NULL THEN
        RAISE EXCEPTION 'Old expired override was not marked revoked';
      END IF;
      IF v_old_row_revoked_at <> v_old_row_ends_at THEN
        RAISE EXCEPTION 'Old expired override revoked_at (%) did not match ends_at (%)', v_old_row_revoked_at, v_old_row_ends_at;
      END IF;

      -- Step 4: Verify exactly one un-revoked override remains for this user and tool as table owner
      SELECT count(*) INTO v_unrevoked_count
      FROM public.user_price_overrides
      WHERE user_id = v_admin_id AND tool_slug = 'rccp' AND revoked_at IS NULL;

      IF v_unrevoked_count <> 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 un-revoked override, found %', v_unrevoked_count;
      END IF;

      -- Clean up test rows as table owner
      DELETE FROM public.user_price_overrides WHERE id IN (v_new_override_id, v_expired_override_id);
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      v_results := jsonb_set(v_results, '{override_expired_cleanup}', jsonb_build_object(
        'passed', true,
        'detail', 'Expired un-revoked override was automatically marked revoked and new override created with exactly 1 active row remaining'
      ));
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      DELETE FROM public.user_price_overrides WHERE id IN (v_new_override_id, v_expired_override_id);
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;
      v_results := jsonb_set(v_results, '{override_expired_cleanup}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- --------------------------------------------------------------------------
    -- 2F: Price Overrides: Duplicate active override returns override_exists
    -- --------------------------------------------------------------------------
    BEGIN
      -- Create an active override (call as admin)
      v_res := public.admin_price_override_create(v_admin_email, 'rccp', 'fixed_price', 800, NULL, now() + interval '30 days', 'Active initial');
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'Initial override creation failed: %', v_res;
      END IF;
      v_new_override_id := (v_res->>'override_id')::uuid;

      -- Attempt second active override -> must return 'override_exists' (no raw error)
      v_res := public.admin_price_override_create(v_admin_email, 'rccp', 'fixed_price', 850, NULL, now() + interval '30 days', 'Duplicate second');
      IF (v_res->>'ok')::boolean = true OR (v_res->>'error') <> 'override_exists' THEN
        RAISE EXCEPTION 'Expected error override_exists, got %', v_res;
      END IF;

      v_results := jsonb_set(v_results, '{override_duplicate_returns_code}', jsonb_build_object(
        'passed', true,
        'detail', 'Attempting a second active override cleanly returned override_exists error code without throwing raw exception'
      ));

      -- Clean up test row as table owner
      RESET ROLE;
      DELETE FROM public.user_price_overrides WHERE id = v_new_override_id;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      IF v_new_override_id IS NOT NULL THEN
        DELETE FROM public.user_price_overrides WHERE id = v_new_override_id;
      END IF;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;
      v_results := jsonb_set(v_results, '{override_duplicate_returns_code}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- --------------------------------------------------------------------------
    -- 2G: Price Overrides: Tool not found & Note length limits
    -- --------------------------------------------------------------------------
    BEGIN
      -- Tool slug not in public.tools
      v_res := public.admin_price_override_create(v_admin_email, 'fake_tool_slug_xyz', 'fixed_price', 500, NULL, NULL, 'Test note');
      IF (v_res->>'ok')::boolean = true OR (v_res->>'error') <> 'tool_not_found' THEN
        RAISE EXCEPTION 'Expected tool_not_found error, got %', v_res;
      END IF;

      -- Note too long (> 500 characters)
      v_res := public.admin_price_override_create(v_admin_email, 'rccp', 'fixed_price', 500, NULL, NULL, repeat('x', 501));
      IF (v_res->>'ok')::boolean = true OR (v_res->>'error') <> 'note_too_long' THEN
        RAISE EXCEPTION 'Expected note_too_long error, got %', v_res;
      END IF;

      v_results := jsonb_set(v_results, '{override_tool_and_note_guards}', jsonb_build_object(
        'passed', true,
        'detail', 'Unregistered tool slug returned tool_not_found and note > 500 chars returned note_too_long'
      ));
    EXCEPTION WHEN OTHERS THEN
      v_results := jsonb_set(v_results, '{override_tool_and_note_guards}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- --------------------------------------------------------------------------
    -- 2H: Blocked domains: Protected domain guard
    -- --------------------------------------------------------------------------
    BEGIN
      v_res := public.admin_blocked_domain_add('gmail.com');
      IF (v_res->>'ok')::boolean = true OR (v_res->>'error') <> 'protected_domain' THEN
        RAISE EXCEPTION 'Expected protected_domain error for gmail.com, got %', v_res;
      END IF;

      v_res := public.admin_blocked_domain_add('outlook.com');
      IF (v_res->>'ok')::boolean = true OR (v_res->>'error') <> 'protected_domain' THEN
        RAISE EXCEPTION 'Expected protected_domain error for outlook.com, got %', v_res;
      END IF;

      v_results := jsonb_set(v_results, '{blocked_domain_protected_guard}', jsonb_build_object(
        'passed', true,
        'detail', 'Blocking mainstream email providers (gmail.com, outlook.com) cleanly refused with protected_domain error'
      ));
    EXCEPTION WHEN OTHERS THEN
      v_results := jsonb_set(v_results, '{blocked_domain_protected_guard}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- --------------------------------------------------------------------------
    -- 2I: Blocked domains: Audit logging only on actual insert/delete
    -- --------------------------------------------------------------------------
    BEGIN
      -- Add call 1 -> inserts row, writes 1 audit log
      v_res := public.admin_blocked_domain_add(v_audit_test_domain);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'First admin_blocked_domain_add failed: %', v_res;
      END IF;

      -- Add call 2 -> idempotent duplicate, no row inserted, NO second audit log
      v_res := public.admin_blocked_domain_add(v_audit_test_domain);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'Second admin_blocked_domain_add failed: %', v_res;
      END IF;

      -- Query audit log as table owner
      RESET ROLE;
      SELECT count(*) INTO v_audit_count_add
      FROM public.admin_audit_log
      WHERE action = 'admin_blocked_domain_add'
        AND (details->>'domain') = v_audit_test_domain;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      IF v_audit_count_add <> 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 audit log row for domain add, found %', v_audit_count_add;
      END IF;

      -- Remove call 1 -> deletes row, writes 1 audit log
      v_res := public.admin_blocked_domain_remove(v_audit_test_domain);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'First admin_blocked_domain_remove failed: %', v_res;
      END IF;

      -- Remove call 2 -> no row deleted, NO second audit log
      v_res := public.admin_blocked_domain_remove(v_audit_test_domain);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'Second admin_blocked_domain_remove failed: %', v_res;
      END IF;

      -- Query audit log as table owner
      RESET ROLE;
      SELECT count(*) INTO v_audit_count_remove
      FROM public.admin_audit_log
      WHERE action = 'admin_blocked_domain_remove'
        AND (details->>'domain') = v_audit_test_domain;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;

      IF v_audit_count_remove <> 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 audit log row for domain remove, found %', v_audit_count_remove;
      END IF;

      v_results := jsonb_set(v_results, '{blocked_domain_audit_log_once}', jsonb_build_object(
        'passed', true,
        'detail', 'Repeated idempotent domain add and remove calls write exactly one audit log row each'
      ));
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      DELETE FROM public.blocked_email_domains WHERE domain = v_audit_test_domain;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;
      v_results := jsonb_set(v_results, '{blocked_domain_audit_log_once}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- --------------------------------------------------------------------------
    -- 2J: Blocked domains: add, list verification, and remove
    -- --------------------------------------------------------------------------
    BEGIN
      -- Add domain (call as admin)
      v_res := public.admin_blocked_domain_add(v_test_domain);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_blocked_domain_add failed: %', v_res;
      END IF;

      -- Verify domain exists in list
      v_domains_res := public.admin_blocked_domains_list();
      SELECT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_domains_res->'domains') elem
        WHERE elem->>'domain' = v_test_domain
      ) INTO v_domain_found;

      IF NOT v_domain_found THEN
        RAISE EXCEPTION 'Added domain was not found in admin_blocked_domains_list';
      END IF;

      -- Remove domain (call as admin)
      v_res := public.admin_blocked_domain_remove(v_test_domain);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_blocked_domain_remove failed: %', v_res;
      END IF;

      -- Verify removed
      v_domains_res := public.admin_blocked_domains_list();
      SELECT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_domains_res->'domains') elem
        WHERE elem->>'domain' = v_test_domain
      ) INTO v_domain_found;

      IF v_domain_found THEN
        RAISE EXCEPTION 'Removed domain still found in admin_blocked_domains_list';
      END IF;

      v_results := jsonb_set(v_results, '{admin_blocked_domains_list_check}', jsonb_build_object(
        'passed', true,
        'detail', 'List verification and removal confirmed'
      ));
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      DELETE FROM public.blocked_email_domains WHERE domain = v_test_domain;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
      SET LOCAL ROLE authenticated;
      v_results := jsonb_set(v_results, '{admin_blocked_domains_list_check}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- Reset back to table owner before final checks
    RESET ROLE;

    -- --------------------------------------------------------------------------
    -- 2K: Final row leak check: ensure table row counts match baseline start
    -- --------------------------------------------------------------------------
    SELECT count(*) INTO v_end_subs FROM public.subscriptions;
    SELECT count(*) INTO v_end_claims FROM public.trial_claims;
    SELECT count(*) INTO v_end_overrides FROM public.user_price_overrides;
    SELECT count(*) INTO v_end_domains FROM public.blocked_email_domains;

    IF v_start_subs = v_end_subs
       AND v_start_claims = v_end_claims
       AND v_start_overrides = v_end_overrides
       AND v_start_domains = v_end_domains THEN
      v_results := jsonb_set(v_results, '{no_leaked_rows}', jsonb_build_object(
        'passed', true,
        'detail', format('Row counts preserved: subscriptions=%s, trial_claims=%s, user_price_overrides=%s, blocked_email_domains=%s',
          v_end_subs, v_end_claims, v_end_overrides, v_end_domains)
      ));
    ELSE
      v_results := jsonb_set(v_results, '{no_leaked_rows}', jsonb_build_object(
        'passed', false,
        'detail', format('Row count mismatch! start(subs=%s, claims=%s, overrides=%s, domains=%s) vs end(subs=%s, claims=%s, overrides=%s, domains=%s)',
          v_start_subs, v_start_claims, v_start_overrides, v_start_domains,
          v_end_subs, v_end_claims, v_end_overrides, v_end_domains)
      ));
    END IF;

  END IF;

  -- ----------------------------------------------------------------------------
  -- ROLLBACK & REPORT
  -- ----------------------------------------------------------------------------
  RAISE EXCEPTION 'ADMIN_VERIFY_RESULT (this error is intentional; everything was rolled back): %', jsonb_pretty(v_results);
END $$;
