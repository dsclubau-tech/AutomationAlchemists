ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Set dsclub.au@gmail.com as admin
UPDATE public.profiles 
SET is_admin = true 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'dsclub.au@gmail.com'
);

-- Add Admin Policies to public.tools (created in 016)
CREATE POLICY "Admins can insert tools" ON public.tools
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update tools" ON public.tools
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete tools" ON public.tools
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
