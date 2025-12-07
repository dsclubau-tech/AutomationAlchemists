/* eslint-disable @typescript-eslint/no-explicit-any */
// NOTE: Using 'as any' casts for 'learn_categories' and 'learn_articles' tables
// because Supabase types don't include them yet. After running migration
// supabase/migrations/008_learn_content.sql and regenerating types, remove the casts.

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, BookOpen, FileText, Image, Video, Star, Eye, EyeOff, Brain, Zap, DollarSign, ShoppingCart, LayoutGrid, Upload, Link, MessageCircle, Check, X as XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/components/AdminLayout';

// Icon options for categories
const iconOptions = [
    { value: 'LayoutGrid', label: 'Grid', icon: LayoutGrid },
    { value: 'Brain', label: 'AI/ML', icon: Brain },
    { value: 'Zap', label: 'Automation', icon: Zap },
    { value: 'DollarSign', label: 'Money', icon: DollarSign },
    { value: 'ShoppingCart', label: 'E-Commerce', icon: ShoppingCart },
    { value: 'FileText', label: 'Document', icon: FileText },
    { value: 'BookOpen', label: 'Book', icon: BookOpen },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutGrid, Brain, Zap, DollarSign, ShoppingCart, FileText, BookOpen,
};

type Category = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string;
    color: string | null;
    display_order: number | null;
    is_active: boolean;
};

type Article = {
    id: string;
    category_id: string | null;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    featured_image: string | null;
    video_url: string | null;
    images: string[] | null;
    author: string | null;
    read_time: string | null;
    is_featured: boolean;
    is_published: boolean;
    display_order: number | null;
    created_at: string;
};

type Comment = {
    id: string;
    article_id: string;
    author_name: string;
    author_email: string | null;
    content: string;
    is_approved: boolean;
    is_pinned: boolean;
    likes_count: number;
    created_at: string;
};

const AdminLearn = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('articles');

    // Categories state
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCatLoading, setIsCatLoading] = useState(true);
    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Articles state
    const [articles, setArticles] = useState<Article[]>([]);
    const [isArtLoading, setIsArtLoading] = useState(true);
    const [isArtDialogOpen, setIsArtDialogOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reviews/Comments state
    const [comments, setComments] = useState<Comment[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(true);
    const [commentFilter, setCommentFilter] = useState<'all' | 'pending' | 'approved'>('all');

    // Category form state
    const [catName, setCatName] = useState('');
    const [catSlug, setCatSlug] = useState('');
    const [catDescription, setCatDescription] = useState('');
    const [catIcon, setCatIcon] = useState('BookOpen');
    const [catOrder, setCatOrder] = useState(0);
    const [catActive, setCatActive] = useState(true);

    // Article form state
    const [artTitle, setArtTitle] = useState('');
    const [artSlug, setArtSlug] = useState('');
    const [artCategoryId, setArtCategoryId] = useState('');
    const [artExcerpt, setArtExcerpt] = useState('');
    const [artContent, setArtContent] = useState('');
    const [artFeaturedImage, setArtFeaturedImage] = useState('');
    const [artVideoUrl, setArtVideoUrl] = useState('');
    const [artImages, setArtImages] = useState('');
    const [artAuthor, setArtAuthor] = useState('');
    const [artReadTime, setArtReadTime] = useState('');
    const [artFeatured, setArtFeatured] = useState(false);
    const [artPublished, setArtPublished] = useState(false);
    const [artOrder, setArtOrder] = useState(0);
    const [imageUploadMode, setImageUploadMode] = useState<'url' | 'upload'>('url');
    const [videoUploadMode, setVideoUploadMode] = useState<'url' | 'upload'>('url');
    const [isUploading, setIsUploading] = useState(false);

    const generateSlug = (text: string) => {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    // File upload handler
    const handleFileUpload = async (file: File, type: 'image' | 'video'): Promise<string | null> => {
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `learn/${type}s/${fileName}`;

            const { data, error } = await supabase.storage
                .from('media')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (error) {
                // If bucket doesn't exist or other error, show message
                toast({
                    title: 'Upload Notice',
                    description: 'File upload requires Supabase storage bucket "media" to be configured. Please use URL instead or set up storage.',
                    variant: 'destructive'
                });
                return null;
            }

            // Get public URL
            const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
            return urlData.publicUrl;
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to upload file.', variant: 'destructive' });
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({ title: 'Error', description: 'Please select an image file.', variant: 'destructive' });
            return;
        }

        const url = await handleFileUpload(file, 'image');
        if (url) {
            setArtFeaturedImage(url);
            toast({ title: 'Success', description: 'Image uploaded successfully!' });
        }
    };

    const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast({ title: 'Error', description: 'Please select a video file.', variant: 'destructive' });
            return;
        }

        const url = await handleFileUpload(file, 'video');
        if (url) {
            setArtVideoUrl(url);
            toast({ title: 'Success', description: 'Video uploaded successfully!' });
        }
    };

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        setIsCatLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('learn_categories')
                .select('*')
                .order('display_order', { ascending: true });
            if (error) throw error;
            setCategories((data || []) as Category[]);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load categories.', variant: 'destructive' });
        } finally {
            setIsCatLoading(false);
        }
    }, [toast]);

    // Fetch articles
    const fetchArticles = useCallback(async () => {
        setIsArtLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('learn_articles')
                .select('*')
                .order('display_order', { ascending: true });
            if (error) throw error;
            setArticles((data || []) as Article[]);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load articles.', variant: 'destructive' });
        } finally {
            setIsArtLoading(false);
        }
    }, [toast]);

    // Fetch comments
    const fetchComments = useCallback(async () => {
        setIsCommentsLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('article_comments')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setComments((data || []) as Comment[]);
        } catch (error) {
            console.error('Failed to load comments:', error);
            // Don't show error toast - table might not exist yet
        } finally {
            setIsCommentsLoading(false);
        }
    }, []);

    // Approve comment
    const handleApproveComment = async (commentId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('article_comments')
                .update({ is_approved: true })
                .eq('id', commentId);
            if (error) throw error;
            toast({ title: 'Success', description: 'Comment approved.' });
            fetchComments();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to approve comment.', variant: 'destructive' });
        }
    };

    // Reject/Delete comment
    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        try {
            const { error } = await (supabase as any)
                .from('article_comments')
                .delete()
                .eq('id', commentId);
            if (error) throw error;
            toast({ title: 'Success', description: 'Comment deleted.' });
            fetchComments();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete comment.', variant: 'destructive' });
        }
    };

    // Get article title by ID
    const getArticleTitle = (articleId: string) => {
        const art = articles.find(a => a.id === articleId);
        return art?.title || 'Unknown Article';
    };

    // Filter comments
    const filteredComments = comments.filter(c => {
        if (commentFilter === 'pending') return !c.is_approved;
        if (commentFilter === 'approved') return c.is_approved;
        return true;
    });

    useEffect(() => {
        fetchCategories();
        fetchArticles();
        fetchComments();
    }, [fetchCategories, fetchArticles, fetchComments]);

    // Category handlers
    const resetCategoryForm = () => {
        setCatName(''); setCatSlug(''); setCatDescription(''); setCatIcon('BookOpen'); setCatOrder(0); setCatActive(true);
        setEditingCategory(null);
    };

    const handleEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setCatName(cat.name);
        setCatSlug(cat.slug);
        setCatDescription(cat.description || '');
        setCatIcon(cat.icon || 'BookOpen');
        setCatOrder(cat.display_order || 0);
        setCatActive(cat.is_active);
        setIsCatDialogOpen(true);
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Delete this category? Articles in this category will become uncategorized.')) return;
        try {
            const { error } = await (supabase as any).from('learn_categories').delete().eq('id', id);
            if (error) throw error;
            toast({ title: 'Success', description: 'Category deleted.' });
            fetchCategories();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete category.', variant: 'destructive' });
        }
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const catData = {
                name: catName,
                slug: catSlug || generateSlug(catName),
                description: catDescription || null,
                icon: catIcon,
                display_order: catOrder,
                is_active: catActive,
            };
            let error;
            if (editingCategory) {
                ({ error } = await (supabase as any).from('learn_categories').update(catData).eq('id', editingCategory.id));
            } else {
                ({ error } = await (supabase as any).from('learn_categories').insert([catData]));
            }
            if (error) throw error;
            toast({ title: 'Success', description: `Category ${editingCategory ? 'updated' : 'created'}.` });
            setIsCatDialogOpen(false);
            resetCategoryForm();
            fetchCategories();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save category.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Article handlers
    const resetArticleForm = () => {
        setArtTitle(''); setArtSlug(''); setArtCategoryId(''); setArtExcerpt(''); setArtContent('');
        setArtFeaturedImage(''); setArtVideoUrl(''); setArtImages(''); setArtAuthor(''); setArtReadTime('');
        setArtFeatured(false); setArtPublished(false); setArtOrder(0);
        setEditingArticle(null);
    };

    const handleEditArticle = (art: Article) => {
        setEditingArticle(art);
        setArtTitle(art.title);
        setArtSlug(art.slug);
        setArtCategoryId(art.category_id || '');
        setArtExcerpt(art.excerpt || '');
        setArtContent(art.content || '');
        setArtFeaturedImage(art.featured_image || '');
        setArtVideoUrl(art.video_url || '');
        setArtImages(art.images?.join('\n') || '');
        setArtAuthor(art.author || '');
        setArtReadTime(art.read_time || '');
        setArtFeatured(art.is_featured);
        setArtPublished(art.is_published);
        setArtOrder(art.display_order || 0);
        setIsArtDialogOpen(true);
    };

    const handleDeleteArticle = async (id: string) => {
        if (!confirm('Delete this article?')) return;
        try {
            const { error } = await (supabase as any).from('learn_articles').delete().eq('id', id);
            if (error) throw error;
            toast({ title: 'Success', description: 'Article deleted.' });
            fetchArticles();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete article.', variant: 'destructive' });
        }
    };

    const handleArticleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const artData = {
                title: artTitle,
                slug: artSlug || generateSlug(artTitle),
                category_id: artCategoryId || null,
                excerpt: artExcerpt || null,
                content: artContent || null,
                featured_image: artFeaturedImage || null,
                video_url: artVideoUrl || null,
                images: artImages.split('\n').filter(i => i.trim()) || null,
                author: artAuthor || null,
                read_time: artReadTime || null,
                is_featured: artFeatured,
                is_published: artPublished,
                display_order: artOrder,
            };
            let error;
            if (editingArticle) {
                ({ error } = await (supabase as any).from('learn_articles').update(artData).eq('id', editingArticle.id));
            } else {
                ({ error } = await (supabase as any).from('learn_articles').insert([artData]));
            }
            if (error) throw error;
            toast({ title: 'Success', description: `Article ${editingArticle ? 'updated' : 'created'}.` });
            setIsArtDialogOpen(false);
            resetArticleForm();
            fetchArticles();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save article.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCategoryName = (categoryId: string | null) => {
        if (!categoryId) return 'Uncategorized';
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name || 'Unknown';
    };

    const getIcon = (iconName: string) => {
        const IconComponent = iconMap[iconName] || BookOpen;
        return <IconComponent className="w-5 h-5" />;
    };

    return (
        <AdminLayout title="Learn Content" description="Manage categories and articles for the Learn page">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-background-dark mb-6">
                        <TabsTrigger value="articles" className="data-[state=active]:bg-primary/20">Articles</TabsTrigger>
                        <TabsTrigger value="categories" className="data-[state=active]:bg-primary/20">Categories</TabsTrigger>
                        <TabsTrigger value="reviews" className="data-[state=active]:bg-primary/20">Reviews</TabsTrigger>
                    </TabsList>

                    {/* Articles Tab */}
                    <TabsContent value="articles">
                        <div className="flex justify-end mb-6">
                            <Dialog open={isArtDialogOpen} onOpenChange={setIsArtDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={resetArticleForm} className="bg-primary hover:bg-primary/90 text-background-dark">
                                        <Plus className="w-4 h-4 mr-2" /> New Article
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-surface-dark border-primary/20">
                                    <DialogHeader>
                                        <DialogTitle className="text-text-main">{editingArticle ? 'Edit Article' : 'New Article'}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleArticleSubmit} className="space-y-4">
                                        <Tabs defaultValue="basic" className="w-full">
                                            <TabsList className="grid w-full grid-cols-3 bg-background-dark">
                                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                                <TabsTrigger value="media">Media</TabsTrigger>
                                                <TabsTrigger value="content">Content</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="basic" className="space-y-4 mt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-text-main">Title *</Label>
                                                        <Input value={artTitle} onChange={(e) => { setArtTitle(e.target.value); if (!editingArticle) setArtSlug(generateSlug(e.target.value)); }} required className="bg-background-dark border-primary/30 text-text-main" placeholder="Article title" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-text-main">Slug</Label>
                                                        <Input value={artSlug} onChange={(e) => setArtSlug(e.target.value)} className="bg-background-dark border-primary/30 text-text-main" placeholder="article-slug" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-text-main">Category</Label>
                                                        <Select value={artCategoryId} onValueChange={setArtCategoryId}>
                                                            <SelectTrigger className="bg-background-dark border-primary/30 text-text-main">
                                                                <SelectValue placeholder="Select category" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-surface-dark border-primary/30">
                                                                {categories.filter(c => c.slug !== 'all').map(cat => (
                                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-text-main">Author</Label>
                                                        <Input value={artAuthor} onChange={(e) => setArtAuthor(e.target.value)} className="bg-background-dark border-primary/30 text-text-main" placeholder="Author name" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-text-main">Excerpt</Label>
                                                    <Textarea value={artExcerpt} onChange={(e) => setArtExcerpt(e.target.value)} className="bg-background-dark border-primary/30 text-text-main" rows={2} placeholder="Brief description for cards" />
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-text-main">Read Time</Label>
                                                        <Input value={artReadTime} onChange={(e) => setArtReadTime(e.target.value)} className="bg-background-dark border-primary/30 text-text-main" placeholder="5 min read" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-text-main">Display Order</Label>
                                                        <Input type="number" value={artOrder} onChange={(e) => setArtOrder(parseInt(e.target.value) || 0)} className="bg-background-dark border-primary/30 text-text-main" />
                                                    </div>
                                                    <div className="space-y-4 pt-6">
                                                        <div className="flex items-center gap-2">
                                                            <Switch checked={artFeatured} onCheckedChange={setArtFeatured} />
                                                            <Label className="text-text-main">Featured</Label>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Switch checked={artPublished} onCheckedChange={setArtPublished} />
                                                            <Label className="text-text-main">Published</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="media" className="space-y-6 mt-4">
                                                {/* Featured Image Section */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-text-main flex items-center gap-2"><Image className="w-4 h-4" /> Featured Image</Label>
                                                        <div className="flex gap-1 bg-background-dark rounded-lg p-1 border border-primary/20">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={imageUploadMode === 'url' ? 'default' : 'ghost'}
                                                                onClick={() => setImageUploadMode('url')}
                                                                className={`h-7 px-3 text-xs ${imageUploadMode === 'url' ? 'bg-primary text-black' : 'text-text-muted'}`}
                                                            >
                                                                <Link className="w-3 h-3 mr-1" /> URL
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={imageUploadMode === 'upload' ? 'default' : 'ghost'}
                                                                onClick={() => setImageUploadMode('upload')}
                                                                className={`h-7 px-3 text-xs ${imageUploadMode === 'upload' ? 'bg-primary text-black' : 'text-text-muted'}`}
                                                            >
                                                                <Upload className="w-3 h-3 mr-1" /> Upload
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {imageUploadMode === 'url' ? (
                                                        <Input
                                                            value={artFeaturedImage}
                                                            onChange={(e) => setArtFeaturedImage(e.target.value)}
                                                            className="bg-background-dark border-primary/30 text-text-main"
                                                            placeholder="https://example.com/image.jpg"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-background-dark border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                                                <Upload className="w-5 h-5 text-primary" />
                                                                <span className="text-text-muted text-sm">{isUploading ? 'Uploading...' : 'Click to upload image'}</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={handleImageFileChange}
                                                                    disabled={isUploading}
                                                                />
                                                            </label>
                                                        </div>
                                                    )}

                                                    {artFeaturedImage && (
                                                        <div className="w-full max-w-md aspect-video rounded-lg overflow-hidden border border-primary/20">
                                                            <img src={artFeaturedImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Video Section */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-text-main flex items-center gap-2"><Video className="w-4 h-4" /> Video</Label>
                                                        <div className="flex gap-1 bg-background-dark rounded-lg p-1 border border-primary/20">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={videoUploadMode === 'url' ? 'default' : 'ghost'}
                                                                onClick={() => setVideoUploadMode('url')}
                                                                className={`h-7 px-3 text-xs ${videoUploadMode === 'url' ? 'bg-primary text-black' : 'text-text-muted'}`}
                                                            >
                                                                <Link className="w-3 h-3 mr-1" /> URL
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={videoUploadMode === 'upload' ? 'default' : 'ghost'}
                                                                onClick={() => setVideoUploadMode('upload')}
                                                                className={`h-7 px-3 text-xs ${videoUploadMode === 'upload' ? 'bg-primary text-black' : 'text-text-muted'}`}
                                                            >
                                                                <Upload className="w-3 h-3 mr-1" /> Upload
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {videoUploadMode === 'url' ? (
                                                        <div>
                                                            <Input
                                                                value={artVideoUrl}
                                                                onChange={(e) => setArtVideoUrl(e.target.value)}
                                                                className="bg-background-dark border-primary/30 text-text-main"
                                                                placeholder="https://youtube.com/watch?v=... or direct video URL"
                                                            />
                                                            <p className="text-xs text-text-muted mt-1">Supports YouTube, Vimeo, or direct video URLs</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-background-dark border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                                                <Upload className="w-5 h-5 text-primary" />
                                                                <span className="text-text-muted text-sm">{isUploading ? 'Uploading...' : 'Click to upload video'}</span>
                                                                <input
                                                                    type="file"
                                                                    accept="video/*"
                                                                    className="hidden"
                                                                    onChange={handleVideoFileChange}
                                                                    disabled={isUploading}
                                                                />
                                                            </label>
                                                        </div>
                                                    )}

                                                    {artVideoUrl && (
                                                        <p className="text-xs text-primary">Video URL set: {artVideoUrl.substring(0, 50)}...</p>
                                                    )}
                                                </div>

                                                {/* Additional Images */}
                                                <div className="space-y-2">
                                                    <Label className="text-text-main">Additional Images (one URL per line)</Label>
                                                    <Textarea
                                                        value={artImages}
                                                        onChange={(e) => setArtImages(e.target.value)}
                                                        className="bg-background-dark border-primary/30 text-text-main"
                                                        rows={4}
                                                        placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                                                    />
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="content" className="space-y-4 mt-4">
                                                <div className="space-y-2">
                                                    <Label className="text-text-main">Article Content</Label>
                                                    <Textarea value={artContent} onChange={(e) => setArtContent(e.target.value)} className="bg-background-dark border-primary/30 text-text-main font-mono text-sm" rows={20} placeholder="Write your article content here..." />
                                                    <p className="text-xs text-text-muted">Use line breaks for paragraphs. HTML is supported.</p>
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                        <div className="flex gap-2 justify-end pt-4 border-t border-primary/20">
                                            <Button type="button" variant="outline" onClick={() => { setIsArtDialogOpen(false); resetArticleForm(); }} className="border-primary/30">Cancel</Button>
                                            <Button type="submit" disabled={isSubmitting} className="bg-primary text-background-dark">
                                                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Article'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid gap-4">
                            {isArtLoading ? (
                                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                            ) : articles.length === 0 ? (
                                <Card className="border-primary/20 bg-surface-dark/50"><CardContent className="py-12 text-center"><p className="text-text-muted">No articles yet. Create your first article!</p></CardContent></Card>
                            ) : (
                                articles.map(article => (
                                    <Card key={article.id} className="border-primary/20 bg-surface-dark/50">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    {article.featured_image ? (
                                                        <img src={article.featured_image} alt="" className="w-20 h-14 object-cover rounded-lg border border-primary/20" />
                                                    ) : (
                                                        <div className="w-20 h-14 bg-primary/10 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-primary" /></div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <CardTitle className="text-text-main flex items-center gap-2">
                                                            {article.title}
                                                            {article.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                                            {!article.is_published && <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">Draft</Badge>}
                                                        </CardTitle>
                                                        <p className="text-sm text-text-muted line-clamp-1">{article.excerpt}</p>
                                                        <div className="flex items-center gap-3 text-xs text-text-muted">
                                                            <span>{getCategoryName(article.category_id)}</span>
                                                            {article.author && <span>by {article.author}</span>}
                                                            {article.read_time && <span>{article.read_time}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleEditArticle(article)} className="border-primary/30"><Edit className="w-4 h-4" /></Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteArticle(article.id)}><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Categories Tab */}
                    <TabsContent value="categories">
                        <div className="flex justify-end mb-6">
                            <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={resetCategoryForm} className="bg-primary hover:bg-primary/90 text-background-dark">
                                        <Plus className="w-4 h-4 mr-2" /> New Category
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg bg-surface-dark border-primary/20">
                                    <DialogHeader>
                                        <DialogTitle className="text-text-main">{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-text-main">Name *</Label>
                                                <Input value={catName} onChange={(e) => { setCatName(e.target.value); if (!editingCategory) setCatSlug(generateSlug(e.target.value)); }} required className="bg-background-dark border-primary/30 text-text-main" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-text-main">Slug</Label>
                                                <Input value={catSlug} onChange={(e) => setCatSlug(e.target.value)} className="bg-background-dark border-primary/30 text-text-main" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-text-main">Description</Label>
                                            <Textarea value={catDescription} onChange={(e) => setCatDescription(e.target.value)} className="bg-background-dark border-primary/30 text-text-main" rows={2} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-text-main">Icon</Label>
                                                <Select value={catIcon} onValueChange={setCatIcon}>
                                                    <SelectTrigger className="bg-background-dark border-primary/30 text-text-main"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-surface-dark border-primary/30">
                                                        {iconOptions.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                <div className="flex items-center gap-2"><opt.icon className="w-4 h-4" />{opt.label}</div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-text-main">Display Order</Label>
                                                <Input type="number" value={catOrder} onChange={(e) => setCatOrder(parseInt(e.target.value) || 0)} className="bg-background-dark border-primary/30 text-text-main" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch checked={catActive} onCheckedChange={setCatActive} />
                                            <Label className="text-text-main">Active</Label>
                                        </div>
                                        <div className="flex gap-2 justify-end pt-4 border-t border-primary/20">
                                            <Button type="button" variant="outline" onClick={() => { setIsCatDialogOpen(false); resetCategoryForm(); }} className="border-primary/30">Cancel</Button>
                                            <Button type="submit" disabled={isSubmitting} className="bg-primary text-background-dark">
                                                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Category'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid gap-4">
                            {isCatLoading ? (
                                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                            ) : categories.length === 0 ? (
                                <Card className="border-primary/20 bg-surface-dark/50"><CardContent className="py-12 text-center"><p className="text-text-muted">No categories yet.</p></CardContent></Card>
                            ) : (
                                categories.map(cat => (
                                    <Card key={cat.id} className="border-primary/20 bg-surface-dark/50">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-primary">{getIcon(cat.icon)}</div>
                                                    <div>
                                                        <CardTitle className="text-text-main flex items-center gap-2">
                                                            {cat.name}
                                                            {!cat.is_active && <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">Inactive</Badge>}
                                                        </CardTitle>
                                                        <p className="text-sm text-text-muted">{cat.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleEditCategory(cat)} className="border-primary/30"><Edit className="w-4 h-4" /></Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Reviews Tab */}
                    <TabsContent value="reviews">
                        <div className="space-y-6">
                            {/* Filter Buttons */}
                            <div className="flex items-center gap-3">
                                <Button
                                    variant={commentFilter === 'all' ? 'default' : 'outline'}
                                    onClick={() => setCommentFilter('all')}
                                    className={commentFilter === 'all' ? 'bg-primary text-black' : 'border-primary/30'}
                                    size="sm"
                                >
                                    All ({comments.length})
                                </Button>
                                <Button
                                    variant={commentFilter === 'pending' ? 'default' : 'outline'}
                                    onClick={() => setCommentFilter('pending')}
                                    className={commentFilter === 'pending' ? 'bg-yellow-500 text-black' : 'border-yellow-500/30 text-yellow-500'}
                                    size="sm"
                                >
                                    Pending ({comments.filter(c => !c.is_approved).length})
                                </Button>
                                <Button
                                    variant={commentFilter === 'approved' ? 'default' : 'outline'}
                                    onClick={() => setCommentFilter('approved')}
                                    className={commentFilter === 'approved' ? 'bg-green-500 text-black' : 'border-green-500/30 text-green-500'}
                                    size="sm"
                                >
                                    Approved ({comments.filter(c => c.is_approved).length})
                                </Button>
                            </div>

                            {/* Comments List */}
                            {isCommentsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : filteredComments.length === 0 ? (
                                <Card className="border-primary/20 bg-surface-dark/50">
                                    <CardContent className="py-12 text-center">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
                                        <p className="text-text-muted">
                                            {commentFilter === 'pending' ? 'No pending comments.' :
                                                commentFilter === 'approved' ? 'No approved comments.' :
                                                    'No comments yet. Comments will appear here when users submit them on articles.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredComments.map(comment => (
                                        <Card key={comment.id} className={`border-primary/20 bg-surface-dark/50 ${!comment.is_approved ? 'border-l-4 border-l-yellow-500' : ''}`}>
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="font-semibold text-text-main">{comment.author_name}</span>
                                                            {comment.author_email && (
                                                                <span className="text-sm text-text-muted">({comment.author_email})</span>
                                                            )}
                                                            {!comment.is_approved && (
                                                                <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">Pending</Badge>
                                                            )}
                                                            {comment.is_approved && (
                                                                <Badge variant="outline" className="text-green-500 border-green-500/50">Approved</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-text-main mb-3">{comment.content}</p>
                                                        <div className="flex items-center gap-4 text-sm text-text-muted">
                                                            <span>On: <span className="text-primary">{getArticleTitle(comment.article_id)}</span></span>
                                                            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                                            {comment.likes_count > 0 && (
                                                                <span>❤️ {comment.likes_count}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {!comment.is_approved && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleApproveComment(comment.id)}
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                <Check className="w-4 h-4 mr-1" />
                                                                Approve
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </AdminLayout>
    );
};

export default AdminLearn;
