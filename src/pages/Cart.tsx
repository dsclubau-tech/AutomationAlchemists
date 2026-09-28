import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowRight, CheckCircle, ShoppingCart, Trash2, CreditCard, Sparkles } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import PageLoader from "@/components/PageLoader";
import { supabase } from "@/integrations/supabase/client";

interface DbTool {
    slug: string;
    name: string;
    status: 'coming_soon' | 'available' | 'maintenance' | 'hidden';
    price_monthly: number;
    maintenance_message: string | null;
}

const TOOL_NAMES: Record<string, string> = {
    'rccp': 'CP Bot & Return Converter',
    'listflow': 'ListFlow',
    'orderbot': 'Order Bot',
    'invoicegen': 'Invoice Generator',
    'cpbot': 'CP Bot',
    'returnlabels': 'Return Label Generator'
};

const Cart = () => {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const checkoutStatus = searchParams.get('checkout');

    const [dbTools, setDbTools] = useState<Record<string, DbTool>>({});
    const [cartSlugs, setCartSlugs] = useState<string[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    // Initial auth check and cart load
    useEffect(() => {
        if (!authLoading && !user) {
            window.location.href = "/auth";
            return;
        }

        const existingCartStr = localStorage.getItem('cart');
        const cart = existingCartStr ? JSON.parse(existingCartStr) : [];
        setCartSlugs(cart);
    }, [user, authLoading]);

    // Handle post-checkout callbacks
    useEffect(() => {
        if (checkoutStatus === 'success') {
            toast({
                title: "Subscription Successful!",
                description: "Your new tool has been activated and added to your dashboard.",
            });
            // Clear cart if desired, but since they checkout one by one, 
            // maybe we just clear everything, or better, we let the dashboard handle it.
            localStorage.setItem('cart', JSON.stringify([]));
            navigate("/dashboard", { replace: true });
        } else if (checkoutStatus === 'cancel') {
            toast({
                title: "Checkout Cancelled",
                description: "Your checkout was cancelled. Your cart has been saved.",
                variant: "destructive"
            });
            navigate("/cart", { replace: true });
        }
    }, [checkoutStatus, navigate, toast]);

    // Fetch live tools data
    useEffect(() => {
        const fetchTools = async () => {
            const { data, error } = await supabase
                .from('tools')
                .select('slug, status, price_monthly, maintenance_message')
                .eq('status', 'available'); // Only fetch available tools for cart/upsell
                
            if (error) {
                console.error("Error fetching live tool data:", error);
                toast({
                    title: "Network Notice",
                    description: "Unable to load live pricing. Please try again later.",
                    variant: "destructive"
                });
                setLoadingData(false);
                return;
            }

            if (data) {
                const toolsMap: Record<string, DbTool> = {};
                data.forEach(t => {
                    toolsMap[t.slug] = {
                        ...t,
                        name: TOOL_NAMES[t.slug] || t.slug
                    } as DbTool;
                });
                setDbTools(toolsMap);
            }
            setLoadingData(false);
        };
        fetchTools();
    }, [toast]);

    const handleRemove = (slug: string) => {
        const updated = cartSlugs.filter(s => s !== slug);
        setCartSlugs(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
    };

    const handleAdd = (slug: string) => {
        if (!cartSlugs.includes(slug)) {
            const updated = [...cartSlugs, slug];
            setCartSlugs(updated);
            localStorage.setItem('cart', JSON.stringify(updated));
        }
    };

    const handleCheckout = async (slug: string) => {
        setCheckoutLoading(slug);
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { product_slug: slug, quantity: 1 }
            });

            if (error) throw error;

            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (err: any) {
            console.error("Checkout error:", err);
            toast({
                title: "Checkout Failed",
                description: err.message || "An unexpected error occurred during checkout.",
                variant: "destructive"
            });
            setCheckoutLoading(null);
        }
    };

    if (authLoading || (!user && !authLoading)) {
        return <PageLoader pageName="Authenticating..." />;
    }

    // Filter cart items to only those strictly 'available' in the DB
    const activeCartItems = cartSlugs.filter(slug => dbTools[slug] && dbTools[slug].status === 'available');
    const availableUpsells = Object.values(dbTools).filter(tool => !activeCartItems.includes(tool.slug));

    return (
        <div className="min-h-screen bg-mint-50 text-teal-900 selection:bg-teal-600 selection:text-white flex flex-col">
            <SEOHead
                title="Your Cart"
                description="Review your selected tools and proceed to checkout securely."
            />
            <Navigation />

            <main className="flex-grow pt-32 pb-24 max-w-[1280px] mx-auto w-full px-4 md:px-12">
                <div className="mb-10 flex items-center gap-3">
                    <div className="p-3 bg-teal-600/10 rounded-2xl text-teal-600">
                        <ShoppingCart className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="font-display text-3xl md:text-4xl font-bold text-teal-900">Your Cart</h1>
                        <p className="font-body-md text-teal-900/60 mt-1">Review your selections and start automating.</p>
                    </div>
                </div>

                {loadingData ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-32 bg-teal-600/10 rounded-2xl w-full max-w-3xl"></div>
                        <div className="h-32 bg-teal-600/10 rounded-2xl w-full max-w-3xl"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Cart Items Section */}
                        <div className="lg:col-span-8 space-y-6">
                            {activeCartItems.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-teal-600/10 shadow-sm">
                                    <ShoppingCart className="w-16 h-16 text-teal-600/20 mx-auto mb-4" />
                                    <h3 className="font-headline-md text-xl font-bold text-teal-900 mb-2">Your cart is empty</h3>
                                    <p className="text-teal-900/60 mb-8 max-w-md mx-auto">You haven't added any tools to your cart yet. Browse our tools to get started.</p>
                                    <Link to="/tools" className="inline-flex items-center gap-2 bg-yellow-accent text-teal-900 font-label-md text-sm font-semibold px-6 py-3 rounded-full hover:bg-yellow-accent/90 transition-colors shadow-sm">
                                        Browse Tools <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-teal-600/5 border border-teal-600/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm font-body-md text-teal-900/80">
                                            Checkout is processed individually per tool to ensure your subscriptions remain distinct and easy to manage on your dashboard.
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {activeCartItems.map((slug) => {
                                            const tool = dbTools[slug];
                                            return (
                                                <motion.div 
                                                    key={slug}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-white rounded-2xl p-6 border border-teal-600/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group"
                                                >
                                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                                        <div className="w-16 h-16 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-teal-600/10">
                                                            {slug === 'rccp' ? (
                                                                <img src="/images/rccp-logo.png" alt="RCCP" className="w-10 h-10 object-contain" />
                                                            ) : (
                                                                <Sparkles className="w-8 h-8 text-teal-600/50" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-headline-md text-xl font-bold text-teal-900">{tool.name}</h3>
                                                            <p className="text-teal-600 font-label-sm font-semibold uppercase tracking-wider text-xs mt-1">Monthly Subscription</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between w-full md:w-auto gap-8">
                                                        <div className="text-right">
                                                            <div className="font-headline-md text-2xl font-bold text-teal-900">
                                                                ${tool.price_monthly}
                                                            </div>
                                                            <div className="text-teal-900/50 text-xs">AUD / month</div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => handleRemove(slug)}
                                                                className="p-3 text-teal-900/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                                title="Remove from cart"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleCheckout(slug)}
                                                                disabled={checkoutLoading === slug}
                                                                className="flex items-center justify-center gap-2 bg-teal-800 text-white font-label-md text-sm font-semibold px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors shadow-md min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {checkoutLoading === slug ? (
                                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                ) : (
                                                                    <>
                                                                        <CreditCard className="w-4 h-4" /> Checkout
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Upsell / You Might Also Like Section */}
                        <div className="lg:col-span-4">
                            {availableUpsells.length > 0 && (
                                <div className="bg-teal-50 rounded-2xl p-8 border border-teal-600/10 sticky top-32">
                                    <h3 className="font-headline-md text-lg font-bold text-teal-900 mb-6 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-teal-600" /> You might also like
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        {availableUpsells.map(tool => (
                                            <div key={tool.slug} className="bg-white rounded-xl p-4 border border-teal-600/10 shadow-sm flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-headline-md text-md font-bold text-teal-900">{tool.name}</h4>
                                                    <span className="font-semibold text-teal-600 text-sm">${tool.price_monthly}/mo</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleAdd(tool.slug)}
                                                    className="w-full text-center py-2 rounded-lg border border-teal-600/20 text-teal-700 font-label-md text-xs font-semibold hover:bg-teal-600/5 transition-colors"
                                                >
                                                    Add to Cart
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Cart;
