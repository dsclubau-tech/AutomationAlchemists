import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import SchemaMarkup from "@/components/SchemaMarkup";

const SaasDevelopment = () => {
    return (
        <div className="min-h-screen bg-background">
            <SEOHead
                title="SaaS Development & Consulting Services | AAlchemists"
                description="End-to-end SaaS development services. From conceptualization to deployment, we build scalable software-as-a-service platforms."
                url="https://automationalchemists.com/services/saas-development"
                keywords="SaaS development, SaaS consulting, software as a service, scalable architecture"
            />
            <SchemaMarkup
                type="ProfessionalService"
                data={{
                    name: "SaaS Development",
                    description: "End-to-end SaaS development services. From conceptualization to deployment, we build scalable software-as-a-service platforms.",
                    url: "https://automationalchemists.com/services/saas-development",
                    provider: {
                        "@type": "Organization",
                        "name": "AAlchemists"
                    }
                }}
            />
            <Navigation />

            <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
                <div className="container mx-auto px-6 py-32 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-display">
                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">
                                SaaS Development
                            </span>
                        </h1>
                        <p className="text-sm sm:text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-display">
                            End-to-end SaaS development services. From conceptualization to deployment, we build scalable software-as-a-service platforms.
                        </p>
                        <Link to="/contact">
                            <Button
                                size="lg"
                                className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base group font-display"
                            >
                                Start Your Project
                                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
            
            <Footer />
        </div>
    );
};

export default SaasDevelopment;
