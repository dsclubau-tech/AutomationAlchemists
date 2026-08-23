CREATE OR REPLACE FUNCTION get_active_subscription_count(
  p_user_id uuid,
  p_product_slug text
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin boolean;
  v_count int;
BEGIN
  -- Reject unauthenticated callers explicitly — don't rely only on grants
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: authentication required';
  END IF;

  IF auth.uid() != p_user_id THEN
    SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
    IF v_is_admin IS NOT TRUE THEN
      RAISE EXCEPTION 'Unauthorized: Cannot view subscriptions for another user';
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND product_slug = p_product_slug
    AND status = 'active';

  RETURN v_count;
END;
$$;

-- Explicitly close the default PUBLIC grant, then open only what's needed
REVOKE ALL ON FUNCTION get_active_subscription_count(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_active_subscription_count(uuid, text) TO authenticated;
