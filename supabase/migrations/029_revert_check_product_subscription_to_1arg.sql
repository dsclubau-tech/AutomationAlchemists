-- Migration 029: Revert check_product_subscription to pure 1-argument signature for rccp

-- 1. Drop the 2-argument store-level signature (confirmed 0 callers)
DROP FUNCTION IF EXISTS public.check_product_subscription(text, text);

-- 2. Recreate the original 1-argument signature for rccp client
CREATE OR REPLACE FUNCTION public.check_product_subscription(p_product_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'has_access', true,
    'status', s.status,
    'current_period_end', s.current_period_end,
    'is_free', t.is_free
  ) INTO v_result
  FROM subscriptions s
  JOIN tools t ON t.slug = s.product_slug
  WHERE s.user_id = auth.uid()
    AND s.product_slug = p_product_slug
    AND s.status = 'active'
    AND (s.current_period_end IS NULL OR s.current_period_end > now())
  LIMIT 1;

  -- Also check if the tool is free (no subscription needed)
  IF v_result IS NULL THEN
    SELECT jsonb_build_object(
      'has_access', true,
      'status', 'free',
      'current_period_end', null,
      'is_free', true
    ) INTO v_result
    FROM tools
    WHERE slug = p_product_slug
      AND is_free = true;
  END IF;

  RETURN COALESCE(v_result, jsonb_build_object(
    'has_access', false,
    'status', null,
    'current_period_end', null,
    'is_free', false
  ));
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_product_subscription(text) TO authenticated, anon;
