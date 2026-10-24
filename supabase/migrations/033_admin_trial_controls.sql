-- ==============================================================================
-- Migration 033: Admin Controls for Free Trials and Price Overrides (Part D)
-- ==============================================================================
-- This migration provides SECURITY DEFINER administrative RPCs for managing:
-- 1. Free Trial Offers (configuration, slot caps, reserved slots, enable toggles)
-- 2. Free Trial Claims (listing, extending, revoking, resetting for test accounts)
-- 3. Blocked Email Domains (listing, adding, removing)
-- 4. User Price Overrides (listing, creating, revoking per-user discounts)
--
-- Security Invariants:
-- - All functions are SECURITY DEFINER with fixed search_path = public, pg_temp.
-- - Every function verifies that auth.uid() is an active administrator in public.profiles.
-- - Execution privileges revoked from PUBLIC, anon, and authenticated; granted
--   strictly to authenticated (under admin guard).
-- - Non-admins calling any of these RPCs immediately fail with error 'not_admin' (42501).
-- - Mutating actions append an immutable entry to public.admin_audit_log.
-- - Wrapped in a single idempotent transaction with lock and statement timeouts.
-- ==============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- ------------------------------------------------------------------------------
-- 1. admin_trial_get_offer(p_tool_slug text) -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_trial_get_offer(p_tool_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_offer record;
  v_claims_count int;
  v_slots_taken int;
  v_slots_left int;
BEGIN
  -- Admin guard
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501';
  END IF;

  IF p_tool_slug IS NULL OR trim(p_tool_slug) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slug_required');
  END IF;

  SELECT * INTO v_offer
  FROM public.trial_offers
  WHERE tool_slug = trim(p_tool_slug);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'offer_not_found');
  END IF;

  SELECT COUNT(*) INTO v_claims_count
  FROM public.trial_claims
  WHERE tool_slug = v_offer.tool_slug;

  v_slots_taken := v_offer.slots_reserved + v_claims_count;
  v_slots_left := GREATEST(v_offer.slot_cap - v_slots_taken, 0);

  RETURN jsonb_build_object(
    'ok', true,
    'offer', jsonb_build_object(
      'tool_slug', v_offer.tool_slug,
      'access_slug', v_offer.access_slug,
      'enabled', v_offer.enabled,
      'trial_days', v_offer.trial_days,
      'slot_cap', v_offer.slot_cap,
      'slots_reserved', v_offer.slots_reserved,
      'require_confirmed_email', v_offer.require_confirmed_email,
      'updated_at', v_offer.updated_at,
      'updated_by', v_offer.updated_by,
      'claims_count', v_claims_count,
      'slots_taken', v_slots_taken,
      'slots_left', v_slots_left
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_trial_get_offer(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_trial_get_offer(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. admin_trial_update_offer(...) -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_trial_update_offer(
  p_tool_slug text,
  p_enabled boolean,
  p_trial_days int,
  p_slot_cap int,
  p_slots_reserved int,
  p_require_confirmed_email boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email text;
  v_claims_count int;
  v_min_cap int;
  v_updated record;
BEGIN
  -- Admin guard
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501';
  END IF;

  IF p_tool_slug IS NULL OR trim(p_tool_slug) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slug_required');
  END IF;

  -- Input validations
  IF p_trial_days IS NULL OR p_trial_days < 1 OR p_trial_days > 90 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_trial_days', 'message', 'Trial days must be between 1 and 90');
  END IF;

  IF p_slot_cap IS NULL OR p_slot_cap < 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_slot_cap', 'message', 'Slot cap must be greater than or equal to 0');
  END IF;

  IF p_slots_reserved IS NULL OR p_slots_reserved < 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_slots_reserved', 'message', 'Slots reserved must be greater than or equal to 0');
  END IF;

  -- Capacity check against existing claims + reserved
  SELECT COUNT(*) INTO v_claims_count
  FROM public.trial_claims
  WHERE tool_slug = trim(p_tool_slug);

  v_min_cap := p_slots_reserved + v_claims_count;
  IF p_slot_cap < v_min_cap THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'cap_below_taken',
      'message', 'Slot cap cannot be less than reserved slots (' || p_slots_reserved || ') plus existing claims (' || v_claims_count || ')',
      'min_cap', v_min_cap
    );
  END IF;

  UPDATE public.trial_offers
  SET
    enabled = COALESCE(p_enabled, false),
    trial_days = p_trial_days,
    slot_cap = p_slot_cap,
    slots_reserved = p_slots_reserved,
    require_confirmed_email = COALESCE(p_require_confirmed_email, false),
    updated_at = now(),
    updated_by = auth.uid()
  WHERE tool_slug = trim(p_tool_slug)
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'offer_not_found');
  END IF;

  -- Audit log entry
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
    'admin_trial_update_offer',
    NULL,
    NULL,
    jsonb_build_object(
      'tool_slug', p_tool_slug,
      'enabled', p_enabled,
      'trial_days', p_trial_days,
      'slot_cap', p_slot_cap,
      'slots_reserved', p_slots_reserved,
      'require_confirmed_email', p_require_confirmed_email
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'offer', jsonb_build_object(
      'tool_slug', v_updated.tool_slug,
      'access_slug', v_updated.access_slug,
      'enabled', v_updated.enabled,
      'trial_days', v_updated.trial_days,
      'slot_cap', v_updated.slot_cap,
      'slots_reserved', v_updated.slots_reserved,
      'require_confirmed_email', v_updated.require_confirmed_email,
      'updated_at', v_updated.updated_at,
      'updated_by', v_updated.updated_by,
      'claims_count', v_claims_count,
      'slots_taken', v_min_cap,
      'slots_left', GREATEST(v_updated.slot_cap - v_min_cap, 0)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_trial_update_offer(text, boolean, int, int, int, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_trial_update_offer(text, boolean, int, int, int, boolean) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. admin_trial_list_claims(p_tool_slug text, p_search text, p_limit int, p_offset int) -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_trial_list_claims(
  p_tool_slug text DEFAULT 'rccp',
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit int;
  v_offset int;
  v_search_pattern text;
  v_claims jsonb;
  v_total int;
BEGIN
  -- Admin guard
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_offset := GREATEST(COALESCE(p_offset, 0), 0);

  IF p_search IS NOT NULL AND trim(p_search) <> '' THEN
    v_search_pattern := '%' || replace(replace(replace(lower(trim(p_search)), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  -- Compute total matching count
  SELECT COUNT(*) INTO v_total
  FROM public.trial_claims c
  LEFT JOIN auth.users u ON u.id = c.user_id
  WHERE (p_tool_slug IS NULL OR p_tool_slug = '' OR c.tool_slug = trim(p_tool_slug))
    AND (v_search_pattern IS NULL OR (c.email_normalized ILIKE v_search_pattern OR COALESCE(u.email, '') ILIKE v_search_pattern));

  -- Query claims with calculated status
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'tool_slug', q.tool_slug,
        'user_id', q.user_id,
        'email', COALESCE(q.user_email, q.email_normalized),
        'email_normalized', q.email_normalized,
        'claimed_at', q.claimed_at,
        'ends_at', q.trial_ends_at,
        'converted_at', q.converted_at,
        'revoked_at', q.revoked_at,
        'revoked_reason', q.revoked_reason,
        'subscription_id', q.subscription_id,
        'is_trial', COALESCE(q.sub_is_trial, true),
        'status', q.computed_status
      )
      ORDER BY q.claimed_at DESC
    ),
    '[]'::jsonb
  ) INTO v_claims
  FROM (
    SELECT
      c.id,
      c.tool_slug,
      c.user_id,
      u.email AS user_email,
      c.email_normalized,
      c.claimed_at,
      c.trial_ends_at,
      c.converted_at,
      c.revoked_at,
      c.revoked_reason,
      c.subscription_id,
      s.is_trial AS sub_is_trial,
      CASE
        WHEN c.revoked_at IS NOT NULL THEN 'revoked'
        WHEN c.converted_at IS NOT NULL THEN 'converted'
        WHEN s.id IS NOT NULL AND s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > now()) THEN 'active'
        ELSE 'expired'
      END AS computed_status
    FROM public.trial_claims c
    LEFT JOIN auth.users u ON u.id = c.user_id
    LEFT JOIN public.subscriptions s ON s.id = c.subscription_id
    WHERE (p_tool_slug IS NULL OR p_tool_slug = '' OR c.tool_slug = trim(p_tool_slug))
      AND (v_search_pattern IS NULL OR (c.email_normalized ILIKE v_search_pattern OR COALESCE(u.email, '') ILIKE v_search_pattern))
    ORDER BY c.claimed_at DESC
    LIMIT v_limit OFFSET v_offset
  ) q;

  RETURN jsonb_build_object(
    'ok', true,
    'claims', v_claims,
    'total_count', v_total,
    'limit', v_limit,
    'offset', v_offset
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_trial_list_claims(text, text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_trial_list_claims(text, text, int, int) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. admin_trial_extend(p_claim_id uuid, p_days int) -> jsonb
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

REVOKE ALL ON FUNCTION public.admin_trial_extend(uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_trial_extend(uuid, int) TO authenticated;

-- ------------------------------------------------------------------------------
-- 5. admin_trial_revoke(p_claim_id uuid) -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_trial_revoke(p_claim_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email text;
  v_claim record;
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

  SELECT c.*, s.is_trial
  INTO v_claim
  FROM public.trial_claims c
  LEFT JOIN public.subscriptions s ON s.id = c.subscription_id
  WHERE c.id = p_claim_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'claim_not_found');
  END IF;

  IF v_claim.converted_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'converted', 'message', 'Cannot revoke a converted subscription');
  END IF;

  IF v_claim.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_revoked', 'message', 'Claim is already revoked');
  END IF;

  -- Mark claim revoked
  UPDATE public.trial_claims
  SET
    revoked_at = now(),
    revoked_reason = 'Revoked by admin'
  WHERE id = p_claim_id;

  -- Set subscription to canceled with current_period_end = now()
  IF v_claim.subscription_id IS NOT NULL AND v_claim.is_trial IS TRUE THEN
    UPDATE public.subscriptions
    SET
      status = 'canceled',
      current_period_end = now(),
      updated_at = now()
    WHERE id = v_claim.subscription_id
      AND is_trial = true;
  END IF;

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
    'admin_trial_revoke',
    v_claim.user_id,
    v_claim.email_normalized,
    jsonb_build_object(
      'claim_id', p_claim_id,
      'subscription_id', v_claim.subscription_id
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_trial_revoke(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_trial_revoke(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. admin_trial_reset_claim(p_claim_id uuid) -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_trial_reset_claim(p_claim_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email text;
  v_claim record;
  v_sub record;
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

  SELECT * INTO v_claim
  FROM public.trial_claims
  WHERE id = p_claim_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'claim_not_found');
  END IF;

  -- Refuse if converted
  IF v_claim.converted_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'converted', 'message', 'Cannot reset a converted claim');
  END IF;

  -- Inspect subscription row if linked
  IF v_claim.subscription_id IS NOT NULL THEN
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = v_claim.subscription_id;

    IF FOUND AND v_sub.is_trial IS NOT TRUE THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_trial_subscription', 'message', 'Refusing to reset: linked subscription is not a trial');
    END IF;

    -- Delete trial subscription row
    DELETE FROM public.subscriptions
    WHERE id = v_claim.subscription_id
      AND is_trial = true;
  END IF;

  -- Delete claim record so normalized email and user can claim again
  DELETE FROM public.trial_claims
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
    'admin_trial_reset_claim',
    v_claim.user_id,
    v_claim.email_normalized,
    jsonb_build_object(
      'claim_id', p_claim_id,
      'email_normalized', v_claim.email_normalized,
      'subscription_id', v_claim.subscription_id
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_trial_reset_claim(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_trial_reset_claim(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 7. admin_blocked_domains_list() -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_blocked_domains_list()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_domains jsonb;
BEGIN
  -- Admin guard
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'domain', domain,
        'created_at', created_at
      )
      ORDER BY domain ASC
    ),
    '[]'::jsonb
  ) INTO v_domains
  FROM public.blocked_email_domains;

  RETURN jsonb_build_object('ok', true, 'domains', v_domains);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_blocked_domains_list() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_blocked_domains_list() TO authenticated;

-- ------------------------------------------------------------------------------
-- 8. admin_blocked_domain_add(p_domain text) -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_blocked_domain_add(p_domain text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email text;
  v_domain text;
BEGIN
  -- Admin guard
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501';
  END IF;

  v_domain := lower(trim(p_domain));

  IF v_domain IS NULL OR v_domain = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'domain_required');
  END IF;

  IF length(v_domain) > 253 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'domain_too_long', 'message', 'Domain name cannot exceed 253 characters');
  END IF;

  -- Validate hostname regex
  IF v_domain !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_hostname', 'message', 'Invalid domain name format');
  END IF;

  -- Idempotent insertion
  INSERT INTO public.blocked_email_domains (domain, created_at)
  VALUES (v_domain, now())
  ON CONFLICT (domain) DO NOTHING;

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
    'admin_blocked_domain_add',
    NULL,
    NULL,
    jsonb_build_object('domain', v_domain)
  );

  RETURN jsonb_build_object('ok', true, 'domain', v_domain);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_blocked_domain_add(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_blocked_domain_add(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 9. admin_blocked_domain_remove(p_domain text) -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_blocked_domain_remove(p_domain text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email text;
  v_domain text;
BEGIN
  -- Admin guard
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501';
  END IF;

  v_domain := lower(trim(p_domain));

  IF v_domain IS NULL OR v_domain = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'domain_required');
  END IF;

  DELETE FROM public.blocked_email_domains
  WHERE domain = v_domain;

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
    'admin_blocked_domain_remove',
    NULL,
    NULL,
    jsonb_build_object('domain', v_domain)
  );

  RETURN jsonb_build_object('ok', true, 'domain', v_domain);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_blocked_domain_remove(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_blocked_domain_remove(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 10. admin_price_overrides_list(p_tool_slug text) -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_price_overrides_list(p_tool_slug text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_overrides jsonb;
BEGIN
  -- Admin guard
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'user_id', o.user_id,
        'email', u.email,
        'tool_slug', o.tool_slug,
        'kind', o.kind,
        'amount_cents', o.amount_cents,
        'percent_off', o.percent_off,
        'currency', o.currency,
        'starts_at', o.starts_at,
        'ends_at', o.ends_at,
        'note', o.note,
        'created_by', o.created_by,
        'created_at', o.created_at,
        'revoked_at', o.revoked_at,
        'is_active', (o.revoked_at IS NULL AND o.starts_at <= now() AND (o.ends_at IS NULL OR o.ends_at > now()))
      )
      ORDER BY o.starts_at DESC
    ),
    '[]'::jsonb
  ) INTO v_overrides
  FROM public.user_price_overrides o
  JOIN auth.users u ON u.id = o.user_id
  WHERE (p_tool_slug IS NULL OR p_tool_slug = '' OR o.tool_slug = trim(p_tool_slug));

  RETURN jsonb_build_object('ok', true, 'overrides', v_overrides);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_price_overrides_list(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_price_overrides_list(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 11. admin_price_override_create(...) -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_price_override_create(
  p_user_email text,
  p_tool_slug text,
  p_kind text,
  p_amount_cents int DEFAULT NULL,
  p_percent_off numeric DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email text;
  v_user_id uuid;
  v_target_email text;
  v_tool_slug text;
  v_kind text;
  v_amount_cents int;
  v_percent_off numeric;
  v_override_id uuid;
BEGIN
  -- Admin guard
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501';
  END IF;

  IF p_user_email IS NULL OR trim(p_user_email) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email_required');
  END IF;

  IF p_tool_slug IS NULL OR trim(p_tool_slug) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'slug_required');
  END IF;

  v_target_email := lower(trim(p_user_email));
  v_tool_slug := trim(p_tool_slug);
  v_kind := lower(trim(p_kind));

  -- User lookup by email in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = v_target_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'user_not_found',
      'message', 'User with email "' || p_user_email || '" not found'
    );
  END IF;

  -- Validate kind
  IF v_kind NOT IN ('fixed_price', 'percent_off') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_kind', 'message', 'Kind must be either fixed_price or percent_off');
  END IF;

  -- Validate amounts according to table CHECK constraints
  IF v_kind = 'fixed_price' THEN
    IF p_amount_cents IS NULL OR p_amount_cents < 50 THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'amount_too_low',
        'message', 'Fixed price amount must be at least 50 cents AUD'
      );
    END IF;
    v_amount_cents := p_amount_cents;
    v_percent_off := NULL;
  ELSIF v_kind = 'percent_off' THEN
    IF p_percent_off IS NULL OR p_percent_off <= 0 OR p_percent_off > 100 THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'invalid_percent',
        'message', 'Percent off must be greater than 0 and less than or equal to 100'
      );
    END IF;
    v_amount_cents := NULL;
    v_percent_off := p_percent_off;
  END IF;

  -- Validate end date
  IF p_ends_at IS NOT NULL AND p_ends_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_ends_at', 'message', 'End date must be in the future');
  END IF;

  -- Check partial unique index constraint (one active unrevoked override per user + tool)
  IF EXISTS (
    SELECT 1 FROM public.user_price_overrides
    WHERE user_id = v_user_id
      AND tool_slug = v_tool_slug
      AND revoked_at IS NULL
      AND (ends_at IS NULL OR ends_at > now())
  ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'override_exists',
      'message', 'An active override already exists for this user and tool'
    );
  END IF;

  INSERT INTO public.user_price_overrides (
    user_id,
    tool_slug,
    kind,
    amount_cents,
    percent_off,
    currency,
    starts_at,
    ends_at,
    note,
    created_by
  ) VALUES (
    v_user_id,
    v_tool_slug,
    v_kind,
    v_amount_cents,
    v_percent_off,
    'aud',
    now(),
    p_ends_at,
    trim(p_note),
    auth.uid()
  ) RETURNING id INTO v_override_id;

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
    'admin_price_override_create',
    v_user_id,
    v_target_email,
    jsonb_build_object(
      'override_id', v_override_id,
      'tool_slug', v_tool_slug,
      'kind', v_kind,
      'amount_cents', v_amount_cents,
      'percent_off', v_percent_off,
      'ends_at', p_ends_at,
      'note', p_note
    )
  );

  RETURN jsonb_build_object('ok', true, 'override_id', v_override_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_price_override_create(text, text, text, int, numeric, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_price_override_create(text, text, text, int, numeric, timestamptz, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 12. admin_price_override_revoke(p_override_id uuid) -> jsonb
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_price_override_revoke(p_override_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email text;
  v_override record;
  v_target_email text;
BEGIN
  -- Admin guard
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501';
  END IF;

  IF p_override_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'override_id_required');
  END IF;

  SELECT * INTO v_override
  FROM public.user_price_overrides
  WHERE id = p_override_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'override_not_found');
  END IF;

  IF v_override.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_revoked', 'message', 'Override is already revoked');
  END IF;

  UPDATE public.user_price_overrides
  SET revoked_at = now()
  WHERE id = p_override_id;

  SELECT email INTO v_target_email FROM auth.users WHERE id = v_override.user_id;

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
    'admin_price_override_revoke',
    v_override.user_id,
    v_target_email,
    jsonb_build_object(
      'override_id', p_override_id,
      'tool_slug', v_override.tool_slug
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_price_override_revoke(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_price_override_revoke(uuid) TO authenticated;

COMMIT;
