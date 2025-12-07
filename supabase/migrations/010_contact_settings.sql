-- Admin Contact Management Migration
-- Create site_settings table for editable contact info

-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (public info)
CREATE POLICY "Anyone can read site settings"
    ON public.site_settings FOR SELECT
    USING (true);

-- Only admins can insert site settings
CREATE POLICY "Admins can insert site settings"
    ON public.site_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Only admins can update site settings
CREATE POLICY "Admins can update site settings"
    ON public.site_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Only admins can delete site settings
CREATE POLICY "Admins can delete site settings"
    ON public.site_settings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Insert default contact settings
INSERT INTO public.site_settings (key, value) VALUES
    ('contact_address', '{"line1": "3/33-37 Warialda St", "line2": "Kogarah NSW 2217"}'),
    ('contact_email', '"dsclub.au@outlook.com"'),
    ('contact_phone', '"+61 404 242 373"'),
    ('business_hours', '{"weekdays": "Monday - Friday: 9:00 AM - 6:00 PM AEST", "saturday": "Saturday: 10:00 AM - 4:00 PM AEST", "sunday": "Sunday: Closed", "enterprise": "24/7 Support for Enterprise Clients"}')
ON CONFLICT (key) DO NOTHING;

-- Admin policies for contacts table (UPDATE and DELETE)
CREATE POLICY "Admins can update contacts"
    ON public.contacts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete contacts"
    ON public.contacts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Add status column to contacts for tracking
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived'));

-- Add use_case and team_size columns if they don't exist
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS use_case TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS team_size TEXT;

-- Create updated_at trigger for site_settings
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_site_settings_updated_at();
