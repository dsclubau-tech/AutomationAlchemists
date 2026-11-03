-- ==============================================================================
-- Migration 035: Trial Uniqueness by Email and Card Only (Phone No Longer Blocks)
-- ==============================================================================
-- Design & Policy Updates:
-- 1. Free trial eligibility is limited per normalized email (trial_claims.email_normalized)
--    and per card fingerprint (trial_identities kind = 'card') ONLY.
-- 2. Phone numbers no longer block, deny, or lock trial access.
-- 3. No new kind = 'phone' rows are written to public.trial_identities.
-- 4. Existing kind = 'phone' rows in public.trial_identities remain intact for historical
--    audit purposes and are ignored by eligibility and claim finalization logic.
-- 5. Stored function public.finalize_card_trial preserves p_phone_hash parameter for safe
--    backward compatibility with edge function callers, but completely ignores its value.
-- 6. PENDING MANUAL EXECUTION: This migration is NOT auto-applied. The owner will apply it
--    manually in the Supabase SQL editor.
-- ==============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ------------------------------------------------------------------------------
-- 1. Stored Function: public.finalize_card_trial (Card & Email Only)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_card_trial(
  p_user_id uuid,
  p_tool_slug text,
  p_email text,
  p_card_fingerprint text,
  p_phone_hash text DEFAULT NULL,
  p_trial_end timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_card_fp text;
  v_existing_claim record;
  v_has_card boolean;
  v_eligibility jsonb;
  v_reason text;
  v_existing_card_user uuid;
  v_raw_email text;
  v_norm_email text;
  v_claim_id uuid;
BEGIN
  v_card_fp := trim(COALESCE(p_card_fingerprint, ''));

  -- Check required card fingerprint upfront
  IF v_card_fp = '' THEN
    INSERT INTO public.trial_denials (user_id, tool_slug, reason)
    VALUES (p_user_id, p_tool_slug, 'card_missing');
    RETURN jsonb_build_object('ok', false, 'reason', 'card_missing');
  END IF;

  -- NOTE: Phone number verification is intentionally omitted. Phone numbers no longer block or deny.

  -- Idempotency check: if caller already has a trial_claim for this tool
  SELECT id, trial_ends_at INTO v_existing_claim
  FROM public.trial_claims
  WHERE user_id = p_user_id
    AND tool_slug = p_tool_slug
  LIMIT 1;

  IF FOUND THEN
    -- Check if existing registered card identity matches the retrying credentials
    SELECT EXISTS (
      SELECT 1 FROM public.trial_identities
      WHERE tool_slug = p_tool_slug AND kind = 'card' AND value_hash = v_card_fp AND user_id = p_user_id
    ) INTO v_has_card;

    IF v_has_card THEN
      -- Same user retrying with identical card: return existing claim idempotently
      RETURN jsonb_build_object('ok', true, 'claim_id', v_existing_claim.id);
    ELSE
      -- User already claimed, but attempted with non-matching card
      INSERT INTO public.trial_denials (user_id, tool_slug, reason)
      VALUES (p_user_id, p_tool_slug, 'already_claimed');
      RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
    END IF;
  END IF;

  -- Re-run eligibility in this transaction (validates user, normalized email uniqueness, disposable domain)
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

  -- Register ONLY card identity (NO phone rows are written)
  INSERT INTO public.trial_identities (tool_slug, kind, value_hash, user_id)
  VALUES (p_tool_slug, 'card', v_card_fp, p_user_id)
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
END;
$$;

-- Preserve permissions: only service_role may execute finalize_card_trial
REVOKE ALL ON FUNCTION public.finalize_card_trial(uuid, text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_card_trial(uuid, text, text, text, text, timestamptz) TO service_role;

COMMIT;
