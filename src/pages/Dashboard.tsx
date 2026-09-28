import { useState, useEffect, ElementType } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Lock, Box, Zap, FileText, Activity, AlertCircle, Sparkles, Wrench, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { handleGetAccessLogic } from '@/lib/checkout';

export interface DbTool {
    id: string;
    slug: string;
    name: string;
    description: string;
    short_description: string;
    icon: string | null;
    status: 'coming_soon' | 'available' | 'maintenance' | 'hidden';
    price_monthly: number;
    is_free: boolean;
    maintenance_message: string | null;
    sort_order: number;
}

interface SubscriptionData {
    product_slug: string;
    status: string;
    current_period_end: string | null;
}

const getIconComponent = (slug: string): ElementType => {
    switch (slug) {
        case 'cpbot': return Box;
        case 'returnlabels': return Zap;
        case 'orderbot': return Activity;
        case 'invoicegen': return FileText;
        case 'listflow': return Sparkles;
        case 'profit_tracker': return AlertCircle;
        default: return Box;
    }
};

const getAppUrl = (slug: string): string => {
    switch (slug) {
        case 'rccp': return 'https://rccp.automationalchemists.com';
        case 'cpbot': return 'https://rccp.automationalchemists.com';
        case 'returnlabels': return 'https://rccp.automationalchemists.com';
        case 'orderbot': return 'https://orderbot.automationalchemists.com';
        case 'invoicegen': return 'https://invoicegen.automationalchemists.com';
        case 'listflow': return 'https://listflow.automationalchemists.com';
        default: return '#';
    }
};

const SkeletonCard = () => (
    <div className="bg-teal-900 rounded-xl overflow-hidden border border-teal-600/30 animate-pulse">
        <div className="h-[80px] bg-[#222]"></div>
        <div className="p-6 space-y-4">
            <div className="h-6 bg-teal-600/30 rounded w-3/4"></div>
            <div className="h-4 bg-teal-600/30 rounded w-full"></div>
            <div className="h-4 bg-teal-600/30 rounded w-5/6"></div>
            <div className="pt-4 flex items-center justify-between">
                <div className="h-6 bg-teal-600/30 rounded w-24"></div>
                <div className="h-10 bg-teal-600/30 rounded w-28"></div>
            </div>
        </div>
    </div>
);

const ToolCard = ({ 
    tool, 
    type,
    currentPeriodEnd,
    isNotified,
    onNotify,
    hasCpBotSub,
    onBuyNow
}: { 
    tool: DbTool; 
    type: 'active' | 'available' | 'coming_soon';
    currentPeriodEnd?: string | null;
    isNotified?: boolean;
    onNotify?: (tool: DbTool) => void;
    hasCpBotSub?: boolean;
    onBuyNow?: (slug: string) => void;
}) => {
    const Icon = getIconComponent(tool.slug);
    const [imageError, setImageError] = useState(false);
    
    let bannerClass = 'bg-teal-600/30';
    let badge = null;
    let button = null;
    let displayDescription = tool.short_description || tool.description;

    if (type === 'active') {
        if (tool.status === 'maintenance') {
            bannerClass = 'bg-teal-800 border-yellow-500/20';
            badge = (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-semibold border border-yellow-500/20 uppercase tracking-wider">
                    <Wrench className="w-3 h-3" />
                    Maintenance
                </div>
            );
            button = (
                <Button disabled className="bg-teal-600/30 text-[#888] font-bold h-10 px-5 rounded-lg text-sm font-display cursor-not-allowed w-full sm:w-auto">
                    Currently Unavailable
                </Button>
            );
        } else if (tool.slug === 'rccp') {
            bannerClass = 'bg-teal-800';
            if (!hasCpBotSub) {
                displayDescription = "Return Converter is free. Upgrade to unlock CP Bot.";
                badge = (
                    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold border border-green-500/20 whitespace-nowrap">
                            ↩️ Return Converter — Active
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-400 text-xs font-semibold border border-zinc-500/20 whitespace-nowrap">
                            🔒 CP Bot — Locked
                        </div>
                    </div>
                );
                button = (
                    <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 w-full sm:w-auto">
                        <Button asChild variant="outline" className="border-teal-600 text-teal-600 hover:bg-yellow-accent text-teal-900 hover:text-black font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full xl:w-auto">
                            <a href={getAppUrl(tool.slug)} target="_blank" rel="noopener noreferrer">
                                Open Return Converter
                            </a>
                        </Button>
                        <Button asChild className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 text-black font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full xl:w-auto">
                            <a href="/#">
                                Unlock CP Bot — AUD $9/mo
                            </a>
                        </Button>
                    </div>
                );
            } else {
                badge = (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold border border-green-500/20 whitespace-nowrap">
                                ↩️ Return Converter — Active
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold border border-green-500/20 whitespace-nowrap">
                                🤖 CP Bot — Active
                            </div>
                        </div>
                        {currentPeriodEnd && (
                            <div className="text-[10px] text-[#888] font-medium">
                                CP Bot renews {new Date(currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                        )}
                    </div>
                );
                button = (
                    <Button asChild className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 text-black font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                        <a href={getAppUrl(tool.slug)} target="_blank" rel="noopener noreferrer">
                            Open Tools
                        </a>
                    </Button>
                );
            }
        } else {
            bannerClass = 'bg-teal-800';
            badge = (
                <div className="flex flex-col gap-1 items-start">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Active
                    </div>
                    {currentPeriodEnd && (
                        <div className="text-[10px] text-[#888] font-medium ml-1">
                            Renews {new Date(currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                    )}
                </div>
            );
            button = (
                <Button asChild className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 text-black font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                    <a href={getAppUrl(tool.slug)} target="_blank" rel="noopener noreferrer">
                        Open {tool.name}
                    </a>
                </Button>
            );
        }
    } else if (type === 'available') {
        bannerClass = 'bg-teal-800';
        badge = (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-400 text-xs font-semibold border border-zinc-500/20">
                <Lock className="w-3 h-3" />
                Not purchased
            </div>
        );
        button = tool.status === 'maintenance' ? (
            <Button disabled className="bg-teal-600/30 text-yellow-500 font-bold h-10 px-5 rounded-lg text-sm font-display cursor-not-allowed w-full sm:w-auto border border-yellow-500/20">
                In Maintenance
            </Button>
        ) : (
            <Button onClick={() => onBuyNow?.(tool.slug)} variant="outline" className="border-teal-600 text-teal-600 hover:bg-yellow-accent text-teal-900 hover:text-black font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                Buy now — AUD ${tool.price_monthly}/mo
            </Button>
        );
    } else if (type === 'coming_soon') {
        bannerClass = 'bg-gradient-to-br from-blue-900/20 to-purple-900/20';
        badge = (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                <Clock className="w-3 h-3" />
                Coming soon
            </div>
        );
        button = isNotified ? (
            <Button disabled className="bg-teal-900 text-teal-600 border border-teal-600/30 font-bold h-10 px-5 rounded-lg text-sm font-display cursor-default w-full sm:w-auto">
                ✓ You're on the list
            </Button>
        ) : (
            <Button onClick={() => onNotify?.(tool)} className="bg-teal-600/30 hover:bg-[#333] text-white font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                Notify me
            </Button>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-teal-900 rounded-xl overflow-hidden border ${tool.status === 'maintenance' && type === 'active' ? 'border-yellow-500/30' : 'border-teal-600/30'} flex flex-col h-full`}
        >
            <div className={`h-[80px] w-full flex items-center justify-center ${bannerClass} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                {tool.slug === 'rccp' ? (
                    imageError ? (
                        <span className="text-4xl relative z-10" title="CP Bot & Return Converter">🤖↩️</span>
                    ) : (
                        <img 
                            src="/images/rccp-logo.png" 
                            alt="CP Bot & Return Converter" 
                            className="w-12 h-12 object-contain relative z-10" 
                            onError={() => setImageError(true)}
                        />
                    )
                ) : (
                    <Icon className="w-10 h-10 text-white/80 relative z-10" />
                )}
            </div>
            
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-white mb-2 font-display">{tool.name}</h3>
                
                <p className="text-[#888] text-sm mb-4 leading-relaxed flex-grow">
                    {displayDescription}
                </p>

                {tool.status === 'maintenance' && type === 'active' && tool.maintenance_message && (
                    <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                        <span className="text-xs font-semibold text-yellow-500 block mb-1">Message from Admin:</span>
                        <span className="text-sm text-yellow-400/90">{tool.maintenance_message}</span>
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-teal-600/30 mt-auto">
                    {badge}
                    {button}
                </div>
            </div>
        </motion.div>
    );
};

const Dashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
    const [dbTools, setDbTools] = useState<DbTool[]>([]);
    const [notifications, setNotifications] = useState<string[]>([]);
    const [orderbotStores, setOrderbotStores] = useState<any>(null);
    const [showAddStoreModal, setShowAddStoreModal] = useState(false);
    const [newStoreName, setNewStoreName] = useState('');
    const [addStoreLoading, setAddStoreLoading] = useState(false);

    // Redirect unauthenticated users once session check is done
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Tools (always available)
                const { data: toolsData } = await supabase
                    .from('tools')
                    .select('*')
                    .neq('status', 'hidden')
                    .order('sort_order', { ascending: true });
                
                if (toolsData) setDbTools(toolsData as DbTool[]);

                if (user) {
                    // Fetch Subscriptions
                    const { data: subsData } = await supabase
                        .from('subscriptions')
                        .select('product_slug, status, current_period_end')
                        .eq('user_id', user.id);
                    
                    if (subsData) setSubscriptions(subsData);

                    // Fetch Notifications
                    const { data: notifData } = await supabase
                        .from('tool_notifications')
                        .select('tool_slug')
                        .eq('user_id', user.id);
                    
                    if (notifData) {
                        setNotifications(notifData.map(n => n.tool_slug));
                    }
                    
                    // Fetch orderbot stores count
                    const { data: obStores } = await supabase.rpc('get_user_store_count', { p_product_slug: 'orderbot' });
                    if (obStores) setOrderbotStores(obStores);
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (!authLoading) {
            fetchData();
        }
    }, [user, authLoading]);

    const handleNotifyMe = async (tool: DbTool) => {
        if (!user) {
            toast({
                title: "🔒 Sign in required",
                description: "Create a free account to get notified when this tool launches.",
                action: (
                    <Button onClick={() => navigate('/auth')} variant="outline" size="sm" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                        Sign in →
                    </Button>
                ),
                className: "bg-teal-900 border-l-4 border-l-[#D4AF37] text-white",
                duration: Infinity,
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('tool_notifications')
                .insert({
                    user_id: user.id,
                    email: user.email,
                    tool_slug: tool.slug,
                    tool_name: tool.name
                });
            
            if (error) throw error;

            setNotifications(prev => [...prev, tool.slug]);
            
            toast({
                title: "🔔 You're on the list!",
                description: `We'll notify you the moment ${tool.name} launches.`,
                className: "bg-teal-900 border-none border-l-4 border-l-[#D4AF37] text-white bottom-right-slide",
                duration: 4000,
            });
        } catch (err) {
            console.error("Error signing up for notification:", err);
            toast({
                title: "Error",
                description: "Failed to sign up for notifications.",
                variant: "destructive",
            });
        }
    };

    const handleAddStoreSubmit = async () => {
        if (!user || !newStoreName.trim()) return;
        setAddStoreLoading(true);
        try {
            const { error } = await supabase.from('stores').insert({
                user_id: user.id,
                email: user.email,
                store_name: newStoreName.trim(),
                connected_tools: ['orderbot'],
                is_active: true
            });
            if (error) throw error;
            
            setShowAddStoreModal(false);
            setNewStoreName('');
            toast({
                title: "Success",
                description: "Store added. An admin will activate monitoring shortly.",
                className: "bg-teal-900 border-none border-l-4 border-l-[#D4AF37] text-white",
            });
            
            // Re-fetch orderbotStores
            const { data: obStores } = await supabase.rpc('get_user_store_count', { p_product_slug: 'orderbot' });
            if (obStores) setOrderbotStores(obStores);
        } catch (err: any) {
            console.error("Error adding store:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to add store",
                variant: "destructive",
            });
        } finally {
            setAddStoreLoading(false);
        }
    };

    // Categorize tools based on dynamic DB data
    const activeTools = dbTools.filter(t => {
        if (t.slug === 'orderbot') {
            return orderbotStores?.active_store_count > 0;
        }
        if (t.slug === 'rccp') return true;
        const hasActiveSub = subscriptions.some(s => s.product_slug === t.slug && s.status === 'active');
        return t.is_free || hasActiveSub;
    });

    const availableTools = dbTools.filter(t => {
        if (t.slug === 'orderbot') {
            return !orderbotStores || orderbotStores.active_store_count === 0;
        }
        if (t.slug === 'rccp') return false;
        if (t.is_free) return false;
        const hasActiveSub = subscriptions.some(s => s.product_slug === t.slug && s.status === 'active');
        return !hasActiveSub && (t.status === 'available' || t.status === 'maintenance');
    });

    const comingSoonTools = dbTools.filter(t => t.status === 'coming_soon');

    const getSubscriptionEndDate = (slug: string) => {
        const querySlug = slug === 'rccp' ? 'cpbot' : slug;
        const sub = subscriptions.find(s => s.product_slug === querySlug && s.status === 'active');
        return sub?.current_period_end;
    };

    if (authLoading) {
        return null;
    }

    return (
        <div className="min-h-screen bg-teal-900 flex flex-col">
            <SEOHead 
                title="Your Dashboard | Automation Alchemists" 
                description="Manage your tools and subscriptions." 
            />
            <Navigation />
            
            <main className="flex-grow pt-32 pb-24 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    
                    <div className="mb-16">
                        <h1 className="text-4xl md:text-5xl font-black text-white font-display mb-4 tracking-tight">Your dashboard</h1>
                        <p className="text-xl text-[#888] font-display">Manage your tools and subscriptions.</p>
                    </div>

                    {isLoading ? (
                        <div className="space-y-16">
                            <section>
                                <div className="h-4 bg-teal-600/30 w-32 rounded mb-6 animate-pulse" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </div>
                            </section>
                            <section>
                                <div className="h-4 bg-teal-600/30 w-48 rounded mb-6 animate-pulse" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <SkeletonCard />
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {/* SECTION 1: Active tools */}
                            {activeTools.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-6 font-display">Active tools</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {activeTools.map(tool => {
                                            if (tool.slug === 'orderbot') {
                                                return (
                                                    <motion.div 
                                                        key={tool.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="bg-teal-900 rounded-xl overflow-hidden border border-teal-600/30 flex flex-col h-full"
                                                    >
                                                        <div className="h-[80px] w-full flex items-center justify-center bg-teal-800 relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                                                            <Activity className="w-10 h-10 text-white/80 relative z-10" />
                                                        </div>
                                                        
                                                        <div className="p-6 flex flex-col flex-grow">
                                                            <h3 className="text-xl font-bold text-white mb-2 font-display">{tool.name}</h3>
                                                            
                                                            <div className="mb-4">
                                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold border border-green-500/20 w-fit">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                    Active
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 mb-6 flex-grow">
                                                                {orderbotStores?.stores?.map((store: any) => (
                                                                    <div key={store.store_id} className="bg-teal-800 p-3 rounded-lg border border-teal-600/30">
                                                                        <div className="text-white font-medium mb-1">📦 {store.store_name}</div>
                                                                        <div className="text-[#888] text-xs mb-2">
                                                                            Active until {store.current_period_end ? new Date(store.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Lifetime'}
                                                                        </div>
                                                                        <a href="https://orderbot.automationalchemists.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 text-xs font-bold hover:underline">
                                                                            Open →
                                                                        </a>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            
                                                            <div className="pt-4 border-t border-teal-600/30 mt-auto">
                                                                <Button onClick={() => setShowAddStoreModal(true)} variant="ghost" className="text-teal-600 hover:text-teal-600 hover:bg-yellow-accent text-teal-900/10 w-full font-bold">
                                                                    + Add another store
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            }
                                            return (
                                                <ToolCard 
                                                    key={tool.id} 
                                                    tool={tool} 
                                                    type="active" 
                                                    currentPeriodEnd={getSubscriptionEndDate(tool.slug)}
                                                    hasCpBotSub={tool.slug === 'rccp' ? subscriptions.some(s => s.product_slug === 'cpbot' && s.status === 'active') : undefined}
                                                />
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* SECTION 2: Available to purchase */}
                            {availableTools.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-6 font-display">Available to purchase</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {availableTools.map(tool => {
                                            if (tool.slug === 'orderbot') {
                                                return (
                                                    <motion.div 
                                                        key={tool.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="bg-teal-900 rounded-xl overflow-hidden border border-teal-600/30 flex flex-col h-full"
                                                    >
                                                        <div className="h-[80px] w-full flex items-center justify-center bg-teal-800 relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                                                            <Activity className="w-10 h-10 text-white/80 relative z-10" />
                                                        </div>
                                                        
                                                        <div className="p-6 flex flex-col flex-grow">
                                                            <h3 className="text-xl font-bold text-white mb-2 font-display">{tool.name}</h3>
                                                            
                                                            <p className="text-[#888] text-sm mb-4 leading-relaxed flex-grow">
                                                                {tool.short_description || tool.description}
                                                            </p>
                                                            
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-teal-600/30 mt-auto">
                                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-400 text-xs font-semibold border border-zinc-500/20">
                                                                    <Lock className="w-3 h-3" />
                                                                    Not purchased
                                                                </div>
                                                                <Button onClick={() => setShowAddStoreModal(true)} variant="outline" className="border-teal-600 text-teal-600 hover:bg-yellow-accent text-teal-900 hover:text-black font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                                                                    Add your first store
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            }
                                            return (
                                                <ToolCard 
                                                    key={tool.id} 
                                                    tool={tool} 
                                                    type="available" 
                                                    onBuyNow={(slug) => handleGetAccessLogic(slug, user, toast)}
                                                />
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* SECTION 3: Coming soon */}
                            {comingSoonTools.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-6 font-display">Coming soon</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {comingSoonTools.map(tool => (
                                            <ToolCard 
                                                key={tool.id} 
                                                tool={tool} 
                                                type="coming_soon" 
                                                isNotified={notifications.includes(tool.slug)}
                                                onNotify={handleNotifyMe}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </main>
            
            <Dialog open={showAddStoreModal} onOpenChange={setShowAddStoreModal}>
                <DialogContent className="bg-teal-900 border-teal-600/30 text-white">
                    <DialogHeader>
                        <DialogTitle>Add eBay Store</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Store Name (required)</Label>
                            <Input 
                                placeholder="e.g. My eBay Store 1"
                                value={newStoreName}
                                onChange={e => setNewStoreName(e.target.value)}
                                className="bg-background-dark border-teal-600/30 text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddStoreModal(false)} className="border-teal-600/30 hover:bg-primary/10 text-white">Cancel</Button>
                        <Button onClick={handleAddStoreSubmit} disabled={addStoreLoading || !newStoreName.trim()} className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 text-black font-bold">
                            {addStoreLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Store
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <Footer />
        </div>
    );
};

export default Dashboard;
