-- ==============================================================================
-- 032_behaviour_verify.sql
-- Non-destructive behavior verification for Migration 032
-- Run in the Supabase SQL Editor.
-- NOTE: Uses an intentional RAISE EXCEPTION at the end to guarantee that ALL
-- mutations are rolled back 100%. The JSON report is rendered in the error message.
-- ==============================================================================

DO $$
DECLARE
  v_test_user_id uuid := '50ef4d35-c7aa-47fe-bbb0-68c74afd6a3c';
  v_test_user_email text := 'fahimmuntasirsiam@gmail.com';
  v_results jsonb := jsonb_build_object();
  
  -- Case 1 variables
  v_c1_res jsonb;
  v_c1_sub_exists boolean;
  
  -- Case 2 variables
  v_c2_sub_id text := 'sub_verify_case2_' || gen_random_uuid();
  v_c2_res1 jsonb;
  v_c2_res2 jsonb;
  v_c2_res3 jsonb;
  v_c2_row record;
  v_c2_initial_end timestamptz := now() + interval '30 days';
  v_c2_later_end timestamptz := now() + interval '60 days';
  
  -- Case 3 variables
  v_c3_manual_id uuid;
  v_c3_res jsonb;
  v_c3_row record;
  
  -- Case 4 variables
  v_c4_trial_sub_id uuid;
  v_c4_claim_id uuid;
  v_c4_sub_count int;
  v_c4_res jsonb;
  v_c4_row record;
  v_c4_claim record;
  
  -- Case 5 variables
  v_c5_res jsonb;
  v_c5_sub_count int;
  v_c5_row record;
  
  -- Case 6 variables
  v_c6_has_orderbot boolean;
  v_c6_sub_id text := 'sub_verify_case6_' || gen_random_uuid();
  v_c6_res1 jsonb;
  v_c6_res2 jsonb;
  v_c6_row record;
  v_c6_initial_end timestamptz := now() + interval '30 days';
  v_c6_updated_end timestamptz := now() + interval '60 days';
  
  -- Case 7 variables
  v_c7_event_id text := 'evt_verify_case7_' || gen_random_uuid();
  v_c7_res1 jsonb;
  v_c7_res2 jsonb;
  
  -- Case 8 variables
  v_c8_webhook_overloads int;
  v_c8_check_sub_overloads int;
  v_c8_rccp_resolved text;
  v_c8_orderbot_resolved text;
BEGIN
  -- Verify test user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_test_user_id) THEN
    SELECT id INTO v_test_user_id FROM auth.users WHERE email = v_test_user_email LIMIT 1;
  END IF;

  -- ----------------------------------------------------------------------------
  -- CASE 1: UNRESOLVED EVENT
  -- customer.subscription.updated with NULL user id, email and product and an
  -- unknown stripe_subscription_id -> message starts with 'skipped: unresolved'
  -- and NO row exists for that stripe id.
  -- ----------------------------------------------------------------------------
  BEGIN
    v_c1_res := public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_case1_' || gen_random_uuid(),
      p_event_type := 'customer.subscription.updated',
      p_user_id := NULL,
      p_email := NULL,
      p_product_slug := NULL,
      p_stripe_customer_id := 'cus_verify_case1',
      p_stripe_subscription_id := 'sub_verify_case1_unknown_' || gen_random_uuid(),
      p_stripe_price_id := 'price_verify_case1',
      p_price_per_month := 10,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'active'
    );

    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions WHERE stripe_subscription_id LIKE 'sub_verify_case1_unknown_%'
    ) INTO v_c1_sub_exists;

    IF (v_c1_res->>'message' LIKE 'skipped: unresolved%') AND (NOT v_c1_sub_exists) THEN
      v_results := jsonb_set(v_results, '{case_1}', jsonb_build_object(
        'passed', true,
        'detail', 'Returned skipped: unresolved user/product and wrote no subscription row'
      ));
    ELSE
      v_results := jsonb_set(v_results, '{case_1}', jsonb_build_object(
        'passed', false,
        'detail', format('Unexpected outcome: res=%s, sub_exists=%s', v_c1_res, v_c1_sub_exists)
      ));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_1}', jsonb_build_object('passed', false, 'detail', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 2: LATE UPDATE AFTER CANCELLATION
  -- checkout.session.completed creates an active row ('invoicegen');
  -- customer.subscription.deleted -> status 'canceled';
  -- customer.subscription.updated (status active, later period end) -> stays 'canceled' & unchanged end
  -- ----------------------------------------------------------------------------
  BEGIN
    -- Ensure clean slate for invoicegen for test user inside block
    DELETE FROM public.subscriptions WHERE user_id = v_test_user_id AND product_slug = 'invoicegen' AND store_id IS NULL;

    -- Step A: checkout.session.completed creates active row
    v_c2_res1 := public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_case2_a_' || gen_random_uuid(),
      p_event_type := 'checkout.session.completed',
      p_user_id := v_test_user_id,
      p_email := v_test_user_email,
      p_product_slug := 'invoicegen',
      p_stripe_customer_id := 'cus_verify_case2',
      p_stripe_subscription_id := v_c2_sub_id,
      p_stripe_price_id := 'price_verify_case2',
      p_price_per_month := 15,
      p_current_period_start := now(),
      p_current_period_end := v_c2_initial_end,
      p_quantity := 1,
      p_subscription_status := 'active'
    );

    -- Step B: customer.subscription.deleted
    v_c2_res2 := public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_case2_b_' || gen_random_uuid(),
      p_event_type := 'customer.subscription.deleted',
      p_user_id := v_test_user_id,
      p_email := v_test_user_email,
      p_product_slug := 'invoicegen',
      p_stripe_customer_id := 'cus_verify_case2',
      p_stripe_subscription_id := v_c2_sub_id,
      p_stripe_price_id := 'price_verify_case2',
      p_price_per_month := 15,
      p_current_period_start := now(),
      p_current_period_end := v_c2_initial_end,
      p_quantity := 1,
      p_subscription_status := 'canceled'
    );

    -- Step C: late customer.subscription.updated with active status and later period end
    v_c2_res3 := public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_case2_c_' || gen_random_uuid(),
      p_event_type := 'customer.subscription.updated',
      p_user_id := v_test_user_id,
      p_email := v_test_user_email,
      p_product_slug := 'invoicegen',
      p_stripe_customer_id := 'cus_verify_case2',
      p_stripe_subscription_id := v_c2_sub_id,
      p_stripe_price_id := 'price_verify_case2',
      p_price_per_month := 15,
      p_current_period_start := now(),
      p_current_period_end := v_c2_later_end,
      p_quantity := 1,
      p_subscription_status := 'active'
    );

    SELECT status, current_period_end INTO v_c2_row
    FROM public.subscriptions
    WHERE stripe_subscription_id = v_c2_sub_id;

    IF v_c2_row.status = 'canceled' AND v_c2_row.current_period_end = v_c2_initial_end THEN
      v_results := jsonb_set(v_results, '{case_2}', jsonb_build_object(
        'passed', true,
        'detail', 'Row stayed canceled and current_period_end was not overwritten by late update'
      ));
    ELSE
      v_results := jsonb_set(v_results, '{case_2}', jsonb_build_object(
        'passed', false,
        'detail', format('Row status=%s, end=%s, expected canceled and %s', v_c2_row.status, v_c2_row.current_period_end, v_c2_initial_end)
      ));
    END IF;

    -- Clean up test row
    DELETE FROM public.subscriptions WHERE stripe_subscription_id = v_c2_sub_id;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_2}', jsonb_build_object('passed', false, 'detail', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 3: MANUAL GRANT NEVER OVERWRITTEN
  -- Active manually_granted = true row with future period end for 'listflow';
  -- checkout.session.completed for same user & slug -> message 'skipped: manual grant present';
  -- row unchanged (stripe_subscription_id NULL, manually_granted true).
  -- ----------------------------------------------------------------------------
  BEGIN
    -- Ensure clean slate for listflow for test user inside block
    DELETE FROM public.subscriptions WHERE user_id = v_test_user_id AND product_slug = 'listflow' AND store_id IS NULL;

    INSERT INTO public.subscriptions (
      user_id, email, product_slug, status, manually_granted, current_period_end, is_trial
    ) VALUES (
      v_test_user_id, v_test_user_email, 'listflow', 'active', true, now() + interval '90 days', false
    ) RETURNING id INTO v_c3_manual_id;

    v_c3_res := public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_case3_' || gen_random_uuid(),
      p_event_type := 'checkout.session.completed',
      p_user_id := v_test_user_id,
      p_email := v_test_user_email,
      p_product_slug := 'listflow',
      p_stripe_customer_id := 'cus_verify_case3',
      p_stripe_subscription_id := 'sub_verify_case3',
      p_stripe_price_id := 'price_verify_case3',
      p_price_per_month := 19,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'active'
    );

    SELECT id, manually_granted, stripe_subscription_id INTO v_c3_row
    FROM public.subscriptions
    WHERE id = v_c3_manual_id;

    IF (v_c3_res->>'message' = 'skipped: manual grant present')
       AND v_c3_row.manually_granted = true
       AND v_c3_row.stripe_subscription_id IS NULL THEN
      v_results := jsonb_set(v_results, '{case_3}', jsonb_build_object(
        'passed', true,
        'detail', 'Webhook skipped with manual grant present message and left row untouched'
      ));
    ELSE
      v_results := jsonb_set(v_results, '{case_3}', jsonb_build_object(
        'passed', false,
        'detail', format('res=%s, manually_granted=%s, stripe_sub_id=%s', v_c3_res, v_c3_row.manually_granted, v_c3_row.stripe_subscription_id)
      ));
    END IF;

    -- Clean up test row
    DELETE FROM public.subscriptions WHERE id = v_c3_manual_id;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_3}', jsonb_build_object('passed', false, 'detail', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 4: TRIAL CONVERSION
  -- Insert active trial row (is_trial true, grant_reason 'free_trial', product_slug 'cpbot')
  -- plus matching trial_claims row; checkout.session.completed with p_product_slug 'rccp' ->
  -- exactly ONE subscriptions row for (user, 'cpbot'), SAME id, is_trial false,
  -- grant_reason 'stripe_checkout', stripe_subscription_id set, and trial_claims.converted_at not null.
  -- ----------------------------------------------------------------------------
  BEGIN
    -- Ensure clean slate for cpbot and trial_claims inside block
    DELETE FROM public.trial_claims WHERE user_id = v_test_user_id;
    DELETE FROM public.subscriptions WHERE user_id = v_test_user_id AND product_slug = 'cpbot' AND store_id IS NULL;

    -- Ensure trial_offers has rccp -> cpbot
    INSERT INTO public.trial_offers (
      tool_slug, access_slug, enabled, trial_days, slot_cap, slots_reserved, require_confirmed_email
    ) VALUES (
      'rccp', 'cpbot', true, 30, 500, 0, false
    ) ON CONFLICT (tool_slug) DO UPDATE SET access_slug = 'cpbot', enabled = true;

    -- Insert active trial subscription row
    INSERT INTO public.subscriptions (
      user_id, email, product_slug, status, is_trial, grant_reason, manually_granted, current_period_end
    ) VALUES (
      v_test_user_id, v_test_user_email, 'cpbot', 'active', true, 'free_trial', false, now() + interval '30 days'
    ) RETURNING id INTO v_c4_trial_sub_id;

    -- Insert matching trial_claims row
    INSERT INTO public.trial_claims (
      tool_slug, user_id, email_normalized, trial_ends_at, subscription_id
    ) VALUES (
      'rccp', v_test_user_id, public.normalize_email(v_test_user_email), now() + interval '30 days', v_c4_trial_sub_id
    ) RETURNING id INTO v_c4_claim_id;

    -- Trigger checkout.session.completed with catalog slug 'rccp'
    v_c4_res := public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_case4_' || gen_random_uuid(),
      p_event_type := 'checkout.session.completed',
      p_user_id := v_test_user_id,
      p_email := v_test_user_email,
      p_product_slug := 'rccp',
      p_stripe_customer_id := 'cus_verify_case4',
      p_stripe_subscription_id := 'sub_verify_case4',
      p_stripe_price_id := 'price_verify_case4',
      p_price_per_month := 9,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'active'
    );

    SELECT count(*) INTO v_c4_sub_count
    FROM public.subscriptions
    WHERE user_id = v_test_user_id AND product_slug = 'cpbot' AND store_id IS NULL;

    SELECT id, is_trial, grant_reason, stripe_subscription_id INTO v_c4_row
    FROM public.subscriptions
    WHERE id = v_c4_trial_sub_id;

    SELECT converted_at INTO v_c4_claim
    FROM public.trial_claims
    WHERE id = v_c4_claim_id;

    IF v_c4_sub_count = 1
       AND v_c4_row.id = v_c4_trial_sub_id
       AND v_c4_row.is_trial = false
       AND v_c4_row.grant_reason = 'stripe_checkout'
       AND v_c4_row.stripe_subscription_id = 'sub_verify_case4'
       AND v_c4_claim.converted_at IS NOT NULL THEN
      v_results := jsonb_set(v_results, '{case_4}', jsonb_build_object(
        'passed', true,
        'detail', 'Trial converted in place to paid subscription: same id, is_trial false, stripe_checkout grant, converted_at set'
      ));
    ELSE
      v_results := jsonb_set(v_results, '{case_4}', jsonb_build_object(
        'passed', false,
        'detail', format('count=%s, id_match=%s, is_trial=%s, reason=%s, stripe_sub=%s, converted_at=%s',
          v_c4_sub_count, (v_c4_row.id = v_c4_trial_sub_id), v_c4_row.is_trial, v_c4_row.grant_reason, v_c4_row.stripe_subscription_id, v_c4_claim.converted_at)
      ));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_4}', jsonb_build_object('passed', false, 'detail', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 5: EXPIRED ROW RE-SUBSCRIBE
  -- Set that row to status 'expired', is_trial false; new checkout.session.completed
  -- with new stripe subscription id -> same row id, status 'active', new stripe ids, no unique violation.
  -- ----------------------------------------------------------------------------
  BEGIN
    UPDATE public.subscriptions
    SET status = 'expired',
        is_trial = false
    WHERE id = v_c4_trial_sub_id;

    v_c5_res := public.process_stripe_webhook_event(
      p_event_id := 'evt_verify_case5_' || gen_random_uuid(),
      p_event_type := 'checkout.session.completed',
      p_user_id := v_test_user_id,
      p_email := v_test_user_email,
      p_product_slug := 'rccp',
      p_stripe_customer_id := 'cus_verify_case5_new',
      p_stripe_subscription_id := 'sub_verify_case5_new',
      p_stripe_price_id := 'price_verify_case5_new',
      p_price_per_month := 9,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'active'
    );

    SELECT count(*) INTO v_c5_sub_count
    FROM public.subscriptions
    WHERE user_id = v_test_user_id AND product_slug = 'cpbot' AND store_id IS NULL;

    SELECT id, status, stripe_subscription_id INTO v_c5_row
    FROM public.subscriptions
    WHERE id = v_c4_trial_sub_id;

    IF v_c5_sub_count = 1
       AND v_c5_row.id = v_c4_trial_sub_id
       AND v_c5_row.status = 'active'
       AND v_c5_row.stripe_subscription_id = 'sub_verify_case5_new' THEN
      v_results := jsonb_set(v_results, '{case_5}', jsonb_build_object(
        'passed', true,
        'detail', 'Expired subscription reactivated cleanly on re-subscribe with new stripe_subscription_id and same row id'
      ));
    ELSE
      v_results := jsonb_set(v_results, '{case_5}', jsonb_build_object(
        'passed', false,
        'detail', format('count=%s, id_match=%s, status=%s, stripe_sub=%s',
          v_c5_sub_count, (v_c5_row.id = v_c4_trial_sub_id), v_c5_row.status, v_c5_row.stripe_subscription_id)
      ));
    END IF;

    -- Clean up test cpbot row and claim
    DELETE FROM public.trial_claims WHERE id = v_c4_claim_id;
    DELETE FROM public.subscriptions WHERE id = v_c4_trial_sub_id;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_5}', jsonb_build_object('passed', false, 'detail', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 6: ORDER BOT UNCHANGED
  -- If test user has no orderbot row with store_id NULL, run checkout.session.completed
  -- with p_quantity 1 for 'orderbot' -> one active row with product_slug 'orderbot' (not remapped),
  -- then customer.subscription.updated with same quantity -> current_period_end updated.
  -- If user already has an orderbot row, record case as {skipped:true, reason:'existing row'}.
  -- ----------------------------------------------------------------------------
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = v_test_user_id AND product_slug = 'orderbot' AND store_id IS NULL
    ) INTO v_c6_has_orderbot;

    IF v_c6_has_orderbot THEN
      v_results := jsonb_set(v_results, '{case_6}', jsonb_build_object(
        'skipped', true,
        'reason', 'existing row'
      ));
    ELSE
      v_c6_res1 := public.process_stripe_webhook_event(
        p_event_id := 'evt_verify_case6_a_' || gen_random_uuid(),
        p_event_type := 'checkout.session.completed',
        p_user_id := v_test_user_id,
        p_email := v_test_user_email,
        p_product_slug := 'orderbot',
        p_stripe_customer_id := 'cus_verify_case6',
        p_stripe_subscription_id := v_c6_sub_id,
        p_stripe_price_id := 'price_verify_case6',
        p_price_per_month := 29,
        p_current_period_start := now(),
        p_current_period_end := v_c6_initial_end,
        p_quantity := 1,
        p_subscription_status := 'active'
      );

      v_c6_res2 := public.process_stripe_webhook_event(
        p_event_id := 'evt_verify_case6_b_' || gen_random_uuid(),
        p_event_type := 'customer.subscription.updated',
        p_user_id := v_test_user_id,
        p_email := v_test_user_email,
        p_product_slug := 'orderbot',
        p_stripe_customer_id := 'cus_verify_case6',
        p_stripe_subscription_id := v_c6_sub_id,
        p_stripe_price_id := 'price_verify_case6',
        p_price_per_month := 29,
        p_current_period_start := now(),
        p_current_period_end := v_c6_updated_end,
        p_quantity := 1,
        p_subscription_status := 'active'
      );

      SELECT product_slug, status, current_period_end INTO v_c6_row
      FROM public.subscriptions
      WHERE stripe_subscription_id = v_c6_sub_id;

      IF v_c6_row.product_slug = 'orderbot'
         AND v_c6_row.status = 'active'
         AND v_c6_row.current_period_end = v_c6_updated_end THEN
        v_results := jsonb_set(v_results, '{case_6}', jsonb_build_object(
          'passed', true,
          'detail', 'Order Bot quantity logic preserved without access slug remapping; period end updated on renewal'
        ));
      ELSE
        v_results := jsonb_set(v_results, '{case_6}', jsonb_build_object(
          'passed', false,
          'detail', format('slug=%s, status=%s, end=%s, expected %s', v_c6_row.product_slug, v_c6_row.status, v_c6_row.current_period_end, v_c6_updated_end)
        ));
      END IF;

      DELETE FROM public.subscriptions WHERE stripe_subscription_id = v_c6_sub_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_6}', jsonb_build_object('passed', false, 'detail', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 7: IDEMPOTENCY
  -- Send the same event id twice -> the second returns message 'already processed'.
  -- ----------------------------------------------------------------------------
  BEGIN
    v_c7_res1 := public.process_stripe_webhook_event(
      p_event_id := v_c7_event_id,
      p_event_type := 'invoice.payment_failed',
      p_user_id := v_test_user_id,
      p_email := v_test_user_email,
      p_product_slug := 'listflow',
      p_stripe_customer_id := 'cus_verify_case7',
      p_stripe_subscription_id := 'sub_verify_case7_dummy',
      p_stripe_price_id := 'price_verify_case7',
      p_price_per_month := 19,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'past_due'
    );

    v_c7_res2 := public.process_stripe_webhook_event(
      p_event_id := v_c7_event_id,
      p_event_type := 'invoice.payment_failed',
      p_user_id := v_test_user_id,
      p_email := v_test_user_email,
      p_product_slug := 'listflow',
      p_stripe_customer_id := 'cus_verify_case7',
      p_stripe_subscription_id := 'sub_verify_case7_dummy',
      p_stripe_price_id := 'price_verify_case7',
      p_price_per_month := 19,
      p_current_period_start := now(),
      p_current_period_end := now() + interval '30 days',
      p_quantity := 1,
      p_subscription_status := 'past_due'
    );

    IF (v_c7_res2->>'message' = 'already processed') THEN
      v_results := jsonb_set(v_results, '{case_7}', jsonb_build_object(
        'passed', true,
        'detail', 'Duplicate event rejected with message already processed'
      ));
    ELSE
      v_results := jsonb_set(v_results, '{case_7}', jsonb_build_object(
        'passed', false,
        'detail', format('res1=%s, res2=%s', v_c7_res1, v_c7_res2)
      ));
    END IF;

    DELETE FROM public.stripe_webhook_events WHERE event_id = v_c7_event_id;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_7}', jsonb_build_object('passed', false, 'detail', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- CASE 8: WIRING
  -- Exactly 1 overload of process_stripe_webhook_event;
  -- exactly 1 overload of check_product_subscription;
  -- resolve_access_slug('rccp') = 'cpbot' and resolve_access_slug('orderbot') = 'orderbot'.
  -- ----------------------------------------------------------------------------
  BEGIN
    SELECT count(*) INTO v_c8_webhook_overloads
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'process_stripe_webhook_event';

    SELECT count(*) INTO v_c8_check_sub_overloads
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'check_product_subscription';

    v_c8_rccp_resolved := public.resolve_access_slug('rccp');
    v_c8_orderbot_resolved := public.resolve_access_slug('orderbot');

    IF v_c8_webhook_overloads = 1
       AND v_c8_check_sub_overloads = 1
       AND v_c8_rccp_resolved = 'cpbot'
       AND v_c8_orderbot_resolved = 'orderbot' THEN
      v_results := jsonb_set(v_results, '{case_8}', jsonb_build_object(
        'passed', true,
        'detail', 'Overloads intact (1 webhook, 1 check_product_subscription); access slug mapping confirmed (rccp->cpbot, orderbot->orderbot)'
      ));
    ELSE
      v_results := jsonb_set(v_results, '{case_8}', jsonb_build_object(
        'passed', false,
        'detail', format('webhook_overloads=%s, check_sub_overloads=%s, rccp_slug=%s, orderbot_slug=%s',
          v_c8_webhook_overloads, v_c8_check_sub_overloads, v_c8_rccp_resolved, v_c8_orderbot_resolved)
      ));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_results := jsonb_set(v_results, '{case_8}', jsonb_build_object('passed', false, 'detail', SQLERRM));
  END;

  -- ----------------------------------------------------------------------------
  -- ROLLBACK & REPORT
  -- ----------------------------------------------------------------------------
  RAISE EXCEPTION 'BEHAVIOUR_RESULT (this error is intentional; everything was rolled back): %', jsonb_pretty(v_results);
END $$;
