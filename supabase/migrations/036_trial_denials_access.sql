-- ==============================================================================
-- Migration 036: Safe Authenticated Access for Trial Denials
-- 
-- 1. Permits authenticated users to read their own trial denial records via RLS.
--    Eliminates HTTP 403 Forbidden on public.trial_denials queries.
-- 2. Provides public.get_card_denial_count(p_tool_slug) SECURITY DEFINER RPC.
-- 3. Updates public.get_trial_status(p_tool_slug) to include card_denial_count
--    in the returned JSON payload, removing any need for separate client table queries.
--
-- NOTE: In accordance with standing rules, this file is created for manual review
-- and execution by the project owner. DO NOT APPLY AUTOMATICALLY.
-- ==============================================================================

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- 1. Grant SELECT privilege and RLS policy on public.trial_denials to authenticated
GRANT SELECT ON TABLE public.trial_denials TO authenticated;

DROP POLICY IF EXISTS "Users can view own trial denials" ON public.trial_denials;
CREATE POLICY "Users can view own trial denials"
  ON public.trial_denials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Standalone helper function: public.get_card_denial_count
CREATE OR REPLACE FUNCTION public.get_card_denial_count(p_tool_slug text DEFAULT 'rccp')
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::integer INTO v_count
  FROM public.trial_denials
  WHERE user_id = auth.uid()
    AND (tool_slug = p_tool_slug OR tool_slug IS NULL)
    AND reason = 'card_already_used';

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_card_denial_count(text) TO authenticated;

-- 3. Update public.get_trial_status to include card_denial_count
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
  v_card_denial_count int := 0;
BEGIN
  -- 1. Must be signed in
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'not_signed_in',
      'denied_reason', null,
      'card_denial_count', 0
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
      'denied_reason', null,
      'card_denial_count', 0
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

  -- Count caller's card denials for this tool
  SELECT COUNT(*)::integer INTO v_card_denial_count
  FROM public.trial_denials
  WHERE user_id = auth.uid()
    AND (tool_slug = p_tool_slug OR tool_slug IS NULL)
    AND reason = 'card_already_used';

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
      'denied_reason', v_denied_reason,
      'card_denial_count', COALESCE(v_card_denial_count, 0)
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
    'denied_reason', v_denied_reason,
    'card_denial_count', COALESCE(v_card_denial_count, 0)
  );
END;
$$;
