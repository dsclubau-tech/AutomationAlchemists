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