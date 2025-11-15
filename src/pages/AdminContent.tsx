import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, Upload, Video, FileText, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contents, setContents] = useState<EducationalContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchContents();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (error || !data) {
      toast({
        title: 'Access Denied',
        description: 'You need admin privileges to access this page.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    setIsAdmin(true);
  };

  const fetchContents = async () => {
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
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContentType('text');
    setContentText('');
    setDisplayOrder(0);
    setPublished(false);
    setVideoFile(null);
    setEditingContent(null);
    setUploadProgress(0);
  };

  const handleEdit = (content: EducationalContent) => {
    setEditingContent(content);
    setTitle(content.title);
    setDescription(content.description || '');
    setContentType(content.content_type as 'video' | 'animation' | 'text');
    setContentText(content.content_text || '');
    setDisplayOrder(content.display_order);
    setPublished(content.published);
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-foreground">Manage Educational Content</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContent ? 'Edit Content' : 'Add New Content'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Enter content title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the content"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type *</Label>
                <Select 
                  value={contentType} 
                  onValueChange={(value) => setContentType(value as 'video' | 'animation' | 'text')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text / Paragraph</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="animation">Animation / GIF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contentType === 'video' && (
                <div className="space-y-2">
                  <Label htmlFor="videoFile">Upload Video</Label>
                  <Input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                  {editingContent?.video_url && !videoFile && (
                    <p className="text-sm text-muted-foreground">
                      Current video will be kept if no new file is uploaded
                    </p>
                  )}
                </div>
              )}

              {contentType === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="contentText">Content Text *</Label>
                  <Textarea
                    id="contentText"
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    required={contentType === 'text'}
                    placeholder="Enter the text content / explanation"
                    rows={8}
                  />
                </div>
              )}

              {contentType === 'animation' && (
                <div className="space-y-2">
                  <Label htmlFor="videoFile">Upload Animation / GIF</Label>
                  <Input
                    id="videoFile"
                    type="file"
                    accept="image/gif,video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={setPublished}
                />
                <Label htmlFor="published">Published</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
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
        {contents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No content yet. Create your first educational content!</p>
            </CardContent>
          </Card>
        ) : (
          contents.map((content) => (
            <Card key={content.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getContentIcon(content.content_type)}
                      <CardTitle>{content.title}</CardTitle>
                      {!content.published && (
                        <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    {content.description && (
                      <p className="text-sm text-muted-foreground">{content.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Order: {content.display_order}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(content)}
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
    </div>
  );
};

export default AdminContent;