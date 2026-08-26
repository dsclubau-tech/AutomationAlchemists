-- ==============================================================================
-- 027_subscription_history_and_expiration.sql
-- 1. Create subscription_history table & trigger-based audit logging
-- 2. Create expire_past_due_subscriptions() & pg_cron schedule
-- 3. Update get_active_subscription_count to filter expired timestamps
-- 4. Update admin_execute_action for renewal & re-granting support
-- ==============================================================================

-- 1. Create subscription_history table
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  product_slug text NOT NULL,
  event_type text NOT NULL, -- 'granted', 'renewed', 'status_changed', 'expired', 'revoked'
  old_status text NULL,
  new_status text NULL,
  old_period_end timestamptz NULL,
  new_period_end timestamptz NULL,
  changed_by_admin_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL indicates system / cron
  changed_by_email text NULL,
  reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user timeline lookups
CREATE INDEX IF NOT EXISTS idx_subscription_history_user 
  ON public.subscription_history (user_id, created_at DESC);

-- Security & RLS on subscription_history
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.subscription_history FROM PUBLIC;
REVOKE ALL ON TABLE public.subscription_history FROM anon;
REVOKE ALL ON TABLE public.subscription_history FROM authenticated;

DROP POLICY IF EXISTS "Admins can view subscription history" ON public.subscription_history;
CREATE POLICY "Admins can view subscription history" 
  ON public.subscription_history 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

GRANT ALL ON TABLE public.subscription_history TO service_role;
GRANT SELECT ON TABLE public.subscription_history TO authenticated;

-- 2. Trigger Function for Subscription History
CREATE OR REPLACE FUNCTION public.log_subscription_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_type text;
  v_admin_id uuid;
  v_admin_email text;
BEGIN
  -- Determine who made the change: auth.uid() if authenticated session, NULL if cron/system
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NOT NULL THEN
    SELECT email INTO v_admin_email FROM auth.users WHERE id = v_admin_id;
  ELSE
    v_admin_email := NULL;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_event_type := 'granted';
    
    INSERT INTO public.subscription_history (
      subscription_id,
      user_id,
      email,
      product_slug,
      event_type,
      old_status,
      new_status,
      old_period_end,
      new_period_end,
      changed_by_admin_id,
      changed_by_email,
      reason,
      created_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.email,
      NEW.product_slug,
      v_event_type,
      NULL,
      NEW.status,
      NULL,
      NEW.current_period_end,
      COALESCE(v_admin_id, NEW.granted_by_admin_id),
      v_admin_email,
      NEW.grant_reason,
      now()
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if status or period_end actually changed
    IF (OLD.status IS NOT DISTINCT FROM NEW.status) AND 
       (OLD.current_period_end IS NOT DISTINCT FROM NEW.current_period_end) THEN
      RETURN NEW;
    END IF;

    -- Determine event type
    IF OLD.status = 'active' AND NEW.status = 'expired' THEN
      v_event_type := 'expired';
      -- For natural expiration, explicitly ensure changed_by is NULL (system action)
      v_admin_id := NULL;
      v_admin_email := NULL;
    ELSIF OLD.status = 'active' AND NEW.status = 'inactive' THEN
      v_event_type := 'revoked';
    ELSIF (OLD.current_period_end IS DISTINCT FROM NEW.current_period_end) AND (NEW.status = 'active') THEN
      v_event_type := 'renewed';
    ELSE
      v_event_type := 'status_changed';
    END IF;

    INSERT INTO public.subscription_history (
      subscription_id,
      user_id,
      email,
      product_slug,
      event_type,
      old_status,
      new_status,
      old_period_end,
      new_period_end,
      changed_by_admin_id,
      changed_by_email,
      reason,
      created_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.email,
      NEW.product_slug,
      v_event_type,
      OLD.status,
      NEW.status,
      OLD.current_period_end,
      NEW.current_period_end,
      v_admin_id,
      v_admin_email,
      CASE WHEN v_event_type = 'expired' THEN 'Natural expiration' ELSE NEW.grant_reason END,
      now()
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscription_history ON public.subscriptions;
CREATE TRIGGER trg_subscription_history
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_subscription_history();

-- 3. Automatic Expiration Function & pg_cron Schedule
CREATE OR REPLACE FUNCTION public.expire_past_due_subscriptions()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND current_period_end IS NOT NULL
    AND current_period_end <= now();
    
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- Schedule via pg_cron every minute if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('expire-past-due-subscriptions');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    
    PERFORM cron.schedule(
      'expire-past-due-subscriptions',
      '* * * * *',
      'SELECT public.expire_past_due_subscriptions()'
    );
    RAISE NOTICE 'Scheduled expire-past-due-subscriptions in pg_cron';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END $$;

-- 4. Update get_active_subscription_count RPC
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
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > now());

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION get_active_subscription_count(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_active_subscription_count(uuid, text) TO authenticated;

-- 5. Update admin_execute_action to support renewals and ON CONFLICT re-granting
CREATE OR REPLACE FUNCTION admin_execute_action(
  p_action_type text,
  p_target_user_id uuid,
  p_target_email text,
  p_payload jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email text;
  v_is_admin boolean;
  v_new_end_date timestamptz;
  v_store_id text;
BEGIN
  -- 1. Verify caller is an admin
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not an admin';
  END IF;

  -- 2. Execute the action
  IF p_action_type = 'extend_subscription' OR p_action_type = 'shorten_subscription' THEN
    v_new_end_date := (p_payload->>'new_date')::timestamptz;
    
    UPDATE public.subscriptions 
    SET current_period_end = v_new_end_date,
        status = CASE 
          WHEN v_new_end_date IS NULL OR v_new_end_date > now() THEN 'active'
          ELSE 'expired'
        END,
        updated_at = now()
    WHERE id = (p_payload->>'subscription_id')::uuid;

  ELSIF p_action_type = 'grant_access' THEN
    v_new_end_date := CASE 
      WHEN p_payload->>'end_date' IS NOT NULL THEN (p_payload->>'end_date')::timestamptz 
      ELSE NULL 
    END;
    v_store_id := NULLIF(p_payload->>'store_id', '');

    IF v_store_id IS NOT NULL THEN
      -- Multi-store upsert
      INSERT INTO public.subscriptions (
        user_id, email, product_slug, status, current_period_end,
        manually_granted, grant_reason, granted_by_admin_id, store_id, store_name, updated_at
      ) VALUES (
        p_target_user_id, p_target_email, p_payload->>'tool_slug', 'active', v_new_end_date,
        true, p_payload->>'reason', auth.uid(), v_store_id, NULLIF(p_payload->>'store_name', ''), now()
      )
      ON CONFLICT (user_id, product_slug, store_id) WHERE store_id IS NOT NULL
      DO UPDATE SET
        status = 'active',
        store_name = EXCLUDED.store_name,
        current_period_end = EXCLUDED.current_period_end,
        manually_granted = true,
        grant_reason = EXCLUDED.grant_reason,
        granted_by_admin_id = EXCLUDED.granted_by_admin_id,
        updated_at = now();
    ELSE
      -- Single-store upsert
      INSERT INTO public.subscriptions (
        user_id, email, product_slug, status, current_period_end,
        manually_granted, grant_reason, granted_by_admin_id, store_id, store_name, updated_at
      ) VALUES (
        p_target_user_id, p_target_email, p_payload->>'tool_slug', 'active', v_new_end_date,
        true, p_payload->>'reason', auth.uid(), NULL, NULL, now()
      )
      ON CONFLICT (user_id, product_slug) WHERE store_id IS NULL
      DO UPDATE SET
        status = 'active',
        current_period_end = EXCLUDED.current_period_end,
        manually_granted = true,
        grant_reason = EXCLUDED.grant_reason,
        granted_by_admin_id = EXCLUDED.granted_by_admin_id,
        updated_at = now();
    END IF;

  ELSIF p_action_type = 'revoke_access' THEN
    UPDATE public.subscriptions 
    SET status = 'inactive',
        updated_at = now()
    WHERE id = (p_payload->>'subscription_id')::uuid;

  ELSIF p_action_type = 'change_tool_status' THEN
    UPDATE public.tools 
    SET 
      status = p_payload->>'status',
      maintenance_message = p_payload->>'maintenance_message',
      price_monthly = (p_payload->>'price')::numeric
    WHERE slug = p_payload->>'tool_slug';

  ELSIF p_action_type = 'edit_profile' THEN
    UPDATE public.profiles
    SET 
      full_name = p_payload->>'full_name',
      phone = p_payload->>'phone'
    WHERE id = p_target_user_id;

  ELSIF p_action_type = 'toggle_admin' THEN
    UPDATE public.profiles
    SET is_admin = (p_payload->>'is_admin')::boolean
    WHERE id = p_target_user_id;

  ELSE
    RAISE EXCEPTION 'Unknown action type: %', p_action_type;
  END IF;

  -- 3. Write to admin_audit_log
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
    p_action_type,
    p_target_user_id,
    p_target_email,
    p_payload
  );

  RETURN true;
END;
$$;

-- 6. RPC to fetch timeline for a specific user
CREATE OR REPLACE FUNCTION admin_get_user_subscription_timeline(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  subscription_id uuid,
  product_slug text,
  event_type text,
  old_status text,
  new_status text,
  old_period_end timestamptz,
  new_period_end timestamptz,
  changed_by_admin_id uuid,
  changed_by_email text,
  reason text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    sh.id,
    sh.subscription_id,
    sh.product_slug,
    sh.event_type,
    sh.old_status,
    sh.new_status,
    sh.old_period_end,
    sh.new_period_end,
    sh.changed_by_admin_id,
    sh.changed_by_email,
    sh.reason,
    sh.created_at
  FROM public.subscription_history sh
  WHERE sh.user_id = p_user_id
  ORDER BY sh.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION admin_get_user_subscription_timeline(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_user_subscription_timeline(uuid) TO authenticated;
