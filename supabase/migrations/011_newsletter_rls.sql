-- Migration: Newsletter Subscribers RLS

-- Create newsletter_subscribers table if it does not exist (just in case)
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
    ON public.newsletter_subscribers
    FOR INSERT
    WITH CHECK (true);

-- Allow admins to view subscribers
CREATE POLICY "Admins can view newsletter subscribers"
    ON public.newsletter_subscribers
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete subscribers
CREATE POLICY "Admins can delete newsletter subscribers"
    ON public.newsletter_subscribers
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update subscribers (e.g., deactivate)
CREATE POLICY "Admins can update newsletter subscribers"
    ON public.newsletter_subscribers
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role));
