-- ==============================================================================
-- Function: claim_free_trial(text)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.claim_free_trial(p_tool_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_email text;
  v_email_confirmed_at timestamptz;
  v_norm_email text;
  v_domain text;
  v_offer record;
  v_claims_count int;
  v_slots_taken int;
  v_sub record;
  v_dummy int;
  v_ends_at timestamptz;
  v_sub_id uuid;
BEGIN
  -- 1. Check signed in
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_signed_in');
  END IF;

  -- 2. Read caller identity from auth.users
  SELECT email, email_confirmed_at
  INTO v_user_email, v_email_confirmed_at
  FROM auth.users
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_signed_in');
  END IF;

  -- 3. Normalize email and extract domain
  v_norm_email := public.normalize_email(v_user_email);
  IF v_norm_email IS NULL OR position('@' in v_norm_email) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'email_not_allowed');
  END IF;

  v_domain := substr(v_norm_email, length(v_norm_email) - position('@' in reverse(v_norm_email)) + 2);

  -- 4. Check blocked disposable email domains
  IF EXISTS (SELECT 1 FROM public.blocked_email_domains WHERE domain = v_domain) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'email_not_allowed');
  END IF;

  -- 5. Lock trial_offers row FOR UPDATE (atomic slot reservation)
  SELECT tool_slug, access_slug, enabled, trial_days, slot_cap, slots_reserved, require_confirmed_email
  INTO v_offer
  FROM public.trial_offers
  WHERE tool_slug = p_tool_slug
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'disabled');
  END IF;

  -- 6. Check email confirmation if required by offer
  IF v_offer.require_confirmed_email AND v_email_confirmed_at IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'email_unconfirmed');
  END IF;

  -- 7. Check already claimed by this user id OR normalized email
  SELECT 1
  INTO v_dummy
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug
    AND (user_id = auth.uid() OR email_normalized = v_norm_email)
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  -- 8. Check existing subscriptions row for (user, access_slug)
  SELECT status, current_period_end
  INTO v_sub
  FROM public.subscriptions
  WHERE user_id = auth.uid()
    AND product_slug = v_offer.access_slug
  LIMIT 1;

  IF FOUND THEN
    IF v_sub.status = 'active' AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now()) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'already_has_access');
    ELSE
      RETURN jsonb_build_object('ok', false, 'reason', 'not_eligible');
    END IF;
  END IF;

  -- 9. Check if offer is enabled
  IF NOT v_offer.enabled THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'disabled');
  END IF;

  -- 10. Check slot availability
  SELECT COUNT(*) INTO v_claims_count
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug;

  v_slots_taken := v_offer.slots_reserved + v_claims_count;
  IF (v_offer.slot_cap - v_slots_taken) <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'sold_out');
  END IF;

  -- 11. Insert subscriptions row & trial_claims row
  v_ends_at := now() + make_interval(days => v_offer.trial_days);

  INSERT INTO public.subscriptions (
    user_id,
    email,
    product_slug,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    manually_granted,
    grant_reason,
    is_trial
  ) VALUES (
    auth.uid(),
    v_user_email,
    v_offer.access_slug,
    'active',
    now(),
    v_ends_at,
    false,
    false,
    'free_trial',
    true
  ) RETURNING id INTO v_sub_id;

  INSERT INTO public.trial_claims (
    tool_slug,
    user_id,
    email_normalized,
    claimed_at,
    trial_ends_at,
    subscription_id
  ) VALUES (
    p_tool_slug,
    auth.uid(),
    v_norm_email,
    now(),
    v_ends_at,
    v_sub_id
  );

  RETURN jsonb_build_object(
    'ok', true,
    'ends_at', v_ends_at,
    'days', v_offer.trial_days
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
END;
$function$
;

-- ==============================================================================
-- Function: get_trial_status(text)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_trial_status(p_tool_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_email text;
  v_email_confirmed_at timestamptz;
  v_norm_email text;
  v_domain text;
  v_offer record;
  v_claims_count int;
  v_slots_taken int;
  v_slots_left int;
  v_claim record;
  v_claim_found boolean := false;
  v_sub record;
  v_sub_found boolean := false;
  v_has_access boolean := false;
  v_reason text := 'ok';
  v_eligible boolean := false;
BEGIN
  -- 1. Must be signed in
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'not_signed_in'
    );
  END IF;

  -- 2. Read caller identity
  SELECT email, email_confirmed_at
  INTO v_user_email, v_email_confirmed_at
  FROM auth.users
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'not_signed_in'
    );
  END IF;

  v_norm_email := public.normalize_email(v_user_email);
  IF v_norm_email IS NOT NULL AND position('@' in v_norm_email) > 0 THEN
    v_domain := substr(v_norm_email, length(v_norm_email) - position('@' in reverse(v_norm_email)) + 2);
  ELSE
    v_domain := '';
  END IF;

  SELECT enabled, trial_days, slot_cap, slots_reserved, access_slug, require_confirmed_email
  INTO v_offer
  FROM public.trial_offers
  WHERE tool_slug = p_tool_slug;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'enabled', false,
      'eligible', false,
      'reason', 'disabled'
    );
  END IF;

  SELECT COUNT(*) INTO v_claims_count
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug;

  v_slots_taken := v_offer.slots_reserved + v_claims_count;
  v_slots_left := GREATEST(v_offer.slot_cap - v_slots_taken, 0);

  -- Inspect existing claim using boolean flag
  SELECT trial_ends_at, converted_at, revoked_at
  INTO v_claim
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug
    AND (user_id = auth.uid() OR email_normalized = v_norm_email)
  LIMIT 1;
  v_claim_found := FOUND;

  -- Inspect existing subscription using boolean flag
  SELECT status, current_period_end
  INTO v_sub
  FROM public.subscriptions
  WHERE user_id = auth.uid()
    AND product_slug = v_offer.access_slug
  LIMIT 1;
  v_sub_found := FOUND;

  IF v_sub_found AND v_sub.status = 'active' AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now()) THEN
    v_has_access := true;
  END IF;

  -- Aligned reason determination order:
  -- not signed in -> email confirmation -> blocked domain -> already claimed ->
  -- existing subscriptions row -> offer disabled -> sold out -> ok
  IF v_offer.require_confirmed_email AND v_email_confirmed_at IS NULL THEN
    v_reason := 'email_unconfirmed';
  ELSIF EXISTS (SELECT 1 FROM public.blocked_email_domains WHERE domain = v_domain) THEN
    v_reason := 'email_not_allowed';
  ELSIF v_claim_found THEN
    v_reason := 'already_claimed';
  ELSIF v_sub_found THEN
    IF v_has_access THEN
      v_reason := 'already_has_access';
    ELSE
      v_reason := 'not_eligible';
    END IF;
  ELSIF NOT v_offer.enabled THEN
    v_reason := 'disabled';
  ELSIF v_slots_left <= 0 THEN
    v_reason := 'sold_out';
  ELSE
    v_reason := 'ok';
  END IF;

  v_eligible := (v_reason = 'ok');

  RETURN jsonb_build_object(
    'enabled', v_offer.enabled,
    'trial_days', v_offer.trial_days,
    'slot_cap', v_offer.slot_cap,
    'slots_taken', v_slots_taken,
    'slots_left', v_slots_left,
    'already_claimed', v_claim_found,
    'has_access', v_has_access,
    'claim', CASE WHEN v_claim_found THEN jsonb_build_object(
      'ends_at', v_claim.trial_ends_at,
      'converted', (v_claim.converted_at IS NOT NULL),
      'revoked', (v_claim.revoked_at IS NOT NULL)
    ) ELSE NULL END,
    'eligible', v_eligible,
    'reason', v_reason
  );
END;
$function$
;

-- ==============================================================================
-- Function: process_stripe_webhook_event(...)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.process_stripe_webhook_event(p_event_id text, p_event_type text, p_user_id uuid, p_email text, p_product_slug text, p_stripe_customer_id text, p_stripe_subscription_id text, p_stripe_price_id text, p_price_per_month numeric, p_current_period_start timestamp with time zone, p_current_period_end timestamp with time zone, p_quantity integer, p_subscription_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_active_count integer;
  v_delta integer;
  v_new_status text;
  v_row record;
  v_user_id uuid;
  v_email text;
  v_product_slug text;
  v_matched_user_id uuid;
  v_matched_email text;
  v_matched_slug text;
  v_trial_sub_id uuid;
BEGIN
  -- 1. Idempotency Check
  INSERT INTO stripe_webhook_events (event_id)
  VALUES (p_event_id)
  ON CONFLICT DO NOTHING;
  
  -- If duplicate, exit early without touching subscriptions
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', true, 'message', 'already processed');
  END IF;

  -- 2. Status Mapping
  IF p_event_type = 'checkout.session.completed' THEN
    IF p_subscription_status IN ('active', 'trialing') THEN
      v_new_status := 'active';
    ELSE
      -- Subscription is incomplete; wait for customer.subscription.updated
      RETURN jsonb_build_object('success', true, 'message', 'ignored incomplete checkout');
    END IF;
  ELSIF p_event_type = 'customer.subscription.updated' THEN
    IF p_subscription_status = 'past_due' THEN
      v_new_status := 'expired';
    ELSE
      v_new_status := 'active'; 
    END IF;
  ELSIF p_event_type = 'customer.subscription.deleted' THEN
    v_new_status := 'canceled';
  ELSIF p_event_type = 'invoice.payment_failed' THEN
    v_new_status := 'expired';
  ELSIF p_event_type = 'charge.refunded' THEN
    v_new_status := 'canceled';
  ELSE
    RETURN jsonb_build_object('success', true, 'message', 'ignored event type');
  END IF;

  -- 3. Cancellation / Expiration Path
  IF v_new_status != 'active' THEN
    -- Cancellation/expiration: deactivate active rows tied to this Stripe subscription
    UPDATE public.subscriptions
    SET status = v_new_status,
        updated_at = now()
    WHERE stripe_subscription_id = p_stripe_subscription_id
      AND status = 'active';

    RETURN jsonb_build_object('success', true, 'message', 'processed status change');
  END IF;

  -- 4. Active Subscription Processing: Parameter & Identity Resolution
  v_user_id := p_user_id;
  v_email := p_email;
  v_product_slug := public.resolve_access_slug(p_product_slug);

  -- If any needed field is missing, attempt resolution from existing subscription
  IF (v_user_id IS NULL OR v_email IS NULL OR v_product_slug IS NULL) AND p_stripe_subscription_id IS NOT NULL THEN
    SELECT user_id, email, product_slug
    INTO v_matched_user_id, v_matched_email, v_matched_slug
    FROM public.subscriptions
    WHERE stripe_subscription_id = p_stripe_subscription_id
    LIMIT 1;

    IF FOUND THEN
      v_user_id := COALESCE(v_user_id, v_matched_user_id);
      v_email := COALESCE(v_email, v_matched_email);
      v_product_slug := COALESCE(v_product_slug, v_matched_slug);
    END IF;
  END IF;

  -- If identity remains unresolved, skip write gracefully (stops infinite retries)
  IF v_user_id IS NULL OR v_email IS NULL OR v_product_slug IS NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'skipped: unresolved user/product');
  END IF;

  -- 5. Order Bot Multi-Store Path (Preserved)
  IF v_product_slug = 'orderbot' THEN
    SELECT COUNT(*) INTO v_active_count
    FROM public.subscriptions
    WHERE stripe_subscription_id = p_stripe_subscription_id
      AND status = 'active';

    IF v_active_count = p_quantity THEN
      -- Match: update existing rows
      UPDATE public.subscriptions
      SET current_period_end = p_current_period_end,
          updated_at = now()
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status = 'active';

    ELSIF v_active_count < p_quantity THEN
      -- Increase Quantity
      v_delta := p_quantity - v_active_count;
      
      -- Update existing rows first
      UPDATE public.subscriptions
      SET current_period_end = p_current_period_end,
          updated_at = now()
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status = 'active';

      -- Insert new slots
      FOR i IN 1..v_delta LOOP
        INSERT INTO public.subscriptions (
          user_id, email, product_slug, status,
          stripe_customer_id, stripe_subscription_id, stripe_price_id, price_per_month,
          current_period_start, current_period_end, manually_granted
        ) VALUES (
          v_user_id, v_email, v_product_slug, 'active',
          p_stripe_customer_id, p_stripe_subscription_id, p_stripe_price_id, p_price_per_month,
          p_current_period_start, p_current_period_end, false
        );
      END LOOP;

    ELSE
      -- Decrease Quantity
      v_delta := v_active_count - p_quantity;
      
      -- Expire newest slots first (rank by created_at DESC)
      FOR v_row IN (
        SELECT id FROM public.subscriptions
        WHERE stripe_subscription_id = p_stripe_subscription_id
          AND status = 'active'
        ORDER BY created_at DESC
        LIMIT v_delta
      ) LOOP
        UPDATE public.subscriptions
        SET status = 'expired',
            updated_at = now()
        WHERE id = v_row.id;
      END LOOP;

      -- Update remaining survivor slots
      UPDATE public.subscriptions
      SET current_period_end = p_current_period_end,
          updated_at = now()
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status = 'active';
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'processed successfully');
  END IF;

  -- 6. Single-Seat Products (cpbot/rccp, listflow, invoicegen, etc.)
  IF p_event_type = 'checkout.session.completed' THEN
    -- 6a. Manual Grant Safety: Active manual grants must never be overwritten
    IF EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = v_user_id
        AND product_slug = v_product_slug
        AND store_id IS NULL
        AND manually_granted = true
        AND status = 'active'
        AND (current_period_end IS NULL OR current_period_end > now())
    ) THEN
      RETURN jsonb_build_object('success', true, 'message', 'skipped: manual grant present');
    END IF;

    -- 6b. Check if existing row is a trial row to track conversion
    SELECT id INTO v_trial_sub_id
    FROM public.subscriptions
    WHERE user_id = v_user_id
      AND product_slug = v_product_slug
      AND store_id IS NULL
      AND is_trial = true;

    -- 6c. UPSERT on (user_id, product_slug) WHERE store_id IS NULL
    INSERT INTO public.subscriptions (
      user_id,
      email,
      product_slug,
      status,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id,
      price_per_month,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      is_trial,
      grant_reason,
      manually_granted,
      store_id
    ) VALUES (
      v_user_id,
      v_email,
      v_product_slug,
      'active',
      p_stripe_customer_id,
      p_stripe_subscription_id,
      p_stripe_price_id,
      p_price_per_month,
      p_current_period_start,
      p_current_period_end,
      false,
      false,
      'stripe_checkout',
      false,
      NULL
    )
    ON CONFLICT (user_id, product_slug) WHERE store_id IS NULL
    DO UPDATE SET
      email = EXCLUDED.email,
      status = 'active',
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      stripe_price_id = EXCLUDED.stripe_price_id,
      price_per_month = EXCLUDED.price_per_month,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = false,
      is_trial = false,
      grant_reason = 'stripe_checkout',
      updated_at = now();

    -- 6d. Trial Conversion: Mark matching trial_claims record as converted
    IF v_trial_sub_id IS NOT NULL THEN
      UPDATE public.trial_claims
      SET converted_at = now()
      WHERE subscription_id = v_trial_sub_id
         OR (user_id = v_user_id AND tool_slug = COALESCE(p_product_slug, 'rccp'));
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'processed successfully');

  ELSIF p_event_type = 'customer.subscription.updated' THEN
    -- Routine renewal / period update: update existing active rows only.
    -- Never insert, upsert, or reactivate cancelled/expired subscriptions.
    UPDATE public.subscriptions
    SET current_period_end = p_current_period_end,
        updated_at = now()
    WHERE stripe_subscription_id = p_stripe_subscription_id
      AND status = 'active';

    RETURN jsonb_build_object('success', true, 'message', 'processed successfully');
  ELSE
    RETURN jsonb_build_object('success', true, 'message', 'ignored event type');
  END IF;
END;
$function$
;

-- ==============================================================================
-- Function: admin_trial_extend(uuid, integer)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_trial_extend(p_claim_id uuid, p_days integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_admin_email text;
  v_claim record;
  v_new_end timestamptz;
BEGIN
  -- Admin guard
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501';
  END IF;

  IF p_claim_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'claim_id_required');
  END IF;

  IF p_days IS NULL OR p_days < 1 OR p_days > 90 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_days', 'message', 'Days must be between 1 and 90');
  END IF;

  SELECT c.*, s.is_trial, s.current_period_end, s.status AS sub_status
  INTO v_claim
  FROM public.trial_claims c
  LEFT JOIN public.subscriptions s ON s.id = c.subscription_id
  WHERE c.id = p_claim_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'claim_not_found');
  END IF;

  IF v_claim.converted_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'converted', 'message', 'Cannot extend a converted subscription');
  END IF;

  IF v_claim.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'revoked', 'message', 'Cannot extend a revoked claim');
  END IF;

  IF v_claim.subscription_id IS NULL OR v_claim.is_trial IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_trial_subscription', 'message', 'Subscription row is missing or not a trial row');
  END IF;

  v_new_end := GREATEST(COALESCE(v_claim.current_period_end, now()), now()) + make_interval(days => p_days);

  UPDATE public.subscriptions
  SET
    current_period_end = v_new_end,
    status = 'active',
    updated_at = now()
  WHERE id = v_claim.subscription_id
    AND is_trial = true;

  UPDATE public.trial_claims
  SET trial_ends_at = v_new_end
  WHERE id = p_claim_id;

  -- Audit log
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    admin_email,
    action,
    target_user_id,
    target_email,
    details
  ) VALUES (
    auth.uid(),
    v_admin_email,
    'admin_trial_extend',
    v_claim.user_id,
    v_claim.email_normalized,
    jsonb_build_object(
      'claim_id', p_claim_id,
      'days', p_days,
      'previous_ends_at', v_claim.current_period_end,
      'new_ends_at', v_new_end
    )
  );

  RETURN jsonb_build_object('ok', true, 'new_ends_at', v_new_end);
END;
$function$
;
