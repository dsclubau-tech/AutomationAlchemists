import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Users, Target, Award, Zap, Heart, Globe, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import { Link } from "react-router-dom";

const values = [
    {
        icon: Zap,
        title: "Innovation",
        description: "We push boundaries and embrace cutting-edge technologies to deliver solutions that set you apart."
    },
    {
        icon: Heart,
        title: "Partnership",
        description: "We're not just vendors—we're partners invested in your success, growing alongside you."
    },
    {
        icon: Award,
        title: "Excellence",
        description: "Quality is non-negotiable. We deliver work we're proud of, every single time."
    },
    {
        icon: Globe,
        title: "Accessibility",
        description: "Enterprise-grade solutions shouldn't require enterprise budgets. We make excellence accessible."
    }
];

const stats = [
    { value: "50+", label: "Projects Delivered" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "24/7", label: "Support Available" },
    { value: "5+", label: "Years Experience" }
];

const Company = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <div className="min-h-screen bg-background-dark text-text-main overflow-x-hidden">
            <PageLoader pageName="Company" />
            <Navigation />

            {/* Fractal Corner Frames */}
            <div className="pointer-events-none absolute top-0 left-0 h-32 w-32 md:h-48 md:w-48" style={{ background: 'radial-gradient(circle at top left, rgba(212,175,55,0.2) 0%, transparent 50%)' }}></div>
            <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 md:h-48 md:w-48" style={{ background: 'radial-gradient(circle at bottom right, rgba(212,175,55,0.15) 0%, transparent 50%)' }}></div>

            <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-16 sm:gap-20 md:gap-24 pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6 pb-12">

                {/* Hero Section */}
                <section className="text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-display">
                            <Sparkles className="w-4 h-4" />
                            About AAlchemists
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-text-main font-display">
                            Transforming Vision Into
                            <span className="text-primary"> Reality</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-text-muted leading-relaxed font-display max-w-3xl mx-auto">
                            We're a team of passionate technologists, designers, and strategists dedicated to helping businesses
                            harness the power of automation and digital transformation.
                        </p>
                    </motion.div>
                </section>

                {/* Stats Section */}
                <section className="w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6"
                    >
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center p-6 bg-surface-dark/50 border border-primary/20 rounded-2xl">
                                <div className="text-3xl sm:text-4xl font-bold text-primary font-display">{stat.value}</div>
                                <div className="text-sm text-text-muted font-display mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </section>

                {/* Mission Section */}
                <section ref={ref} className="grid md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 text-primary font-display">
                            <Target className="w-5 h-5" />
                            Our Mission
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-text-main font-display">
                            Empowering Businesses Through Intelligent Automation
                        </h2>
                        <p className="text-text-muted leading-relaxed font-display">
                            We believe that every business deserves access to the tools and technologies that drive growth.
                            Our mission is to bridge the gap between complex technology and practical business solutions,
                            making automation accessible to companies of all sizes.
                        </p>
                        <p className="text-text-muted leading-relaxed font-display">
                            From streamlining daily operations to building custom software solutions, we're here to help you
                            focus on what matters most—growing your business.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-3xl"></div>
                        <div className="relative bg-surface-dark border border-primary/30 rounded-3xl p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                                    <Rocket className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-text-main font-display">Our Approach</h3>
                                    <p className="text-sm text-text-muted font-display">Built for scale, designed for humans</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <span className="text-text-muted font-display">Understand your unique challenges</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <span className="text-text-muted font-display">Design tailored solutions</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <span className="text-text-muted font-display">Implement with precision</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <span className="text-text-muted font-display">Support your continued growth</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Values Section */}
                <section className="space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 text-primary font-display mb-4">
                            <Heart className="w-5 h-5" />
                            Our Values
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-text-main font-display">
                            What Drives Us Forward
                        </h2>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-surface-dark/50 border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-colors"
                            >
                                <value.icon className="w-10 h-10 text-primary mb-4" />
                                <h3 className="text-lg font-bold text-text-main font-display mb-2">{value.title}</h3>
                                <p className="text-sm text-text-muted font-display leading-relaxed">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Team Section */}
                <section className="bg-surface-dark/50 border border-primary/20 rounded-3xl p-8 sm:p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-2xl mx-auto space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 text-primary font-display">
                            <Users className="w-5 h-5" />
                            Our Team
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-text-main font-display">
                            Built by Experts, Driven by Passion
                        </h2>
                        <p className="text-text-muted font-display leading-relaxed">
                            Our team brings together decades of combined experience in software development,
                            automation, design, and business strategy. We're not just building technology—we're
                            building relationships that last.
                        </p>
                        <Link to="/contact">
                            <Button className="bg-primary text-background-dark hover:brightness-110 transition-all font-display h-12 px-8">
                                Meet the Team
                            </Button>
                        </Link>
                    </motion.div>
                </section>

                {/* CTA Section */}
                <section className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-3xl p-8 sm:p-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6 max-w-2xl mx-auto"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-text-main font-display">
                            Ready to Transform Your Business?
                        </h2>
                        <p className="text-text-muted font-display">
                            Let's discuss how we can help automate your operations and accelerate your growth.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/contact">
                                <Button className="bg-primary text-background-dark hover:brightness-110 transition-all font-display h-12 px-8">
                                    Get Started
                                </Button>
                            </Link>
                            <Link to="/services">
                                <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-display h-12 px-8">
                                    View Services
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </section>

                <Footer />
            </div>
        </div>
    );
};

export default Company;
