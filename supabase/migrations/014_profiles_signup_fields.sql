-- Add signup fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS referral_source TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Update the handle_new_user trigger function to pass through new metadata fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, country, phone, referral_source, terms_accepted, terms_accepted_at)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'referral_source',
    COALESCE((new.raw_user_meta_data->>'terms_accepted')::boolean, false),
    CASE
      WHEN (new.raw_user_meta_data->>'terms_accepted')::boolean = true THEN NOW()
      ELSE NULL
    END
  );
  RETURN new;
END;
$$;
