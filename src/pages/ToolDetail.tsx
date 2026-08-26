import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toolsData } from "@/data/tools";
import { 
    ArrowLeft, 
    CheckCircle2, 
    Zap, 
    Shield, 
    Clock, 
    Smartphone, 
    RefreshCw, 
    Database, 
    Wrench,
    Bot,
    ChevronRight,
    LucideIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";

// Map string icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
    Zap,
    Shield,
    Clock,
    Smartphone,
    RefreshCw,
    Database,
    Wrench,
    Bot,
    CheckCircle2
};

const ToolDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const tool = toolsData.find((t) => t.slug === slug);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleGetAccess = () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please sign in or create an account to get access to this tool.",
                variant: "destructive"
            });
            setTimeout(() => {
                window.location.href = "/auth";
            }, 1500);
            return;
        }

        window.location.href = "/pricing";
    };

    if (!tool) {
        return (
            <div className="min-h-screen bg-mint-50 flex flex-col justify-between">
                <Navigation />
                <div className="container mx-auto px-6 py-32 text-center">
                    <h1 className="text-4xl font-bold mb-4 font-display text-teal-900">Tool Not Found</h1>
                    <p className="text-teal-900/80 mb-8 font-display">The tool you are looking for does not exist.</p>
                    <Link to="/tools">
                        <Button className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90">Back to Tools</Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const HeroIcon = iconMap[tool.icon] || Wrench;

    return (
        <div className="min-h-screen bg-mint-50 text-teal-900 selection:bg-teal-600 selection:text-white flex flex-col justify-between">
            <SEOHead
                title={`${tool.name} | Automation Alchemists`}
                description={tool.fullDescription || tool.description}
                url={`https://www.automationalchemists.com/tools/${tool.slug}`}
                keywords={tool.seoKeywords}
            />
            <Navigation />

            <main className="flex-grow pt-32 pb-24">
                {/* Breadcrumbs */}
                <div className="container mx-auto px-6 max-w-5xl mb-12">
                    <div className="flex items-center text-sm text-teal-900/80 font-display">
                        <Link to="/tools" className="hover:text-teal-600 transition-colors flex items-center">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Tools
                        </Link>
                        <ChevronRight className="w-4 h-4 mx-2" />
                        <span className="text-teal-600 font-semibold">{tool.name}</span>
                    </div>
                </div>

                {/* Hero Section */}
                <section className="container mx-auto px-6 max-w-5xl mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-white border border-teal-600/20 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-md"
                    >
                        {/* Background glow */}
                        <div 
                            className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] opacity-10 pointer-events-none"
                            style={{ backgroundColor: tool.bannerBg === '#0d1117' || tool.bannerBg.startsWith('#0') ? '#207680' : tool.bannerBg }} 
                        />

                        <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                            {/* Icon */}
                            <div className="shrink-0">
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-mint-50/20 border border-teal-600/20 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-900/5">
                                    {tool.slug === 'rccp' ? (
                                        <img src="/images/rccp-logo.png" alt="CP Bot Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                                    ) : (
                                        <HeroIcon className="w-12 h-12 md:w-16 md:h-16 text-teal-600" />
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-grow">
                                <span className="text-teal-900 text-sm font-bold tracking-widest uppercase mb-2 block font-display">
                                    {tool.category}
                                </span>
                                <h1 className="text-4xl md:text-5xl font-black mb-6 font-display">
                                    {tool.slug === 'rccp' ? (
                                        <>
                                            <span className="text-teal-900">Return Converter</span>
                                            <span className="text-teal-900/40 font-normal mx-2">x</span>
                                            <span className="text-teal-600">CopyPaste Bot</span>
                                        </>
                                    ) : (
                                        <span className="text-teal-900">{tool.name}</span>
                                    )}
                                </h1>
                                <p className="text-teal-900/80 text-lg md:text-xl leading-relaxed mb-8 max-w-3xl font-display">
                                    {tool.fullDescription ?? 'No description available'}
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="text-2xl font-bold text-teal-900 font-display">
                                        {tool.price}
                                        {tool.isFree ? '' : <span className="text-sm text-teal-900/80 font-normal ml-1">/month</span>}
                                    </div>
                                    <Button 
                                        size="lg"
                                        onClick={handleGetAccess}
                                        className="w-full sm:w-auto bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 shadow-md font-bold font-display px-8"
                                    >
                                        {tool.isFree ? 'Use now free' : 'Get access'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Features Section */}
                <section className="container mx-auto px-6 max-w-5xl mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <h2 className="text-3xl font-bold text-teal-900 mb-10 font-display">What's included</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {(tool.features ?? []).map((feature, i) => {
                                const FeatureIcon = iconMap[feature.icon] || CheckCircle2;
                                return (
                                    <div key={i} className="bg-white border border-teal-600/20 rounded-2xl p-6 shadow-sm hover:border-teal-600/40 hover:shadow-md transition-all">
                                        <div className="w-12 h-12 bg-teal-600/10 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                                            <FeatureIcon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-teal-900 mb-3 font-display">{feature.title}</h3>
                                        <p className="text-teal-900/80 leading-relaxed text-sm">
                                            {feature.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </section>

                <div className="container mx-auto px-6 max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
                    {/* How it works */}
                    <motion.section
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <h2 className="text-3xl font-bold text-teal-900 mb-8 font-display">How it works</h2>
                        <div className="space-y-6">
                            {(tool.howItWorks ?? []).map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold font-display text-sm">
                                        {i + 1}
                                    </div>
                                    <p className="text-teal-900/80 mt-1">{step}</p>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Who it's for */}
                    <motion.section
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <h2 className="text-3xl font-bold text-teal-900 mb-8 font-display">Built for</h2>
                        <div className="bg-white border border-teal-600/20 shadow-sm rounded-2xl p-8">
                            <p className="text-teal-900/80 leading-relaxed text-lg">
                                {tool.builtFor ?? 'N/A'}
                            </p>
                        </div>
                    </motion.section>
                </div>

                {/* Bottom CTA */}
                <section className="container mx-auto px-6 max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="bg-white border border-teal-600/20 shadow-sm rounded-3xl p-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-6 font-display">Ready to get started?</h2>
                        <p className="text-lg text-teal-900/80 mb-8 font-display">
                            Join Automation Alchemists and scale your eBay dropshipping business today.
                        </p>
                        <Button 
                            size="lg"
                            onClick={handleGetAccess}
                            className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 shadow-md font-bold font-display px-10 py-6 text-lg"
                        >
                            {tool.isFree ? 'Start using free' : 'Get access now'}
                        </Button>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default ToolDetail;
