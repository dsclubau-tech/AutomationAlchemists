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
import { Loader2, Plus, Edit, Trash2, Code, Cloud, Smartphone, Bot, Database, Palette, Globe, Cpu, Zap, Shield, Image, Video, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';

// Icon options for services
const iconOptions = [
    { value: 'Code', label: 'Code', icon: Code },
    { value: 'Cloud', label: 'Cloud', icon: Cloud },
    { value: 'Smartphone', label: 'Smartphone', icon: Smartphone },
    { value: 'Bot', label: 'Bot/AI', icon: Bot },
    { value: 'Database', label: 'Database', icon: Database },
    { value: 'Palette', label: 'Design', icon: Palette },
    { value: 'Globe', label: 'Web', icon: Globe },
    { value: 'Cpu', label: 'Tech', icon: Cpu },
    { value: 'Zap', label: 'Fast', icon: Zap },
    { value: 'Shield', label: 'Security', icon: Shield },
];

const gradientOptions = [
    { value: 'from-blue-500 to-purple-600', label: 'Blue to Purple' },
    { value: 'from-green-500 to-teal-600', label: 'Green to Teal' },
    { value: 'from-orange-500 to-red-600', label: 'Orange to Red' },
    { value: 'from-pink-500 to-rose-600', label: 'Pink to Rose' },
    { value: 'from-yellow-500 to-amber-600', label: 'Yellow to Amber' },
    { value: 'from-cyan-500 to-blue-600', label: 'Cyan to Blue' },
];

type Service = {
    id: string;
    title: string;
    slug: string | null;
    description: string;
    short_description: string | null;
    detailed_content: string | null;
    features: string[];
    icon: string;
    color_gradient: string | null;
    images: string[] | null;
    video_url: string | null;
    display_order: number | null;
    is_active: boolean | null;
    quote: string | null;
    visual_tags: string[] | null;
    created_at: string;
    updated_at: string;
};

const AdminServices = () => {
    const { toast } = useToast();
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state - Basic Info
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [features, setFeatures] = useState('');
    const [icon, setIcon] = useState('Code');
    const [colorGradient, setColorGradient] = useState(gradientOptions[0].value);
    const [displayOrder, setDisplayOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);

    // Form state - Media
    const [videoUrl, setVideoUrl] = useState('');
    const [images, setImages] = useState('');

    // Form state - Detailed Content
    const [detailedContent, setDetailedContent] = useState('');

    // Form state - New section format fields
    const [quote, setQuote] = useState('');
    const [visualTags, setVisualTags] = useState('');

    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setServices((data || []) as unknown as Service[]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load services.';
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        analytics.trackPageView('/admin/services');
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // Auto-generate slug from title
    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (!editingService) {
            setSlug(generateSlug(value));
        }
    };

    const resetForm = () => {
        setTitle('');
        setSlug('');
        setShortDescription('');
        setDescription('');
        setDetailedContent('');
        setFeatures('');
        setIcon('Code');
        setColorGradient(gradientOptions[0].value);
        setDisplayOrder(0);
        setIsActive(true);
        setVideoUrl('');
        setImages('');
        setQuote('');
        setVisualTags('');
        setEditingService(null);
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setTitle(service.title);
        setSlug(service.slug || '');
        setShortDescription(service.short_description || '');
        setDescription(service.description);
        setDetailedContent(service.detailed_content || '');
        setFeatures(service.features?.join('\n') || '');
        setIcon(service.icon || 'Code');
        setColorGradient(service.color_gradient || gradientOptions[0].value);
        setDisplayOrder(service.display_order || 0);
        setIsActive(service.is_active !== false);
        setVideoUrl(service.video_url || '');
        setImages(service.images?.join('\n') || '');
        setQuote(service.quote || '');
        setVisualTags(service.visual_tags?.join('\n') || '');
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Service deleted successfully.',
            });
            fetchServices();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete service.';
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const serviceData = {
                title,
                slug: slug || generateSlug(title),
                short_description: shortDescription || null,
                description,
                detailed_content: detailedContent || null,
                features: features.split('\n').filter(f => f.trim()),
                icon,
                color_gradient: colorGradient,
                display_order: displayOrder,
                is_active: isActive,
                video_url: videoUrl || null,
                images: images.split('\n').filter(i => i.trim()) || null,
                quote: quote || null,
                visual_tags: visualTags.split('\n').filter(t => t.trim()) || null,
            };

            let error;
            if (editingService) {
                ({ error } = await supabase
                    .from('services')
                    .update(serviceData)
                    .eq('id', editingService.id));
            } else {
                ({ error } = await supabase
                    .from('services')
                    .insert([serviceData]));
            }

            if (error) throw error;

            toast({
                title: 'Success',
                description: `Service ${editingService ? 'updated' : 'created'} successfully.`,
            });

            setIsDialogOpen(false);
            resetForm();
            fetchServices();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred.';
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIcon = (iconName: string) => {
        const iconOption = iconOptions.find(i => i.value === iconName);
        if (iconOption) {
            const IconComponent = iconOption.icon;
            return <IconComponent className="w-5 h-5" />;
        }
        return <Code className="w-5 h-5" />;
    };

    return (
        <AdminLayout title="Services" description="Manage your service offerings with media content">
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
                                Add Service
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-surface-dark border-primary/20">
                            <DialogHeader>
                                <DialogTitle className="text-text-main">
                                    {editingService ? 'Edit Service' : 'Add New Service'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Tabs defaultValue="basic" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 bg-background-dark">
                                        <TabsTrigger value="basic" className="data-[state=active]:bg-primary/20">Basic Info</TabsTrigger>
                                        <TabsTrigger value="media" className="data-[state=active]:bg-primary/20">Media</TabsTrigger>
                                        <TabsTrigger value="content" className="data-[state=active]:bg-primary/20">Detailed Content</TabsTrigger>
                                    </TabsList>

                                    {/* Basic Info Tab */}
                                    <TabsContent value="basic" className="space-y-4 mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title" className="text-text-main">Service Title *</Label>
                                                <Input
                                                    id="title"
                                                    value={title}
                                                    onChange={(e) => handleTitleChange(e.target.value)}
                                                    required
                                                    placeholder="e.g., Web Development"
                                                    className="bg-background-dark border-primary/30 text-text-main"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="slug" className="text-text-main">URL Slug</Label>
                                                <Input
                                                    id="slug"
                                                    value={slug}
                                                    onChange={(e) => setSlug(e.target.value)}
                                                    placeholder="web-development"
                                                    className="bg-background-dark border-primary/30 text-text-main"
                                                />
                                                <p className="text-xs text-text-muted">Auto-generated from title. Used in URL: /services/{slug || 'your-slug'}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="shortDescription" className="text-text-main">Short Description</Label>
                                            <Input
                                                id="shortDescription"
                                                value={shortDescription}
                                                onChange={(e) => setShortDescription(e.target.value)}
                                                placeholder="Brief one-line description for cards"
                                                className="bg-background-dark border-primary/30 text-text-main"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-text-main">Main Description *</Label>
                                            <Textarea
                                                id="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                required
                                                placeholder="Full description of the service..."
                                                rows={4}
                                                className="bg-background-dark border-primary/30 text-text-main"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="features" className="text-text-main">Features (one per line, max 4 recommended)</Label>
                                            <Textarea
                                                id="features"
                                                value={features}
                                                onChange={(e) => setFeatures(e.target.value)}
                                                placeholder="Feature 1&#10;Feature 2&#10;Feature 3&#10;Feature 4"
                                                rows={4}
                                                className="bg-background-dark border-primary/30 text-text-main"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="quote" className="text-text-main">Quote (for section display)</Label>
                                            <Input
                                                id="quote"
                                                value={quote}
                                                onChange={(e) => setQuote(e.target.value)}
                                                placeholder="e.g., Stop bragging about working 80 hours..."
                                                className="bg-background-dark border-primary/30 text-text-main"
                                            />
                                            <p className="text-xs text-text-muted">Inspirational quote displayed in the service section.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="visualTags" className="text-text-main">Visual Tags (one per line)</Label>
                                            <Textarea
                                                id="visualTags"
                                                value={visualTags}
                                                onChange={(e) => setVisualTags(e.target.value)}
                                                placeholder="Zapier&#10;Make&#10;n8n&#10;AI Agents"
                                                rows={3}
                                                className="bg-background-dark border-primary/30 text-text-main"
                                            />
                                            <p className="text-xs text-text-muted">Tags shown in the visual element (e.g., tool names, integrations).</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="icon" className="text-text-main">Icon</Label>
                                                <Select value={icon} onValueChange={setIcon}>
                                                    <SelectTrigger className="bg-background-dark border-primary/30 text-text-main">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-surface-dark border-primary/30">
                                                        {iconOptions.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                <div className="flex items-center gap-2">
                                                                    <opt.icon className="w-4 h-4" />
                                                                    {opt.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gradient" className="text-text-main">Color Theme</Label>
                                                <Select value={colorGradient} onValueChange={setColorGradient}>
                                                    <SelectTrigger className="bg-background-dark border-primary/30 text-text-main">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-surface-dark border-primary/30">
                                                        {gradientOptions.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="displayOrder" className="text-text-main">Display Order</Label>
                                                <Input
                                                    id="displayOrder"
                                                    type="number"
                                                    value={displayOrder}
                                                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                                                    className="bg-background-dark border-primary/30 text-text-main"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="isActive" className="text-text-main">Status</Label>
                                                <Select value={isActive ? 'active' : 'draft'} onValueChange={(v) => setIsActive(v === 'active')}>
                                                    <SelectTrigger className="bg-background-dark border-primary/30 text-text-main">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-surface-dark border-primary/30">
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Media Tab */}
                                    <TabsContent value="media" className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="videoUrl" className="text-text-main flex items-center gap-2">
                                                <Video className="w-4 h-4" />
                                                Video URL
                                            </Label>
                                            <Input
                                                id="videoUrl"
                                                value={videoUrl}
                                                onChange={(e) => setVideoUrl(e.target.value)}
                                                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                                                className="bg-background-dark border-primary/30 text-text-main"
                                            />
                                            <p className="text-xs text-text-muted">Supports YouTube and Vimeo URLs. Will be embedded on the service detail page.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="images" className="text-text-main flex items-center gap-2">
                                                <Image className="w-4 h-4" />
                                                Image URLs (one per line)
                                            </Label>
                                            <Textarea
                                                id="images"
                                                value={images}
                                                onChange={(e) => setImages(e.target.value)}
                                                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                                                rows={5}
                                                className="bg-background-dark border-primary/30 text-text-main"
                                            />
                                            <p className="text-xs text-text-muted">Add image URLs to display in a gallery on the service detail page.</p>
                                        </div>

                                        {images && images.split('\n').filter(i => i.trim()).length > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-text-main">Image Preview</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {images.split('\n').filter(i => i.trim()).map((img, idx) => (
                                                        <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-primary/20 bg-background-dark">
                                                            <img src={img.trim()} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="4"/><text x="12" y="14" text-anchor="middle" font-size="6" fill="%23666">Error</text></svg>';
                                                            }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Detailed Content Tab */}
                                    <TabsContent value="content" className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="detailedContent" className="text-text-main">Detailed Content</Label>
                                            <Textarea
                                                id="detailedContent"
                                                value={detailedContent}
                                                onChange={(e) => setDetailedContent(e.target.value)}
                                                placeholder="Add detailed content for the service page. This will be displayed in the 'About This Service' section.&#10;&#10;You can write multiple paragraphs here.&#10;&#10;Use line breaks to separate sections."
                                                rows={12}
                                                className="bg-background-dark border-primary/30 text-text-main font-mono text-sm"
                                            />
                                            <p className="text-xs text-text-muted">This content appears on the service detail page. Use multiple lines to create paragraphs.</p>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <div className="flex gap-2 justify-end pt-4 border-t border-primary/20">
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
                                            'Save Service'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : services.length === 0 ? (
                        <Card className="border-primary/20 bg-surface-dark/50">
                            <CardContent className="py-12 text-center">
                                <p className="text-text-muted">No services yet. Create your first service!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        services.map((service) => (
                            <Card key={service.id} className="border-primary/20 bg-surface-dark/50">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="text-primary">
                                                {getIcon(service.icon)}
                                            </div>
                                            <div className="space-y-1">
                                                <CardTitle className="text-text-main flex items-center gap-2">
                                                    {service.title}
                                                    {service.is_active === false && (
                                                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded">Draft</span>
                                                    )}
                                                </CardTitle>
                                                <p className="text-sm text-text-muted line-clamp-2">{service.short_description || service.description}</p>
                                                <div className="flex items-center gap-4 text-xs text-text-muted">
                                                    <span>{service.features?.length || 0} features</span>
                                                    {service.video_url && <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video</span>}
                                                    {service.images && service.images.length > 0 && <span className="flex items-center gap-1"><Image className="w-3 h-3" /> {service.images.length} images</span>}
                                                    {service.slug && (
                                                        <a href={`/services/${service.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                                            <ExternalLink className="w-3 h-3" /> View
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(service)}
                                                className="border-primary/30 text-text-main hover:bg-primary/10"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(service.id)}
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

export default AdminServices;
