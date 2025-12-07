import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Workflow, TrendingUp, Cog, BarChart } from "lucide-react";
import { Link } from "react-router-dom";

const WorkflowAutomation = () => {
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
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 font-display">
                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">
                                Workflow Automation
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-display">
                            Streamline your business processes and eliminate repetitive tasks. Focus on what matters most.
                        </p>
                        <Link to="/contact">
                            <Button
                                size="lg"
                                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-base group font-display"
                            >
                                Automate Now
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 bg-gradient-subtle">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-display">
                            Transform Your Operations
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-3xl mx-auto font-display">
                            Intelligent automation that adapts to your business needs and scales with your growth
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: TrendingUp,
                                title: "Boost Productivity",
                                description: "Save 500+ hours annually by automating repetitive tasks and manual processes."
                            },
                            {
                                icon: Cog,
                                title: "Reduce Errors",
                                description: "Eliminate human error with consistent, reliable automated workflows and validation."
                            },
                            {
                                icon: BarChart,
                                title: "Data-Driven Insights",
                                description: "Real-time analytics and reporting to make informed business decisions faster."
                            },
                            {
                                icon: Workflow,
                                title: "Seamless Integration",
                                description: "Connect all your tools and platforms for a unified, efficient workflow ecosystem."
                            }
                        ].map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center p-8 bg-card rounded-2xl shadow-card"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <benefit.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-base font-bold text-primary mb-2 font-display">{benefit.title}</h3>
                                <p className="text-xs text-muted-foreground font-display">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Automation Types Section */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-display">
                            Automation Solutions
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-3xl mx-auto font-display">
                            Custom-built workflows tailored to your specific business processes
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                title: "Sales & Marketing",
                                workflows: [
                                    "Lead capture and nurturing",
                                    "Email campaign automation",
                                    "Social media posting",
                                    "CRM data synchronization",
                                    "Sales pipeline management"
                                ]
                            },
                            {
                                title: "Operations",
                                workflows: [
                                    "Invoice generation and tracking",
                                    "Inventory management",
                                    "Order processing",
                                    "Document approval workflows",
                                    "Reporting and analytics"
                                ]
                            },
                            {
                                title: "Customer Service",
                                workflows: [
                                    "Ticket routing and assignment",
                                    "Customer onboarding",
                                    "Feedback collection",
                                    "Support escalation",
                                    "Knowledge base updates"
                                ]
                            }
                        ].map((category, index) => (
                            <motion.div
                                key={category.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="p-8 bg-card rounded-xl shadow-card"
                            >
                                <h3 className="text-base font-bold text-primary mb-4 font-display">{category.title}</h3>
                                <ul className="space-y-2">
                                    {category.workflows.map((workflow) => (
                                        <li key={workflow} className="text-xs text-muted-foreground flex items-start font-display">
                                            <span className="text-accent mr-2">▸</span>
                                            {workflow}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ROI Section */}
            <section className="py-24 bg-gradient-subtle">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center font-display">
                            The Numbers Speak
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8 mb-12">
                            {[
                                { stat: "500+", label: "Hours Saved Annually" },
                                { stat: "85%", label: "Error Reduction" },
                                { stat: "3x", label: "Faster Processing" }
                            ].map((item, index) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="text-center p-6 bg-card rounded-xl shadow-card"
                                >
                                    <div className="text-xl font-bold text-primary mb-2 font-display">{item.stat}</div>
                                    <div className="text-xs text-muted-foreground font-display">{item.label}</div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="text-center">
                            <Link to="/contact">
                                <Button
                                    size="lg"
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-sm font-display"
                                >
                                    Calculate Your ROI
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default WorkflowAutomation;
