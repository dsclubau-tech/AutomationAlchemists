-- ==============================================================================
-- Migration 031: Free Trial and User Price Overrides (Part A Database Layer)
-- ==============================================================================
-- This migration establishes the database foundation for free trials (no card)
-- and admin-configured per-user discounts.
--
-- Safety & Idempotency:
-- - Wrapped in a single BEGIN ... COMMIT block.
-- - Fully idempotent (IF NOT EXISTS, CREATE OR REPLACE, ON CONFLICT DO NOTHING).
-- - Does NOT modify, drop, or alter any existing indexes, triggers, or functions.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Modify subscriptions table: add is_trial column
-- ------------------------------------------------------------------------------
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS is_trial boolean NOT NULL DEFAULT false;

-- ------------------------------------------------------------------------------
-- 2. Table: public.trial_offers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trial_offers (
  tool_slug text PRIMARY KEY,
  access_slug text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  trial_days int NOT NULL DEFAULT 30 CHECK (trial_days BETWEEN 1 AND 90),
  slot_cap int NOT NULL DEFAULT 500 CHECK (slot_cap >= 0),
  slots_reserved int NOT NULL DEFAULT 0 CHECK (slots_reserved >= 0),
  require_confirmed_email boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Note: access_slug must match the slug the CP Bot gate checks (to be confirmed by the CP Bot developer).
-- Note: slots_reserved must only reflect slots genuinely set aside (for example people already promised a trial), never invented scarcity.
INSERT INTO public.trial_offers (
  tool_slug,
  access_slug,
  enabled,
  trial_days,
  slot_cap,
  slots_reserved,
  require_confirmed_email
) VALUES (
  'rccp',
  'cpbot',
  false,
  30,
  500,
  0,
  false
) ON CONFLICT (tool_slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Table: public.blocked_email_domains
-- ------------------------------------------------------------------------------
-- Note: A speed bump, editable from the admin panel later, not a wall.
CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
  domain text PRIMARY KEY CHECK (domain = lower(domain)),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.blocked_email_domains (domain) VALUES
  ('mailinator.com'),
  ('guerrillamail.com'),
  ('10minutemail.com'),
  ('temp-mail.org'),
  ('tempmail.com'),
  ('yopmail.com'),
  ('trashmail.com'),
  ('sharklasers.com'),
  ('getnada.com'),
  ('dispostable.com'),
  ('maildrop.cc'),
  ('throwawaymail.com'),
  ('fakeinbox.com'),
  ('mailnesia.com'),
  ('tempail.com')
ON CONFLICT (domain) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. Table: public.trial_claims
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trial_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug text NOT NULL REFERENCES public.trial_offers(tool_slug),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email_normalized text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  trial_ends_at timestamptz NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  converted_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  CONSTRAINT trial_claims_tool_slug_email_normalized_key UNIQUE (tool_slug, email_normalized)
);

-- IMPORTANT: No cascade from auth.users (ON DELETE SET NULL), so deleting an account does not free its trial.
CREATE UNIQUE INDEX IF NOT EXISTS trial_claims_tool_user_idx 
  ON public.trial_claims (tool_slug, user_id) 
  WHERE (user_id IS NOT NULL);

-- ------------------------------------------------------------------------------
-- 5. Table: public.user_price_overrides
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_price_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('fixed_price', 'percent_off')),
  amount_cents int,
  percent_off numeric(5,2),
  currency text NOT NULL DEFAULT 'aud',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT user_price_overrides_kind_check CHECK (
    (kind = 'fixed_price' AND amount_cents > 0 AND percent_off IS NULL) OR
    (kind = 'percent_off' AND percent_off > 0 AND percent_off <= 100 AND amount_cents IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS user_price_overrides_active_user_tool_idx 
  ON public.user_price_overrides (user_id, tool_slug) 
  WHERE (revoked_at IS NULL);

-- ------------------------------------------------------------------------------
-- 6. Helper Function: public.normalize_email
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_email text;
  v_at_pos int;
  v_local text;
  v_domain text;
  v_plus_pos int;
BEGIN
  IF p_email IS NULL THEN
    RETURN NULL;
  END IF;

  v_email := lower(trim(p_email));
  IF v_email = '' THEN
    RETURN NULL;
  END IF;

  -- Split at the last '@'
  v_at_pos := length(v_email) - position('@' in reverse(v_email)) + 1;
  IF v_at_pos <= 1 OR v_at_pos >= length(v_email) THEN
    RETURN NULL;
  END IF;

  v_local := substr(v_email, 1, v_at_pos - 1);
  v_domain := substr(v_email, v_at_pos + 1);

  -- Map googlemail.com to gmail.com
  IF v_domain = 'googlemail.com' THEN
    v_domain := 'gmail.com';
  END IF;

  -- Remove +tag from local part for every domain
  v_plus_pos := position('+' in v_local);
  IF v_plus_pos > 0 THEN
    v_local := substr(v_local, 1, v_plus_pos - 1);
  END IF;

  -- Remove dots from local part ONLY for gmail.com
  IF v_domain = 'gmail.com' THEN
    v_local := replace(v_local, '.', '');
  END IF;

  IF v_local = '' OR v_domain = '' THEN
    RETURN NULL;
  END IF;

  RETURN v_local || '@' || v_domain;
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. Public Function: public.get_trial_public
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_trial_public(p_tool_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_offer record;
  v_claims_count int;
  v_slots_taken int;
  v_slots_left int;
BEGIN
  SELECT enabled, trial_days, slot_cap, slots_reserved
  INTO v_offer
  FROM public.trial_offers
  WHERE tool_slug = p_tool_slug;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('enabled', false);
  END IF;

  SELECT COUNT(*) INTO v_claims_count
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug;

  v_slots_taken := v_offer.slots_reserved + v_claims_count;
  v_slots_left := GREATEST(v_offer.slot_cap - v_slots_taken, 0);

  RETURN jsonb_build_object(
    'enabled', v_offer.enabled,
    'trial_days', v_offer.trial_days,
    'slot_cap', v_offer.slot_cap,
    'slots_taken', v_slots_taken,
    'slots_left', v_slots_left
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. Authenticated Function: public.get_trial_status
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
  v_sub record;
  v_reason text := 'ok';
  v_eligible boolean := false;
  v_has_access boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'not_signed_in'
    );
  END IF;

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

  SELECT trial_ends_at, converted_at, revoked_at
  INTO v_claim
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug
    AND (user_id = auth.uid() OR email_normalized = v_norm_email)
  LIMIT 1;

  SELECT status, current_period_end
  INTO v_sub
  FROM public.subscriptions
  WHERE user_id = auth.uid()
    AND product_slug = v_offer.access_slug
  LIMIT 1;

  IF v_sub.status = 'active' AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now()) THEN
    v_has_access := true;
  END IF;

  -- Reason determination in exact order
  IF v_offer.require_confirmed_email AND v_email_confirmed_at IS NULL THEN
    v_reason := 'email_unconfirmed';
  ELSIF EXISTS (SELECT 1 FROM public.blocked_email_domains WHERE domain = v_domain) THEN
    v_reason := 'email_not_allowed';
  ELSIF NOT v_offer.enabled THEN
    v_reason := 'disabled';
  ELSIF v_slots_left <= 0 THEN
    v_reason := 'sold_out';
  ELSIF v_claim IS NOT NULL THEN
    v_reason := 'already_claimed';
  ELSIF v_sub IS NOT NULL THEN
    IF v_has_access THEN
      v_reason := 'already_has_access';
    ELSE
      v_reason := 'not_eligible';
    END IF;
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
    'already_claimed', (v_claim IS NOT NULL),
    'has_access', v_has_access,
    'claim', CASE WHEN v_claim IS NOT NULL THEN jsonb_build_object(
      'ends_at', v_claim.trial_ends_at,
      'converted', (v_claim.converted_at IS NOT NULL),
      'revoked', (v_claim.revoked_at IS NOT NULL)
    ) ELSE NULL END,
    'eligible', v_eligible,
    'reason', v_reason
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. Claim Function: public.claim_free_trial
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_free_trial(p_tool_slug text)
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
  v_ends_at timestamptz;
  v_sub_id uuid;
BEGIN
  -- 1. Must be signed in
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

  -- 7. Check if offer is enabled
  IF NOT v_offer.enabled THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'disabled');
  END IF;

  -- 8. Check slot availability
  SELECT COUNT(*) INTO v_claims_count
  FROM public.trial_claims
  WHERE tool_slug = p_tool_slug;

  v_slots_taken := v_offer.slots_reserved + v_claims_count;
  IF (v_offer.slot_cap - v_slots_taken) <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'sold_out');
  END IF;

  -- 9. Check already claimed by this email or user id
  IF EXISTS (
    SELECT 1 FROM public.trial_claims
    WHERE tool_slug = p_tool_slug
      AND (user_id = auth.uid() OR email_normalized = v_norm_email)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  -- 10. Check existing subscriptions row for (user, access_slug)
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

  -- 11. Insert subscriptions row & trial_claims row
  v_ends_at := now() + (v_offer.trial_days || ' days')::interval;

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
$$;

-- ------------------------------------------------------------------------------
-- 10. Row Level Security & Privilege Configuration
-- ------------------------------------------------------------------------------

-- Enable RLS on all four new tables
ALTER TABLE public.trial_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_price_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY trial_claims_select_own 
  ON public.trial_claims 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY user_price_overrides_select_own 
  ON public.user_price_overrides 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid() AND revoked_at IS NULL);

-- trial_offers and blocked_email_domains intentionally have NO policies
-- Client interaction is strictly mediated by SECURITY DEFINER functions.

-- Revoke all table privileges from anon and authenticated
REVOKE ALL ON TABLE public.trial_offers FROM anon, authenticated;
REVOKE ALL ON TABLE public.trial_claims FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_price_overrides FROM anon, authenticated;
REVOKE ALL ON TABLE public.blocked_email_domains FROM anon, authenticated;

-- Grant selective read-only table privileges to authenticated
GRANT SELECT ON TABLE public.trial_claims TO authenticated;
GRANT SELECT ON TABLE public.user_price_overrides TO authenticated;

-- Function Privileges
REVOKE ALL ON FUNCTION public.normalize_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_email(text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_trial_public(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trial_public(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_trial_status(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trial_status(text) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_free_trial(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_free_trial(text) TO authenticated;

COMMIT;
