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
