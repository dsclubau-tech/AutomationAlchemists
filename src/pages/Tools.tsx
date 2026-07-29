import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { Helmet } from "react-helmet-async";
import { toolsData, ToolData } from "@/data/tools";
import { useAuth } from "@/hooks/useAuth";

const ToolCard = ({ tool, isFullWidth = false, index }: { tool: ToolData; isFullWidth?: boolean; index: number }) => {
    const Icon = tool.icon;
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleGetAccess = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/auth');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
            className={`flex flex-col bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#D4AF37]/40 transition-all duration-300 ${isFullWidth ? 'md:col-span-2' : ''}`}
        >
            {/* Top Banner */}
            <div 
                className="h-[160px] relative flex items-center justify-center shrink-0"
                style={{ backgroundColor: tool.bannerBg }}
            >
                {/* Badge */}
                <div className="absolute top-4 right-4">
                    {tool.isFree ? (
                        <span className="bg-[#4caf50]/20 text-[#4caf50] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Free
                        </span>
                    ) : (
                        <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Paid
                        </span>
                    )}
                </div>
                
                {/* Icon */}
                <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                    <Icon className="w-12 h-12 text-white/90" />
                </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 flex flex-col flex-1">
                <div className="mb-6 flex-1">
                    <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-2 block font-display">
                        {tool.category}
                    </span>
                    <h2 className="text-2xl font-bold text-white mb-3 font-display">
                        {tool.name}
                    </h2>
                    <p className="text-[#888] text-sm leading-relaxed mb-6 line-clamp-3">
                        {tool.shortDescription}
                    </p>
                    
                    <ul className="space-y-3">
                        {tool.features.map((feature, i) => (
                            <li key={i} className="flex items-start text-sm text-[#ccc]">
                                <span className="text-[#D4AF37] mr-3 mt-1.5 leading-none text-xs">●</span>
                                <span><span className="text-white font-medium">{feature.title}</span> - {feature.description}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
                    <div className="text-white font-bold font-display">
                        {tool.price}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link to={`/tools/${tool.slug}`} className="flex-1 sm:flex-none">
                            <Button variant="outline" className="w-full sm:w-auto border-[#2a2a2a] hover:bg-[#2a2a2a] hover:text-white font-display">
                                Learn more
                            </Button>
                        </Link>
                        <Button 
                            onClick={handleGetAccess}
                            className="flex-1 sm:flex-none bg-[#D4AF37] hover:bg-[#c29f2f] text-black font-bold font-display"
                        >
                            Get access
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const Tools = () => {
    // Generate JSON-LD schema for each tool
    const toolSchemas = toolsData.map((tool) => ({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.shortDescription,
        applicationCategory: "BusinessApplication",
        url: `https://www.automationalchemists.com/tools/${tool.slug}`,
        operatingSystem: "Web",
        offers: {
            "@type": "Offer",
            price: tool.isFree ? "0" : tool.price.replace(/[^0-9]/g, ''),
            priceCurrency: "AUD",
        },
        author: {
            "@type": "Organization",
            name: "Automation Alchemists",
        },
    }));

    const regularTools = toolsData.filter(t => t.slug !== 'returnlabels');
    const fullWidthTool = toolsData.find(t => t.slug === 'returnlabels');

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEOHead
                title="SaaS Tools for eBay & Amazon Dropshipping | Automation Alchemists"
                description="Automation tools designed specifically for Amazon-to-eBay dropshippers. Australian market, globally built."
                url="https://www.automationalchemists.com/tools"
                keywords="eBay automation, Amazon dropshipping tools, eBay seller tools, order bot, invoice generator, return labels, listing tool, Australia"
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(toolSchemas)}
                </script>
            </Helmet>
            
            <Navigation />

            {/* Page Header */}
            <section className="pt-32 pb-16 px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-[#D4AF37] text-sm font-bold tracking-widest uppercase mb-4 block font-display">
                            OUR SAAS TOOLS
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 font-display">
                            Built for eBay Sellers
                        </h1>
                        <p className="text-lg md:text-xl text-[#888] font-display max-w-2xl mx-auto leading-relaxed">
                            Automation tools designed specifically for Amazon-to-eBay dropshippers. Australian market, globally built.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="pb-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        {regularTools.map((tool, index) => (
                            <ToolCard key={tool.id} tool={tool} index={index} />
                        ))}
                        {fullWidthTool && (
                            <ToolCard key={fullWidthTool.id} tool={fullWidthTool} index={regularTools.length} isFullWidth={true} />
                        )}
                    </div>
                </div>
            </section>

            {/* Custom Tool CTA */}
            <section className="py-24 bg-surface-dark border-t border-[#2a2a2a]">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-display">
                            Need a custom solution?
                        </h2>
                        <p className="text-[#888] mb-8 max-w-2xl mx-auto font-display">
                            We build bespoke automation solutions for eBay and Amazon sellers. If you have a workflow that needs automating, let's talk.
                        </p>
                        <Link to="/contact">
                            <Button
                                size="lg"
                                className="bg-[#D4AF37] hover:bg-[#c29f2f] text-black font-bold font-display"
                            >
                                Get in Touch
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Tools;
