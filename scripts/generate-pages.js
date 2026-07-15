const fs = require('fs');

const template = (name, title, desc, keyword, route) => `import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import SchemaMarkup from "@/components/SchemaMarkup";

const ${name} = () => {
    return (
        <div className="min-h-screen bg-background">
            <SEOHead
                title="${title}"
                description="${desc}"
                url="https://automationalchemists.com/services/${route}"
                keywords="${keyword}"
            />
            <SchemaMarkup
                type="ProfessionalService"
                data={{
                    name: "${name.replace(/([A-Z])/g, ' $1').trim()}",
                    description: "${desc}",
                    url: "https://automationalchemists.com/services/${route}",
                    provider: {
                        "@type": "Organization",
                        "name": "AAlchemists"
                    }
                }}
            />
            <Navigation />

            {/* Hero Section */}
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
                                ${name.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                        </h1>
                        <p className="text-sm sm:text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-display">
                            ${desc}
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

            {/* Features Section */}
            <section className="py-24 bg-gradient-subtle">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-6 font-display">
                            Expert Solutions
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl mx-auto font-display">
                            Delivering scalable and secure solutions tailored to your business goals.
                        </p>
                    </motion.div>
                </div>
            </section>
            
            <Footer />
        </div>
    );
};

export default ${name};
`;

const pages = [
  { name: 'WebDevelopment', title: 'Custom Web Development Services | AAlchemists', desc: 'Expert custom web development services. We build responsive, fast, and scalable web applications tailored to your business needs globally.', keyword: 'web development, custom web app, responsive websites, frontend, backend', route: 'web-development' },
  { name: 'AppDevelopment', title: 'Android & Flutter App Development Agency | AAlchemists', desc: 'Top-tier Android and Flutter app development. We create cross-platform mobile apps with native performance to reach your global audience.', keyword: 'app development, flutter development, android development, cross-platform apps', route: 'app-development' },
  { name: 'SaasDevelopment', title: 'SaaS Development & Consulting Services | AAlchemists', desc: 'End-to-end SaaS development services. From conceptualization to deployment, we build scalable software-as-a-service platforms.', keyword: 'SaaS development, SaaS consulting, software as a service, scalable architecture', route: 'saas-development' },
  { name: 'Automation', title: 'Business Workflow Automation Consulting | AAlchemists', desc: 'Streamline your operations with our workflow automation consulting. We integrate AI and automation tools to save time and boost efficiency.', keyword: 'workflow automation, business automation, AI integration, process optimization', route: 'automation' }
];

pages.forEach(p => {
  fs.writeFileSync(`src/pages/${p.name}.tsx`, template(p.name, p.title, p.desc, p.keyword, p.route));
});
