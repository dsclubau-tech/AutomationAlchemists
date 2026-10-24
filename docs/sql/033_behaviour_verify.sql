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
  
  -- Blocked domain variables
  v_test_domain text := 'verify-test-' || substr(gen_random_uuid()::text, 1, 8) || '.com';
  v_domains_res jsonb;
  v_domain_found boolean;
BEGIN
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
  -- 2. LOOK UP ACTIVE ADMIN USER
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
      -- Create a fake active trial subscription & claim
      INSERT INTO public.subscriptions (
        user_id, email, product_slug, status, is_trial, grant_reason, manually_granted, current_period_end
      ) VALUES (
        v_non_admin_id, 'fake-trial-verify@example.com', 'cpbot', 'active', true, 'free_trial', false, now() + interval '7 days'
      ) RETURNING id INTO v_fake_sub_id;

      INSERT INTO public.trial_claims (
        tool_slug, user_id, email_normalized, trial_ends_at, subscription_id
      ) VALUES (
        'rccp', v_non_admin_id, 'fake-trial-verify@example.com', now() + interval '7 days', v_fake_sub_id
      ) RETURNING id INTO v_fake_claim_id;

      -- 1. Extend claim by 14 days
      v_res := public.admin_trial_extend(v_fake_claim_id, 14);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_trial_extend failed: %', v_res;
      END IF;

      -- 2. Revoke claim
      v_res := public.admin_trial_revoke(v_fake_claim_id);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_trial_revoke failed: %', v_res;
      END IF;

      -- Verify subscription was marked canceled
      IF NOT EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE id = v_fake_sub_id AND status = 'canceled'
      ) THEN
        RAISE EXCEPTION 'Subscription was not marked canceled after claim revoke';
      END IF;

      -- 3. Reset claim (testing only)
      v_res := public.admin_trial_reset_claim(v_fake_claim_id);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_trial_reset_claim failed: %', v_res;
      END IF;

      -- Verify claim and trial subscription are completely removed
      IF EXISTS (SELECT 1 FROM public.trial_claims WHERE id = v_fake_claim_id) THEN
        RAISE EXCEPTION 'Claim row still exists after reset';
      END IF;
      IF EXISTS (SELECT 1 FROM public.subscriptions WHERE id = v_fake_sub_id) THEN
        RAISE EXCEPTION 'Subscription row still exists after reset';
      END IF;

      -- 4. Test refusal on converted claim
      INSERT INTO public.trial_claims (
        tool_slug, user_id, email_normalized, trial_ends_at, converted_at
      ) VALUES (
        'rccp', v_non_admin_id, 'converted-claim@example.com', now() + interval '30 days', now()
      ) RETURNING id INTO v_converted_claim_id;

      v_res := public.admin_trial_revoke(v_converted_claim_id);
      IF (v_res->>'error') <> 'converted' THEN
        RAISE EXCEPTION 'Expected error converted on revoking converted claim, got %', v_res;
      END IF;

      v_res := public.admin_trial_reset_claim(v_converted_claim_id);
      IF (v_res->>'error') <> 'converted' THEN
        RAISE EXCEPTION 'Expected error converted on resetting converted claim, got %', v_res;
      END IF;

      v_results := jsonb_set(v_results, '{admin_claim_lifecycle}', jsonb_build_object(
        'passed', true,
        'detail', 'Extend (+14d), revoke (status canceled), and reset (clean removal) succeeded; converted claims safely refused'
      ));
    EXCEPTION WHEN OTHERS THEN
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

      -- Duplicate creation -> override_exists
      v_res := public.admin_price_override_create(v_admin_email, 'rccp', 'fixed_price', 600, NULL, now() + interval '30 days', 'Duplicate');
      IF (v_res->>'error') <> 'override_exists' THEN
        RAISE EXCEPTION 'Expected override_exists error on duplicate active override, got %', v_res;
      END IF;

      -- Revoke override
      v_res := public.admin_price_override_revoke(v_fake_override_id);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'Failed price override revoke: %', v_res;
      END IF;

      v_results := jsonb_set(v_results, '{admin_price_overrides}', jsonb_build_object(
        'passed', true,
        'detail', 'User lookup (user_not_found), constraint validation (amount_too_low), uniqueness (override_exists), and revoke succeeded'
      ));
    EXCEPTION WHEN OTHERS THEN
      v_results := jsonb_set(v_results, '{admin_price_overrides}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    -- --------------------------------------------------------------------------
    -- 2E: Blocked domains: add, idempotency, list, remove
    -- --------------------------------------------------------------------------
    BEGIN
      -- Add domain
      v_res := public.admin_blocked_domain_add(v_test_domain);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_blocked_domain_add failed: %', v_res;
      END IF;

      -- Idempotent duplicate add
      v_res := public.admin_blocked_domain_add(v_test_domain);
      IF (v_res->>'ok')::boolean <> true THEN
        RAISE EXCEPTION 'admin_blocked_domain_add idempotent repeat failed: %', v_res;
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

      -- Remove domain
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

      v_results := jsonb_set(v_results, '{admin_blocked_domains}', jsonb_build_object(
        'passed', true,
        'detail', 'Add, idempotent repeat, list verification, and remove succeeded'
      ));
    EXCEPTION WHEN OTHERS THEN
      v_results := jsonb_set(v_results, '{admin_blocked_domains}', jsonb_build_object('passed', false, 'error', SQLERRM));
    END;

    RESET ROLE;
  END IF;

  -- ----------------------------------------------------------------------------
  -- ROLLBACK & REPORT
  -- ----------------------------------------------------------------------------
  RAISE EXCEPTION 'ADMIN_VERIFY_RESULT (this error is intentional; everything was rolled back): %', jsonb_pretty(v_results);
END $$;
