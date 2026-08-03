-- ================================================
-- MIGRATION 6: Pricing Packages
-- ================================================

-- Create pricing_packages table for dynamic pricing management
CREATE TABLE public.pricing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price TEXT NOT NULL DEFAULT 'Custom',
  description TEXT NOT NULL,
  short_description TEXT,
  features TEXT[] DEFAULT '{}',
  icon TEXT NOT NULL DEFAULT 'Star',
  badge TEXT,
  badge_color TEXT DEFAULT 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  cta_text TEXT DEFAULT 'Get Started',
  is_popular BOOLEAN DEFAULT false,
  discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active pricing packages
CREATE POLICY "Anyone can view active pricing packages"
ON public.pricing_packages
FOR SELECT
USING (is_active = true);

-- Admins can view all packages (including inactive)
CREATE POLICY "Admins can view all packages"
ON public.pricing_packages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all packages
CREATE POLICY "Admins can manage pricing packages"
ON public.pricing_packages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for ordering
CREATE INDEX idx_pricing_packages_order ON public.pricing_packages(display_order, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_pricing_packages_updated_at
BEFORE UPDATE ON public.pricing_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pricing packages (same as current hardcoded ones)
INSERT INTO public.pricing_packages (name, price, description, short_description, features, icon, badge, badge_color, cta_text, is_popular, display_order) VALUES
(
  'Starter',
  'Custom',
  'Perfect for MVPs and proof of concepts. Get your idea off the ground quickly.',
  'Perfect for MVPs and proof of concepts.',
  ARRAY['Single app development', 'Basic automation setup', '2 weeks delivery', '1 month support', 'Source code included'],
  'Star',
  'Entry Level',
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'Get Started',
  false,
  1
),
(
  'Professional',
  'Custom',
  'For businesses ready to scale. Comprehensive solutions for growing needs.',
  'For businesses ready to scale.',
  ARRAY['Full-stack application', 'Advanced automation', 'Virtual assistant integration', '4 weeks delivery', '3 months support', 'Priority updates', 'Analytics dashboard'],
  'Zap',
  'Most Popular',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  'Most Popular',
  true,
  2
),
(
  'Enterprise',
  'Custom',
  'Complete digital transformation. Tailored for large-scale operations.',
  'Complete digital transformation.',
  ARRAY['Multiple applications', 'Custom workflow automation', '24/7 virtual assistants', 'Flexible timeline', '12 months support', 'Dedicated team', 'White-label options', 'API integrations'],
  'Shield',
  'Enterprise',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  'Contact Sales',
  false,
  3
);

-- ================================================
-- DONE! Pricing packages table created.
-- ================================================
-- Add new fields to services table for detailed service pages

-- Add slug for URL-friendly paths
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add detailed content for the full service description page
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS detailed_content TEXT;

-- Add short description for card display
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Add images array for gallery
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add video URL
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add display order for sorting
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add is_active for draft/published state
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing services with slugs based on title
UPDATE public.services 
SET slug = LOWER(REPLACE(REPLACE(title, ' ', '-'), '&', 'and'))
WHERE slug IS NULL;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_services_order ON public.services(display_order, created_at DESC);
-- Migration: Learn Content System
-- Creates tables for learn categories and articles with blog-style content

-- Create learn_categories table
CREATE TABLE IF NOT EXISTS public.learn_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT 'BookOpen',
    color TEXT DEFAULT 'from-blue-500 to-purple-600',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learn_articles table
CREATE TABLE IF NOT EXISTS public.learn_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.learn_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT,
    featured_image TEXT,
    video_url TEXT,
    images TEXT[] DEFAULT '{}',
    author TEXT,
    read_time TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learn_categories_slug ON public.learn_categories(slug);
CREATE INDEX IF NOT EXISTS idx_learn_categories_display_order ON public.learn_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_learn_articles_slug ON public.learn_articles(slug);
CREATE INDEX IF NOT EXISTS idx_learn_articles_category ON public.learn_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_learn_articles_published ON public.learn_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_learn_articles_featured ON public.learn_articles(is_featured);

-- Enable RLS
ALTER TABLE public.learn_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learn_categories (drop first to make idempotent)
DROP POLICY IF EXISTS "Allow public read access to active categories" ON public.learn_categories;
CREATE POLICY "Allow public read access to active categories" ON public.learn_categories
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Allow admin full access to categories" ON public.learn_categories;
CREATE POLICY "Allow admin full access to categories" ON public.learn_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for learn_articles (drop first to make idempotent)
DROP POLICY IF EXISTS "Allow public read access to published articles" ON public.learn_articles;
CREATE POLICY "Allow public read access to published articles" ON public.learn_articles
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Allow admin full access to articles" ON public.learn_articles;
CREATE POLICY "Allow admin full access to articles" ON public.learn_articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Insert some default categories
INSERT INTO public.learn_categories (name, slug, description, icon, color, display_order) VALUES
    ('All', 'all', 'View all articles', 'LayoutGrid', 'from-gray-500 to-gray-600', 0),
    ('Machine Learning', 'machine-learning', 'AI and ML tutorials and insights', 'Brain', 'from-purple-500 to-pink-600', 1),
    ('Automation', 'automation', 'Workflow automation and efficiency', 'Zap', 'from-yellow-500 to-orange-600', 2),
    ('Passive Income', 'passive-income', 'Building passive income streams', 'DollarSign', 'from-green-500 to-emerald-600', 3),
    ('E-Commerce', 'ecommerce', 'Online business strategies', 'ShoppingCart', 'from-blue-500 to-cyan-600', 4),
    ('Case Studies', 'case-studies', 'Real-world success stories', 'FileText', 'from-indigo-500 to-violet-600', 5)
ON CONFLICT (slug) DO NOTHING;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_learn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_learn_categories_updated_at ON public.learn_categories;
CREATE TRIGGER update_learn_categories_updated_at
    BEFORE UPDATE ON public.learn_categories
    FOR EACH ROW EXECUTE FUNCTION update_learn_updated_at();

DROP TRIGGER IF EXISTS update_learn_articles_updated_at ON public.learn_articles;
CREATE TRIGGER update_learn_articles_updated_at
    BEFORE UPDATE ON public.learn_articles
    FOR EACH ROW EXECUTE FUNCTION update_learn_updated_at();

-- ============================================
-- STORAGE BUCKET SETUP FOR MEDIA UPLOADS
-- ============================================

-- Create the media storage bucket (if it doesn't exist)
-- Note: This needs to be run separately in Supabase Dashboard > Storage
-- OR via the Supabase Management API

-- The following SQL creates storage policies for the 'media' bucket
-- First create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name it "media"
-- 4. Make it PUBLIC for images/videos to be accessible

-- Storage policies (run these AFTER creating the bucket)
-- Allow public read access to all files in media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

-- Allow public to read files
DROP POLICY IF EXISTS "Allow public read access to media" ON storage.objects;
CREATE POLICY "Allow public read access to media" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated users to upload media" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media' 
        AND auth.role() = 'authenticated'
    );

-- Allow admins to delete files
DROP POLICY IF EXISTS "Allow admins to delete media" ON storage.objects;
CREATE POLICY "Allow admins to delete media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'media' 
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to update files
DROP POLICY IF EXISTS "Allow admins to update media" ON storage.objects;
CREATE POLICY "Allow admins to update media" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'media' 
        AND EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
-- Migration: Learn Comments and Reactions System
-- Creates tables for article comments and reactions (likes)

-- ============================================
-- ARTICLE REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.article_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.learn_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL DEFAULT 'like', -- like, love, helpful, insightful
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, user_id, reaction_type)
);

-- ============================================
-- ARTICLE COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.learn_articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMMENT LIKES TABLE (for tracking who liked a comment)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.article_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_ip TEXT, -- For anonymous like tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id),
    UNIQUE(comment_id, user_ip)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_article_reactions_article ON public.article_reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_reactions_user ON public.article_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_article ON public.article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_parent ON public.article_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_approved ON public.article_comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes(comment_id);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - ARTICLE REACTIONS
-- ============================================
DROP POLICY IF EXISTS "Allow users to view all reactions" ON public.article_reactions;
CREATE POLICY "Allow users to view all reactions" ON public.article_reactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to add reactions" ON public.article_reactions;
CREATE POLICY "Allow authenticated users to add reactions" ON public.article_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own reactions" ON public.article_reactions;
CREATE POLICY "Allow users to delete own reactions" ON public.article_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - ARTICLE COMMENTS
-- ============================================
DROP POLICY IF EXISTS "Allow public to view approved comments" ON public.article_comments;
CREATE POLICY "Allow public to view approved comments" ON public.article_comments
    FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Allow anyone to submit comments" ON public.article_comments;
CREATE POLICY "Allow anyone to submit comments" ON public.article_comments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to edit own comments" ON public.article_comments;
CREATE POLICY "Allow users to edit own comments" ON public.article_comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access to comments" ON public.article_comments;
CREATE POLICY "Allow admin full access to comments" ON public.article_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- RLS POLICIES - COMMENT LIKES
-- ============================================
DROP POLICY IF EXISTS "Allow anyone to view comment likes" ON public.comment_likes;
CREATE POLICY "Allow anyone to view comment likes" ON public.comment_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anyone to like comments" ON public.comment_likes;
CREATE POLICY "Allow anyone to like comments" ON public.comment_likes
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to unlike own likes" ON public.comment_likes;
CREATE POLICY "Allow users to unlike own likes" ON public.comment_likes
    FOR DELETE USING (auth.uid() = user_id OR user_ip IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_article_comments_updated_at ON public.article_comments;
CREATE TRIGGER update_article_comments_updated_at
    BEFORE UPDATE ON public.article_comments
    FOR EACH ROW EXECUTE FUNCTION update_learn_updated_at();

-- ============================================
-- FUNCTION TO UPDATE COMMENT LIKES COUNT
-- ============================================
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.article_comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.article_comments 
        SET likes_count = GREATEST(0, likes_count - 1) 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON public.comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- ============================================
-- VIEW FOR ARTICLE REACTION COUNTS
-- ============================================
CREATE OR REPLACE VIEW public.article_reaction_counts AS
SELECT 
    article_id,
    reaction_type,
    COUNT(*) as count
FROM public.article_reactions
GROUP BY article_id, reaction_type;
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
-- Migration: Services Write Policies

-- Allow admins to insert services
CREATE POLICY "Admins can insert services"
    ON public.services
    FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update services
CREATE POLICY "Admins can update services"
    ON public.services
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete services
CREATE POLICY "Admins can delete services"
    ON public.services
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::app_role));
-- Migration: Rate Limits Table

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Service role will bypass)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies needed; edge functions will use service role to read/write

-- Optional: Create an index to speed up the count queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint_time 
ON public.rate_limits (ip_address, endpoint, created_at);
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
CREATE TABLE IF NOT EXISTS public.tools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  short_description text,
  icon text,
  status text NOT NULL DEFAULT 'coming_soon',
  price_monthly numeric(10,2),
  is_free boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  maintenance_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed the 5 tools
INSERT INTO public.tools (slug, name, short_description, status, price_monthly, is_free, sort_order)
VALUES
  ('cpbot', 'CP Bot', 'One-click eBay to Amazon order fulfilment', 'available', 9.00, false, 1),
  ('listflow', 'ListFlow', 'Product tracking and listing — AutoDS alternative', 'available', 19.00, false, 2),
  ('orderbot', 'Order Bot', 'Instant WhatsApp/Discord alerts for new eBay orders', 'available', 7.00, false, 3),
  ('invoicegen', 'Invoice Generator', 'Auto-generate professional invoices for eBay sales', 'available', 5.00, false, 4),
  ('returnlabels', 'Return Label Generator', 'Generate eBay return labels instantly', 'available', 0, true, 5)
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tools are viewable by everyone" ON public.tools
  FOR SELECT USING (true);
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
-- RPC to fetch all users (profiles + email) for the admin dashboard
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE (
  id uuid,
  email varchar,
  full_name text,
  phone text,
  is_admin boolean,
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
    p.id, 
    u.email::varchar, 
    p.full_name, 
    p.phone, 
    p.is_admin, 
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$;
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
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  color_gradient TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Services policies (public read, admin write)
CREATE POLICY "Anyone can view services"
  ON public.services FOR SELECT
  USING (true);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY "Anyone can submit contact form"
  ON public.contacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

-- Storage policies
CREATE POLICY "Anyone can view uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own uploads"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial services data
INSERT INTO public.services (title, description, icon, features, color_gradient) VALUES
('Web Development', 'Custom websites and web applications built with cutting-edge technologies for optimal performance and user experience.', 'Code', ARRAY['Responsive Design', 'Modern Frameworks', 'SEO Optimization', 'Performance Tuning'], 'from-blue-500 to-cyan-500'),
('Cloud Services', 'Scalable cloud infrastructure solutions to power your applications with reliability and security.', 'Cloud', ARRAY['AWS & Azure Integration', 'Auto-scaling', 'Load Balancing', '24/7 Monitoring'], 'from-purple-500 to-pink-500'),
('Mobile Development', 'Native and cross-platform mobile applications that deliver seamless experiences across all devices.', 'Smartphone', ARRAY['iOS & Android', 'Cross-platform', 'Native Performance', 'App Store Deployment'], 'from-green-500 to-teal-500'),
('Cybersecurity', 'Comprehensive security solutions to protect your digital assets and ensure compliance with industry standards.', 'Lock', ARRAY['Penetration Testing', 'Security Audits', 'Compliance Management', 'Threat Detection'], 'from-red-500 to-orange-500'),
('Data Analytics', 'Transform raw data into actionable insights with our advanced analytics and business intelligence solutions.', 'Database', ARRAY['Business Intelligence', 'Real-time Analytics', 'Data Visualization', 'Predictive Modeling'], 'from-yellow-500 to-amber-500'),
('Digital Transformation', 'End-to-end digital transformation services to modernize your business processes and infrastructure.', 'Zap', ARRAY['Process Automation', 'Legacy Migration', 'Change Management', 'Innovation Strategy'], 'from-indigo-500 to-blue-500');
-- Fix search path for update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Make uploads bucket private for security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'uploads';

-- Update storage policies to restrict access to file owners
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- Create secure policies for uploads bucket
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Create roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can insert/update/delete roles (will be enforced via backend)
CREATE POLICY "Only service role can manage roles"
  ON public.user_roles FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update contacts policy to restrict anonymous submissions to admins only
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;

CREATE POLICY "Users can view own contacts and admins can view all"
  ON public.contacts FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Grant default 'user' role to existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;
-- ========================================
-- CONTACT FORM FILE ATTACHMENTS MIGRATION
-- ========================================
-- Purpose: Allow users to attach files to contact form submissions
-- Developer Notes: 
--   - Attachments stored in 'contact-attachments' storage bucket
--   - File paths stored as text array in contacts table
--   - Max 3 files per submission (enforced client-side)
--   - Supported types: PDF, JPG, PNG (max 5MB each)

-- Add attachments column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';

COMMENT ON COLUMN public.contacts.attachments IS 'Array of file paths in contact-attachments bucket. Format: ["user_id/timestamp_filename.ext"]';

-- Create storage bucket for contact attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-attachments',
  'contact-attachments',
  false, -- Private bucket, only accessible by admins
  5242880, -- 5MB limit per file
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STORAGE RLS POLICIES
-- ========================================
-- Security Model:
--   - Anyone can upload (INSERT) to their own folder
--   - Only admins can view (SELECT) all attachments
--   - Only admins can delete (DELETE) attachments

-- Policy: Allow anyone to upload files (authenticated or not)
-- Files are stored in user-specific folders or 'anonymous' folder
CREATE POLICY "Anyone can upload contact attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contact-attachments'
);

-- Policy: Only admins can view contact attachments
CREATE POLICY "Admins can view contact attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contact-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Only admins can delete contact attachments
CREATE POLICY "Admins can delete contact attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contact-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);
-- Create educational content table
CREATE TABLE public.educational_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'animation', 'text')),
  video_url TEXT,
  content_text TEXT,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view published content
CREATE POLICY "Anyone can view published content"
ON public.educational_content
FOR SELECT
USING (published = true);

-- Admins can do everything
CREATE POLICY "Admins can manage all content"
ON public.educational_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for educational videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('educational-videos', 'educational-videos', true);

-- RLS for educational videos bucket
CREATE POLICY "Public can view educational videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'educational-videos');

CREATE POLICY "Admins can upload educational videos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'educational-videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete educational videos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'educational-videos' AND has_role(auth.uid(), 'admin'::app_role));

-- Create index for ordering
CREATE INDEX idx_educational_content_order ON public.educational_content(display_order, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_educational_content_updated_at
BEFORE UPDATE ON public.educational_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
