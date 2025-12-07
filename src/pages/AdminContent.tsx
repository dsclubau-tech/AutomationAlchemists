import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, Video, FileText, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';
import { motion } from 'framer-motion';

// Define type based on database schema
type EducationalContent = {
  id: string;
  title: string;
  description: string | null;
  content_type: 'text' | 'video' | 'animation';
  content_text: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  display_order: number | null;
  published: boolean | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

const AdminContent = () => {
  const { toast } = useToast();
  const [contents, setContents] = useState<EducationalContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<EducationalContent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'video' | 'animation' | 'text'>('text');
  const [contentText, setContentText] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [published, setPublished] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('educational_content')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load content.',
        variant: 'destructive',
      });
    } else {
      setContents((data || []) as EducationalContent[]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    analytics.trackPageView('/admin/content');
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContentType('text');
    setContentText('');
    setDisplayOrder(0);
    setPublished(false);
    setVideoFile(null);
    setEditingContent(null);
  };

  const handleEdit = (content: EducationalContent) => {
    setEditingContent(content);
    setTitle(content.title);
    setDescription(content.description || '');
    setContentType(content.content_type as 'video' | 'animation' | 'text');
    setContentText(content.content_text || '');
    setDisplayOrder(content.display_order || 0);
    setPublished(content.published || false);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, videoUrl: string | null) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    // Delete video file if exists
    if (videoUrl) {
      const fileName = videoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('educational-videos').remove([fileName]);
      }
    }

    const { error } = await supabase
      .from('educational_content')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete content.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Content deleted successfully.',
      });
      fetchContents();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let videoUrl = editingContent?.video_url || null;

      // Upload video if provided
      if (videoFile && contentType === 'video') {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('educational-videos')
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('educational-videos')
          .getPublicUrl(fileName);

        videoUrl = publicUrl;
      }

      const contentData = {
        title,
        description: description || null,
        content_type: contentType,
        video_url: contentType === 'video' ? videoUrl : null,
        content_text: contentType === 'text' ? contentText : null,
        display_order: displayOrder,
        published,
      };

      let error;
      if (editingContent) {
        ({ error } = await supabase
          .from('educational_content')
          .update(contentData)
          .eq('id', editingContent.id));
      } else {
        ({ error } = await supabase
          .from('educational_content')
          .insert([contentData]));
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Content ${editingContent ? 'updated' : 'created'} successfully.`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchContents();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'animation': return <Sparkles className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout title="Educational Content" description="Manage videos, animations, and text content">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 text-background-dark">
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-dark border-primary/20">
              <DialogHeader>
                <DialogTitle className="text-text-main">
                  {editingContent ? 'Edit Content' : 'Add New Content'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-text-main">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter content title"
                    className="bg-background-dark border-primary/30 text-text-main"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-text-main">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the content"
                    rows={3}
                    className="bg-background-dark border-primary/30 text-text-main"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType" className="text-text-main">Content Type *</Label>
                  <Select
                    value={contentType}
                    onValueChange={(value) => setContentType(value as 'video' | 'animation' | 'text')}
                  >
                    <SelectTrigger className="bg-background-dark border-primary/30 text-text-main">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-dark border-primary/30">
                      <SelectItem value="text">Text / Paragraph</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="animation">Animation / GIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {contentType === 'video' && (
                  <div className="space-y-2">
                    <Label htmlFor="videoFile" className="text-text-main">Upload Video</Label>
                    <Input
                      id="videoFile"
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="bg-background-dark border-primary/30 text-text-main"
                    />
                    {editingContent?.video_url && !videoFile && (
                      <p className="text-sm text-text-muted">
                        Current video will be kept if no new file is uploaded
                      </p>
                    )}
                  </div>
                )}

                {contentType === 'text' && (
                  <div className="space-y-2">
                    <Label htmlFor="contentText" className="text-text-main">Content Text *</Label>
                    <Textarea
                      id="contentText"
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      required={contentType === 'text'}
                      placeholder="Enter the text content / explanation"
                      rows={8}
                      className="bg-background-dark border-primary/30 text-text-main"
                    />
                  </div>
                )}

                {contentType === 'animation' && (
                  <div className="space-y-2">
                    <Label htmlFor="videoFile" className="text-text-main">Upload Animation / GIF</Label>
                    <Input
                      id="videoFile"
                      type="file"
                      accept="image/gif,video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="bg-background-dark border-primary/30 text-text-main"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="displayOrder" className="text-text-main">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-background-dark border-primary/30 text-text-main"
                  />
                  <p className="text-xs text-text-muted">Lower numbers appear first</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={published}
                    onCheckedChange={setPublished}
                  />
                  <Label htmlFor="published" className="text-text-main">Published</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    className="border-primary/30 text-text-main hover:bg-primary/10"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-background-dark">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Content'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : contents.length === 0 ? (
            <Card className="border-primary/20 bg-surface-dark/50">
              <CardContent className="py-12 text-center">
                <p className="text-text-muted">No content yet. Create your first educational content!</p>
              </CardContent>
            </Card>
          ) : (
            contents.map((content) => (
              <Card key={content.id} className="border-primary/20 bg-surface-dark/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">{getContentIcon(content.content_type)}</span>
                        <CardTitle className="text-text-main">{content.title}</CardTitle>
                        {!content.published && (
                          <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                            Draft
                          </span>
                        )}
                      </div>
                      {content.description && (
                        <p className="text-sm text-text-muted">{content.description}</p>
                      )}
                      <p className="text-xs text-text-muted">Order: {content.display_order}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(content)}
                        className="border-primary/30 text-text-main hover:bg-primary/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(content.id, content.video_url)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminContent;