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
            <div className="min-h-screen bg-[#aaccd6] text-[#1c1b1b] selection:bg-[#112E81] selection:text-white flex flex-col">
                <Navigation />
                <main className="flex-grow flex flex-col items-center justify-center pt-32 pb-24 text-center">
                    <h1 className="text-4xl font-bold mb-6 text-[#112E81] font-display">Tool not found</h1>
                    <Link to="/tools" className="text-[#112E81] hover:underline text-lg font-display">
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
        <div className="min-h-screen bg-[#aaccd6] text-[#1c1b1b] selection:bg-[#112E81] selection:text-white flex flex-col">
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
                    <div className="flex items-center text-sm text-[#444651] font-display">
                        <Link to="/tools" className="hover:text-[#112E81] transition-colors flex items-center">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Tools
                        </Link>
                        <ChevronRight className="w-4 h-4 mx-2" />
                        <span className="text-[#112E81] font-semibold">{tool.name}</span>
                    </div>
                </div>

                {/* Hero Section */}
                <section className="container mx-auto px-6 max-w-5xl mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-white border border-[#112E81]/20 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-md"
                    >
                        {/* Background glow */}
                        <div 
                            className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] opacity-10 pointer-events-none"
                            style={{ backgroundColor: tool.bannerBg === '#0d1117' || tool.bannerBg.startsWith('#0') ? '#aaccd6' : tool.bannerBg }} 
                        />

                        <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                            {/* Icon */}
                            <div className="shrink-0">
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-[#aaccd6]/20 border border-[#112E81]/20 rounded-2xl flex items-center justify-center shadow-lg shadow-[#112E81]/5">
                                    {tool.slug === 'rccp' ? (
                                        <img src="/images/rccp-logo.png" alt="CP Bot Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                                    ) : (
                                        <HeroIcon className="w-12 h-12 md:w-16 md:h-16 text-[#112E81]" />
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-grow">
                                <span className="text-[#00195c] text-sm font-bold tracking-widest uppercase mb-2 block font-display">
                                    {tool.category}
                                </span>
                                <h1 className="text-4xl md:text-5xl font-black mb-6 font-display">
                                    {tool.slug === 'rccp' ? (
                                        <>
                                            <span className="text-[#3354f4]">Return Converter</span>
                                            <span className="text-[#888] font-normal mx-2">x</span>
                                            <span className="text-[#00839e]">CopyPaste Bot</span>
                                        </>
                                    ) : (
                                        <span className="text-[#112E81]">{tool.name}</span>
                                    )}
                                </h1>
                                <p className="text-[#444651] text-lg md:text-xl leading-relaxed mb-8 max-w-3xl font-display">
                                    {tool.fullDescription ?? 'No description available'}
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="text-2xl font-bold text-[#1c1b1b] font-display">
                                        {tool.price}
                                        {tool.isFree ? '' : <span className="text-sm text-[#444651] font-normal ml-1">/month</span>}
                                    </div>
                                    <Button 
                                        size="lg"
                                        onClick={handleGetAccess}
                                        className="w-full sm:w-auto bg-[#112E81] hover:bg-[#112E81]/90 text-white shadow-md font-bold font-display px-8"
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
                        <h2 className="text-3xl font-bold text-[#112E81] mb-10 font-display">What's included</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {(tool.features ?? []).map((feature, i) => {
                                const FeatureIcon = iconMap[feature.icon] || CheckCircle2;
                                return (
                                    <div key={i} className="bg-white border border-[#112E81]/10 rounded-2xl p-6 shadow-sm hover:border-[#112E81]/30 hover:shadow-md transition-all">
                                        <div className="w-12 h-12 bg-[#112E81]/10 text-[#112E81] rounded-xl flex items-center justify-center mb-6">
                                            <FeatureIcon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#1c1b1b] mb-3 font-display">{feature.title}</h3>
                                        <p className="text-[#444651] leading-relaxed text-sm">
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
                        <h2 className="text-3xl font-bold text-[#112E81] mb-8 font-display">How it works</h2>
                        <div className="space-y-6">
                            {(tool.howItWorks ?? []).map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-[#112E81] text-white flex items-center justify-center font-bold font-display text-sm">
                                        {i + 1}
                                    </div>
                                    <p className="text-[#444651] mt-1">{step}</p>
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
                        <h2 className="text-3xl font-bold text-[#112E81] mb-8 font-display">Built for</h2>
                        <div className="bg-white border border-[#112E81]/10 shadow-sm rounded-2xl p-8">
                            <p className="text-[#444651] leading-relaxed text-lg">
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
                        className="bg-gradient-to-b from-white to-[#aaccd6]/30 border border-[#112E81]/10 shadow-sm rounded-3xl p-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-[#112E81] mb-6 font-display">Ready to get started?</h2>
                        <p className="text-lg text-[#444651] mb-8 font-display">
                            Join Automation Alchemists and scale your eBay dropshipping business today.
                        </p>
                        <Button 
                            size="lg"
                            onClick={handleGetAccess}
                            className="bg-[#112E81] hover:bg-[#112E81]/90 text-white shadow-md font-bold font-display px-10 py-6 text-lg"
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

