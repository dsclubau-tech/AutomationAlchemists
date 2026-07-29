import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Billing = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/auth");
        }
    }, [user, loading, navigate]);

    if (loading || !user) {
        return null;
    }

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
                        
                        <div className="bg-surface-dark border border-primary/20 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                            <p className="text-xl text-primary font-display mb-4">Billing Portal Coming Soon</p>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                We are currently integrating our billing provider. Soon you will be able to manage all your tool subscriptions and payment methods here.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default Billing;
