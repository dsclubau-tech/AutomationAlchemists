-- RPC: Check if the current user has an active subscription for a given product
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

-- Ensure users can read their own subscriptions (needed for CP Bot direct queries)
-- Using DO block to avoid error if policy already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND policyname = 'Users can read own subscriptions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;
