import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Users, Target, Award, Zap, Heart, Globe, Rocket, Sparkles, Activity, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import { Link } from "react-router-dom";

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
                            About Automation Alchemists
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-text-main font-display">
                            Transforming Vision Into
                            <span className="text-primary"> Reality</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-text-muted leading-relaxed font-display max-w-3xl mx-auto">
                            We're a team who build custom automation systems and digital tools, helping businesses cut manual work, streamline operations, and scale faster.
                        </p>
                    </motion.div>
                </section>


                {/* SaaS Showcase Section */}
                <section className="w-full space-y-12">


                    {/* Text Block & Process Block Below Carousel */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto text-center space-y-6 pt-8"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-text-main font-display">
                            Simple, Scalable Business Automation
                        </h2>
                        <p className="text-lg text-text-muted leading-relaxed font-display">
                            Most businesses can't access enterprise-level technology — until now. We build workflow automation and custom software that's practical, affordable, and built for companies of any size. Whether you need to streamline daily operations or build custom tools from scratch, we handle the technical work so you can focus on growing your business.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-3xl mx-auto pt-6"
                    >
                        <div className="bg-[#111] border-l-4 border-l-[#D4AF37] border-t border-r border-b border-primary/20 rounded-r-[12px] p-8 md:p-10 shadow-lg">
                            <h3 className="text-2xl font-bold text-white font-display mb-2">Our Process</h3>
                            <p className="text-text-muted font-display mb-6">A clear path from problem to solution</p>
                            <ul className="space-y-4 text-white/90 font-display">
                                <li className="flex items-start gap-3">
                                    <span className="text-[#D4AF37] font-bold mt-1">•</span>
                                    <span>Learn your business and challenges</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#D4AF37] font-bold mt-1">•</span>
                                    <span>Design a solution that fits</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#D4AF37] font-bold mt-1">•</span>
                                    <span>Build and implement it right</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#D4AF37] font-bold mt-1">•</span>
                                    <span>Support you as you grow</span>
                                </li>
                            </ul>
                        </div>
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

                {/* Automation Manifesto Section */}
                <section className="py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-[800px] mx-auto text-center space-y-12"
                    >
                        <blockquote className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#D4AF37] italic font-display leading-tight">
                            "We are very serious about business automation in 2026. Manual repetitive tasks should be out of fashion by now but it isn't. Productivity inflation is a thing. We want to see people reach their potential by giving them more time on their hands and making their business flow effortless. We will hold hands with clients as they achieve what they want and benefit the world"
                        </blockquote>
                        
                        <div className="space-y-6 text-left md:text-center">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
                                We Take Automation Seriously
                            </h2>
                            <p className="text-lg text-white/90 leading-relaxed font-display">
                                Manual, repetitive work should have gone out of fashion years ago. Instead, businesses are drowning in more of it than ever — we call it productivity inflation: more tools, more software, and somehow less time.
                            </p>
                            <p className="text-lg text-white/90 leading-relaxed font-display">
                                We exist to reverse that. Every hour of manual work we eliminate is an hour back in your hands to think, to grow, to build the business you actually set out to build. We don't disappear after launch. We stay hands-on with every client, all the way to the result they came for.
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* Enthusiasts Section */}
                <section className="py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-[800px] mx-auto text-center space-y-8"
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#D4AF37] italic font-display">
                            "Built by enthusiasts, driven by goals"
                        </h2>
                        
                        <p className="text-lg text-white/90 leading-relaxed font-display">
                            We have built successful automation workflows and SaaS tools tested on our own business. We believe everything is possible when most people will say it's not. We don't shy away from creativity and growth and we want to see business put some real impact on the world.
                        </p>
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
