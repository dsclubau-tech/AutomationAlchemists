-- Store-level subscription support (Steps 1-4)
-- Already executed in Supabase SQL Editor on 2026-08-21

-- ================================================
-- Step 1: Update subscriptions table for multi-store
-- ================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS store_id text,
  ADD COLUMN IF NOT EXISTS store_name text,
  ADD COLUMN IF NOT EXISTS max_stores integer DEFAULT 1;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_product_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS 
  subscriptions_user_product_store_unique
  ON public.subscriptions(user_id, product_slug, store_id)
  WHERE store_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
  subscriptions_user_product_no_store_unique  
  ON public.subscriptions(user_id, product_slug)
  WHERE store_id IS NULL;

-- ================================================
-- Step 2: Create stores table
-- ================================================
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  store_name text NOT NULL,
  store_identifier text,
  connected_tools text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, store_name)
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stores"
  ON public.stores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own stores"
  ON public.stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own stores"
  ON public.stores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all stores"
  ON public.stores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- Step 3: Update check_product_subscription RPC for multi-store
-- ================================================
CREATE OR REPLACE FUNCTION 
  public.check_product_subscription(
    p_product_slug text,
    p_store_id text DEFAULT NULL
  )
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_store_count integer;
  v_max_stores integer;
BEGIN
  IF p_store_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'has_access', true,
      'status', s.status,
      'store_id', s.store_id,
      'store_name', s.store_name,
      'current_period_end', s.current_period_end,
      'is_free', false
    ) INTO v_result
    FROM subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.product_slug = p_product_slug
      AND s.store_id = p_store_id
      AND s.status = 'active'
      AND (
        s.current_period_end IS NULL OR 
        s.current_period_end > now()
      )
    LIMIT 1;
    
    RETURN COALESCE(v_result, jsonb_build_object(
      'has_access', false,
      'status', null,
      'store_id', p_store_id,
      'store_name', null,
      'current_period_end', null,
      'is_free', false
    ));
  END IF;

  SELECT jsonb_build_object(
    'has_access', true,
    'status', s.status,
    'store_id', null,
    'current_period_end', s.current_period_end,
    'is_free', t.is_free
  ) INTO v_result
  FROM subscriptions s
  JOIN tools t ON t.slug = s.product_slug
  WHERE s.user_id = auth.uid()
    AND s.product_slug = p_product_slug
    AND s.status = 'active'
    AND (
      s.current_period_end IS NULL OR 
      s.current_period_end > now()
    )
  LIMIT 1;

  IF v_result IS NULL THEN
    SELECT jsonb_build_object(
      'has_access', true,
      'status', 'free',
      'store_id', null,
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
    'store_id', null,
    'current_period_end', null,
    'is_free', false
  ));
END;
$$;

-- ================================================
-- Step 4: Store count function
-- ================================================
CREATE OR REPLACE FUNCTION
  public.get_user_store_count(p_product_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_count integer;
  v_stores jsonb;
BEGIN
  SELECT 
    COUNT(*),
    jsonb_agg(jsonb_build_object(
      'store_id', s.store_id,
      'store_name', s.store_name,
      'status', s.status,
      'current_period_end', s.current_period_end
    ))
  INTO v_active_count, v_stores
  FROM subscriptions s
  WHERE s.user_id = auth.uid()
    AND s.product_slug = p_product_slug
    AND s.status = 'active'
    AND s.store_id IS NOT NULL
    AND (
      s.current_period_end IS NULL OR
      s.current_period_end > now()
    );

  RETURN jsonb_build_object(
    'active_store_count', COALESCE(v_active_count, 0),
    'stores', COALESCE(v_stores, '[]'::jsonb)
  );
END;
$$;
