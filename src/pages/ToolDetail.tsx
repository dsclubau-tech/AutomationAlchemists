import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft, MousePointerClick, Zap, Chrome, Layers, LineChart, RefreshCw, MessageCircle, Hash, Clock, FileText, Image, Download, CheckCircle2, Gift, Icon, LucideIcon } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { toolsData, ToolData } from '@/data/tools';
import { useAuth } from '@/hooks/useAuth';

// Map icon strings to lucide-react components
const iconMap: Record<string, LucideIcon> = {
    'mouse-pointer-click': MousePointerClick,
    'zap': Zap,
    'chrome': Chrome,
    'layers': Layers,
    'line-chart': LineChart,
    'refresh-cw': RefreshCw,
    'message-circle': MessageCircle,
    'hash': Hash,
    'clock': Clock,
    'file-text': FileText,
    'image': Image,
    'download': Download,
    'check-circle-2': CheckCircle2,
    'gift': Gift
};

const ToolDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const tool = toolsData.find(t => t.slug === slug);

    useEffect(() => {
        if (tool) window.scrollTo(0, 0);
    }, [tool]);

    if (!tool) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Navigation />
                <main className="flex-grow flex flex-col items-center justify-center pt-32 pb-24 text-center">
                    <h1 className="text-4xl font-bold mb-6 text-white font-display">Tool not found</h1>
                    <Link to="/tools" className="text-primary hover:underline text-lg font-display">
                        return to Tools page
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    const HeroIcon = tool.icon || CheckCircle2;

    const handleGetAccess = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/auth');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <SEOHead
                title={`${tool.name} | Automation Alchemists`}
                description={tool.shortDescription}
                url={`https://www.automationalchemists.com/tools/${tool.slug}`}
                keywords={tool.seoKeywords}
            />
            <Navigation />

            <main className="flex-grow pt-32 pb-24">
                {/* Breadcrumbs */}
                <div className="container mx-auto px-6 max-w-5xl mb-12">
                    <div className="flex items-center text-sm text-[#888] font-display">
                        <Link to="/tools" className="hover:text-white transition-colors flex items-center">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Tools
                        </Link>
                        <ChevronRight className="w-4 h-4 mx-2" />
                        <span className="text-[#D4AF37]">{tool.name}</span>
                    </div>
                </div>

                {/* Hero Section */}
                <section className="container mx-auto px-6 max-w-5xl mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-surface-dark border border-primary/20 rounded-3xl p-8 md:p-12 relative overflow-hidden"
                    >
                        {/* Background glow based on bannerBg */}
                        <div 
                            className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] opacity-30 pointer-events-none"
                            style={{ backgroundColor: tool.bannerBg === '#0d1117' || tool.bannerBg.startsWith('#0') ? '#D4AF37' : tool.bannerBg }} // Fallback for very dark bgs
                        />

                        <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                            {/* Icon */}
                            <div className="shrink-0">
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-background border border-primary/30 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10">
                                    <HeroIcon className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-grow">
                                <span className="text-[#D4AF37] text-sm font-bold tracking-widest uppercase mb-2 block font-display">
                                    {tool.category}
                                </span>
                                <h1 className="text-4xl md:text-5xl font-black text-white mb-6 font-display">
                                    {tool.name}
                                </h1>
                                <p className="text-[#888] text-lg md:text-xl leading-relaxed mb-8 max-w-3xl font-display">
                                    {tool.fullDescription ?? 'No description available'}
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="text-2xl font-bold text-white font-display">
                                        {tool.price}
                                        {tool.isFree ? '' : <span className="text-sm text-[#888] font-normal ml-1">/month</span>}
                                    </div>
                                    <Button 
                                        size="lg"
                                        onClick={handleGetAccess}
                                        className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#c29f2f] text-black font-bold font-display px-8"
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
                        <h2 className="text-3xl font-bold text-white mb-10 font-display">What's included</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {(tool.features ?? []).map((feature, i) => {
                                const FeatureIcon = iconMap[feature.icon] || CheckCircle2;
                                return (
                                    <div key={i} className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 hover:border-primary/30 transition-colors">
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                                            <FeatureIcon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3 font-display">{feature.title}</h3>
                                        <p className="text-[#888] leading-relaxed text-sm">
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
                        <h2 className="text-3xl font-bold text-white mb-8 font-display">How it works</h2>
                        <div className="space-y-6">
                            {(tool.howItWorks ?? []).map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-[#2a2a2a] text-white flex items-center justify-center font-bold font-display text-sm">
                                        {i + 1}
                                    </div>
                                    <p className="text-[#888] mt-1">{step}</p>
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
                        <h2 className="text-3xl font-bold text-white mb-8 font-display">Built for</h2>
                        <div className="bg-[#111] border border-primary/20 rounded-2xl p-8">
                            <p className="text-[#888] leading-relaxed text-lg">
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
                        className="bg-gradient-to-b from-surface-dark to-background border border-[#2a2a2a] rounded-3xl p-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">Ready to get started?</h2>
                        <p className="text-lg text-[#888] mb-8 font-display">
                            Join Automation Alchemists and scale your eBay dropshipping business today.
                        </p>
                        <Button 
                            size="lg"
                            onClick={handleGetAccess}
                            className="bg-[#D4AF37] hover:bg-[#c29f2f] text-black font-bold font-display px-10 py-6 text-lg"
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
