CREATE TABLE IF NOT EXISTS public.tool_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  tool_slug text NOT NULL,
  tool_name text NOT NULL,
  notified boolean DEFAULT false,
  notified_at timestamptz,
  seen_at timestamptz DEFAULT null,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_slug)
);

ALTER TABLE public.tool_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users view own notifications"
  ON public.tool_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own (sign up for notify)
CREATE POLICY "Users can sign up for notifications"
  ON public.tool_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own (unsubscribe)
CREATE POLICY "Users can unsubscribe"
  ON public.tool_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own (mark as seen)
CREATE POLICY "Users can update own notifications"
  ON public.tool_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all notifications
CREATE POLICY "Admins view all notifications"
  ON public.tool_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update all notifications (to mark as notified)
CREATE POLICY "Admins update all notifications"
  ON public.tool_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add notification preference columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'notify_product_launches') THEN
    ALTER TABLE public.profiles ADD COLUMN notify_product_launches boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'notify_account_activity') THEN
    ALTER TABLE public.profiles ADD COLUMN notify_account_activity boolean DEFAULT true;
  END IF;
END $$;
