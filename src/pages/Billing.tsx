import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { redirectToBillingPortal } from "@/lib/checkout";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Loader2 } from "lucide-react";

const Billing = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/auth");
        }
    }, [user, loading, navigate]);

    if (loading || !user) {
        return null;
    }

    const handleManageSubscription = async () => {
        setIsRedirecting(true);
        try {
            await redirectToBillingPortal(toast);
        } finally {
            setIsRedirecting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-body">
            <SEOHead
                title="Billing | Automation Alchemists"
                description="Manage your Automation Alchemists billing and subscriptions."
                noindex={true}
            />
            
            <Navigation />
            
            <main className="flex-grow pt-32 pb-20">
                <div className="container mx-auto px-6 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-8"
                    >
                        <div>
                            <h1 className="text-3xl font-bold font-display mb-2">Billing & Subscriptions</h1>
                            <p className="text-muted-foreground">Manage your payment methods and tool subscriptions.</p>
                        </div>
                        
                        <div className="bg-teal-900 border border-teal-800 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                            <div className="w-12 h-12 rounded-full bg-teal-800/80 border border-teal-600/30 flex items-center justify-center text-yellow-accent mb-4">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white font-display mb-2">Customer Billing Portal</h2>
                            <p className="text-mint-50/70 max-w-md mx-auto mb-6">
                                Update payment methods, view invoices and receipts, or manage active tool subscriptions through the secure Stripe billing portal.
                            </p>
                            <Button
                                onClick={handleManageSubscription}
                                disabled={isRedirecting}
                                className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors font-display"
                            >
                                {isRedirecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Redirecting to Stripe...
                                    </>
                                ) : (
                                    "Manage subscription"
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default Billing;
