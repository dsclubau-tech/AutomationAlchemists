import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import SchemaMarkup from "@/components/SchemaMarkup";

const Tools = () => {
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

    return (
        <div className="min-h-screen bg-mint-50 text-teal-900 selection:bg-teal-600 selection:text-white">
            <SEOHead
                title="Tools"
                description="Discover our custom tools: Return Converter, CopyPaste Bot, and ListFlow. Built for Amazon-to-eBay automation and dropshipping efficiency."
                keywords="Return Converter, CopyPaste Bot, ListFlow, eBay tools, Amazon dropshipping, automation tools"
            />
            <SchemaMarkup
                type="SoftwareApplication"
                data={{
                    name: "Automation Alchemists Tools",
                    description: "Suite of automation tools for e-commerce and dropshipping businesses.",
                    url: "https://automationalchemists.com/tools",
                    applicationCategory: "BusinessApplication"
                }}
            />
            <Navigation />

            <main className="pt-28 pb-20">
                {/* Hero Section */}
                <section className="max-w-[1280px] mx-auto px-4 md:px-12 mb-16">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-teal-800 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl"
                    >
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-600/30 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl"></div>
                        
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
                            className="bg-white rounded-2xl p-8 border border-teal-600/20 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/5 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="relative z-10 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-label-sm text-xs text-teal-600 uppercase tracking-wider font-semibold">Order Fulfilment & Returns</span>
                                    <div className="flex gap-2">
                                        <span className="bg-teal-600/10 text-teal-600 px-2 py-1 rounded text-xs font-semibold">Free</span>
                                        <span className="bg-teal-600/10 text-teal-600 px-2 py-1 rounded text-xs font-semibold">Paid</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-teal-600/10 rounded-xl">
                                        <img src="/images/rccp-logo.png" alt="Return Converter x CopyPaste Bot" className="w-8 h-8 object-contain" />
                                    </div>
                                    <h2 className="font-headline-md text-2xl font-bold transition-colors group-hover:opacity-80">
                                        <span className="text-teal-900">Return Converter</span> <span className="text-teal-900/40 font-normal mx-0.5">x</span> <span className="text-teal-600">CopyPaste Bot</span>
                                    </h2>
                                </div>
                                <p className="font-body-md text-base text-teal-900/80 mb-6">One-click eBay to Amazon order fulfilment plus instant return label generation — two tools in one platform.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">One-click copy</strong> <span className="text-teal-900/80">- Copy eBay address to Amazon in one click</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">Instant labels</strong> <span className="text-teal-900/80">- Generate eBay return labels instantly</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">History tracking</strong> <span className="text-teal-900/80">- Fulfilment history and activity tracking</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">Cloud clipboard</strong> <span className="text-teal-900/80">- Cloud clipboard for cross-device sync</span></div>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-auto border-t border-teal-600/20 pt-6 relative z-10">
                                <div className="flex justify-between items-center mb-6 px-1">
                                    <span className="font-label-md text-sm text-teal-900/80">Return Converter: <strong className="text-teal-900">Free</strong></span>
                                    <span className="font-label-md text-sm text-teal-900/80">CP Bot: <strong className="text-teal-900">AUD $19/mo</strong></span>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col xl:flex-row gap-3">
                                        <a className="flex-1 text-center py-2.5 px-4 rounded-lg border border-teal-600 text-teal-600 font-label-md text-sm font-semibold hover:bg-teal-600/10 transition-colors" href="https://rccp.automationalchemists.com" target="_blank" rel="noopener noreferrer">Use Free Tool</a>
                                        <a className="flex-1 text-center py-2.5 px-4 rounded-lg bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-label-md text-sm font-semibold transition-colors shadow-md" href="https://rccp.automationalchemists.com" target="_blank" rel="noopener noreferrer">Get CP Bot</a>
                                    </div>
                                    <div className="flex justify-end">
                                        <Link to="/tools/rccp" className="text-teal-600 font-label-md text-sm font-semibold hover:underline flex items-center gap-1">Learn more <ArrowRight className="w-4 h-4" /></Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ListFlow Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="bg-white rounded-2xl p-8 border border-teal-600/20 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/5 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="relative z-10 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-label-sm text-xs text-teal-600 uppercase tracking-wider font-semibold">Product Management</span>
                                    <span className="bg-teal-600/10 text-teal-600 px-2 py-1 rounded text-xs font-semibold">Paid</span>
                                </div>
                                <h2 className="font-headline-md text-2xl font-bold text-teal-900 mb-3 group-hover:text-teal-600 transition-colors">ListFlow</h2>
                                <p className="font-body-md text-base text-teal-900/80 mb-6">Track, list, and monitor products across eBay. A faster AutoDS alternative.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">Bulk listing</strong> <span className="text-teal-900/80">- Import and list dozens of products from Amazon to eBay in seconds.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">Price monitoring</strong> <span className="text-teal-900/80">- Get alerts when prices change on Amazon to protect your margins.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">Inventory sync</strong> <span className="text-teal-900/80">- Automatically update your stock levels when items go out of stock.</span></div>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-auto border-t border-teal-600/20 pt-6 relative z-10">
                                <div className="flex items-end gap-1 mb-6 border-t border-teal-800/10 pt-6">
                                    <span className="font-headline-md text-2xl text-teal-900 font-bold">AUD $59</span>
                                    <span className="font-label-md text-sm text-teal-900/80 mb-1">/month</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <button onClick={handleGetAccess} className="flex-1 text-center py-2.5 px-4 rounded-lg bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-label-md text-sm font-semibold transition-colors shadow-md">Get access</button>
                                    <Link to="/tools/listflow" className="text-teal-600 font-label-md text-sm font-semibold hover:underline flex items-center gap-1">Learn more <ArrowRight className="w-4 h-4" /></Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* Order Bot Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="bg-white rounded-2xl p-8 border border-teal-600/20 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="relative z-10 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-label-sm text-xs text-teal-600 uppercase tracking-wider font-semibold">Notifications</span>
                                    <span className="bg-teal-600/10 text-teal-600 px-2 py-1 rounded text-xs font-semibold">Paid</span>
                                </div>
                                <h2 className="font-headline-md text-2xl font-bold text-teal-900 mb-3 group-hover:text-teal-600 transition-colors">Order Bot</h2>
                                <p className="font-body-md text-base text-teal-900/80 mb-6">Get instant WhatsApp or Discord alerts the moment you receive a new eBay order.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">WhatsApp alerts</strong> <span className="text-teal-900/80">- Receive a message directly to your phone the instant a sale occurs.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">Discord integration</strong> <span className="text-teal-900/80">- Push order notifications to a dedicated channel in your Discord server.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">Real-time speed</strong> <span className="text-teal-900/80">- Alerts are delivered in milliseconds, ensuring you can act fast.</span></div>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-auto border-t border-teal-600/20 pt-6 relative z-10">
                                <div className="flex items-end gap-1 mb-6 border-t border-teal-800/10 pt-6">
                                    <span className="font-headline-md text-2xl text-teal-900 font-bold">AUD $7</span>
                                    <span className="font-label-md text-sm text-teal-900/80 mb-1">/month</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <button onClick={handleGetAccess} className="flex-1 text-center py-2.5 px-4 rounded-lg bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-label-md text-sm font-semibold transition-colors shadow-md">Get access</button>
                                    <Link to="/tools/order-bot" className="text-teal-600 font-label-md text-sm font-semibold hover:underline flex items-center gap-1">Learn more <ArrowRight className="w-4 h-4" /></Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* Invoice Generator Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="bg-white rounded-2xl p-8 border border-teal-600/20 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="relative z-10 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-label-sm text-xs text-teal-600 uppercase tracking-wider font-semibold">Invoicing</span>
                                    <span className="bg-teal-600/10 text-teal-600 px-2 py-1 rounded text-xs font-semibold">Paid</span>
                                </div>
                                <h2 className="font-headline-md text-2xl font-bold text-teal-900 mb-3 group-hover:text-teal-600 transition-colors">Invoice Generator</h2>
                                <p className="font-body-md text-base text-teal-900/80 mb-6">Auto-generate professional invoices for your eBay sales in one click.</p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">One-click creation</strong> <span className="text-teal-900/80">- Generate a full invoice directly from the order page instantly.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">Custom branding</strong> <span className="text-teal-900/80">- Add your store's logo, address, and ABN to look highly professional.</span></div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div><strong className="text-teal-900">PDF export</strong> <span className="text-teal-900/80">- Download ready-to-send PDF files that you can easily attach to messages.</span></div>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-auto border-t border-teal-600/20 pt-6 relative z-10">
                                <div className="flex items-end gap-1 mb-6 border-t border-teal-800/10 pt-6">
                                    <span className="font-headline-md text-2xl text-teal-900 font-bold">AUD $5</span>
                                    <span className="font-label-md text-sm text-teal-900/80 mb-1">/month</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <button onClick={handleGetAccess} className="flex-1 text-center py-2.5 px-4 rounded-lg bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-label-md text-sm font-semibold transition-colors shadow-md">Get access</button>
                                    <Link to="/tools/invoice-generator" className="text-teal-600 font-label-md text-sm font-semibold hover:underline flex items-center gap-1">Learn more <ArrowRight className="w-4 h-4" /></Link>
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
                        className="bg-white/60 backdrop-blur-md rounded-2xl p-12 text-center border border-teal-600/20 shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="font-headline-lg text-3xl md:text-4xl font-bold text-teal-900 mb-4">Need a custom solution?</h2>
                            <p className="font-body-lg text-lg text-teal-900/80 mb-8">
                                We build bespoke automation solutions for eBay and Amazon sellers. If you have a workflow that needs automating, let's talk.
                            </p>
                            <Link to="/contact" className="inline-block bg-yellow-accent text-teal-900 font-label-md text-sm font-semibold px-8 py-3 rounded-full hover:bg-yellow-accent/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
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
