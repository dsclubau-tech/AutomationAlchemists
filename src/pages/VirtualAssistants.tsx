import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Clock, MessageSquare, Shield } from "lucide-react";

const VirtualAssistants = () => {
    return (
        <div className="min-h-screen bg-background">
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
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 font-determination">
                            <span className="bg-gradient-to-r from-blue-600 via-purple-400 to-saffron bg-clip-text text-transparent">
                                24/7 Virtual Assistants
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-determination">
                            AI-powered automation that works around the clock. Never miss a lead, inquiry, or opportunity.
                        </p>
                        <Button
                            size="lg"
                            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-base group font-determination"
                        >
                            Get Your Assistant
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
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
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-determination">
                            Always On, Always Ready
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-3xl mx-auto font-determination">
                            Intelligent automation that handles customer interactions, data processing, and routine tasks
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Clock,
                                title: "24/7 Availability",
                                description: "Your virtual assistant never sleeps, ensuring continuous support and service delivery."
                            },
                            {
                                icon: Bot,
                                title: "AI-Powered",
                                description: "Advanced machine learning algorithms that improve with every interaction and learn your business."
                            },
                            {
                                icon: MessageSquare,
                                title: "Multi-Channel",
                                description: "Seamlessly handle inquiries across email, chat, social media, and messaging platforms."
                            },
                            {
                                icon: Shield,
                                title: "Secure & Reliable",
                                description: "Enterprise-grade security with data encryption and compliance with industry standards."
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center p-8 bg-card rounded-2xl shadow-card"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <feature.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-base font-bold text-primary mb-2 font-determination">{feature.title}</h3>
                                <p className="text-xs text-muted-foreground font-determination">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-determination">
                            What Can Your Assistant Do?
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-3xl mx-auto font-determination">
                            From customer service to data analysis, our virtual assistants handle it all
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                title: "Customer Support",
                                items: ["Answer FAQs instantly", "Ticket routing and prioritization", "Sentiment analysis", "Escalation management"]
                            },
                            {
                                title: "Lead Generation",
                                items: ["Qualify incoming leads", "Schedule appointments", "Follow-up automation", "CRM integration"]
                            },
                            {
                                title: "Data Processing",
                                items: ["Extract and organize data", "Generate reports", "Database management", "Analytics and insights"]
                            },
                            {
                                title: "Content Management",
                                items: ["Social media scheduling", "Email campaigns", "Content moderation", "SEO optimization"]
                            }
                        ].map((useCase, index) => (
                            <motion.div
                                key={useCase.title}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                viewport={{ once: true }}
                                className="p-8 bg-card rounded-xl shadow-card"
                            >
                                <h3 className="text-base font-bold text-primary mb-4 font-determination">{useCase.title}</h3>
                                <ul className="space-y-2">
                                    {useCase.items.map((item) => (
                                        <li key={item} className="text-xs text-muted-foreground flex items-start font-determination">
                                            <span className="text-accent mr-2">▸</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
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
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-determination">
                            Deploy Your Virtual Assistant Today
                        </h2>
                        <p className="text-sm text-muted-foreground mb-8 max-w-2xl mx-auto font-determination">
                            Start automating your business operations with AI-powered assistance. Free trial available.
                        </p>
                        <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-sm font-determination"
                        >
                            Start Free Trial
                        </Button>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default VirtualAssistants;
