import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import { Search, PenTool, Hammer, TrendingUp, Brain, PencilRuler, Cog, Route } from "lucide-react";

const Company = () => {
    return (
        <div className="min-h-screen bg-[#AACCD6] text-[#1c1b1b] overflow-x-hidden antialiased">
            <PageLoader pageName="Company" />
            <Navigation />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="bg-[#112E81] text-white pt-24 pb-32 px-4 sm:px-6 md:px-12 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col gap-6"
                        >
                            <span className="text-[#D4AF37] text-sm font-semibold uppercase tracking-wider font-display">About Automation Alchemists</span>
                            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">Transforming Vision Into Reality</h1>
                            <p className="text-lg text-white/90 max-w-xl font-display">
                                We're a team who build custom automation systems and digital tools, helping businesses cut manual work, streamline operations, and scale faster.
                            </p>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative h-[400px] w-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-sm bg-white/5"
                        >
                            <img alt="Team working" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAul0Z76sg_D7C-8UXWRqouP5wAPWI-BkxBb7HK-I6TgreeYPKD6evg-wJQz3A6yJnIXDvAS65vYMJRW0ojNLRYmNickOmNPyRQwancWaZGwmEtaGN8fNkhdHP6fJQhhLpr9aFE-02IbUJMxSZNGG8MQReXGLoDROReNoKk1fbNShA6lZUAlbnqtzsmEKsIxU62q4QSmIvIJg-EUY2z2yFlQWeai7Aa1eAd4XkEoe1I3ha4gN6XO8Yxtg"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#112E81] to-transparent opacity-60"></div>
                        </motion.div>
                    </div>
                </section>

                {/* Our Process Section (Bento Grid) */}
                <section className="py-24 px-4 sm:px-6 md:px-12 bg-[#AACCD6]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <motion.h2 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[#112E81] mb-4"
                            >
                                Simple, Scalable Business Automation
                            </motion.h2>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-lg text-[#112E81]/80 max-w-3xl mx-auto font-display"
                            >
                                Most businesses can't access enterprise-level technology — until now. We build workflow automation and custom software that's practical, affordable, and built for companies of any size. Whether you need to streamline daily operations or build custom tools from scratch, we handle the technical work so you can focus on growing your business.
                            </motion.p>
                        </div>
                        <div className="grid md:grid-cols-12 gap-6 auto-rows-[250px]">
                            {/* Process Intro */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="md:col-span-4 md:row-span-2 bg-[#AACCD6] rounded-2xl p-8 border-2 border-[#112E81]/20 shadow-sm flex flex-col justify-between group hover:border-[#112E81]/50 transition-colors"
                            >
                                <div>
                                    <Route className="w-10 h-10 text-[#112E81] mb-4" />
                                    <h3 className="font-display text-2xl font-bold text-[#112E81] mb-2">Our Process</h3>
                                    <p className="text-base text-[#112E81]/80 font-display">A clear path from problem to solution</p>
                                </div>
                                <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden mt-6">
                                    <div className="h-full bg-gradient-to-r from-[#112E81]/50 to-[#112E81] w-full animate-pulse"></div>
                                </div>
                            </motion.div>
                            {/* Steps */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="md:col-span-4 bg-[#112E81] text-white rounded-2xl p-8 shadow-sm relative overflow-hidden group"
                            >
                                <div className="absolute -right-4 -bottom-4 text-white opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <Search className="w-32 h-32" />
                                </div>
                                <h4 className="text-sm font-semibold text-[#D4AF37] mb-2 font-display uppercase tracking-wider">Step 01</h4>
                                <p className="font-display text-2xl font-bold leading-tight z-10 relative">Learn your business and challenges</p>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="md:col-span-4 bg-[#AACCD6] rounded-2xl p-8 border-2 border-[#112E81]/20 shadow-sm relative overflow-hidden group hover:border-[#112E81]/50 transition-colors"
                            >
                                <div className="absolute -right-4 -bottom-4 text-[#112E81] opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <PenTool className="w-32 h-32" />
                                </div>
                                <h4 className="text-sm font-semibold text-[#112E81]/60 mb-2 font-display uppercase tracking-wider">Step 02</h4>
                                <p className="font-display text-2xl font-bold text-[#112E81] leading-tight z-10 relative">Design a solution that fits</p>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="md:col-span-4 bg-[#AACCD6] rounded-2xl p-8 border-2 border-[#112E81]/20 shadow-sm relative overflow-hidden group hover:border-[#112E81]/50 transition-colors"
                            >
                                <div className="absolute -right-4 -bottom-4 text-[#112E81] opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <Hammer className="w-32 h-32" />
                                </div>
                                <h4 className="text-sm font-semibold text-[#112E81]/60 mb-2 font-display uppercase tracking-wider">Step 03</h4>
                                <p className="font-display text-2xl font-bold text-[#112E81] leading-tight z-10 relative">Build and implement it right</p>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="md:col-span-4 bg-[#112E81] text-white rounded-2xl p-8 shadow-sm relative overflow-hidden group"
                            >
                                <div className="absolute -right-4 -bottom-4 text-white opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <TrendingUp className="w-32 h-32" />
                                </div>
                                <h4 className="text-sm font-semibold text-[#D4AF37] mb-2 font-display uppercase tracking-wider">Step 04</h4>
                                <p className="font-display text-2xl font-bold leading-tight z-10 relative">Support you as you grow</p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Mission & Approach Section */}
                <section className="py-24 px-4 sm:px-6 md:px-12 bg-[#AACCD6] border-y border-[#112E81]/10">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8 sticky top-28"
                        >
                            <div>
                                <span className="text-[#112E81] text-sm font-semibold uppercase tracking-wider mb-2 block font-display">Our Mission</span>
                                <h2 className="font-display text-3xl md:text-4xl font-bold text-[#112E81]">Empowering Businesses Through Intelligent Automation</h2>
                            </div>
                            <p className="text-lg text-[#112E81]/80 font-display">
                                We believe that every business deserves access to the tools and technologies that drive growth. Our mission is to bridge the gap between complex technology and practical business solutions, making automation accessible to companies of all sizes.
                            </p>
                            <p className="text-base text-[#112E81]/80 font-display">
                                From streamlining daily operations to building custom software solutions, we're here to help you focus on what matters most—growing your business.
                            </p>
                            <div className="bg-white rounded-xl p-8 border-l-4 border-[#112E81] shadow-sm">
                                <blockquote className="text-lg text-[#112E81] italic relative z-10 font-display font-medium leading-relaxed">
                                    "We are very serious about business automation in 2026. Manual repetitive tasks should be out of fashion by now but it isn't. Productivity inflation is a thing. We want to see people reach their potential by giving them more time on their hands and making their business flow effortless. We will hold hands with clients as they achieve what they want and benefit the world"
                                </blockquote>
                            </div>
                        </motion.div>
                        <div className="grid gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h3 className="font-display text-2xl font-bold text-[#112E81] mb-6">Our Approach: Built for scale, designed for humans</h3>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="p-8 rounded-2xl bg-[#AACCD6] border-2 border-[#112E81]/20 shadow-sm hover:border-[#112E81]/50 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#112E81]/10 flex items-center justify-center mb-4">
                                    <Brain className="w-6 h-6 text-[#112E81]" />
                                </div>
                                <h4 className="font-display text-xl font-bold text-[#112E81] mb-2">Understand your unique challenges</h4>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="p-8 rounded-2xl bg-[#AACCD6] border-2 border-[#112E81]/20 shadow-sm hover:border-[#112E81]/50 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#112E81]/10 flex items-center justify-center mb-4">
                                    <PencilRuler className="w-6 h-6 text-[#112E81]" />
                                </div>
                                <h4 className="font-display text-xl font-bold text-[#112E81] mb-2">Design tailored solutions</h4>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="p-8 rounded-2xl bg-[#AACCD6] border-2 border-[#112E81]/20 shadow-sm hover:border-[#112E81]/50 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#112E81]/10 flex items-center justify-center mb-4">
                                    <Cog className="w-6 h-6 text-[#112E81]" />
                                </div>
                                <h4 className="font-display text-xl font-bold text-[#112E81] mb-2">Implement with precision</h4>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="p-8 rounded-2xl bg-[#AACCD6] border-2 border-[#112E81]/20 shadow-sm hover:border-[#112E81]/50 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#112E81]/10 flex items-center justify-center mb-4">
                                    <TrendingUp className="w-6 h-6 text-[#112E81]" />
                                </div>
                                <h4 className="font-display text-xl font-bold text-[#112E81] mb-2">Support your continued growth</h4>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Serious About Automation Section */}
                <section className="py-24 px-4 sm:px-6 md:px-12 bg-[#112E81] text-white relative overflow-hidden">
                    <div className="max-w-7xl mx-auto text-center relative z-10">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-8"
                        >
                            We Take Automation Seriously
                        </motion.h2>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="max-w-3xl mx-auto space-y-6 text-lg text-white/80 font-display"
                        >
                            <p>
                                Manual, repetitive work should have gone out of fashion years ago. Instead, businesses are drowning in more of it than ever — we call it productivity inflation: more tools, more software, and somehow less time.
                            </p>
                            <p>
                                We exist to reverse that. Every hour of manual work we eliminate is an hour back in your hands to think, to grow, to build the business you actually set out to build. We don't disappear after launch. We stay hands-on with every client, all the way to the result they came for.
                            </p>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="mt-16 flex flex-col items-center justify-center gap-8 border-t border-white/10 pt-16"
                        >
                            <div className="text-center max-w-2xl">
                                <h3 className="font-display text-2xl font-bold text-[#D4AF37] mb-4">"Built by enthusiasts, driven by goals"</h3>
                                <p className="text-base text-white/80 font-display">
                                    We have built successful automation workflows and SaaS tools tested on our own business. We believe everything is possible when most people will say it's not. We don't shy away from creativity and growth and we want to see business put some real impact on the world.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 px-4 sm:px-6 md:px-12 bg-[#AACCD6] text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto"
                    >
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-[#112E81] mb-6">Ready to Transform Your Business?</h2>
                        <p className="text-lg text-[#112E81]/80 mb-12 font-display">
                            Let's discuss how we can help automate your operations and accelerate your growth.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link className="inline-flex justify-center items-center px-8 py-4 bg-[#112E81] text-white rounded font-semibold text-sm hover:shadow-lg transition-all duration-300 active:scale-95 font-display" to="/contact">
                                Get Started
                            </Link>
                            <Link className="inline-flex justify-center items-center px-8 py-4 bg-transparent border-2 border-[#112E81] text-[#112E81] rounded font-semibold text-sm hover:bg-[#112E81]/5 transition-colors active:scale-95 font-display" to="/services">
                                View Services
                            </Link>
                        </div>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Company;
