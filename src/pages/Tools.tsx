import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Helmet } from "react-helmet-async";
import { toolsData } from "@/data/tools";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, ArrowRight } from "lucide-react";

const Tools = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleGetAccess = (e: React.MouseEvent) => {
        e.preventDefault();
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/auth');
        }
    };

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

    return (
        <div className="min-h-screen bg-[#aaccd6] text-[#1c1b1b] antialiased flex flex-col font-body-md">
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

            <main className="flex-grow pt-32 pb-24">
                {/* Hero Section */}
                <section className="max-w-[1280px] mx-auto px-4 md:px-12 mb-24">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-[#112E81] rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl"
                    >
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#5152b9]/30 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#c6e8f3]/30 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-white font-label-sm text-xs uppercase tracking-wider mb-6 border border-white/20 backdrop-blur-sm">Our SaaS Tools</span>
                            <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-6">Built for eBay Sellers</h1>
                            <p className="font-body-lg text-lg text-white/80 mb-10 max-w-2xl mx-auto">
                                Automation tools designed specifically for Amazon-to-eBay dropshippers. Australian market, globally built.
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* Tools Grid */}
                <section className="max-w-[1280px] mx-auto px-4 md:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* CP Bot Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="bg-white rounded-2xl p-8 border border-[#757683]/50 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#112E81]/5 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="relative z-10 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-label-sm text-xs text-[#112E81] uppercase tracking-wider font-semibold">Order Fulfilment & Returns</span>
                                    <div className="flex gap-2">
                                        <span className="bg-[#e5e2e1] text-[#444651] px-2 py-1 rounded text-xs font-semibold">Free</span>
                                        <span className="bg-[#dce1ff] text-[#112E81] px-2 py-1 rounded text-xs font-semibold">Paid</span>
                                    </div>
                                </div>
                                <h2 className="font-headline-md text-2xl font-bold text-[#1c1b1b] mb-3 group-hover:text-[#112E81] transition-colors">CP Bot & Return Converter</h2>
                                <p className="font-body-md text-base text-[#444651] mb-6">One-click eBay to Amazon order fulfilment plus instant return label generation — two tools in one platform.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#112E81] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">One-click copy</strong> <span className="text-[#444651]">- Copy eBay address to Amazon in one click</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#112E81] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">Instant labels</strong> <span className="text-[#444651]">- Generate eBay return labels instantly</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#112E81] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">History tracking</strong> <span className="text-[#444651]">- Fulfilment history and activity tracking</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#112E81] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">Cloud clipboard</strong> <span className="text-[#444651]">- Cloud clipboard for cross-device sync</span></div>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-auto border-t border-[#757683]/30 pt-6 relative z-10">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-label-md text-sm text-[#444651]">Return Converter: <strong className="text-[#1c1b1b]">Free</strong></span>
                                    <span className="font-label-md text-sm text-[#444651]">CP Bot: <strong className="text-[#1c1b1b]">A$9/mo</strong></span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <a className="flex-1 text-center py-2.5 px-4 rounded-lg border border-[#112E81] text-[#112E81] font-label-md text-sm font-semibold hover:bg-[#112E81]/5 transition-colors" href="https://rccp.automationalchemists.com" target="_blank" rel="noopener noreferrer">Use Free Tool →</a>
                                    <a className="flex-1 text-center py-2.5 px-4 rounded-lg bg-[#112E81] text-white font-label-md text-sm font-semibold hover:bg-[#112E81]/90 transition-colors shadow-md" href="https://rccp.automationalchemists.com" target="_blank" rel="noopener noreferrer">Get CP Bot →</a>
                                </div>
                            </div>
                        </motion.div>

                        {/* ListFlow Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="bg-white rounded-2xl p-8 border border-[#757683]/50 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#5152b9]/5 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="relative z-10 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-label-sm text-xs text-[#5152b9] uppercase tracking-wider font-semibold">Product Management</span>
                                    <span className="bg-[#dce1ff] text-[#112E81] px-2 py-1 rounded text-xs font-semibold">Paid</span>
                                </div>
                                <h2 className="font-headline-md text-2xl font-bold text-[#1c1b1b] mb-3 group-hover:text-[#5152b9] transition-colors">ListFlow</h2>
                                <p className="font-body-md text-base text-[#444651] mb-6">Track, list, and monitor products across eBay. A faster AutoDS alternative.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#5152b9] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">Bulk listing</strong> <span className="text-[#444651]">- Import and list dozens of products from Amazon to eBay in seconds.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#5152b9] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">Price monitoring</strong> <span className="text-[#444651]">- Get alerts when prices change on Amazon to protect your margins.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#5152b9] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">Inventory sync</strong> <span className="text-[#444651]">- Automatically update your stock levels when items go out of stock.</span></div>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-auto border-t border-[#757683]/30 pt-6 relative z-10">
                                <div className="flex items-end mb-6">
                                    <span className="font-headline-md text-2xl text-[#1c1b1b] font-bold">$19</span>
                                    <span className="font-body-md text-base text-[#444651] ml-1 pb-1">/month</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <button onClick={handleGetAccess} className="flex-1 text-center py-2.5 px-4 rounded-lg bg-[#5152b9] text-white font-label-md text-sm font-semibold hover:bg-[#5152b9]/90 transition-colors shadow-md">Get access</button>
                                    <Link to="/tools/listflow" className="text-[#5152b9] font-label-md text-sm font-semibold hover:underline flex items-center gap-1">Learn more <ArrowRight className="w-4 h-4" /></Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* Order Bot Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="bg-white rounded-2xl p-8 border border-[#757683]/50 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="relative z-10 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-label-sm text-xs text-[#183a42] uppercase tracking-wider font-semibold">Notifications</span>
                                    <span className="bg-[#dce1ff] text-[#112E81] px-2 py-1 rounded text-xs font-semibold">Paid</span>
                                </div>
                                <h2 className="font-headline-md text-2xl font-bold text-[#1c1b1b] mb-3 group-hover:text-[#183a42] transition-colors">Order Bot</h2>
                                <p className="font-body-md text-base text-[#444651] mb-6">Get instant WhatsApp or Discord alerts the moment you receive a new eBay order.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#183a42] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">WhatsApp alerts</strong> <span className="text-[#444651]">- Receive a message directly to your phone the instant a sale occurs.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#183a42] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">Discord integration</strong> <span className="text-[#444651]">- Push order notifications to a dedicated channel in your Discord server.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#183a42] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">Real-time speed</strong> <span className="text-[#444651]">- Alerts are delivered in milliseconds, ensuring you can act fast.</span></div>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-auto border-t border-[#757683]/30 pt-6 relative z-10">
                                <div className="flex items-end mb-6">
                                    <span className="font-headline-md text-2xl text-[#1c1b1b] font-bold">$7</span>
                                    <span className="font-body-md text-base text-[#444651] ml-1 pb-1">/month</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <button onClick={handleGetAccess} className="flex-1 text-center py-2.5 px-4 rounded-lg bg-[#183a42] text-white font-label-md text-sm font-semibold hover:bg-[#183a42]/90 transition-colors shadow-md">Get access</button>
                                    <Link to="/tools/order-bot" className="text-[#183a42] font-label-md text-sm font-semibold hover:underline flex items-center gap-1">Learn more <ArrowRight className="w-4 h-4" /></Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* Invoice Generator Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="bg-white rounded-2xl p-8 border border-[#757683]/50 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="relative z-10 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-label-sm text-xs text-[#4259ac] uppercase tracking-wider font-semibold">Invoicing</span>
                                    <span className="bg-[#dce1ff] text-[#112E81] px-2 py-1 rounded text-xs font-semibold">Paid</span>
                                </div>
                                <h2 className="font-headline-md text-2xl font-bold text-[#1c1b1b] mb-3 group-hover:text-[#4259ac] transition-colors">Invoice Generator</h2>
                                <p className="font-body-md text-base text-[#444651] mb-6">Auto-generate professional invoices for your eBay sales in one click.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#4259ac] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">One-click creation</strong> <span className="text-[#444651]">- Generate a full invoice directly from the order page instantly.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#4259ac] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">Custom branding</strong> <span className="text-[#444651]">- Add your store's logo, address, and ABN to look highly professional.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-[#4259ac] w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-[#1c1b1b]">PDF export</strong> <span className="text-[#444651]">- Download ready-to-send PDF files that you can easily attach to messages.</span></div>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-auto border-t border-[#757683]/30 pt-6 relative z-10">
                                <div className="flex items-end mb-6">
                                    <span className="font-headline-md text-2xl text-[#1c1b1b] font-bold">$5</span>
                                    <span className="font-body-md text-base text-[#444651] ml-1 pb-1">/month</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <button onClick={handleGetAccess} className="flex-1 text-center py-2.5 px-4 rounded-lg bg-[#4259ac] text-white font-label-md text-sm font-semibold hover:bg-[#4259ac]/90 transition-colors shadow-md">Get access</button>
                                    <Link to="/tools/invoice-generator" className="text-[#4259ac] font-label-md text-sm font-semibold hover:underline flex items-center gap-1">Learn more <ArrowRight className="w-4 h-4" /></Link>
                                </div>
                            </div>
                        </motion.div>
                        
                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-[1280px] mx-auto px-4 md:px-12 mt-24">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="bg-white/60 backdrop-blur-md rounded-2xl p-12 text-center border border-[#757683]/30 shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="font-headline-lg text-3xl md:text-4xl font-bold text-[#112E81] mb-4">Need a custom solution?</h2>
                            <p className="font-body-lg text-lg text-[#444651] mb-8">
                                We build bespoke automation solutions for eBay and Amazon sellers. If you have a workflow that needs automating, let's talk.
                            </p>
                            <Link to="/contact" className="inline-block bg-[#112E81] text-white font-label-md text-sm font-semibold px-8 py-3 rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                                Get in Touch
                            </Link>
                        </div>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Tools;
