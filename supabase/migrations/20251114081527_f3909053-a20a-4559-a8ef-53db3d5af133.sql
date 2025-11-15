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