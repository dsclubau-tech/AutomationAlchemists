CREATE OR REPLACE FUNCTION admin_delete_user(
  p_target_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- 1. Verify caller is an admin
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not an admin';
  END IF;

  -- 2. Execute deletes in a single transaction
  -- The PL/pgSQL block automatically runs in a transaction.
  -- If any statement fails, the entire block is rolled back.
  
  -- Delete from stores (to prevent leftover data if applicable)
  DELETE FROM public.stores WHERE user_id = p_target_user_id;

  -- Delete from subscriptions
  DELETE FROM public.subscriptions WHERE user_id = p_target_user_id;

  -- Delete from profiles
  DELETE FROM public.profiles WHERE id = p_target_user_id;

  -- Note: auth.users deletion must happen via GoTrue admin API in the edge function
END;
$$;
