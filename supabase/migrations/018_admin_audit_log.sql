CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES auth.users(id),
  admin_email text,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  target_email text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can select audit logs" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Only service role and the SECURITY DEFINER RPC can INSERT. 
-- No public INSERT policy needed.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS manually_granted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS grant_reason text,
  ADD COLUMN IF NOT EXISTS granted_by_admin_id uuid REFERENCES auth.users(id);

-- RPC for secure standard actions
CREATE OR REPLACE FUNCTION admin_execute_action(
  p_action_type text,
  p_target_user_id uuid,
  p_target_email text,
  p_payload jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email text;
  v_is_admin boolean;
BEGIN
  -- 1. Verify caller is an admin
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not an admin';
  END IF;

  -- 2. Execute the action
  IF p_action_type = 'extend_subscription' OR p_action_type = 'shorten_subscription' THEN
    UPDATE public.subscriptions 
    SET current_period_end = (p_payload->>'new_date')::timestamptz 
    WHERE id = (p_payload->>'subscription_id')::uuid;

  ELSIF p_action_type = 'grant_access' THEN
    INSERT INTO public.subscriptions (
      user_id, 
      product_slug, 
      status, 
      current_period_end, 
      manually_granted, 
      grant_reason, 
      granted_by_admin_id
    ) VALUES (
      p_target_user_id,
      p_payload->>'tool_slug',
      'active',
      CASE 
        WHEN p_payload->>'end_date' IS NOT NULL THEN (p_payload->>'end_date')::timestamptz 
        ELSE NULL 
      END,
      true,
      p_payload->>'reason',
      auth.uid()
    );

  ELSIF p_action_type = 'revoke_access' THEN
    UPDATE public.subscriptions 
    SET status = 'inactive'
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

  -- 3. Write to audit log
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
