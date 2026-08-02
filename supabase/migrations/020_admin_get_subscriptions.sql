-- RPC to fetch all subscriptions joined with user emails
CREATE OR REPLACE FUNCTION admin_get_subscriptions()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email varchar,
  product_slug text,
  status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  manually_granted boolean,
  grant_reason text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    s.id, 
    s.user_id,
    u.email::varchar as user_email,
    s.product_slug,
    s.status,
    s.current_period_end,
    s.cancel_at_period_end,
    s.manually_granted,
    s.grant_reason,
    s.created_at
  FROM public.subscriptions s
  JOIN auth.users u ON s.user_id = u.id
  ORDER BY s.created_at DESC;
END;
$$;
