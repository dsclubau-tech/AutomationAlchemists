import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Target, Users, Lightbulb, Heart } from "lucide-react";

const Mission = () => {
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
                                Our Mission
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-determination">
                            Transforming ideas into reality through automation, AI, and innovation.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission Statement */}
            <section className="py-24 bg-gradient-subtle">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-determination">
                            Alchemy for the Automation Era
                        </h2>
                        <p className="text-sm text-muted-foreground mb-8 font-determination">
                            At AAlchemists, we believe that every visionary idea deserves to become reality. We're not just developers—we're digital alchemists who transform your concepts into fully functional, revenue-generating applications.
                        </p>
                        <p className="text-sm text-muted-foreground font-determination">
                            Our mission is simple: eliminate the barriers between imagination and execution. No coding walls. No deploy drama. Just pure automation magic that turns your vision into passive income streams.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Core Values */}
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
                            What Drives Us
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-3xl mx-auto font-determination">
                            Our core values guide everything we do
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Target,
                                title: "Results-Driven",
                                description: "We measure success by your success. Every project is built to deliver real, measurable outcomes."
                            },
                            {
                                icon: Users,
                                title: "Client-Centric",
                                description: "Your vision is our blueprint. We listen, adapt, and build exactly what you need."
                            },
                            {
                                icon: Lightbulb,
                                title: "Innovation First",
                                description: "We leverage cutting-edge technology to create solutions that are ahead of the curve."
                            },
                            {
                                icon: Heart,
                                title: "Quality Obsessed",
                                description: "We don't ship until it's perfect. Every line of code, every pixel, every interaction matters."
                            }
                        ].map((value, index) => (
                            <motion.div
                                key={value.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center p-8 bg-card rounded-2xl shadow-card"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <value.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-base font-bold text-primary mb-2 font-determination">{value.title}</h3>
                                <p className="text-xs text-muted-foreground font-determination">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-24 bg-gradient-subtle">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-determination">
                                Our Journey
                            </h2>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="p-8 bg-card rounded-xl shadow-card">
                                <h3 className="text-base font-bold text-primary mb-4 font-determination">The Problem We Saw</h3>
                                <p className="text-xs text-muted-foreground font-determination">
                                    Too many brilliant ideas die in the prototype phase. Entrepreneurs and businesses struggle with technical barriers, deployment complexities, and the overwhelming challenge of turning concepts into production-ready applications.
                                </p>
                            </div>

                            <div className="p-8 bg-card rounded-xl shadow-card">
                                <h3 className="text-base font-bold text-primary mb-4 font-determination">Our Solution</h3>
                                <p className="text-xs text-muted-foreground font-determination">
                                    We built AAlchemists to be the bridge between vision and reality. With 5+ years of ecommerce expertise and a passion for automation, we handle the entire development lifecycle—from initial concept to deployed, revenue-generating application.
                                </p>
                            </div>

                            <div className="p-8 bg-card rounded-xl shadow-card">
                                <h3 className="text-base font-bold text-primary mb-4 font-determination">Looking Forward</h3>
                                <p className="text-xs text-muted-foreground font-determination">
                                    We're building a future where anyone with a great idea can bring it to life. Through AI, automation, and intelligent workflows, we're making professional-grade development accessible to visionaries worldwide.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Mission;
