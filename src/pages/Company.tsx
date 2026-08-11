import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import { Search, PenTool, Hammer, TrendingUp, Brain, PencilRuler, Cog, Route, Quote } from "lucide-react";

const Company = () => {
    const [activeStep, setActiveStep] = useState<number | null>(0);

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
                            className="max-w-6xl mx-auto"
                        >
                            <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
                                {/* Left Side: Clickable Steps */}
                                <div className="flex flex-col gap-4 w-full md:w-5/12">
                                    {[
                                        { id: 0, num: '01', title: 'Learn your business', icon: Search },
                                        { id: 1, num: '02', title: 'Design a solution', icon: PenTool },
                                        { id: 2, num: '03', title: 'Build and implement', icon: Hammer },
                                        { id: 3, num: '04', title: 'Support & scale', icon: TrendingUp },
                                    ].map((step) => (
                                        <button 
                                            key={step.id}
                                            onClick={() => setActiveStep(step.id)}
                                            onMouseEnter={() => setActiveStep(step.id)}
                                            className={`w-full flex items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                                                activeStep === step.id 
                                                ? 'bg-[#112E81] border-[#112E81] shadow-xl md:translate-x-4' 
                                                : 'bg-white border-transparent hover:border-[#112E81]/30 hover:bg-white/60 shadow-sm'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-colors duration-300 ${
                                                activeStep === step.id ? 'bg-[#D4AF37] text-[#112E81]' : 'bg-[#112E81]/10 text-[#112E81]'
                                            }`}>
                                                <step.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className={`text-xs font-bold tracking-widest uppercase mb-1 block transition-colors ${
                                                    activeStep === step.id ? 'text-[#D4AF37]' : 'text-[#112E81]/60'
                                                }`}>Step {step.num}</span>
                                                <h4 className={`text-xl font-bold font-display transition-colors ${
                                                    activeStep === step.id ? 'text-white' : 'text-[#1c1b1b]'
                                                }`}>{step.title}</h4>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Right Side: Dynamic Content */}
                                <div className="w-full md:w-7/12">
                                    <div className="bg-white rounded-3xl p-10 lg:p-14 shadow-xl border-t-4 border-[#D4AF37] h-full min-h-[350px] relative overflow-hidden flex flex-col justify-center">
                                        
                                        <AnimatePresence mode="wait">
                                            {activeStep === 0 && (
                                                <motion.div 
                                                    key="step0"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="relative z-10"
                                                >
                                                    <Search className="absolute -bottom-10 -right-10 w-48 h-48 text-[#112E81] opacity-5 pointer-events-none" />
                                                    <h3 className="text-3xl lg:text-4xl font-bold text-[#112E81] font-display mb-6 leading-tight">Learn your business and challenges</h3>
                                                    <p className="text-[#444651] text-lg lg:text-xl leading-relaxed">
                                                        We dive deep into your daily operations to identify bottlenecks, repetitive tasks, and areas ripe for automation. We map out your exact current workflow so we understand perfectly how you operate.
                                                    </p>
                                                </motion.div>
                                            )}
                                            {activeStep === 1 && (
                                                <motion.div 
                                                    key="step1"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="relative z-10"
                                                >
                                                    <PenTool className="absolute -bottom-10 -right-10 w-48 h-48 text-[#112E81] opacity-5 pointer-events-none" />
                                                    <h3 className="text-3xl lg:text-4xl font-bold text-[#112E81] font-display mb-6 leading-tight">Design a solution that fits</h3>
                                                    <p className="text-[#444651] text-lg lg:text-xl leading-relaxed">
                                                        Our architects draft a tailored automation blueprint. We meticulously select the right tools, APIs, and infrastructure, ensuring the new system scales seamlessly alongside your business growth.
                                                    </p>
                                                </motion.div>
                                            )}
                                            {activeStep === 2 && (
                                                <motion.div 
                                                    key="step2"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="relative z-10"
                                                >
                                                    <Hammer className="absolute -bottom-10 -right-10 w-48 h-48 text-[#112E81] opacity-5 pointer-events-none" />
                                                    <h3 className="text-3xl lg:text-4xl font-bold text-[#112E81] font-display mb-6 leading-tight">Build and implement it right</h3>
                                                    <p className="text-[#444651] text-lg lg:text-xl leading-relaxed">
                                                        We develop your custom integrations and bots. Everything is rigorously tested in a secure sandbox environment before a smooth, zero-downtime deployment into your live workspace.
                                                    </p>
                                                </motion.div>
                                            )}
                                            {activeStep === 3 && (
                                                <motion.div 
                                                    key="step3"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="relative z-10"
                                                >
                                                    <TrendingUp className="absolute -bottom-10 -right-10 w-48 h-48 text-[#112E81] opacity-5 pointer-events-none" />
                                                    <h3 className="text-3xl lg:text-4xl font-bold text-[#112E81] font-display mb-6 leading-tight">Support you as you grow</h3>
                                                    <p className="text-[#444651] text-lg lg:text-xl leading-relaxed">
                                                        Post-launch, we monitor your systems 24/7. As your business volume increases, we continuously optimize and tweak the automation so that it handles increased loads effortlessly.
                                                    </p>
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
                <section className="py-32 px-4 sm:px-6 md:px-12 bg-[#AACCD6]">
                    <div className="max-w-5xl mx-auto text-center relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#112E81] opacity-5 pointer-events-none">
                            <Quote className="w-64 h-64" />
                        </div>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="relative z-10"
                        >
                            <blockquote className="text-2xl md:text-3xl lg:text-4xl text-[#112E81] font-display font-medium leading-tight md:leading-snug">
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
