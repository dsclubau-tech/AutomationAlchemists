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
