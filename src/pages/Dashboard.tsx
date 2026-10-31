import { useState, useEffect, useCallback, ElementType } from 'react';
import { motion } from 'framer-motion';
import { DashboardTrialCard } from '@/components/DashboardTrialCard';
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
import { handleGetAccessLogic, startTrialCheckout, redirectToBillingPortal } from '@/lib/checkout';
import { VISIBLE_TOOL_SLUGS } from '@/data/tools';
import { useTrialStatus, TrialStatusData } from '@/lib/trial';
import {
    categorizeDashboardTools,
    canManageSubscription,
    getSubscriptionDateText,
} from '@/lib/dashboardSections';

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
    is_trial?: boolean;
    manually_granted?: boolean;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
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
    <div className="bg-white rounded-2xl overflow-hidden border border-teal-600/20 shadow-sm animate-pulse w-full min-w-0 flex flex-col h-full">
        <div className="h-[80px] bg-teal-600/5 border-b border-teal-600/10"></div>
        <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
            <div className="space-y-4">
                <div className="h-6 bg-teal-600/15 rounded w-3/4"></div>
                <div className="h-4 bg-teal-600/10 rounded w-full"></div>
                <div className="h-4 bg-teal-600/10 rounded w-5/6"></div>
            </div>
            <div className="pt-4 flex items-center justify-between border-t border-teal-600/10">
                <div className="h-6 bg-teal-600/15 rounded w-24"></div>
                <div className="h-10 bg-teal-600/15 rounded w-28"></div>
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
    cpBotSubscription,
    subscription,
    trialStatus,
    onStartTrial,
    onManageSubscription,
    onSubscribe,
    onBuyNow
}: { 
    tool: DbTool; 
    type: 'active' | 'available' | 'coming_soon';
    currentPeriodEnd?: string | null;
    isNotified?: boolean;
    onNotify?: (tool: DbTool) => void;
    cpBotSubscription?: SubscriptionData | null;
    subscription?: SubscriptionData | null;
    trialStatus?: TrialStatusData | null;
    onStartTrial?: () => void;
    onManageSubscription?: () => void;
    onSubscribe?: () => void;
    onBuyNow?: (slug: string) => void;
}) => {
    const Icon = getIconComponent(tool.slug);
    const [imageError, setImageError] = useState(false);
    
    let badge = null;
    let button = null;
    let displayDescription = tool.short_description || tool.description;

    if (type === 'active') {
        if (tool.status === 'maintenance') {
            badge = (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-semibold border border-amber-500/30 uppercase tracking-wider">
                    <Wrench className="w-3 h-3" />
                    Maintenance
                </div>
            );
            button = (
                <Button disabled className="bg-teal-600/10 text-teal-900/60 font-bold h-10 px-5 rounded-lg text-sm font-display cursor-not-allowed w-full sm:w-auto border border-teal-600/20">
                    Currently Unavailable
                </Button>
            );
        } else if (tool.slug === 'rccp') {
            const hasCpBotSub = Boolean(cpBotSubscription);
            const isCpBotTrial = Boolean(cpBotSubscription?.is_trial || cpBotSubscription?.status === 'trialing');
            const isTrialEligible = !hasCpBotSub && Boolean(
                trialStatus?.enabled &&
                trialStatus?.eligible &&
                !trialStatus?.already_claimed &&
                (trialStatus?.slots_left ?? 0) > 0
            );
            const trialDays = trialStatus?.trial_days || 30;

            if (!hasCpBotSub) {
                displayDescription = "Return Converter is free. Upgrade to unlock CP Bot.";
                badge = (
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-600/10 text-green-700 text-xs font-semibold border border-green-600/20 whitespace-nowrap">
                            ↩️ Return Converter — Active
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold border border-zinc-300 whitespace-nowrap">
                            🔒 CP Bot — Locked
                        </div>
                    </div>
                );

                if (isTrialEligible) {
                    // State 4: Locked and eligible -> "Start free trial now"
                    button = (
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                            <div className="flex flex-wrap items-center gap-2">
                                <Button asChild variant="outline" className="bg-transparent border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-600 font-bold h-10 px-4 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                                    <a href={getAppUrl(tool.slug)} target="_blank" rel="noopener noreferrer">
                                        Open Return Converter
                                    </a>
                                </Button>
                                <Button onClick={onStartTrial} className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold h-10 px-4 rounded-lg text-sm transition-colors font-display w-full sm:w-auto shadow-sm">
                                    Start free trial now
                                </Button>
                            </div>
                            <p className="text-[11px] text-teal-900/70 font-display">
                                {trialDays} days free, then A${tool.price_monthly}/month. Card required. Cancel anytime.
                            </p>
                        </div>
                    );
                } else {
                    // State 1: Not eligible or no trial -> "Subscribe"
                    button = (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <Button asChild variant="outline" className="bg-transparent border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-600 font-bold h-10 px-4 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                                <a href={getAppUrl(tool.slug)} target="_blank" rel="noopener noreferrer">
                                    Open Return Converter
                                </a>
                            </Button>
                            <Button onClick={onSubscribe} className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold h-10 px-4 rounded-lg text-sm transition-colors font-display w-full sm:w-auto shadow-sm">
                                Subscribe
                            </Button>
                        </div>
                    );
                }
            } else if (isCpBotTrial) {
                // State 2: Trial active -> end date and "Manage subscription"
                const trialDateText = getSubscriptionDateText(cpBotSubscription);
                badge = (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-600/10 text-green-700 text-xs font-semibold border border-green-600/20 whitespace-nowrap">
                                ↩️ Return Converter — Active
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-800 text-xs font-semibold border border-yellow-500/30 whitespace-nowrap">
                                🤖 CP Bot — Free Trial
                            </div>
                        </div>
                        {trialDateText && (
                            <div className="text-xs text-teal-900/70 font-medium">
                                {trialDateText}
                            </div>
                        )}
                    </div>
                );
                button = (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Button asChild className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold h-10 px-4 rounded-lg text-sm transition-colors font-display w-full sm:w-auto shadow-sm">
                            <a href={getAppUrl(tool.slug)} target="_blank" rel="noopener noreferrer">
                                Open Tools
                            </a>
                        </Button>
                        {canManageSubscription(cpBotSubscription) && (
                            <Button onClick={onManageSubscription} variant="outline" className="bg-transparent border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-600 font-bold h-10 px-4 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                                Manage subscription
                            </Button>
                        )}
                    </div>
                );
            } else {
                // State 3: Paid / Manual active -> "Manage subscription" (only if Stripe link & not manual)
                const activeDateText = getSubscriptionDateText(cpBotSubscription, 'CP Bot');
                badge = (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-600/10 text-green-700 text-xs font-semibold border border-green-600/20 whitespace-nowrap">
                                ↩️ Return Converter — Active
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-600/10 text-green-700 text-xs font-semibold border border-green-600/20 whitespace-nowrap">
                                🤖 CP Bot — Active
                            </div>
                        </div>
                        {activeDateText && (
                            <div className="text-xs text-teal-900/70 font-medium">
                                {activeDateText}
                            </div>
                        )}
                    </div>
                );
                button = (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Button asChild className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold h-10 px-4 rounded-lg text-sm transition-colors font-display w-full sm:w-auto shadow-sm">
                            <a href={getAppUrl(tool.slug)} target="_blank" rel="noopener noreferrer">
                                Open Tools
                            </a>
                        </Button>
                        {canManageSubscription(cpBotSubscription) && (
                            <Button onClick={onManageSubscription} variant="outline" className="bg-transparent border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-600 font-bold h-10 px-4 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                                Manage subscription
                            </Button>
                        )}
                    </div>
                );
            }
        } else {
            const activeDateText = getSubscriptionDateText(subscription);
            badge = (
                <div className="flex flex-col gap-1 items-start">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-600/10 text-green-700 text-xs font-semibold border border-green-600/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                        Active
                    </div>
                    {activeDateText && (
                        <div className="text-xs text-teal-900/70 font-medium ml-1">
                            {activeDateText}
                        </div>
                    )}
                </div>
            );
            button = (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Button asChild className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full sm:w-auto shadow-sm">
                        <a href={getAppUrl(tool.slug)} target="_blank" rel="noopener noreferrer">
                            Open {tool.name}
                        </a>
                    </Button>
                    {canManageSubscription(subscription) && onManageSubscription && (
                        <Button onClick={onManageSubscription} variant="outline" className="bg-transparent border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-600 font-bold h-10 px-4 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                            Manage subscription
                        </Button>
                    )}
                </div>
            );
        }
    } else if (type === 'available') {
        badge = (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold border border-zinc-300">
                <Lock className="w-3 h-3" />
                Not purchased
            </div>
        );
        button = tool.status === 'maintenance' ? (
            <Button disabled className="bg-teal-600/10 text-amber-800 font-bold h-10 px-5 rounded-lg text-sm font-display cursor-not-allowed w-full sm:w-auto border border-amber-500/30">
                In Maintenance
            </Button>
        ) : (
            <Button onClick={() => onBuyNow?.(tool.slug)} variant="outline" className="bg-transparent border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-600 font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                Buy now — AUD ${tool.price_monthly}/mo
            </Button>
        );
    } else if (type === 'coming_soon') {
        badge = (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-600/10 text-teal-700 text-xs font-semibold border border-teal-600/20">
                <Clock className="w-3 h-3" />
                Coming soon
            </div>
        );
        button = (
            <button
                disabled
                className="w-full sm:w-auto text-center py-2 px-5 rounded-lg bg-teal-600/10 text-teal-900/60 font-display text-sm font-semibold cursor-not-allowed border border-teal-600/20 h-10"
            >
                Coming soon
            </button>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl overflow-hidden border ${tool.status === 'maintenance' && type === 'active' ? 'border-amber-500/30' : 'border-teal-600/20'} shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full w-full min-w-0`}
        >
            <div className={`h-[80px] w-full flex items-center justify-center ${tool.status === 'maintenance' && type === 'active' ? 'bg-amber-500/10 border-b border-amber-500/20' : 'bg-teal-600/5 border-b border-teal-600/10'} relative overflow-hidden`}>
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
                    <Icon className="w-10 h-10 text-teal-600 relative z-10" />
                )}
            </div>
            
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-teal-900 mb-2 font-display">{tool.name}</h3>
                
                <p className="text-teal-900/80 text-sm mb-4 leading-relaxed flex-grow">
                    {displayDescription}
                </p>

                {tool.status === 'maintenance' && type === 'active' && tool.maintenance_message && (
                    <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
                        <span className="text-xs font-semibold text-amber-800 block mb-1">Message from Admin:</span>
                        <span className="text-sm text-amber-900/90">{tool.maintenance_message}</span>
                    </div>
                )}
                
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-teal-600/10 mt-auto">
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
    const { data: trialStatus } = useTrialStatus('rccp', user?.id);
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

    const refetchSubscriptions = useCallback(async () => {
        if (!user) return;
        try {
            const { data: subsData } = await supabase
                .from('subscriptions')
                .select('product_slug, status, current_period_end, is_trial, manually_granted, stripe_subscription_id, stripe_customer_id')
                .eq('user_id', user.id);
            if (subsData) setSubscriptions(subsData as SubscriptionData[]);
        } catch (err) {
            console.error("Error refreshing subscriptions:", err);
        }
    }, [user]);

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
                    await refetchSubscriptions();

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
    }, [user, authLoading, refetchSubscriptions]);

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

    // Categorize tools using pure section assignment rules (no duplicates)
    const { activeTools, availableTools, comingSoonTools } = categorizeDashboardTools(
        dbTools,
        subscriptions,
        orderbotStores
    );

    const getSubscriptionEndDate = (slug: string) => {
        const querySlug = slug === 'rccp' ? 'cpbot' : slug;
        const sub = subscriptions.find(s => (s.product_slug === querySlug || (slug === 'rccp' && s.product_slug === 'rccp')) && (s.status === 'active' || s.status === 'trialing'));
        return sub?.current_period_end;
    };

    if (authLoading) {
        return null;
    }

    return (
        <div className="min-h-screen bg-mint-50 text-teal-900 time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white flex flex-col justify-between">
            <SEOHead 
                title="Your Dashboard | Automation Alchemists" 
                description="Manage your tools and subscriptions." 
            />
            <Navigation />
            
            <main className="flex-grow pt-32 pb-24 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    
                    <div className="mb-16">
                        <h1 className="text-4xl md:text-5xl font-black text-teal-900 font-display mb-4 tracking-tight">Your dashboard</h1>
                        <p className="text-xl text-teal-900/80 font-display">Manage your tools and subscriptions.</p>
                    </div>

                    {!isLoading && user && (
                        <DashboardTrialCard
                            userId={user.id}
                            onClaimSuccess={refetchSubscriptions}
                            onSubscribe={() => handleGetAccessLogic('rccp', user, toast)}
                            priceMonthly={dbTools.find(t => t.slug === 'rccp')?.price_monthly}
                        />
                    )}

                    {isLoading ? (
                        <div className="space-y-16">
                            <section>
                                <div className="h-4 bg-teal-600/20 w-32 rounded mb-6 animate-pulse" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </div>
                            </section>
                            <section>
                                <div className="h-4 bg-teal-600/20 w-48 rounded mb-6 animate-pulse" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
                                    <SkeletonCard />
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {/* SECTION 1: Your tools */}
                            {activeTools.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-teal-900/70 uppercase tracking-wider mb-6 font-display">Your tools</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
                                        {activeTools.map(tool => {
                                            if (tool.slug === 'orderbot') {
                                                return (
                                                    <motion.div 
                                                        key={tool.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="bg-white rounded-2xl overflow-hidden border border-teal-600/20 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full w-full min-w-0"
                                                    >
                                                        <div className="h-[80px] w-full flex items-center justify-center bg-teal-600/5 border-b border-teal-600/10 relative overflow-hidden">
                                                            <Activity className="w-10 h-10 text-teal-600 relative z-10" />
                                                        </div>
                                                        
                                                        <div className="p-6 flex flex-col flex-grow">
                                                            <h3 className="text-xl font-bold text-teal-900 mb-2 font-display">{tool.name}</h3>
                                                            
                                                            <div className="mb-4">
                                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-600/10 text-green-700 text-xs font-semibold border border-green-600/20 w-fit">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                                                    Active
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 mb-6 flex-grow">
                                                                {orderbotStores?.stores?.map((store: any) => (
                                                                    <div key={store.store_id} className="bg-mint-50 p-3 rounded-lg border border-teal-600/20">
                                                                        <div className="text-teal-900 font-medium mb-1">📦 {store.store_name}</div>
                                                                        <div className="text-teal-900/70 text-xs mb-2">
                                                                            Active until {store.current_period_end ? new Date(store.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Lifetime'}
                                                                        </div>
                                                                        <a href="https://orderbot.automationalchemists.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 text-xs font-bold hover:underline">
                                                                            Open →
                                                                        </a>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            
                                                            <div className="pt-4 border-t border-teal-600/10 mt-auto">
                                                                <Button onClick={() => setShowAddStoreModal(true)} variant="outline" className="bg-transparent border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-600 w-full font-bold transition-colors">
                                                                    + Add another store
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            }
                                            const activeSub = subscriptions.find(
                                                s => (s.product_slug === tool.slug || (tool.slug === 'rccp' && s.product_slug === 'cpbot')) &&
                                                     (s.status === 'active' || s.status === 'trialing')
                                            );
                                            return (
                                                <ToolCard 
                                                    key={tool.id} 
                                                    tool={tool} 
                                                    type="active" 
                                                    currentPeriodEnd={getSubscriptionEndDate(tool.slug)}
                                                    cpBotSubscription={tool.slug === 'rccp' ? subscriptions.find(s => (s.product_slug === 'cpbot' || s.product_slug === 'rccp') && (s.status === 'active' || s.status === 'trialing')) : undefined}
                                                    subscription={activeSub}
                                                    trialStatus={tool.slug === 'rccp' ? trialStatus : undefined}
                                                    onStartTrial={() => startTrialCheckout({ returnPath: '/dashboard', user, toast })}
                                                    onManageSubscription={() => redirectToBillingPortal(toast)}
                                                    onSubscribe={() => handleGetAccessLogic('rccp', user, toast)}
                                                />
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* SECTION 2: Available */}
                            {availableTools.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-teal-900/70 uppercase tracking-wider mb-6 font-display">Available</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
                                        {availableTools.map(tool => {
                                            if (tool.slug === 'orderbot') {
                                                return (
                                                    <motion.div 
                                                        key={tool.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="bg-white rounded-2xl overflow-hidden border border-teal-600/20 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full w-full min-w-0"
                                                    >
                                                        <div className="h-[80px] w-full flex items-center justify-center bg-teal-600/5 border-b border-teal-600/10 relative overflow-hidden">
                                                            <Activity className="w-10 h-10 text-teal-600 relative z-10" />
                                                        </div>
                                                        
                                                        <div className="p-6 flex flex-col flex-grow">
                                                            <h3 className="text-xl font-bold text-teal-900 mb-2 font-display">{tool.name}</h3>
                                                            
                                                            <p className="text-teal-900/80 text-sm mb-4 leading-relaxed flex-grow">
                                                                {tool.short_description || tool.description}
                                                            </p>
                                                            
                                                            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-teal-600/10 mt-auto">
                                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold border border-zinc-300">
                                                                    <Lock className="w-3 h-3" />
                                                                    Not purchased
                                                                </div>
                                                                <Button onClick={() => setShowAddStoreModal(true)} variant="outline" className="bg-transparent border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-600 font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
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
                                    <h2 className="text-sm font-bold text-teal-900/70 uppercase tracking-wider mb-6 font-display">Coming soon</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
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
                <DialogContent className="bg-white border border-teal-600/20 text-teal-900 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-teal-900 font-display">Add eBay Store</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-teal-900 font-medium">Store Name (required)</Label>
                            <Input 
                                placeholder="e.g. My eBay Store 1"
                                value={newStoreName}
                                onChange={e => setNewStoreName(e.target.value)}
                                className="bg-white border border-teal-600/30 text-teal-900 focus-visible:ring-2 focus-visible:ring-teal-600"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddStoreModal(false)} className="border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white">Cancel</Button>
                        <Button onClick={handleAddStoreSubmit} disabled={addStoreLoading || !newStoreName.trim()} className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold shadow-sm">
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
