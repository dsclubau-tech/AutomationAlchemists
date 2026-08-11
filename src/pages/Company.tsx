import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import { Search, PenTool, Hammer, TrendingUp, Brain, PencilRuler, Cog, Route } from "lucide-react";

const Company = () => {
    const [activeStep, setActiveStep] = useState<number | null>(null);

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
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-2xl p-8 md:p-12 border-t-4 border-[#112E81] shadow-sm max-w-6xl mx-auto"
                        >
                            <div className="flex items-center gap-4 mb-16">
                                <Route className="w-8 h-8 text-[#112E81]" />
                                <div>
                                    <h3 className="font-display text-2xl font-bold text-[#112E81]">Our Process</h3>
                                    <p className="text-[#444651] text-sm">A clear path from problem to solution</p>
                                </div>
                            </div>
                            
                            {/* Workflow Diagram */}
                            <div className="relative">
                                {/* Connecting Line */}
                                <div className="absolute top-[28px] left-8 right-8 h-0.5 bg-[#112E81]/10 hidden md:block z-0"></div>
                                <div 
                                    className="absolute top-[28px] left-8 h-0.5 bg-[#D4AF37] hidden md:block z-0 transition-all duration-500 ease-out"
                                    style={{ width: activeStep !== null ? `${(activeStep / 3) * 100}%` : '0%' }}
                                ></div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative z-10">
                                    {/* Step 1 */}
                                    <div 
                                        className="relative group cursor-pointer"
                                        onMouseEnter={() => setActiveStep(0)}
                                        onMouseLeave={() => setActiveStep(null)}
                                    >
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-all duration-300 mx-auto md:mx-0 ${activeStep === 0 ? 'bg-[#112E81] text-[#D4AF37] scale-110 shadow-lg' : 'bg-white border-2 border-[#112E81]/20 text-[#112E81] group-hover:border-[#112E81]/50'}`}>
                                            <Search className="w-6 h-6" />
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h4 className={`text-xs font-semibold mb-2 font-display uppercase tracking-wider transition-colors ${activeStep === 0 ? 'text-[#D4AF37]' : 'text-[#112E81]/60'}`}>Step 01</h4>
                                            <p className={`font-display text-lg font-bold leading-tight transition-colors ${activeStep === 0 ? 'text-[#112E81]' : 'text-[#1c1b1b]'}`}>Learn your business and challenges</p>
                                        </div>
                                        <AnimatePresence>
                                            {activeStep === 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="mt-4 text-[#444651] text-sm leading-relaxed"
                                                >
                                                    We dive deep into your daily operations to identify bottlenecks, repetitive tasks, and areas ripe for automation. We map out your exact current workflow.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Step 2 */}
                                    <div 
                                        className="relative group cursor-pointer"
                                        onMouseEnter={() => setActiveStep(1)}
                                        onMouseLeave={() => setActiveStep(null)}
                                    >
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-all duration-300 mx-auto md:mx-0 ${activeStep === 1 ? 'bg-[#112E81] text-[#D4AF37] scale-110 shadow-lg' : 'bg-white border-2 border-[#112E81]/20 text-[#112E81] group-hover:border-[#112E81]/50'}`}>
                                            <PenTool className="w-6 h-6" />
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h4 className={`text-xs font-semibold mb-2 font-display uppercase tracking-wider transition-colors ${activeStep === 1 ? 'text-[#D4AF37]' : 'text-[#112E81]/60'}`}>Step 02</h4>
                                            <p className={`font-display text-lg font-bold leading-tight transition-colors ${activeStep === 1 ? 'text-[#112E81]' : 'text-[#1c1b1b]'}`}>Design a solution that fits</p>
                                        </div>
                                        <AnimatePresence>
                                            {activeStep === 1 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="mt-4 text-[#444651] text-sm leading-relaxed"
                                                >
                                                    Our architects draft a tailored automation blueprint. We select the right tools and APIs, ensuring the new system scales seamlessly with your business.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Step 3 */}
                                    <div 
                                        className="relative group cursor-pointer"
                                        onMouseEnter={() => setActiveStep(2)}
                                        onMouseLeave={() => setActiveStep(null)}
                                    >
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-all duration-300 mx-auto md:mx-0 ${activeStep === 2 ? 'bg-[#112E81] text-[#D4AF37] scale-110 shadow-lg' : 'bg-white border-2 border-[#112E81]/20 text-[#112E81] group-hover:border-[#112E81]/50'}`}>
                                            <Hammer className="w-6 h-6" />
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h4 className={`text-xs font-semibold mb-2 font-display uppercase tracking-wider transition-colors ${activeStep === 2 ? 'text-[#D4AF37]' : 'text-[#112E81]/60'}`}>Step 03</h4>
                                            <p className={`font-display text-lg font-bold leading-tight transition-colors ${activeStep === 2 ? 'text-[#112E81]' : 'text-[#1c1b1b]'}`}>Build and implement it right</p>
                                        </div>
                                        <AnimatePresence>
                                            {activeStep === 2 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="mt-4 text-[#444651] text-sm leading-relaxed"
                                                >
                                                    We develop the custom integrations and bots. Everything is rigorously tested in a sandbox environment before a smooth, zero-downtime deployment.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Step 4 */}
                                    <div 
                                        className="relative group cursor-pointer"
                                        onMouseEnter={() => setActiveStep(3)}
                                        onMouseLeave={() => setActiveStep(null)}
                                    >
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-all duration-300 mx-auto md:mx-0 ${activeStep === 3 ? 'bg-[#112E81] text-[#D4AF37] scale-110 shadow-lg' : 'bg-white border-2 border-[#112E81]/20 text-[#112E81] group-hover:border-[#112E81]/50'}`}>
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h4 className={`text-xs font-semibold mb-2 font-display uppercase tracking-wider transition-colors ${activeStep === 3 ? 'text-[#D4AF37]' : 'text-[#112E81]/60'}`}>Step 04</h4>
                                            <p className={`font-display text-lg font-bold leading-tight transition-colors ${activeStep === 3 ? 'text-[#112E81]' : 'text-[#1c1b1b]'}`}>Support you as you grow</p>
                                        </div>
                                        <AnimatePresence>
                                            {activeStep === 3 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="mt-4 text-[#444651] text-sm leading-relaxed"
                                                >
                                                    Post-launch, we monitor the systems 24/7. As your business grows, we continuously optimize the automation to handle increased volume effortlessly.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Slogan Section */}
                <section className="py-24 px-4 sm:px-6 md:px-12 bg-[#AACCD6] border-y border-[#112E81]/10">
                    <div className="max-w-4xl mx-auto">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-xl p-8 md:p-12 border-l-4 border-[#112E81] shadow-sm"
                        >
                            <blockquote className="text-lg md:text-xl text-[#112E81] italic relative z-10 font-display font-medium leading-relaxed">
                                "We are very serious about business automation in 2026. Manual repetitive tasks should be out of fashion by now but it isn't. Productivity inflation is a thing. We want to see people reach their potential by giving them more time on their hands and making their business flow effortless. We will hold hands with clients as they achieve what they want and benefit the world"
                            </blockquote>
                        </motion.div>
                    </div>
                </section>

                {/* Serious About Automation Section */}
                <section className="py-24 px-4 sm:px-6 md:px-12 bg-[#112E81] text-white relative overflow-hidden">
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="text-center mb-16">
                            <motion.h2 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                            >
                                We Take Automation Seriously
                            </motion.h2>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-[#AACCD6] text-sm md:text-base font-display uppercase tracking-widest font-semibold"
                            >
                                The automation manifesto
                            </motion.p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-2xl relative overflow-hidden group hover:bg-white/10 transition-colors"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D4AF37]"></div>
                                <h3 className="text-xl md:text-2xl font-bold text-[#D4AF37] mb-4 font-display">The Problem: Productivity Inflation</h3>
                                <p className="text-white/80 text-lg leading-relaxed font-display">
                                    Manual, repetitive work should have gone out of fashion years ago. Instead, businesses are drowning in more of it than ever: more tools, more software, and somehow less time.
                                </p>
                            </motion.div>
                            
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-2xl relative overflow-hidden group hover:bg-white/10 transition-colors"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#AACCD6]"></div>
                                <h3 className="text-xl md:text-2xl font-bold text-[#AACCD6] mb-4 font-display">Our Solution: Real Time Savings</h3>
                                <p className="text-white/80 text-lg leading-relaxed font-display">
                                    We exist to reverse that. Every hour of manual work we eliminate is an hour back in your hands to think, to grow, and to build. We don't disappear after launch — we stay hands-on with every client.
                                </p>
                            </motion.div>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 p-10 md:p-14 rounded-3xl text-center relative overflow-hidden shadow-2xl backdrop-blur-sm">
                                <div className="absolute -top-6 -left-6 text-[#D4AF37] opacity-20 transform -scale-x-100">
                                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                    </svg>
                                </div>
                                <h3 className="font-display text-2xl md:text-4xl font-bold text-[#D4AF37] mb-6 relative z-10">"Built by enthusiasts, driven by goals"</h3>
                                <p className="text-lg md:text-xl text-white/90 font-display leading-relaxed relative z-10 max-w-2xl mx-auto">
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
