import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, Star, Zap, Shield, Rocket, Crown, Gem, Target, Award, Percent } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { analytics } from '@/utils/analytics';
import AdminLayout from '@/components/AdminLayout';

// Icon options for packages
const iconOptions = [
    { value: 'Star', label: 'Star', icon: Star },
    { value: 'Zap', label: 'Zap', icon: Zap },
    { value: 'Shield', label: 'Shield', icon: Shield },
    { value: 'Rocket', label: 'Rocket', icon: Rocket },
    { value: 'Crown', label: 'Crown', icon: Crown },
    { value: 'Gem', label: 'Gem', icon: Gem },
    { value: 'Target', label: 'Target', icon: Target },
    { value: 'Award', label: 'Award', icon: Award },
];

const badgeColorOptions = [
    { value: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100', label: 'Blue' },
    { value: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100', label: 'Purple' },
    { value: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', label: 'Green' },
    { value: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100', label: 'Yellow' },
    { value: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', label: 'Red' },
    { value: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100', label: 'Pink' },
];

type PricingPackage = {
    id: string;
    name: string;
    price: string;
    description: string;
    short_description: string | null;
    features: string[];
    icon: string;
    badge: string | null;
    badge_color: string | null;
    cta_text: string | null;
    is_popular: boolean | null;
    discount_percent: number | null;
    display_order: number | null;
    is_active: boolean | null;
    created_at: string;
    updated_at: string;
};

const AdminPricing = () => {
    const { toast } = useToast();
    const [packages, setPackages] = useState<PricingPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [price, setPrice] = useState('Custom');
    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [features, setFeatures] = useState('');
    const [icon, setIcon] = useState('Star');
    const [badge, setBadge] = useState('');
    const [badgeColor, setBadgeColor] = useState(badgeColorOptions[0].value);
    const [ctaText, setCtaText] = useState('Get Started');
    const [isPopular, setIsPopular] = useState(false);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [displayOrder, setDisplayOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);

    const fetchPackages = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('pricing_packages')
                .select('*')
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPackages((data || []) as PricingPackage[]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load pricing packages.';
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
        analytics.trackPageView('/admin/pricing');
    }, []);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    const resetForm = () => {
        setName('');
        setPrice('Custom');
        setDescription('');
        setShortDescription('');
        setFeatures('');
        setIcon('Star');
        setBadge('');
        setBadgeColor(badgeColorOptions[0].value);
        setCtaText('Get Started');
        setIsPopular(false);
        setDiscountPercent(0);
        setDisplayOrder(0);
        setIsActive(true);
        setEditingPackage(null);
    };

    const handleEdit = (pkg: PricingPackage) => {
        setEditingPackage(pkg);
        setName(pkg.name);
        setPrice(pkg.price);
        setDescription(pkg.description);
        setShortDescription(pkg.short_description || '');
        setFeatures(pkg.features?.join('\n') || '');
        setIcon(pkg.icon);
        setBadge(pkg.badge || '');
        setBadgeColor(pkg.badge_color || badgeColorOptions[0].value);
        setCtaText(pkg.cta_text || 'Get Started');
        setIsPopular(pkg.is_popular || false);
        setDiscountPercent(pkg.discount_percent || 0);
        setDisplayOrder(pkg.display_order || 0);
        setIsActive(pkg.is_active !== false);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this pricing package?')) return;

        try {
            const { error } = await supabase
                .from('pricing_packages')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Pricing package deleted successfully.',
            });
            fetchPackages();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete package.';
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
            const packageData = {
                name,
                price,
                description,
                short_description: shortDescription || null,
                features: features.split('\n').filter(f => f.trim()),
                icon,
                badge: badge || null,
                badge_color: badgeColor,
                cta_text: ctaText,
                is_popular: isPopular,
                discount_percent: discountPercent,
                display_order: displayOrder,
                is_active: isActive,
            };

            let error;
            if (editingPackage) {
                ({ error } = await supabase
                    .from('pricing_packages')
                    .update(packageData)
                    .eq('id', editingPackage.id));
            } else {
                ({ error } = await supabase
                    .from('pricing_packages')
                    .insert([packageData]));
            }

            if (error) throw error;

            toast({
                title: 'Success',
                description: `Package ${editingPackage ? 'updated' : 'created'} successfully.`,
            });

            setIsDialogOpen(false);
            resetForm();
            fetchPackages();
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
        return <Star className="w-5 h-5" />;
    };

    return (
        <AdminLayout title="Pricing Packages" description="Manage pricing plans and discounts">
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
                                Add Package
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-dark border-primary/20">
                            <DialogHeader>
                                <DialogTitle className="text-text-main">
                                    {editingPackage ? 'Edit Package' : 'Add New Package'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-text-main">Package Name *</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder="e.g., Starter, Professional"
                                            className="bg-background-dark border-primary/30 text-text-main"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price" className="text-text-main">Price *</Label>
                                        <Input
                                            id="price"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            required
                                            placeholder="e.g., Custom, $99/mo"
                                            className="bg-background-dark border-primary/30 text-text-main"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-text-main">Full Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        placeholder="Detailed description of the package"
                                        rows={3}
                                        className="bg-background-dark border-primary/30 text-text-main"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shortDescription" className="text-text-main">Short Description</Label>
                                    <Input
                                        id="shortDescription"
                                        value={shortDescription}
                                        onChange={(e) => setShortDescription(e.target.value)}
                                        placeholder="Brief tagline for collapsed view"
                                        className="bg-background-dark border-primary/30 text-text-main"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="features" className="text-text-main">Features (one per line)</Label>
                                    <Textarea
                                        id="features"
                                        value={features}
                                        onChange={(e) => setFeatures(e.target.value)}
                                        placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                        rows={5}
                                        className="bg-background-dark border-primary/30 text-text-main"
                                    />
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
                                        <Label htmlFor="ctaText" className="text-text-main">CTA Button Text</Label>
                                        <Input
                                            id="ctaText"
                                            value={ctaText}
                                            onChange={(e) => setCtaText(e.target.value)}
                                            placeholder="Get Started"
                                            className="bg-background-dark border-primary/30 text-text-main"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="badge" className="text-text-main">Badge Text</Label>
                                        <Input
                                            id="badge"
                                            value={badge}
                                            onChange={(e) => setBadge(e.target.value)}
                                            placeholder="e.g., Most Popular, New"
                                            className="bg-background-dark border-primary/30 text-text-main"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="badgeColor" className="text-text-main">Badge Color</Label>
                                        <Select value={badgeColor} onValueChange={setBadgeColor}>
                                            <SelectTrigger className="bg-background-dark border-primary/30 text-text-main">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-surface-dark border-primary/30">
                                                {badgeColorOptions.map((opt) => (
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
                                        <Label htmlFor="discountPercent" className="text-text-main flex items-center gap-2">
                                            <Percent className="w-4 h-4 text-primary" />
                                            Discount Percentage
                                        </Label>
                                        <Input
                                            id="discountPercent"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={discountPercent}
                                            onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                                            className="bg-background-dark border-primary/30 text-text-main"
                                        />
                                        <p className="text-xs text-text-muted">Set to 0 for no discount</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="displayOrder" className="text-text-main">Display Order</Label>
                                        <Input
                                            id="displayOrder"
                                            type="number"
                                            value={displayOrder}
                                            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                                            className="bg-background-dark border-primary/30 text-text-main"
                                        />
                                        <p className="text-xs text-text-muted">Lower numbers appear first</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isPopular"
                                            checked={isPopular}
                                            onCheckedChange={setIsPopular}
                                        />
                                        <Label htmlFor="isPopular" className="text-text-main">Mark as Popular</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isActive"
                                            checked={isActive}
                                            onCheckedChange={setIsActive}
                                        />
                                        <Label htmlFor="isActive" className="text-text-main">Active</Label>
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-4">
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
                                            'Save Package'
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
                    ) : packages.length === 0 ? (
                        <Card className="border-primary/20 bg-surface-dark/50">
                            <CardContent className="py-12 text-center">
                                <p className="text-text-muted">No pricing packages yet. Create your first package!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        packages.map((pkg) => (
                            <Card key={pkg.id} className={`border-primary/20 bg-surface-dark/50 ${!pkg.is_active ? 'opacity-50' : ''}`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="text-primary">
                                                {getIcon(pkg.icon)}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <CardTitle className="text-text-main">{pkg.name}</CardTitle>
                                                    <span className="text-xl font-bold text-primary">{pkg.price}</span>
                                                    {pkg.discount_percent && pkg.discount_percent > 0 && (
                                                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                                            {pkg.discount_percent}% OFF
                                                        </Badge>
                                                    )}
                                                    {pkg.is_popular && (
                                                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                            Popular
                                                        </Badge>
                                                    )}
                                                    {!pkg.is_active && (
                                                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                    {pkg.badge && (
                                                        <Badge className={pkg.badge_color || ''}>
                                                            {pkg.badge}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-muted">{pkg.short_description || pkg.description}</p>
                                                <p className="text-xs text-text-muted">Order: {pkg.display_order} • {pkg.features?.length || 0} features</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(pkg)}
                                                className="border-primary/30 text-text-main hover:bg-primary/10"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(pkg.id)}
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

export default AdminPricing;
