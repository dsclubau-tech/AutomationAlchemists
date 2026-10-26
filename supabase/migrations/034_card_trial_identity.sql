-- ==============================================================================
-- Migration 034: Card-Required Free Trial Architecture & Identity Gating
-- ==============================================================================
-- New Design:
-- 1. Free trials now REQUIRE A CARD taken by Stripe Checkout.
--    - Trial length = trial_offers.trial_days (default 30 days).
--    - Customer starts a Stripe subscription in 'trialing' status.
--    - Stripe charges the card at trial end unless customer cancels.
-- 2. Anti-Abuse Identification Gating:
--    - One trial per normalised email (trial_claims.email_normalized).
--    - One trial per card fingerprint (trial_identities kind = 'card').
--    - One trial per phone number HMAC hash (trial_identities kind = 'phone').
-- 3. The old no-card path (claim_free_trial) is completely closed and returns
--    {ok: false, reason: 'checkout_required'} for all callers.
-- 4. Single-seat trial subscriptions are provisioned with status = 'active',
--    is_trial = true, grant_reason = 'stripe_trial', and current_period_end
--    set to Stripe trial_end PLUS 6 hours grace to prevent pg_cron from expiring
--    the row during Stripe's ~1h invoice generation window.
-- 5. On customer.subscription.updated with active status, trial rows are converted
--    in place (is_trial = false, grant_reason = 'stripe_checkout', converted_at stamped).
--    Safe reactivation from 'expired' (cron) or 'past_due' is supported, but 'canceled'
--    rows are NEVER reactivated.
-- 6. Note: Migrations are NEVER auto-applied; this file is written for manual execution.
-- ==============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ------------------------------------------------------------------------------
-- 1. Tables: trial_identities & trial_denials
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trial_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug text NOT NULL REFERENCES public.tools(slug),
  kind text NOT NULL CHECK (kind IN ('card', 'phone')),
  value_hash text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trial_identities_tool_kind_value_unique UNIQUE (tool_slug, kind, value_hash)
);

CREATE TABLE IF NOT EXISTS public.trial_denials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tool_slug text,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS enabled with zero policies (direct access completely revoked)
ALTER TABLE public.trial_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_denials ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.trial_identities FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.trial_denials FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. Shared Internal Helper: public._check_trial_eligibility
-- ------------------------------------------------------------------------------
-- Reuses EXACTLY the checks that claim_free_trial did in migration 031:
-- 1. Valid signed in user in auth.users
-- 2. Normalised email valid
-- 3. Email domain not blocked
-- 4. Offer exists in trial_offers
-- 5. Email confirmed if require_confirmed_email = true
-- 6. No existing claim for user ID or normalised email
-- 7. No existing subscription row with active access
-- 8. Offer enabled = true
-- 9. Slots available (slot_cap - slots_reserved - claims > 0)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._check_trial_eligibility(
  p_user_id uuid,
  p_tool_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
BEGIN
  -- 1. Must be a valid user in auth.users
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'not_signed_in', 'trial_days', null);
  END IF;

  SELECT email, email_confirmed_at
  INTO v_user_email, v_email_confirmed_at
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'not_signed_in', 'trial_days', null);
  END IF;

  -- 2. Normalize email
  v_norm_email := public.normalize_email(v_user_email);
  IF v_norm_email IS NULL OR position('@' in v_norm_email) = 0 THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'email_not_allowed', 'trial_days', null);
  END IF;

  v_domain := substr(v_norm_email, length(v_norm_email) - position('@' in reverse(v_norm_email)) + 2);

  -- 3. Blocked disposable domains
  IF EXISTS (SELECT 1 FROM public.blocked_email_domains WHERE domain = v_domain) THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'email_not_allowed', 'trial_days', null);
  END IF;

  -- 4. Offer exists
  SELECT tool_slug, access_slug, enabled, trial_days, slot_cap, slots_reserved, require_confirmed_email
  INTO v_offer
  FROM public.trial_offers
  WHERE tool_slug = p_tool_slug;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'disabled', 'trial_days', null);
  END IF;

  -- 5. Email confirmation check if required
  IF v_offer.require_confirmed_email AND v_email_confirmed_at IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'email_unconfirmed', 'trial_days', v_offer.trial_days);
  END IF;

  -- 6. Check already claimed by this user ID OR normalized email
  SELECT 1 INTO v_dummy
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug
    AND (user_id = p_user_id OR email_normalized = v_norm_email)
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'already_claimed', 'trial_days', v_offer.trial_days);
  END IF;

  -- 7. Check existing subscriptions row for (p_user_id, access_slug)
  SELECT status, current_period_end
  INTO v_sub
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND product_slug = v_offer.access_slug
  LIMIT 1;

  IF FOUND THEN
    IF v_sub.status = 'active' AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now()) THEN
      RETURN jsonb_build_object('eligible', false, 'reason', 'already_has_access', 'trial_days', v_offer.trial_days);
    ELSE
      RETURN jsonb_build_object('eligible', false, 'reason', 'not_eligible', 'trial_days', v_offer.trial_days);
    END IF;
  END IF;

  -- 8. Offer enabled
  IF NOT v_offer.enabled THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'disabled', 'trial_days', v_offer.trial_days);
  END IF;

  -- 9. Slot availability
  SELECT COUNT(*) INTO v_claims_count
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug;

  v_slots_taken := v_offer.slots_reserved + v_claims_count;
  IF (v_offer.slot_cap - v_slots_taken) <= 0 THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'sold_out', 'trial_days', v_offer.trial_days);
  END IF;

  -- 10. All checks pass
  RETURN jsonb_build_object(
    'eligible', true,
    'reason', 'ok',
    'trial_days', v_offer.trial_days,
    'access_slug', v_offer.access_slug,
    'normalized_email', v_norm_email
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. Stored Function: public.trial_eligibility_for
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trial_eligibility_for(
  p_user_id uuid,
  p_tool_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_res jsonb;
BEGIN
  v_res := public._check_trial_eligibility(p_user_id, p_tool_slug);
  RETURN jsonb_build_object(
    'eligible', (v_res->>'eligible')::boolean,
    'reason', v_res->>'reason',
    'trial_days', (v_res->>'trial_days')::int
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. Stored Function: public.finalize_card_trial
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_card_trial(
  p_user_id uuid,
  p_tool_slug text,
  p_email text,
  p_card_fingerprint text,
  p_phone_hash text,
  p_trial_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_card_fp text;
  v_phone_h text;
  v_existing_claim record;
  v_has_card boolean;
  v_has_phone boolean;
  v_eligibility jsonb;
  v_reason text;
  v_existing_card_user uuid;
  v_existing_phone_user uuid;
  v_raw_email text;
  v_norm_email text;
  v_claim_id uuid;
BEGIN
  v_card_fp := trim(COALESCE(p_card_fingerprint, ''));
  v_phone_h := trim(COALESCE(p_phone_hash, ''));

  -- Check required fingerprint and phone hash upfront
  IF v_card_fp = '' THEN
    INSERT INTO public.trial_denials (user_id, tool_slug, reason)
    VALUES (p_user_id, p_tool_slug, 'card_missing');
    RETURN jsonb_build_object('ok', false, 'reason', 'card_missing');
  END IF;

  IF v_phone_h = '' THEN
    INSERT INTO public.trial_denials (user_id, tool_slug, reason)
    VALUES (p_user_id, p_tool_slug, 'phone_missing');
    RETURN jsonb_build_object('ok', false, 'reason', 'phone_missing');
  END IF;

  -- Idempotency check: if caller already has a trial_claim for this tool
  SELECT id, trial_ends_at INTO v_existing_claim
  FROM public.trial_claims
  WHERE user_id = p_user_id
    AND tool_slug = p_tool_slug
  LIMIT 1;

  IF FOUND THEN
    -- Check if existing registered identities match the retrying credentials
    SELECT EXISTS (
      SELECT 1 FROM public.trial_identities
      WHERE tool_slug = p_tool_slug AND kind = 'card' AND value_hash = v_card_fp AND user_id = p_user_id
    ) INTO v_has_card;

    SELECT EXISTS (
      SELECT 1 FROM public.trial_identities
      WHERE tool_slug = p_tool_slug AND kind = 'phone' AND value_hash = v_phone_h AND user_id = p_user_id
    ) INTO v_has_phone;

    IF v_has_card AND v_has_phone THEN
      -- Same user retrying with identical card and phone: return existing claim idempotently
      RETURN jsonb_build_object('ok', true, 'claim_id', v_existing_claim.id);
    ELSE
      -- User already claimed, but attempted with non-matching identities
      INSERT INTO public.trial_denials (user_id, tool_slug, reason)
      VALUES (p_user_id, p_tool_slug, 'already_claimed');
      RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
    END IF;
  END IF;

  -- Re-run eligibility in this transaction
  v_eligibility := public._check_trial_eligibility(p_user_id, p_tool_slug);
  IF (v_eligibility->>'eligible')::boolean IS NOT TRUE THEN
    v_reason := v_eligibility->>'reason';
    INSERT INTO public.trial_denials (user_id, tool_slug, reason)
    VALUES (p_user_id, p_tool_slug, v_reason);
    RETURN jsonb_build_object('ok', false, 'reason', v_reason);
  END IF;

  -- Check if card fingerprint is already registered to a DIFFERENT user
  SELECT user_id INTO v_existing_card_user
  FROM public.trial_identities
  WHERE tool_slug = p_tool_slug
    AND kind = 'card'
    AND value_hash = v_card_fp
  LIMIT 1;

  IF FOUND AND (v_existing_card_user IS NULL OR v_existing_card_user != p_user_id) THEN
    INSERT INTO public.trial_denials (user_id, tool_slug, reason)
    VALUES (p_user_id, p_tool_slug, 'card_already_used');
    RETURN jsonb_build_object('ok', false, 'reason', 'card_already_used');
  END IF;

  -- Check if phone hash is already registered to a DIFFERENT user
  SELECT user_id INTO v_existing_phone_user
  FROM public.trial_identities
  WHERE tool_slug = p_tool_slug
    AND kind = 'phone'
    AND value_hash = v_phone_h
  LIMIT 1;

  IF FOUND AND (v_existing_phone_user IS NULL OR v_existing_phone_user != p_user_id) THEN
    INSERT INTO public.trial_denials (user_id, tool_slug, reason)
    VALUES (p_user_id, p_tool_slug, 'phone_already_used');
    RETURN jsonb_build_object('ok', false, 'reason', 'phone_already_used');
  END IF;

  -- Register card and phone identities
  INSERT INTO public.trial_identities (tool_slug, kind, value_hash, user_id)
  VALUES (p_tool_slug, 'card', v_card_fp, p_user_id)
  ON CONFLICT (tool_slug, kind, value_hash) DO NOTHING;

  INSERT INTO public.trial_identities (tool_slug, kind, value_hash, user_id)
  VALUES (p_tool_slug, 'phone', v_phone_h, p_user_id)
  ON CONFLICT (tool_slug, kind, value_hash) DO NOTHING;

  -- Resolve normalized email
  v_norm_email := v_eligibility->>'normalized_email';
  IF v_norm_email IS NULL THEN
    SELECT email INTO v_raw_email FROM auth.users WHERE id = p_user_id;
    v_norm_email := public.normalize_email(COALESCE(p_email, v_raw_email));
  END IF;

  -- Insert the trial_claims row (trial_ends_at = p_trial_end)
  INSERT INTO public.trial_claims (
    tool_slug,
    user_id,
    email_normalized,
    claimed_at,
    trial_ends_at
  ) VALUES (
    p_tool_slug,
    p_user_id,
    v_norm_email,
    now(),
    p_trial_end
  )
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object('ok', true, 'claim_id', v_claim_id);

EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.trial_denials (user_id, tool_slug, reason)
    VALUES (p_user_id, p_tool_slug, 'already_claimed');
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. Stored Function: public.mirror_cancel_at_period_end
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mirror_cancel_at_period_end(
  p_stripe_subscription_id text,
  p_flag boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.subscriptions
  SET cancel_at_period_end = p_flag,
      updated_at = now()
  WHERE stripe_subscription_id = p_stripe_subscription_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. Stored Function: public.claim_free_trial (Replaced: no-card path closed)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_free_trial(p_tool_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- The cardless free trial is permanently closed; a card entered via Stripe Checkout is required.
  RETURN jsonb_build_object('ok', false, 'reason', 'checkout_required');
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. Stored Function: public.get_trial_status (Extended: denied_reason added)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_trial_status(p_tool_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
  v_denied_reason text := null;
BEGIN
  -- 1. Must be signed in
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'not_signed_in',
      'denied_reason', null
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
      'reason', 'not_signed_in',
      'denied_reason', null
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
    SELECT reason INTO v_denied_reason
    FROM public.trial_denials
    WHERE user_id = auth.uid()
      AND (tool_slug = p_tool_slug OR tool_slug IS NULL)
      AND created_at >= now() - interval '2 days'
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN jsonb_build_object(
      'enabled', false,
      'eligible', false,
      'reason', 'disabled',
      'denied_reason', v_denied_reason
    );
  END IF;

  SELECT COUNT(*) INTO v_claims_count
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug;

  v_slots_taken := v_offer.slots_reserved + v_claims_count;
  v_slots_left := GREATEST(v_offer.slot_cap - v_slots_taken, 0);

  -- Inspect existing claim
  SELECT trial_ends_at, converted_at, revoked_at
  INTO v_claim
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug
    AND (user_id = auth.uid() OR email_normalized = v_norm_email)
  LIMIT 1;
  v_claim_found := FOUND;

  -- Inspect existing subscription
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

  -- Aligned reason determination order
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

  -- Retrieve latest denial reason within 2 days
  SELECT reason INTO v_denied_reason
  FROM public.trial_denials
  WHERE user_id = auth.uid()
    AND (tool_slug = p_tool_slug OR tool_slug IS NULL)
    AND created_at >= now() - interval '2 days'
  ORDER BY created_at DESC
  LIMIT 1;

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
    'reason', v_reason,
    'denied_reason', v_denied_reason
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. Stored Procedure: public.process_stripe_webhook_event (Exact 13 arguments)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_email text,
  p_product_slug text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_price_per_month numeric,
  p_current_period_start timestamp with time zone,
  p_current_period_end timestamp with time zone,
  p_quantity integer,
  p_subscription_status text
)
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
  v_is_trial boolean;
  v_grant_reason text;
  v_target_period_end timestamptz;
  v_upserted_sub_id uuid;
  v_tool_slug text;
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
    IF p_subscription_status IN ('past_due', 'unpaid') THEN
      v_new_status := 'past_due';
    ELSIF p_subscription_status = 'canceled' THEN
      v_new_status := 'canceled';
    ELSE
      v_new_status := 'active'; 
    END IF;
  ELSIF p_event_type = 'customer.subscription.deleted' THEN
    v_new_status := 'canceled';
  ELSIF p_event_type = 'invoice.payment_failed' THEN
    v_new_status := 'past_due';
  ELSIF p_event_type = 'charge.refunded' THEN
    v_new_status := 'canceled';
  ELSE
    RETURN jsonb_build_object('success', true, 'message', 'ignored event type');
  END IF;

  -- 3. Access Revocation / Expiration / Past-Due Path
  IF v_new_status != 'active' THEN
    -- Access revocation: update rows tied to this Stripe subscription.
    -- Strict rule: NEVER overwrite or reactivate a 'canceled' subscription.
    UPDATE public.subscriptions
    SET status = v_new_status,
        updated_at = now()
    WHERE stripe_subscription_id = p_stripe_subscription_id
      AND status != 'canceled';

    RETURN jsonb_build_object('success', true, 'message', 'processed status change');
  END IF;

  -- 4. Active / Trialing Subscription Processing: Parameter & Identity Resolution
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

    -- If no active rows but past_due/expired exist, reactivate them (never canceled)
    IF v_active_count = 0 THEN
      UPDATE public.subscriptions
      SET status = 'active',
          current_period_end = p_current_period_end,
          updated_at = now()
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status IN ('past_due', 'expired');

      SELECT COUNT(*) INTO v_active_count
      FROM public.subscriptions
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status = 'active';
    END IF;

    IF v_active_count = p_quantity THEN
      -- Match: update existing rows
      UPDATE public.subscriptions
      SET current_period_end = p_current_period_end,
          status = 'active',
          updated_at = now()
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status != 'canceled';

    ELSIF v_active_count < p_quantity THEN
      -- Increase Quantity
      v_delta := p_quantity - v_active_count;
      
      -- Update existing rows first
      UPDATE public.subscriptions
      SET current_period_end = p_current_period_end,
          status = 'active',
          updated_at = now()
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status != 'canceled';

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
          status = 'active',
          updated_at = now()
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status != 'canceled';
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

    -- 6b. Check if this is a trialing checkout session
    IF p_subscription_status = 'trialing' THEN
      v_is_trial := true;
      v_grant_reason := 'stripe_trial';
      -- Stripe invoices ~1h after trial end. A +6h grace stops paying customers being locked out in that gap.
      -- True trial end is stored in trial_claims.trial_ends_at.
      v_target_period_end := p_current_period_end + interval '6 hours';
    ELSE
      v_is_trial := false;
      v_grant_reason := 'stripe_checkout';
      v_target_period_end := p_current_period_end;
    END IF;

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
      v_target_period_end,
      false,
      v_is_trial,
      v_grant_reason,
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
      is_trial = EXCLUDED.is_trial,
      grant_reason = EXCLUDED.grant_reason,
      updated_at = now()
    RETURNING id INTO v_upserted_sub_id;

    -- 6d. Link trial_claims.subscription_id for trialing checkouts
    IF v_is_trial THEN
      SELECT tool_slug INTO v_tool_slug
      FROM public.trial_offers
      WHERE access_slug = v_product_slug
      LIMIT 1;

      UPDATE public.trial_claims
      SET subscription_id = v_upserted_sub_id
      WHERE user_id = v_user_id
        AND (tool_slug = v_product_slug OR tool_slug = COALESCE(v_tool_slug, 'rccp'))
        AND subscription_id IS NULL;
    ELSE
      -- Converting from a pre-existing trial row:
      UPDATE public.trial_claims
      SET converted_at = now()
      WHERE user_id = v_user_id
        AND (subscription_id = v_upserted_sub_id OR tool_slug = COALESCE(p_product_slug, 'rccp'))
        AND converted_at IS NULL;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'processed successfully');

  ELSIF p_event_type = 'customer.subscription.updated' THEN
    -- Routine renewal / paid conversion / payment recovery:
    -- Convert in place if is_trial = true
    UPDATE public.subscriptions
    SET
      status = 'active',
      is_trial = false,
      grant_reason = 'stripe_checkout',
      current_period_end = p_current_period_end,
      updated_at = now()
    WHERE stripe_subscription_id = p_stripe_subscription_id
      AND status != 'canceled'
      AND is_trial = true;

    IF FOUND THEN
      -- Stamp trial_claims.converted_at
      UPDATE public.trial_claims
      SET converted_at = now()
      WHERE (
        subscription_id IN (
          SELECT id FROM public.subscriptions WHERE stripe_subscription_id = p_stripe_subscription_id
        )
        OR (
          user_id = v_user_id
          AND (tool_slug = p_product_slug OR tool_slug IN (SELECT tool_slug FROM public.trial_offers WHERE access_slug = v_product_slug))
        )
      )
      AND converted_at IS NULL;
    END IF;

    -- Update non-trial rows (routine renewal or recovery from past_due / expired; NEVER canceled)
    UPDATE public.subscriptions
    SET
      status = 'active',
      current_period_end = p_current_period_end,
      updated_at = now()
    WHERE stripe_subscription_id = p_stripe_subscription_id
      AND status != 'canceled'
      AND is_trial = false;

    RETURN jsonb_build_object('success', true, 'message', 'processed successfully');
  ELSE
    RETURN jsonb_build_object('success', true, 'message', 'ignored event type');
  END IF;
END;
$function$;

-- ------------------------------------------------------------------------------
-- 9. Stored Function: public.admin_trial_extend (Refuse revoked claim)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_trial_extend(p_claim_id uuid, p_days int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

  -- Refuse revoked claim checked before any update
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
$$;

-- ------------------------------------------------------------------------------
-- 10. Privileges & Access Security
-- ------------------------------------------------------------------------------

-- Internal helper: service_role only
REVOKE ALL ON FUNCTION public._check_trial_eligibility(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._check_trial_eligibility(uuid, text) TO service_role;

-- New RPC: trial_eligibility_for -> service_role only
REVOKE ALL ON FUNCTION public.trial_eligibility_for(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trial_eligibility_for(uuid, text) TO service_role;

-- New RPC: finalize_card_trial -> service_role only
REVOKE ALL ON FUNCTION public.finalize_card_trial(uuid, text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_card_trial(uuid, text, text, text, text, timestamptz) TO service_role;

-- New RPC: mirror_cancel_at_period_end -> service_role only
REVOKE ALL ON FUNCTION public.mirror_cancel_at_period_end(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mirror_cancel_at_period_end(text, boolean) TO service_role;

-- claim_free_trial: preserve authenticated grant
REVOKE ALL ON FUNCTION public.claim_free_trial(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_free_trial(text) TO authenticated;

-- get_trial_status: preserve authenticated grant
REVOKE ALL ON FUNCTION public.get_trial_status(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trial_status(text) TO authenticated;

-- process_stripe_webhook_event: postgres & service_role
REVOKE ALL ON FUNCTION public.process_stripe_webhook_event(text, text, uuid, text, text, text, text, text, numeric, timestamptz, timestamptz, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_stripe_webhook_event(text, text, uuid, text, text, text, text, text, numeric, timestamptz, timestamptz, integer, text) TO postgres, service_role;

-- admin_trial_extend: preserve authenticated grant (protected internally by admin profile check)
REVOKE ALL ON FUNCTION public.admin_trial_extend(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_trial_extend(uuid, integer) TO authenticated;

COMMIT;
