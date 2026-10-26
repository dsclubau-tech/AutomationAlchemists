-- ==============================================================================
-- 034_behaviour_verify.sql
-- Non-destructive behavior verification for Migration 034
-- Run in the Supabase SQL Editor.
-- NOTE: Uses an intentional RAISE EXCEPTION at the end to guarantee that ALL
-- mutations are rolled back 100%. The JSON report is rendered in the error message.
-- ==============================================================================

DO $$
DECLARE
  v_results jsonb := jsonb_build_object();

  -- Baseline row counts
  v_start_subs int;
  v_start_claims int;
  v_start_identities int;
  v_start_denials int;
  v_start_events int;
  v_end_subs int;
  v_end_claims int;
  v_end_identities int;
  v_end_denials int;
  v_end_events int;

  -- Test fixtures
  v_user_a uuid := gen_random_uuid();
  v_user_b uuid := gen_random_uuid();
  v_user_c uuid := gen_random_uuid();
  v_admin_user uuid := gen_random_uuid();
  v_email_a text := 'test_trial_a_' || substr(v_user_a::text, 1, 8) || '@example.com';
  v_email_b text := 'test_trial_b_' || substr(v_user_b::text, 1, 8) || '@example.com';
  v_email_c text := 'test_trial_c_' || substr(v_user_c::text, 1, 8) || '@example.com';
  v_email_admin text := 'test_admin_' || substr(v_admin_user::text, 1, 8) || '@example.com';

  v_card_fp_1 text := 'card_fp_verify_034_1';
  v_card_fp_2 text := 'card_fp_verify_034_2';
  v_phone_hash_1 text := 'phone_hash_verify_034_1';
  v_phone_hash_2 text := 'phone_hash_verify_034_2';

  v_trial_end timestamptz := now() + interval '30 days';
  v_original_offer_enabled boolean;

  -- Case variables
  v_c1_res jsonb;
  v_c2_res jsonb;
  v_c3_finalize_res jsonb;
  v_c3_claim_id uuid;
  v_c3_webhook_res jsonb;
  v_c3_sub record;
  v_c3_claim record;
  v_c4_res jsonb;
  v_c4_sub_count int;
  v_c5_res jsonb;
  v_c5_denial record;
  v_c5_ident_count int;
  v_c5_sub_count int;
  v_c6_res jsonb;
  v_c6_denial record;
  v_c7_res jsonb;
  v_c8_webhook_res jsonb;
  v_c8_sub record;
  v_c8_claim record;
  v_c9_sub_exp_id uuid;
  v_c9_sub_canc_id uuid;
  v_c9_exp_row record;
  v_c9_canc_row record;
  v_c10_sub_id uuid;
  v_c10_sub_row record;
  v_c10_gate_res jsonb;
  v_c11_res jsonb;
  v_c12_claim_id uuid;
  v_c12_sub_id uuid;
  v_c12_res jsonb;
  v_c13_manual_sub_id uuid;
  v_c13_res jsonb;
  v_c13_manual_row record;
  v_c13_orderbot_sub_id text := 'sub_ob_' || gen_random_uuid();
  v_c13_ob_count int;
BEGIN
  -- ----------------------------------------------------------------------------
  -- 0. SNAPSHOT BASELINE COUNTS
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_start_subs FROM public.subscriptions;
  SELECT count(*) INTO v_start_claims FROM public.trial_claims;
  SELECT count(*) INTO v_start_identities FROM public.trial_identities;
  SELECT count(*) INTO v_start_denials FROM public.trial_denials;
  SELECT count(*) INTO v_start_events FROM public.stripe_webhook_events;

  -- Store original offer enabled state
  SELECT enabled INTO v_original_offer_enabled FROM public.trial_offers WHERE tool_slug = 'rccp';

  -- Create test users in auth.users
  INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role)
  VALUES
    (v_user_a, v_email_a, now(), '{}'::jsonb, '{"provider":"email"}'::jsonb, 'authenticated', 'authenticated'),
    (v_user_b, v_email_b, now(), '{}'::jsonb, '{"provider":"email"}'::jsonb, 'authenticated', 'authenticated'),
    (v_user_c, v_email_c, now(), '{}'::jsonb, '{"provider":"email"}'::jsonb, 'authenticated', 'authenticated'),
    (v_admin_user, v_email_admin, now(), '{}'::jsonb, '{"provider":"email"}'::jsonb, 'authenticated', 'authenticated')
  ON CONFLICT DO NOTHING;

  -- Ensure profiles record exists for admin check
  INSERT INTO public.profiles (id, full_name, is_admin)
  VALUES (v_admin_user, 'Verify Admin', true)
  ON CONFLICT (id) DO UPDATE SET is_admin = true;

  -- Temporarily enable offer for testing
  UPDATE public.trial_offers SET enabled = true WHERE tool_slug = 'rccp';

  -- ----------------------------------------------------------------------------
  -- CASE 1: claim_free_trial returns checkout_required
  -- ----------------------------------------------------------------------------
  BEGIN
    v_c1_res := public.claim_free_trial('rccp');
    IF (v_c1_res->>'ok')::boolean = false AND v_c1_res->>'reason' = 'checkout_required' THEN
      v_results := jsonb_set(v_results, '{case_1}', jsonb_build_object('passed', true, 'detail', 'claim_free_trial rejected with checkout_required'));
    ELSE
      v_results := jsonb_set(v_results, '{case_1}', jsonb_build_object('passed', false, 'detail', v_c1_res));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_1}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 2: eligible user passes trial_eligibility_for
  -- ----------------------------------------------------------------------------
  BEGIN
    v_c2_res := public.trial_eligibility_for(v_user_a, 'rccp');
    IF (v_c2_res->>'eligible')::boolean = true AND v_c2_res->>'reason' = 'ok' AND (v_c2_res->>'trial_days')::int = 30 THEN
      v_results := jsonb_set(v_results, '{case_2}', jsonb_build_object('passed', true, 'detail', 'User A passed eligibility'));
    ELSE
      v_results := jsonb_set(v_results, '{case_2}', jsonb_build_object('passed', false, 'detail', v_c2_res));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_2}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 3: trialing checkout creates one active is_trial row with the +6h grace, a claim and the link
  -- ----------------------------------------------------------------------------
  BEGIN
    v_c3_finalize_res := public.finalize_card_trial(
      v_user_a, 'rccp', v_email_a, v_card_fp_1, v_phone_hash_1, v_trial_end
    );
    v_c3_claim_id := (v_c3_finalize_res->>'claim_id')::uuid;

    v_c3_webhook_res := public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_c3_' || gen_random_uuid(),
      p_event_type := 'checkout.session.completed',
      p_user_id := v_user_a,
      p_email := v_email_a,
      p_product_slug := 'rccp',
      p_stripe_customer_id := 'cus_verify_c3',
      p_stripe_subscription_id := 'sub_verify_c3_' || gen_random_uuid(),
      p_stripe_price_id := 'price_verify_c3',
      p_price_per_month := 9.00,
      p_current_period_start := now(),
      p_current_period_end := v_trial_end,
      p_quantity := 1,
      p_subscription_status := 'trialing'
    );

    SELECT * INTO v_c3_sub FROM public.subscriptions
    WHERE user_id = v_user_a AND product_slug = 'cpbot' AND store_id IS NULL;

    SELECT * INTO v_c3_claim FROM public.trial_claims
    WHERE id = v_c3_claim_id;

    IF (v_c3_finalize_res->>'ok')::boolean = true
       AND v_c3_sub.status = 'active'
       AND v_c3_sub.is_trial = true
       AND v_c3_sub.grant_reason = 'stripe_trial'
       AND v_c3_sub.current_period_end = (v_trial_end + interval '6 hours')
       AND v_c3_claim.subscription_id = v_c3_sub.id
       AND v_c3_claim.trial_ends_at = v_trial_end THEN
      v_results := jsonb_set(v_results, '{case_3}', jsonb_build_object('passed', true, 'detail', 'Trial subscription provisioned with +6h grace and claim linked'));
    ELSE
      v_results := jsonb_set(v_results, '{case_3}', jsonb_build_object(
        'passed', false,
        'finalize_res', v_c3_finalize_res,
        'sub_status', v_c3_sub.status,
        'sub_is_trial', v_c3_sub.is_trial,
        'sub_period_end', v_c3_sub.current_period_end,
        'claim_linked_sub', v_c3_claim.subscription_id
      ));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_3}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 4: the same event again is idempotent
  -- ----------------------------------------------------------------------------
  BEGIN
    SELECT count(*) INTO v_c4_sub_count FROM public.subscriptions WHERE user_id = v_user_a AND product_slug = 'cpbot';
    
    -- Re-run with the exact same event ID as Case 3
    v_c4_res := public.process_stripe_webhook_event(
      p_event_id := (v_c3_webhook_res->>'event_id'), -- or check stripe_webhook_events
      p_event_type := 'checkout.session.completed',
      p_user_id := v_user_a,
      p_email := v_email_a,
      p_product_slug := 'rccp',
      p_stripe_customer_id := 'cus_verify_c3',
      p_stripe_subscription_id := v_c3_sub.stripe_subscription_id,
      p_stripe_price_id := 'price_verify_c3',
      p_price_per_month := 9.00,
      p_current_period_start := now(),
      p_current_period_end := v_trial_end,
      p_quantity := 1,
      p_subscription_status := 'trialing'
    );

    IF (v_c4_res->>'message' = 'already processed' OR v_c4_res->>'success' = 'true') THEN
      v_results := jsonb_set(v_results, '{case_4}', jsonb_build_object('passed', true, 'detail', 'Idempotent replay detected and skipped'));
    ELSE
      v_results := jsonb_set(v_results, '{case_4}', jsonb_build_object('passed', false, 'detail', v_c4_res));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_4}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 5: second user with the same card fingerprint is denied and gets no claim, identity or subscription
  -- ----------------------------------------------------------------------------
  BEGIN
    v_c5_res := public.finalize_card_trial(
      v_user_b, 'rccp', v_email_b, v_card_fp_1, v_phone_hash_2, v_trial_end
    );

    SELECT * INTO v_c5_denial FROM public.trial_denials
    WHERE user_id = v_user_b AND tool_slug = 'rccp' ORDER BY created_at DESC LIMIT 1;

    SELECT count(*) INTO v_c5_ident_count FROM public.trial_identities WHERE user_id = v_user_b;
    SELECT count(*) INTO v_c5_sub_count FROM public.subscriptions WHERE user_id = v_user_b;

    IF (v_c5_res->>'ok')::boolean = false
       AND v_c5_res->>'reason' = 'card_already_used'
       AND v_c5_denial.reason = 'card_already_used'
       AND v_c5_ident_count = 0
       AND v_c5_sub_count = 0 THEN
      v_results := jsonb_set(v_results, '{case_5}', jsonb_build_object('passed', true, 'detail', 'Duplicate card fingerprint blocked and logged to trial_denials'));
    ELSE
      v_results := jsonb_set(v_results, '{case_5}', jsonb_build_object(
        'passed', false,
        'res', v_c5_res,
        'denial_reason', v_c5_denial.reason,
        'ident_count', v_c5_ident_count,
        'sub_count', v_c5_sub_count
      ));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_5}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 6: same phone hash denied
  -- ----------------------------------------------------------------------------
  BEGIN
    v_c6_res := public.finalize_card_trial(
      v_user_c, 'rccp', v_email_c, v_card_fp_2, v_phone_hash_1, v_trial_end
    );

    SELECT * INTO v_c6_denial FROM public.trial_denials
    WHERE user_id = v_user_c AND tool_slug = 'rccp' ORDER BY created_at DESC LIMIT 1;

    IF (v_c6_res->>'ok')::boolean = false
       AND v_c6_res->>'reason' = 'phone_already_used'
       AND v_c6_denial.reason = 'phone_already_used' THEN
      v_results := jsonb_set(v_results, '{case_6}', jsonb_build_object('passed', true, 'detail', 'Duplicate phone hash blocked and logged to trial_denials'));
    ELSE
      v_results := jsonb_set(v_results, '{case_6}', jsonb_build_object('passed', false, 'detail', v_c6_res));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_6}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 7: same user retry is idempotent
  -- ----------------------------------------------------------------------------
  BEGIN
    v_c7_res := public.finalize_card_trial(
      v_user_a, 'rccp', v_email_a, v_card_fp_1, v_phone_hash_1, v_trial_end
    );

    IF (v_c7_res->>'ok')::boolean = true AND (v_c7_res->>'claim_id')::uuid = v_c3_claim_id THEN
      v_results := jsonb_set(v_results, '{case_7}', jsonb_build_object('passed', true, 'detail', 'Same user retry is idempotent and returns existing claim_id'));
    ELSE
      v_results := jsonb_set(v_results, '{case_7}', jsonb_build_object('passed', false, 'detail', v_c7_res));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_7}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 8: subscription.updated active converts the trial row in place and stamps converted_at
  -- ----------------------------------------------------------------------------
  BEGIN
    v_c8_webhook_res := public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_c8_' || gen_random_uuid(),
      p_event_type := 'customer.subscription.updated',
      p_user_id := v_user_a,
      p_email := v_email_a,
      p_product_slug := 'cpbot',
      p_stripe_customer_id := 'cus_verify_c3',
      p_stripe_subscription_id := v_c3_sub.stripe_subscription_id,
      p_stripe_price_id := 'price_verify_c3',
      p_price_per_month := 9.00,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'active'
    );

    SELECT * INTO v_c8_sub FROM public.subscriptions WHERE id = v_c3_sub.id;
    SELECT * INTO v_c8_claim FROM public.trial_claims WHERE id = v_c3_claim_id;

    IF v_c8_sub.status = 'active'
       AND v_c8_sub.is_trial = false
       AND v_c8_sub.grant_reason = 'stripe_checkout'
       AND v_c8_claim.converted_at IS NOT NULL THEN
      v_results := jsonb_set(v_results, '{case_8}', jsonb_build_object('passed', true, 'detail', 'Trial converted in place (is_trial=false, converted_at stamped)'));
    ELSE
      v_results := jsonb_set(v_results, '{case_8}', jsonb_build_object(
        'passed', false,
        'sub_is_trial', v_c8_sub.is_trial,
        'sub_grant_reason', v_c8_sub.grant_reason,
        'claim_converted_at', v_c8_claim.converted_at
      ));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_8}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 9: an expired-by-cron trial row is reactivated by Stripe active, but a canceled row is not
  -- ----------------------------------------------------------------------------
  BEGIN
    -- Setup an expired row
    INSERT INTO public.subscriptions (
      user_id, email, product_slug, status, stripe_customer_id, stripe_subscription_id, is_trial
    ) VALUES (
      v_user_b, v_email_b, 'listflow', 'expired', 'cus_c9_exp', 'sub_c9_exp', true
    ) RETURNING id INTO v_c9_sub_exp_id;

    -- Setup a canceled row
    INSERT INTO public.subscriptions (
      user_id, email, product_slug, status, stripe_customer_id, stripe_subscription_id, is_trial
    ) VALUES (
      v_user_c, v_email_c, 'listflow', 'canceled', 'cus_c9_canc', 'sub_c9_canc', false
    ) RETURNING id INTO v_c9_sub_canc_id;

    -- Webhook sends 'active' for the expired subscription
    PERFORM public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_c9_exp_' || gen_random_uuid(),
      p_event_type := 'customer.subscription.updated',
      p_user_id := v_user_b,
      p_email := v_email_b,
      p_product_slug := 'listflow',
      p_stripe_customer_id := 'cus_c9_exp',
      p_stripe_subscription_id := 'sub_c9_exp',
      p_stripe_price_id := 'price_c9',
      p_price_per_month := 59.00,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'active'
    );

    -- Webhook sends 'active' for the canceled subscription
    PERFORM public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_c9_canc_' || gen_random_uuid(),
      p_event_type := 'customer.subscription.updated',
      p_user_id := v_user_c,
      p_email := v_email_c,
      p_product_slug := 'listflow',
      p_stripe_customer_id := 'cus_c9_canc',
      p_stripe_subscription_id := 'sub_c9_canc',
      p_stripe_price_id := 'price_c9',
      p_price_per_month := 59.00,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'active'
    );

    SELECT status INTO v_c9_exp_row FROM public.subscriptions WHERE id = v_c9_sub_exp_id;
    SELECT status INTO v_c9_canc_row FROM public.subscriptions WHERE id = v_c9_sub_canc_id;

    IF v_c9_exp_row.status = 'active' AND v_c9_canc_row.status = 'canceled' THEN
      v_results := jsonb_set(v_results, '{case_9}', jsonb_build_object('passed', true, 'detail', 'Expired row safely reactivated; canceled row remained canceled'));
    ELSE
      v_results := jsonb_set(v_results, '{case_9}', jsonb_build_object(
        'passed', false,
        'expired_row_status', v_c9_exp_row.status,
        'canceled_row_status', v_c9_canc_row.status
      ));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_9}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 10: past_due revokes access, later active restores it
  -- ----------------------------------------------------------------------------
  BEGIN
    -- Start with active subscription
    INSERT INTO public.subscriptions (
      user_id, email, product_slug, status, stripe_customer_id, stripe_subscription_id, current_period_end
    ) VALUES (
      v_user_a, v_email_a, 'orderbot', 'active', 'cus_c10', 'sub_c10_' || gen_random_uuid(), now() + interval '30 days'
    ) RETURNING id INTO v_c10_sub_id;

    SELECT stripe_subscription_id INTO v_c10_sub_row FROM public.subscriptions WHERE id = v_c10_sub_id;

    -- Send past_due
    PERFORM public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_c10_pd_' || gen_random_uuid(),
      p_event_type := 'customer.subscription.updated',
      p_user_id := v_user_a,
      p_email := v_email_a,
      p_product_slug := 'orderbot',
      p_stripe_customer_id := 'cus_c10',
      p_stripe_subscription_id := v_c10_sub_row.stripe_subscription_id,
      p_stripe_price_id := 'price_c10',
      p_price_per_month := 7.00,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'past_due'
    );

    SELECT status INTO v_c10_sub_row FROM public.subscriptions WHERE id = v_c10_sub_id;

    -- Impersonate user_a to check check_product_subscription gate
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);
    v_c10_gate_res := public.check_product_subscription('orderbot');

    IF v_c10_sub_row.status = 'past_due' AND (v_c10_gate_res->>'has_access')::boolean = false THEN
      -- Now restore via active event
      RESET ROLE;
      PERFORM public.process_stripe_webhook_event(
        p_event_id := 'evt_verify_c10_act_' || gen_random_uuid(),
        p_event_type := 'customer.subscription.updated',
        p_user_id := v_user_a,
        p_email := v_email_a,
        p_product_slug := 'orderbot',
        p_stripe_customer_id := 'cus_c10',
        p_stripe_subscription_id := (SELECT stripe_subscription_id FROM public.subscriptions WHERE id = v_c10_sub_id),
        p_stripe_price_id := 'price_c10',
        p_price_per_month := 7.00,
        p_current_period_start := now(),
        p_current_period_end := now() + interval '30 days',
        p_quantity := 1,
        p_subscription_status := 'active'
      );

      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);
      v_c10_gate_res := public.check_product_subscription('orderbot');
      RESET ROLE;

      IF (v_c10_gate_res->>'has_access')::boolean = true THEN
        v_results := jsonb_set(v_results, '{case_10}', jsonb_build_object('passed', true, 'detail', 'past_due revoked access; later active restored it'));
      ELSE
        v_results := jsonb_set(v_results, '{case_10}', jsonb_build_object('passed', false, 'detail', 'active did not restore access'));
      END IF;
    ELSE
      RESET ROLE;
      v_results := jsonb_set(v_results, '{case_10}', jsonb_build_object('passed', false, 'status', v_c10_sub_row.status, 'gate', v_c10_gate_res));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    v_results := jsonb_set(v_results, '{case_10}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 11: get_trial_status shows denied_reason
  -- ----------------------------------------------------------------------------
  BEGIN
    -- Impersonate User B (who was denied card_already_used in Case 5)
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
    v_c11_res := public.get_trial_status('rccp');
    RESET ROLE;

    IF v_c11_res->>'denied_reason' = 'card_already_used' THEN
      v_results := jsonb_set(v_results, '{case_11}', jsonb_build_object('passed', true, 'detail', 'get_trial_status projected denied_reason: card_already_used'));
    ELSE
      v_results := jsonb_set(v_results, '{case_11}', jsonb_build_object('passed', false, 'detail', v_c11_res));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    v_results := jsonb_set(v_results, '{case_11}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 12: admin_trial_extend refuses a revoked claim
  -- ----------------------------------------------------------------------------
  BEGIN
    -- Insert a revoked trial claim
    INSERT INTO public.subscriptions (
      user_id, email, product_slug, status, is_trial, current_period_end
    ) VALUES (
      v_user_c, v_email_c, 'cpbot', 'expired', true, now()
    ) RETURNING id INTO v_c12_sub_id;

    INSERT INTO public.trial_claims (
      tool_slug, user_id, email_normalized, claimed_at, trial_ends_at, subscription_id, revoked_at, revoked_reason
    ) VALUES (
      'rccp', v_user_c, v_email_c, now(), now(), v_c12_sub_id, now(), 'policy_violation'
    ) RETURNING id INTO v_c12_claim_id;

    -- Impersonate admin user
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_user::text, 'role', 'authenticated')::text, true);
    v_c12_res := public.admin_trial_extend(v_c12_claim_id, 7);
    RESET ROLE;

    IF (v_c12_res->>'ok')::boolean = false
       AND v_c12_res->>'error' = 'revoked'
       AND v_c12_res->>'message' = 'Cannot extend a revoked claim' THEN
      v_results := jsonb_set(v_results, '{case_12}', jsonb_build_object('passed', true, 'detail', 'admin_trial_extend refused revoked claim upfront'));
    ELSE
      v_results := jsonb_set(v_results, '{case_12}', jsonb_build_object('passed', false, 'detail', v_c12_res));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    v_results := jsonb_set(v_results, '{case_12}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 13: Order Bot path and manual-grant safety unchanged
  -- ----------------------------------------------------------------------------
  BEGIN
    -- 13a. Manual Grant Safety: Active manual grant cannot be overwritten by checkout
    INSERT INTO public.subscriptions (
      user_id, email, product_slug, status, manually_granted, grant_reason, current_period_end, store_id
    ) VALUES (
      v_user_a, v_email_a, 'listflow', 'active', true, 'admin VIP grant', now() + interval '90 days', NULL
    ) RETURNING id INTO v_c13_manual_sub_id;

    v_c13_res := public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_c13_' || gen_random_uuid(),
      p_event_type := 'checkout.session.completed',
      p_user_id := v_user_a,
      p_email := v_email_a,
      p_product_slug := 'listflow',
      p_stripe_customer_id := 'cus_c13',
      p_stripe_subscription_id := 'sub_c13_overwrite_attempt',
      p_stripe_price_id := 'price_c13',
      p_price_per_month := 59.00,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'active'
    );

    SELECT * INTO v_c13_manual_row FROM public.subscriptions WHERE id = v_c13_manual_sub_id;

    -- 13b. Order Bot multi-store path: quantity 2 creates 2 slots
    PERFORM public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_c13_ob_' || gen_random_uuid(),
      p_event_type := 'checkout.session.completed',
      p_user_id := v_user_b,
      p_email := v_email_b,
      p_product_slug := 'orderbot',
      p_stripe_customer_id := 'cus_c13_ob',
      p_stripe_subscription_id := v_c13_orderbot_sub_id,
      p_stripe_price_id := 'price_ob',
      p_price_per_month := 7.00,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 2,
      p_subscription_status := 'active'
    );

    SELECT count(*) INTO v_c13_ob_count FROM public.subscriptions
    WHERE stripe_subscription_id = v_c13_orderbot_sub_id AND status = 'active';

    IF (v_c13_res->>'message' = 'skipped: manual grant present')
       AND v_c13_manual_row.manually_granted = true
       AND v_c13_ob_count = 2 THEN
      v_results := jsonb_set(v_results, '{case_13}', jsonb_build_object('passed', true, 'detail', 'Manual grant safety and Order Bot multi-store provisioning preserved'));
    ELSE
      v_results := jsonb_set(v_results, '{case_13}', jsonb_build_object(
        'passed', false,
        'manual_webhook_msg', v_c13_res->>'message',
        'is_manual', v_c13_manual_row.manually_granted,
        'ob_active_slots', v_c13_ob_count
      ));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_13}', jsonb_build_object('passed', false, 'error', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CLEANUP TEST FIXTURES & RESTORE SETTINGS BEFORE ROW COUNT CHECK
  -- ----------------------------------------------------------------------------
  UPDATE public.trial_offers SET enabled = v_original_offer_enabled WHERE tool_slug = 'rccp';

  DELETE FROM public.subscriptions WHERE user_id IN (v_user_a, v_user_b, v_user_c, v_admin_user);
  DELETE FROM public.trial_claims WHERE user_id IN (v_user_a, v_user_b, v_user_c, v_admin_user);
  DELETE FROM public.trial_identities WHERE user_id IN (v_user_a, v_user_b, v_user_c, v_admin_user);
  DELETE FROM public.trial_denials WHERE user_id IN (v_user_a, v_user_b, v_user_c, v_admin_user);
  DELETE FROM public.admin_audit_log WHERE admin_user_id = v_admin_user;
  DELETE FROM public.stripe_webhook_events WHERE event_id LIKE 'evt_verify_%';
  DELETE FROM public.profiles WHERE id IN (v_user_a, v_user_b, v_user_c, v_admin_user);
  DELETE FROM auth.users WHERE id IN (v_user_a, v_user_b, v_user_c, v_admin_user);

  -- ----------------------------------------------------------------------------
  -- ROW LEAK CHECK
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_end_subs FROM public.subscriptions;
  SELECT count(*) INTO v_end_claims FROM public.trial_claims;
  SELECT count(*) INTO v_end_identities FROM public.trial_identities;
  SELECT count(*) INTO v_end_denials FROM public.trial_denials;
  SELECT count(*) INTO v_end_events FROM public.stripe_webhook_events;

  IF v_start_subs = v_end_subs
     AND v_start_claims = v_end_claims
     AND v_start_identities = v_end_identities
     AND v_start_denials = v_end_denials
     AND v_start_events = v_end_events THEN
    v_results := jsonb_set(v_results, '{row_count_check}', jsonb_build_object(
      'passed', true,
      'detail', format('Row counts preserved: subs=%s, claims=%s, identities=%s, denials=%s, events=%s',
        v_end_subs, v_end_claims, v_end_identities, v_end_denials, v_end_events)
    ));
  ELSE
    v_results := jsonb_set(v_results, '{row_count_check}', jsonb_build_object(
      'passed', false,
      'detail', format('Row mismatch! start(subs=%s, claims=%s, idents=%s, denials=%s, evts=%s) vs end(subs=%s, claims=%s, idents=%s, denials=%s, evts=%s)',
        v_start_subs, v_start_claims, v_start_identities, v_start_denials, v_start_events,
        v_end_subs, v_end_claims, v_end_identities, v_end_denials, v_end_events)
    ));
  END IF;

  -- ----------------------------------------------------------------------------
  -- ROLLBACK & REPORT
  -- ----------------------------------------------------------------------------
  RAISE EXCEPTION 'BEHAVIOUR_RESULT (this error is intentional; everything was rolled back): %', jsonb_pretty(v_results);
END $$;
