-- ==============================================================================
-- 030_stripe_webhook_schema_and_rpc.sql
-- 1. Create stripe_webhook_events for idempotency
-- 2. Create process_stripe_webhook_event RPC for atomic processing
-- ==============================================================================

-- 1. Create stripe_webhook_events table
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Strict Lockdown
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.stripe_webhook_events FROM PUBLIC;
REVOKE ALL ON TABLE public.stripe_webhook_events FROM anon;
REVOKE ALL ON TABLE public.stripe_webhook_events FROM authenticated;

GRANT ALL ON TABLE public.stripe_webhook_events TO service_role;

-- 2. Create process_stripe_webhook_event RPC
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
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_quantity integer,
  p_subscription_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_active_count integer;
  v_delta integer;
  v_new_status text;
  v_row record;
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

  -- 3. Quantity Mapping & State Reconciliation
  IF v_new_status != 'active' THEN
    -- Cancellation/expiration: everything tied to this subscription goes away.
    -- No quantity reconciliation needed or wanted here.
    UPDATE subscriptions
    SET status = v_new_status
    WHERE stripe_subscription_id = p_stripe_subscription_id
      AND status = 'active';
  ELSE
    -- Subscription is staying active, so we reconcile slots based on quantity.
    SELECT COUNT(*) INTO v_active_count
    FROM subscriptions
    WHERE stripe_subscription_id = p_stripe_subscription_id
      AND status = 'active';

    IF v_active_count = p_quantity THEN
      -- Match: update existing rows
      UPDATE subscriptions
      SET current_period_end = p_current_period_end
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status = 'active';

    ELSIF v_active_count < p_quantity THEN
      -- Increase Quantity
      v_delta := p_quantity - v_active_count;
      
      -- Update existing rows first
      UPDATE subscriptions
      SET current_period_end = p_current_period_end
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status = 'active';

      -- Insert new slots
      FOR i IN 1..v_delta LOOP
        INSERT INTO subscriptions (
          user_id, email, product_slug, status,
          stripe_customer_id, stripe_subscription_id, stripe_price_id, price_per_month,
          current_period_start, current_period_end, manually_granted
        ) VALUES (
          p_user_id, p_email, p_product_slug, 'active',
          p_stripe_customer_id, p_stripe_subscription_id, p_stripe_price_id, p_price_per_month,
          p_current_period_start, p_current_period_end, false
        );
      END LOOP;

    ELSE
      -- Decrease Quantity
      v_delta := v_active_count - p_quantity;
      
      -- Expire newest slots first (rank by created_at DESC)
      FOR v_row IN (
        SELECT id FROM subscriptions
        WHERE stripe_subscription_id = p_stripe_subscription_id
          AND status = 'active'
        ORDER BY created_at DESC
        LIMIT v_delta
      ) LOOP
        UPDATE subscriptions
        SET status = 'expired'
        WHERE id = v_row.id;
      END LOOP;

      -- Update remaining survivor slots
      UPDATE subscriptions
      SET current_period_end = p_current_period_end
      WHERE stripe_subscription_id = p_stripe_subscription_id
        AND status = 'active';
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'processed successfully');
END;
$$;
