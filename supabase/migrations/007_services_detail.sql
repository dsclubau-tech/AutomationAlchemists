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
