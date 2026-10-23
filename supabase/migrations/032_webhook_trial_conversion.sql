-- ==============================================================================
-- Migration 032: Webhook Trial Conversion, Access Slug Mapping & Manual Grant Safety
-- ==============================================================================
-- 1. Helper function: public.resolve_access_slug(p_tool_slug text)
--    Maps catalog marketing slugs (e.g. 'rccp') to entitlement access slugs
--    (e.g. 'cpbot' from trial_offers). Unmapped tools resolve to their own slug.
--    Execution is strictly restricted to the database owner (postgres role).
-- 2. Enhanced public.process_stripe_webhook_event
--    - Preserves exact 13-argument signature.
--    - Resolves missing user/email/product from existing subscription before writing.
--    - Skips without inserting if user/product cannot be resolved (avoids HTTP 500).
--    - Protects active manual grants (manually_granted = true) from being overwritten.
--    - UPSERTs single-seat tools on (user_id, product_slug) WHERE store_id IS NULL,
--      converting trial rows (is_trial = false) and updating trial_claims.converted_at.
--    - Preserves Order Bot multi-store quantity logic.
-- ==============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ------------------------------------------------------------------------------
-- 1. Helper Function: public.resolve_access_slug
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_access_slug(p_tool_slug text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_access_slug text;
BEGIN
  IF p_tool_slug IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT access_slug INTO v_access_slug
  FROM public.trial_offers
  WHERE tool_slug = p_tool_slug;

  RETURN COALESCE(v_access_slug, p_tool_slug);
END;
$$;

-- Security: Restricted strictly to postgres role
REVOKE ALL ON FUNCTION public.resolve_access_slug(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_access_slug(text) TO postgres;

-- ------------------------------------------------------------------------------
-- 2. Stored Procedure: public.process_stripe_webhook_event
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
$function$;

COMMIT;
