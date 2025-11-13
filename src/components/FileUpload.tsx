import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, File, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) {
      toast({
        title: 'Error',
        description: !user ? 'Please sign in to upload files.' : 'Please select a file first.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type and size
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only JPG, PNG, and PDF files are allowed.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get signed URL instead of public URL
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('uploads')
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (urlError) throw urlError;

      setUploadedUrl(signedUrlData.signedUrl);

      toast({
        title: 'Success!',
        description: 'File uploaded successfully.',
      });

      setFile(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  
};

export default FileUpload;
