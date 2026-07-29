import { useState, useEffect, ElementType } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Lock, Box, Zap, FileText, Activity, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';

type License = Database['public']['Tables']['cp_bot_licenses']['Row'];

export interface Tool {
    id: string;
    name: string;
    description: string;
    icon: ElementType;
    productSlug?: string;
    alwaysActive?: boolean;
    appUrl?: string;
}

// Hardcoded Tools Definition
const ALL_TOOLS: Tool[] = [
    {
        id: 'cp_bot',
        name: 'CP Bot',
        description: 'One-click eBay to Amazon order fulfilment',
        icon: Box,
        productSlug: 'cpbot',
        appUrl: 'https://cpbot.automationalchemists.com',
    },
    {
        id: 'return_label',
        name: 'Return Label Generator',
        description: 'Generate eBay return labels instantly',
        icon: Zap,
        alwaysActive: true,
        appUrl: 'https://returnlabel.automationalchemists.com',
    },
    {
        id: 'order_bot',
        name: 'Order Bot',
        description: 'Instant WhatsApp or Discord alerts for new eBay orders',
        icon: Activity,
        productSlug: 'orderbot',
        appUrl: 'https://orderbot.automationalchemists.com',
    },
    {
        id: 'invoice_generator',
        name: 'Invoice Generator',
        description: 'Auto-generate professional invoices for eBay sales',
        icon: FileText,
        productSlug: 'invoicegen',
        appUrl: 'https://invoicegen.automationalchemists.com',
    },
    {
        id: 'list_flow',
        name: 'ListFlow',
        description: 'Product tracking and listing — faster AutoDS alternative',
        icon: Sparkles,
        productSlug: 'listflow',
        appUrl: 'https://listflow.automationalchemists.com',
    }
];

// TODO: Add upcoming tools here
const COMING_SOON_TOOLS: Tool[] = [
    {
        id: 'profit_tracker',
        name: 'Profit Tracker Pro',
        description: 'Advanced analytics and real-time margin tracking',
        icon: AlertCircle,
    }
];

const SkeletonCard = () => (
    <div className="bg-[#111] rounded-xl overflow-hidden border border-[#2a2a2a] animate-pulse">
        <div className="h-[80px] bg-[#222]"></div>
        <div className="p-6 space-y-4">
            <div className="h-6 bg-[#2a2a2a] rounded w-3/4"></div>
            <div className="h-4 bg-[#2a2a2a] rounded w-full"></div>
            <div className="h-4 bg-[#2a2a2a] rounded w-5/6"></div>
            <div className="pt-4 flex items-center justify-between">
                <div className="h-6 bg-[#2a2a2a] rounded w-24"></div>
                <div className="h-10 bg-[#2a2a2a] rounded w-28"></div>
            </div>
        </div>
    </div>
);

const ToolCard = ({ 
    tool, 
    type 
}: { 
    tool: Tool & { currentPeriodEnd?: string }; 
    type: 'active' | 'available' | 'coming_soon' 
}) => {
    const Icon = tool.icon;
    
    let bannerClass = 'bg-[#2a2a2a]';
    let badge = null;
    let button = null;

    if (type === 'active') {
        bannerClass = 'bg-gradient-to-br from-[#1a1200] to-[#2a1f00]';
        badge = (
            <div className="flex flex-col gap-1 items-start">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Active
                </div>
                {tool.currentPeriodEnd && (
                    <div className="text-[10px] text-[#888] font-medium ml-1">
                        Renews {new Date(tool.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                )}
            </div>
        );
        button = (
            <Button asChild className="bg-[#D4AF37] hover:bg-[#c29f2f] text-black font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                <a href={tool.appUrl} target="_blank" rel="noopener noreferrer">
                    Open {tool.name}
                </a>
            </Button>
        );
    } else if (type === 'available') {
        bannerClass = 'bg-gradient-to-br from-[#1a1a1a] to-[#222]';
        badge = (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-400 text-xs font-semibold border border-zinc-500/20">
                <Lock className="w-3 h-3" />
                Not purchased
            </div>
        );
        button = (
            <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold h-10 px-5 rounded-lg text-sm transition-colors font-display w-full sm:w-auto">
                Buy now — $X/mo
            </Button>
        );
    } else if (type === 'coming_soon') {
        bannerClass = 'bg-gradient-to-br from-blue-900/20 to-purple-900/20';
        badge = (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                Coming soon
            </div>
        );
        button = (
            <Button disabled className="bg-[#2a2a2a] text-[#888] font-bold h-10 px-5 rounded-lg text-sm font-display cursor-not-allowed w-full sm:w-auto">
                Notify me
            </Button>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] rounded-xl overflow-hidden border border-[#2a2a2a] flex flex-col h-full"
        >
            <div className={`h-[80px] w-full flex items-center justify-center ${bannerClass} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                <Icon className="w-10 h-10 text-white/80 relative z-10" />
            </div>
            
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-white mb-2 font-display">{tool.name}</h3>
                <p className="text-[#888] text-sm mb-6 flex-grow leading-relaxed">{tool.description}</p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-[#2a2a2a]">
                    {badge}
                    {button}
                </div>
            </div>
        </motion.div>
    );
};

interface SubscriptionData {
    product_slug: string | null;
    status: string | null;
    current_period_end: string | null;
}

const Dashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);

    useEffect(() => {
        // Simple auth protection
        if (!authLoading && user === null) {
            navigate('/auth');
            return;
        }

        if (user) {
            const fetchLicenses = async () => {
                setIsLoading(true);
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { data, error } = await (supabase as any)
                        .from('subscriptions')
                        .select('product_slug, status, current_period_end')
                        .eq('user_id', user.id);
                    
                    if (!error && data) {
                        setSubscriptions(data);
                    }
                } catch (err) {
                    console.error("Error fetching licenses:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchLicenses();
        }
    }, [user, authLoading, navigate]);

    // Categorize tools
    const activeTools = ALL_TOOLS.map(t => {
        const sub = subscriptions.find(s => s.product_slug === t.productSlug && s.status === 'active');
        return {
            ...t,
            currentPeriodEnd: sub?.current_period_end
        };
    }).filter(t => t.alwaysActive || t.currentPeriodEnd);

    const availableTools = ALL_TOOLS.filter(t => {
        if (t.alwaysActive) return false;
        const sub = subscriptions.find(s => s.product_slug === t.productSlug && s.status === 'active');
        return !sub;
    });

    if (authLoading || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-surface-dark flex flex-col">
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
                                <div className="h-4 bg-[#2a2a2a] w-32 rounded mb-6 animate-pulse" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </div>
                            </section>
                            <section>
                                <div className="h-4 bg-[#2a2a2a] w-48 rounded mb-6 animate-pulse" />
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
                                        {activeTools.map(tool => (
                                            <ToolCard key={tool.id} tool={tool} type="active" />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* SECTION 2: Available to purchase */}
                            {availableTools.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-6 font-display">Available to purchase</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {availableTools.map(tool => (
                                            <ToolCard key={tool.id} tool={tool} type="available" />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* SECTION 3: Coming soon */}
                            {COMING_SOON_TOOLS.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-[#888] uppercase tracking-wider mb-6 font-display">Coming soon</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {COMING_SOON_TOOLS.map(tool => (
                                            <ToolCard key={tool.id} tool={tool} type="coming_soon" />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default Dashboard;
