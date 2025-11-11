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