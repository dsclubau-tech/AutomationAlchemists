import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import SchemaMarkup from "@/components/SchemaMarkup";

const VibeToApp = () => {
    return (
        <div className="min-h-screen bg-background">
            <SEOHead
                title="Vibe-to-App Execution | AAlchemists"
                description="Transform your wildest ideas into fully functional applications. No coding walls, no deploy drama."
                url="https://automationalchemists.com/services/vibe-to-app"
                keywords="app execution, rapid development, prototype to production, vibe to app"
            />
            <SchemaMarkup
                type="ProfessionalService"
                data={{
                    name: "Vibe-to-App Execution",
                    description: "Transform your wildest ideas into fully functional applications.",
                    url: "https://automationalchemists.com/services/vibe-to-app",
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
                                Vibe-to-App Execution
                            </span>
                        </h1>
                        <p className="text-sm sm:text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-display">
                            Transform your wildest ideas into fully functional applications. No coding walls, no deploy drama.
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
                            From Concept to Reality
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl mx-auto font-display">
                            We handle the entire development lifecycle so you can focus on your vision
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Sparkles,
                                title: "Idea Refinement",
                                description: "We take your raw concept and transform it into a detailed technical specification with clear milestones and deliverables."
                            },
                            {
                                icon: Zap,
                                title: "Rapid Development",
                                description: "Using modern frameworks and best practices, we build your application with speed and precision, delivering working prototypes fast."
                            },
                            {
                                icon: Rocket,
                                title: "Launch Ready",
                                description: "From deployment to monitoring, we ensure your app is production-ready with proper infrastructure and scaling capabilities."
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center p-6 sm:p-8 bg-card rounded-2xl shadow-card"
                            >
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-primary mb-2 font-display">{feature.title}</h3>
                                <p className="text-xs sm:text-xs text-muted-foreground font-display">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-6 font-display">
                            Our Process
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl mx-auto font-display">
                            A proven methodology that turns vibes into viable products
                        </p>
                    </motion.div>

                    <div className="max-w-4xl mx-auto space-y-8">
                        {[
                            { step: "01", title: "Discovery Call", desc: "Share your vision, goals, and requirements" },
                            { step: "02", title: "Technical Planning", desc: "We create a detailed roadmap and architecture" },
                            { step: "03", title: "Iterative Development", desc: "Regular updates and feedback loops" },
                            { step: "04", title: "Testing & Refinement", desc: "Rigorous quality assurance and optimization" },
                            { step: "05", title: "Deployment & Support", desc: "Launch with confidence and ongoing maintenance" }
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="flex items-start gap-4 sm:gap-6 p-4 sm:p-6 bg-card rounded-xl shadow-card"
                            >
                                <div className="text-3xl sm:text-4xl font-bold text-primary/20 font-display">{item.step}</div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-primary mb-2 font-display">{item.title}</h3>
                                    <p className="text-xs sm:text-xs text-muted-foreground font-display">{item.desc}</p>
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
                            Ready to Build Your App?
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-2xl mx-auto font-display">
                            Let's turn your idea into a reality. Get started with a free consultation.
                        </p>
                        <Link to="/contact">
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 sm:px-12 py-4 sm:py-6 text-xs sm:text-sm font-display"
                            >
                                Schedule a Call
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default VibeToApp;
