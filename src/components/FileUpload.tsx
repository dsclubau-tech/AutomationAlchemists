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

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      setUploadedUrl(publicUrl);

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

  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-3xl text-center">File Upload</CardTitle>
              <CardDescription className="text-center">
                {user 
                  ? 'Upload your files securely to our cloud storage.'
                  : 'Sign in to upload files.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 transition-colors">
                <File className="w-12 h-12 text-muted-foreground mb-4" />
                <Input
                  type="file"
                  onChange={handleFileChange}
                  disabled={!user}
                  className="max-w-xs"
                />
                {file && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                className="w-full"
                size="lg"
                disabled={!file || isUploading || !user}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>

              {uploadedUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <Check className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      File uploaded successfully!
                    </p>
                    <a
                      href={uploadedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline break-all"
                    >
                      {uploadedUrl}
                    </a>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default FileUpload;
