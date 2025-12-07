-- ================================================
-- NEXUS CORPORATE SITE - COMPLETE DATABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- ================================================

-- ================================================
-- MIGRATION 1: Core Tables (profiles, services, contacts)
-- ================================================

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

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

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

-- ================================================
-- MIGRATION 2: User Roles
-- ================================================

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

-- ================================================
-- MIGRATION 3: Secure Storage
-- ================================================

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

-- ================================================
-- MIGRATION 4: Contact Attachments
-- ================================================

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

-- Policy: Allow anyone to upload files (authenticated or not)
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

-- ================================================
-- MIGRATION 5: Educational Content
-- ================================================

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
VALUES ('educational-videos', 'educational-videos', true)
ON CONFLICT (id) DO NOTHING;

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

-- ================================================
-- DONE! Database setup complete.
-- ================================================
