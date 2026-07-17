import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, List, Bell, FileText, Undo2, MousePointerClick, MapPin } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import SchemaMarkup from "@/components/SchemaMarkup";
import { Helmet } from "react-helmet-async";

// TODO: Replace placeholder "#" URLs with actual external tool URLs once provided
const tools = [
    {
        id: "listflow",
        name: "ListFlow",
        icon: List,
        description: "Product tracking, listing, and price monitoring for eBay sellers — a faster, leaner alternative to AutoDS.",
        cta: "Visit ListFlow",
        url: "#", // TODO: Replace with actual ListFlow URL
    },
    {
        id: "order-bot",
        name: "Order Bot",
        icon: Bell,
        description: "Get instant WhatsApp or Discord alerts the moment you receive a new eBay order.",
        cta: "Visit Order Bot",
        url: "#", // TODO: Replace with actual Order Bot URL
    },
    {
        id: "invoice-generator",
        name: "Invoice Generator",
        icon: FileText,
        description: "Auto-generate professional invoices for your eBay sales in one click.",
        cta: "Visit Invoice Generator",
        url: "#", // TODO: Replace with actual Invoice Generator URL
    },
    {
        id: "return-label-generator",
        name: "Return Label Generator",
        icon: Undo2,
        description: "Generate eBay return shipping labels instantly, no manual lookup.",
        cta: "Visit Return Label Generator",
        url: "#", // TODO: Replace with actual Return Label Generator URL
    },
    {
        id: "cpbot",
        name: "CPBot",
        icon: MousePointerClick,
        description: "One-click copy of eBay customer address, one-click order fill on Amazon — streamlines fulfillment between marketplaces.",
        cta: "Visit CPBot",
        url: "#", // TODO: Replace with actual CPBot URL
    },
];

const Tools = () => {
    // Build SoftwareApplication JSON-LD for each tool
    const toolSchemas = tools.map((tool) => ({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.description,
        applicationCategory: "BusinessApplication",
        url: tool.url === "#" ? "https://www.automationalchemists.com/tools" : tool.url,
        operatingSystem: "Web",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "AUD",
        },
        author: {
            "@type": "Organization",
            name: "AAlchemists",
        },
    }));

    return (
        <div className="min-h-screen bg-background">
            <SEOHead
                title="SaaS Tools for eBay & Amazon Dropshipping | AAlchemists"
                description="Automation tools built for Australian eBay sellers who dropship from Amazon. Covers order notifications, invoicing, returns, order fulfillment, and product listing."
                url="https://www.automationalchemists.com/tools"
                keywords="eBay automation, Amazon dropshipping tools, eBay seller tools, order bot, invoice generator, return labels, listing tool, Australia"
            />
            {/* SoftwareApplication JSON-LD for each tool */}
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(toolSchemas)}
                </script>
            </Helmet>
            <Navigation />

            {/* Hero Section */}
            <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden pt-20">
                <div className="container mx-auto px-6 py-24 sm:py-32 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-display">
                            <span className="bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                                Our SaaS Tools for eBay & Amazon Dropshipping
                            </span>
                        </h1>
                        <p className="text-sm sm:text-base md:text-lg text-foreground mb-6 max-w-3xl mx-auto font-display leading-relaxed">
                            Purpose-built automation tools for Australian eBay sellers who dropship from Amazon.
                            From instant order notifications and one-click invoicing to return label generation,
                            streamlined order fulfillment, and intelligent product listing — everything you need
                            to run your dropshipping operation faster, with less manual work.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs sm:text-sm font-display">
                            <MapPin className="w-4 h-4" />
                            Currently available for Australian eBay sellers
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Tools Grid */}
            <section className="py-16 sm:py-24">
                <div className="container mx-auto px-6">
                    <div className="space-y-8 sm:space-y-12 max-w-5xl mx-auto">
                        {tools.map((tool, index) => (
                            <motion.div
                                key={tool.id}
                                id={`tool-${tool.id}`}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.08 }}
                                viewport={{ once: true, margin: "-50px" }}
                                className="group relative rounded-2xl border border-primary/15 bg-card p-6 sm:p-8 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,175,55,0.08)]"
                            >
                                {/* Subtle glow on hover */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                                        <tool.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold text-white mb-2 font-display">
                                            {tool.name}
                                        </h2>
                                        <p className="text-xs sm:text-sm text-muted-foreground font-display leading-relaxed">
                                            {tool.description}
                                        </p>
                                    </div>

                                    {/* CTA */}
                                    <div className="flex-shrink-0 sm:self-center">
                                        <a
                                            href={tool.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block"
                                        >
                                            <Button
                                                variant="outline"
                                                className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 font-display text-xs sm:text-sm group/btn whitespace-nowrap"
                                            >
                                                {tool.cta}
                                                <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-subtle">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-6 font-display">
                            Need a Custom Tool?
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-2xl mx-auto font-display">
                            We build bespoke automation solutions for eBay and Amazon sellers. If you have a workflow that needs automating, let's talk.
                        </p>
                        <a href="/contact">
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 sm:px-12 py-4 sm:py-6 text-xs sm:text-sm font-display"
                            >
                                Get in Touch
                            </Button>
                        </a>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Tools;
