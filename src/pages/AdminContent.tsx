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
              <Button onClick={resetForm} className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-teal-900 border border-teal-600/20 shadow-2xl border-teal-600/20">
              <DialogHeader>
                <DialogTitle className="text-teal-900 font-display">
                  {editingContent ? 'Edit Content' : 'Add New Content'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-teal-900 font-semibold">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter content title"
                    className="bg-white border-teal-600/20 text-teal-900 border-teal-600/20 text-teal-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-teal-900 font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the content"
                    rows={3}
                    className="bg-white border-teal-600/20 text-teal-900 border-teal-600/20 text-teal-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType" className="text-teal-900 font-semibold">Content Type *</Label>
                  <Select
                    value={contentType}
                    onValueChange={(value) => setContentType(value as 'video' | 'animation' | 'text')}
                  >
                    <SelectTrigger className="bg-white border-teal-600/20 text-teal-900 border-teal-600/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-teal-600/20 text-teal-900 shadow-xl">
                      <SelectItem value="text">Text / Paragraph</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="animation">Animation / GIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {contentType === 'video' && (
                  <div className="space-y-2">
                    <Label htmlFor="videoFile" className="text-teal-900 font-semibold">Upload Video</Label>
                    <Input
                      id="videoFile"
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="bg-white border-teal-600/20 text-teal-900 border-teal-600/20 text-teal-900"
                    />
                    {editingContent?.video_url && !videoFile && (
                      <p className="text-sm text-teal-900/70">
                        Current video will be kept if no new file is uploaded
                      </p>
                    )}
                  </div>
                )}

                {contentType === 'text' && (
                  <div className="space-y-2">
                    <Label htmlFor="contentText" className="text-teal-900 font-semibold">Content Text *</Label>
                    <Textarea
                      id="contentText"
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      required={contentType === 'text'}
                      placeholder="Enter the text content / explanation"
                      rows={8}
                      className="bg-white border-teal-600/20 text-teal-900 border-teal-600/20 text-teal-900"
                    />
                  </div>
                )}

                {contentType === 'animation' && (
                  <div className="space-y-2">
                    <Label htmlFor="videoFile" className="text-teal-900 font-semibold">Upload Animation / GIF</Label>
                    <Input
                      id="videoFile"
                      type="file"
                      accept="image/gif,video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="bg-white border-teal-600/20 text-teal-900 border-teal-600/20 text-teal-900"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="displayOrder" className="text-teal-900 font-semibold">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-white border-teal-600/20 text-teal-900 border-teal-600/20 text-teal-900"
                  />
                  <p className="text-xs text-teal-900/70">Lower numbers appear first</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={published}
                    onCheckedChange={setPublished}
                  />
                  <Label htmlFor="published" className="text-teal-900 font-semibold">Published</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-yellow-accent hover:bg-yellow-accent/90 text-teal-900 font-semibold shadow-sm">
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
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : contents.length === 0 ? (
            <Card className="border-teal-600/20 bg-white border border-teal-600/20 shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-teal-900/70">No content yet. Create your first educational content!</p>
              </CardContent>
            </Card>
          ) : (
            contents.map((content) => (
              <Card key={content.id} className="border-teal-600/20 bg-white border border-teal-600/20 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-teal-600">{getContentIcon(content.content_type)}</span>
                        <CardTitle className="text-teal-900 font-display">{content.title}</CardTitle>
                        {!content.published && (
                          <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                            Draft
                          </span>
                        )}
                      </div>
                      {content.description && (
                        <p className="text-sm text-teal-900/70">{content.description}</p>
                      )}
                      <p className="text-xs text-teal-900/70">Order: {content.display_order}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(content)}
                        className="border-teal-600/30 text-teal-900 hover:bg-teal-600/10"
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