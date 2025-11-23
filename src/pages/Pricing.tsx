import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const Pricing = () => {
    const plans = [
        {
            name: "Starter",
            price: "Custom",
            description: "Perfect for MVPs and proof of concepts",
            features: [
                "Single app development",
                "Basic automation setup",
                "2 weeks delivery",
                "1 month support",
                "Source code included"
            ],
            cta: "Get Started",
            popular: false
        },
        {
            name: "Professional",
            price: "Custom",
            description: "For businesses ready to scale",
            features: [
                "Full-stack application",
                "Advanced automation",
                "Virtual assistant integration",
                "4 weeks delivery",
                "3 months support",
                "Priority updates",
                "Analytics dashboard"
            ],
            cta: "Most Popular",
            popular: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "Complete digital transformation",
            features: [
                "Multiple applications",
                "Custom workflow automation",
                "24/7 virtual assistants",
                "Flexible timeline",
                "12 months support",
                "Dedicated team",
                "White-label options",
                "API integrations"
            ],
            cta: "Contact Sales",
            popular: false
        }
    ];

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
                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">
                                Transparent Pricing
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-determination">
                            Custom solutions tailored to your needs. No hidden fees, no surprises.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-24 bg-gradient-subtle">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className={`relative p-8 bg-card rounded-2xl shadow-card ${plan.popular ? 'ring-2 ring-primary' : ''
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-determination">
                                        Most Popular
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-primary mb-2 font-determination">{plan.name}</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-primary font-determination">{plan.price}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-6 font-determination">{plan.description}</p>

                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start text-xs text-muted-foreground font-determination">
                                            <Check className="w-4 h-4 text-accent mr-2 flex-shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={`w-full font-determination text-sm ${plan.popular
                                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                        : 'bg-accent hover:bg-accent/90 text-accent-foreground'
                                        }`}
                                >
                                    {plan.cta}
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
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
                            How Pricing Works
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-3xl mx-auto font-determination">
                            Every project is unique, so we create custom quotes based on your specific needs
                        </p>
                    </motion.div>

                    <div className="max-w-4xl mx-auto space-y-6">
                        {[
                            {
                                step: "01",
                                title: "Discovery Call",
                                desc: "We discuss your vision, requirements, and timeline to understand the full scope"
                            },
                            {
                                step: "02",
                                title: "Custom Proposal",
                                desc: "Receive a detailed proposal with pricing, milestones, and deliverables"
                            },
                            {
                                step: "03",
                                title: "Flexible Payment",
                                desc: "Choose milestone-based payments or monthly retainers that work for your budget"
                            },
                            {
                                step: "04",
                                title: "Transparent Billing",
                                desc: "Track progress and costs in real-time with no hidden fees or surprises"
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="flex items-start gap-6 p-6 bg-card rounded-xl shadow-card"
                            >
                                <div className="text-4xl font-bold text-primary/20 font-determination">{item.step}</div>
                                <div>
                                    <h3 className="text-base font-bold text-primary mb-2 font-determination">{item.title}</h3>
                                    <p className="text-xs text-muted-foreground font-determination">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
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
                            Common Questions
                        </h2>
                    </motion.div>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {[
                            {
                                q: "Why custom pricing?",
                                a: "Every project has unique requirements. Custom pricing ensures you only pay for what you need and get the best value for your investment."
                            },
                            {
                                q: "What's included in support?",
                                a: "Bug fixes, minor updates, performance monitoring, and technical assistance. Extended support packages are available for ongoing development."
                            },
                            {
                                q: "Do you offer payment plans?",
                                a: "Yes! We offer milestone-based payments, monthly retainers, and flexible arrangements to fit your budget and cash flow."
                            },
                            {
                                q: "What if my needs change?",
                                a: "We're flexible. Projects can be adjusted mid-development with transparent pricing for additional features or scope changes."
                            }
                        ].map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="p-6 bg-card rounded-xl shadow-card"
                            >
                                <h3 className="text-base font-bold text-primary mb-2 font-determination">{faq.q}</h3>
                                <p className="text-xs text-muted-foreground font-determination">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-determination">
                            Ready to Get Started?
                        </h2>
                        <p className="text-sm text-muted-foreground mb-8 max-w-2xl mx-auto font-determination">
                            Schedule a free consultation to discuss your project and get a custom quote
                        </p>
                        <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-sm font-determination"
                        >
                            Book Free Consultation
                        </Button>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Pricing;
