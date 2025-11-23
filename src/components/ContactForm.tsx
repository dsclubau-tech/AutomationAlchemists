import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, Paperclip, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';

// ✅ Define schema using Zod
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email format'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message is too long'),
});

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const ContactForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Validate file count
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({
        title: 'Too many files',
        description: `You can only attach up to ${MAX_FILES} files`,
        variant: 'destructive',
      });
      return;
    }

    // Validate each file
    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 5MB limit`,
          variant: 'destructive',
        });
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} must be PDF, JPG, or PNG`,
          variant: 'destructive',
        });
        return;
      }
    }

    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ Validate with Zod before submitting
      contactSchema.parse({ name, email, message });

      // Upload files to storage if any
      const uploadedPaths: string[] = [];
      if (files.length > 0) {
        const folderName = user?.id || 'anonymous';

        for (const file of files) {
          const timestamp = Date.now();
          const fileName = `${folderName}/${timestamp}_${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('contact-attachments')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('File upload error:', uploadError);
            throw new Error(`Failed to upload ${file.name}`);
          }

          uploadedPaths.push(fileName);
        }
      }

      // Submit form with file paths
      const { data, error } = await supabase.functions.invoke('submit-contact', {
        body: {
          name,
          email,
          message,
          attachments: uploadedPaths,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send message');

      toast({
        title: 'Message sent!',
        description: "We'll get back to you as soon as possible.",
      });

      setName('');
      setEmail('');
      setMessage('');
      setFiles([]);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        // ✅ Show first validation error
        toast({
          title: 'Validation Error',
          description: error.errors[0]?.message || 'Invalid input',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send message. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 px-6 bg-background">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >

        </motion.div>
      </div>
    </section>
  );
};

export default ContactForm;
