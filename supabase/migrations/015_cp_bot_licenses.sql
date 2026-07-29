CREATE TABLE IF NOT EXISTS public.cp_bot_licenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.cp_bot_licenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own licenses" 
    ON public.cp_bot_licenses 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all licenses" 
    ON public.cp_bot_licenses 
    FOR ALL 
    USING (has_role('admin', auth.uid()));

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cp_bot_licenses_modtime
    BEFORE UPDATE ON public.cp_bot_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
