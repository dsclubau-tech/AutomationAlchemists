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
          <Card className="border-primary/20 bg-surface-dark/50 singularity-shadow fractal-clip-path-card">
            <CardHeader>
              <CardTitle className="text-2xl text-white font-display">Send Us a Message</CardTitle>
              <CardDescription className="text-white/70 font-display">
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-display">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="fractal-clip-path-sm bg-input border-0 text-white placeholder:text-white/50 focus:ring-1 focus:ring-primary font-display"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-display">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="fractal-clip-path-sm bg-input border-0 text-white placeholder:text-white/50 focus:ring-1 focus:ring-primary font-display"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white font-display">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your inquiry in detail here..."
                    required
                    rows={5}
                    className="fractal-clip-path bg-input border-0 text-white placeholder:text-white/50 focus:ring-1 focus:ring-primary resize-none font-display"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file" className="text-white font-display">Attachments (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file')?.click()}
                      disabled={files.length >= MAX_FILES}
                      className="border-primary/50 text-white hover:bg-primary/10 font-display"
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      Attach Files
                    </Button>
                    <span className="text-xs text-white/60 font-display">
                      {files.length}/{MAX_FILES} files
                    </span>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-input rounded text-sm font-display"
                        >
                          <span className="text-white truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-white/60 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full fractal-clip-path-button gold-foil-outline relative flex h-12 cursor-pointer items-center justify-center overflow-hidden bg-background-dark px-4 text-sm font-bold tracking-wider text-primary transition-all duration-300 hover:text-black group font-display"
                >
                  <span className="absolute inset-0 z-0 h-full w-0 bg-gradient-to-r from-primary to-primary-light transition-all duration-300 group-hover:w-full"></span>
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Transmit Inquiry
                      </>
                    )}
                  </span>
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
