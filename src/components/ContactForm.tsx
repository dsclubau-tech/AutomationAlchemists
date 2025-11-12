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
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Get in Touch</CardTitle>
              <CardDescription className="text-center">
                Have a question or want to work together? Send us a message.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your project..."
                    className="min-h-[150px]"
                    maxLength={1000}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachments">
                    Attachments (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add up to {MAX_FILES} files (PDF, JPG, PNG - max 5MB each)
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachments"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      className="cursor-pointer"
                      disabled={files.length >= MAX_FILES}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={files.length >= MAX_FILES}
                      onClick={() => document.getElementById('attachments')?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded-md"
                        >
                          <span className="text-sm truncate flex-1">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactForm;
