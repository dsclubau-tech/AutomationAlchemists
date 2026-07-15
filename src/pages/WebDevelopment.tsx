import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
    ArrowRight, 
    Monitor, 
    Server, 
    Zap, 
    ShieldCheck, 
    Search,
    Database,
    Code2,
    Layout,
    Layers,
    CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import SchemaMarkup from "@/components/SchemaMarkup";

const WebDevelopment = () => {
    const faqs = [
        {
            question: "How long does custom web development take?",
            answer: "A standard custom web application or corporate site typically takes 4 to 8 weeks from kickoff to launch. More complex platforms involving deep integrations or extensive backend architecture can take 3 to 4 months. We provide a strict timeline during our initial architecture phase."
        },
        {
            question: "Why should we use React and Next.js over WordPress?",
            answer: "Next.js and React provide unparalleled performance, security, and scalability. Unlike traditional CMS platforms, modern JavaScript frameworks allow us to deliver sub-second page loads (crucial for SEO) and eliminate the constant security vulnerabilities associated with plugin bloat."
        },
        {
            question: "Do you handle website migration and SEO preservation?",
            answer: "Absolutely. We meticulously map your existing URLs, implement 301 redirects, and transfer all metadata during development. Our goal is to ensure you maintain and ultimately improve your search engine rankings when transitioning to the new stack."
        }
    ];

    const faqSchema = {
        mainEntity: faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEOHead
                title="Custom Web Development with Next.js & React | AAlchemists"
                description="Expert custom web development services. We build responsive, fast, and scalable web applications tailored to your business needs globally."
                url="https://automationalchemists.com/services/web-development"
                keywords="custom web development agency, Next.js/React development services, business website development"
            />
            <SchemaMarkup
                type="ProfessionalService"
                data={{
                    name: "Web Development",
                    description: "Expert custom web development services. We build responsive, fast, and scalable web applications tailored to your business needs globally.",
                    url: "https://automationalchemists.com/services/web-development",
                    provider: {
                        "@type": "Organization",
                        "name": "AAlchemists"
                    }
                }}
            />
            <SchemaMarkup
                type="FAQPage"
                data={faqSchema}
            />
            <Navigation />

            {/* 1. HERO SECTION */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-24 pb-16">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6 text-sm font-medium">
                            <Code2 className="w-4 h-4" /> Global Web Development Services
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 font-display leading-tight">
                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">
                                Custom Web Development
                            </span>
                            <br />with Next.js & React
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-foreground/80 mb-10 max-w-3xl mx-auto font-display leading-relaxed">
                            We architect high-performance, responsive websites and complex web applications designed to scale. No templates, no bloat—just clean code, elite performance, and uncompromised security.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/contact">
                                <Button
                                    size="lg"
                                    className="bg-primary hover:bg-primary/90 text-background-dark px-8 py-6 text-base group font-display font-bold gold-foil-outline"
                                >
                                    Get a Free Quote
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to="/services/saas-development" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                Need a full SaaS platform instead?
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. PROBLEM/SOLUTION SECTION */}
            <section className="py-20 bg-background-light/30 border-y border-border/40">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display text-white">Escaping the Template Trap</h2>
                            <div className="space-y-6 text-foreground/80 text-lg leading-relaxed">
                                <p>
                                    Most growing businesses inevitably hit a technological ceiling. Legacy CMS platforms become sluggish, off-the-shelf themes require fragile plugins to function, and your digital presence begins to look exactly like your competitors. This technological debt leads to poor SEO, high bounce rates, and constant security anxiety.
                                </p>
                                <p>
                                    <strong>AAlchemists takes a fundamentally different approach.</strong> As a boutique agency, our founders are directly involved in your architecture. We don't farm out your vision to junior developers or rely on bloated page builders. We engineer custom web solutions from the ground up using the modern JavaScript stack.
                                </p>
                                <p>
                                    The result? Sub-second loading speeds, unbreakable security, bespoke animations, and an administration layer custom-tailored to how your team actually works.
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="bg-background-dark p-8 rounded-2xl border border-border relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-2xl font-bold mb-6 font-display text-white">The AAlchemists Difference</h3>
                            <ul className="space-y-5">
                                {[
                                    "Senior-level engineering on every project",
                                    "Direct communication with technical founders",
                                    "Agile, transparent two-week sprint cycles",
                                    "Global pricing without the call-center experience",
                                    "Built for core web vitals and technical SEO"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-foreground/90">
                                        <div className="mt-1 bg-primary/20 p-1 rounded-full text-primary">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. WHAT'S INCLUDED */}
            <section className="py-24 relative">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">
                            Comprehensive Deliverables
                        </h2>
                        <p className="text-foreground/70 max-w-2xl mx-auto text-lg">
                            Everything required to launch, scale, and manage your custom web application securely.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Layout,
                                title: "Responsive Frontend Design",
                                desc: "Pixel-perfect, mobile-first interfaces tailored to your brand identity with dynamic animations."
                            },
                            {
                                icon: Server,
                                title: "Custom CMS Integration",
                                desc: "Headless CMS architecture (Sanity, Strapi, or Custom) allowing your team to easily manage content without touching code."
                            },
                            {
                                icon: Search,
                                title: "Technical SEO & Performance",
                                desc: "Server-Side Rendering (SSR) and Static Site Generation (SSG) for instant load times and optimal crawlability."
                            },
                            {
                                icon: Database,
                                title: "API & Gateway Integrations",
                                desc: "Seamless integration with Stripe, CRM systems, marketing tools, and internal company databases."
                            },
                            {
                                icon: ShieldCheck,
                                title: "Security & Compliance",
                                desc: "Enterprise-grade security measures, role-based access control, and GDPR/CCPA compliant architecture."
                            },
                            {
                                icon: Layers,
                                title: "Deployment & Hosting",
                                desc: "CI/CD pipeline setup and scalable edge-network hosting (Vercel/AWS) for zero-downtime updates."
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-background-light/40 border border-border/50 p-8 rounded-xl hover:bg-background-light transition-colors"
                            >
                                <feature.icon className="w-10 h-10 text-primary mb-5" />
                                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                                <p className="text-foreground/70 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. TECH STACK */}
            <section className="py-24 bg-background-dark border-y border-border/40">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">Modern Technology Stack</h2>
                        <p className="text-foreground/70 max-w-2xl mx-auto text-lg mb-12">
                            We don't compromise on architecture. We build business website development projects using the same technologies powering the world's most demanding applications.
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                            {["React.js", "Next.js", "Vite", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL", "Framer Motion", "Sanity / Headless CMS", "Vercel / AWS"].map((tech, i) => (
                                <span key={i} className="px-6 py-3 bg-background border border-border/60 rounded-full text-white/90 font-medium hover:border-primary/50 hover:text-primary transition-colors">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 5. PROCESS */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">Our Delivery Process</h2>
                        <p className="text-foreground/70 text-lg">A transparent, milestone-driven approach to custom web development.</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        {[
                            { step: "01", title: "Discovery & Architecture", desc: "We map out your business requirements, target audience, and data structures. We deliver a comprehensive technical specification and architecture document." },
                            { step: "02", title: "UI/UX Design & Prototyping", desc: "Our designers craft high-fidelity wireframes and interactive prototypes in Figma, ensuring the user experience aligns perfectly with your brand." },
                            { step: "03", title: "Agile Development Sprints", desc: "We build your platform in two-week iterations. You receive regular staging links to test new features as they are completed." },
                            { step: "04", title: "QA & Performance Auditing", desc: "Rigorous cross-browser testing, accessibility (a11y) checks, and Lighthouse performance auditing to ensure sub-second load times." },
                            { step: "05", title: "Launch & Handoff", desc: "Seamless deployment to production, domain DNS management, analytics integration, and comprehensive training for your team." }
                        ].map((phase, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="flex gap-6 mb-12 last:mb-0 relative"
                            >
                                {i !== 4 && <div className="absolute left-6 top-16 bottom-[-3rem] w-px bg-border/50"></div>}
                                <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold font-display text-lg relative z-10">
                                    {phase.step}
                                </div>
                                <div className="pt-2">
                                    <h3 className="text-2xl font-bold text-white mb-3">{phase.title}</h3>
                                    <p className="text-foreground/70 text-lg leading-relaxed">{phase.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. FAQ SECTION */}
            <section className="py-24 bg-background-light/30 border-t border-border/40">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">Frequently Asked Questions</h2>
                    </div>
                    
                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-background border border-border/50 rounded-xl p-6 md:p-8"
                            >
                                <h3 className="text-xl font-bold text-white mb-4">{faq.question}</h3>
                                <p className="text-foreground/70 leading-relaxed">{faq.answer}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. CLOSING CTA */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5"></div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display max-w-3xl mx-auto">
                        Ready to elevate your digital presence?
                    </h2>
                    <p className="text-xl text-foreground/70 mb-10 max-w-2xl mx-auto">
                        Partner with our senior engineering team to build a custom web application that performs globally.
                    </p>
                    <Link to="/contact">
                        <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-background-dark px-10 py-7 text-lg group font-display font-bold gold-foil-outline shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                        >
                            Start Your Project Today
                            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </section>
            
            <Footer />
        </div>
    );
};

export default WebDevelopment;
