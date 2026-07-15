import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
    ArrowRight, 
    Cloud, 
    Users, 
    Server, 
    Lock, 
    BarChart3,
    CreditCard,
    CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import SchemaMarkup from "@/components/SchemaMarkup";

const SaasDevelopment = () => {
    const faqs = [
        {
            question: "How long does it take to build a SaaS MVP?",
            answer: "A scalable, production-ready SaaS MVP typically takes 8 to 12 weeks to engineer. This includes core functionality, multi-tenant database architecture, secure authentication, and a billing system integration like Stripe. We focus on launching quickly so you can validate with real users."
        },
        {
            question: "Do you own the codebase after the SaaS is launched?",
            answer: "No. You retain 100% ownership of all intellectual property, source code, and assets from day one. We operate as your dedicated engineering partner, providing full handoff and documentation upon completion of the build."
        },
        {
            question: "Can you help scale our SaaS once we hit product-market fit?",
            answer: "Yes, our architecture is designed for scale from the beginning. Once you hit product-market fit, we offer retainer-based agile sprint cycles to continuously build new features, optimize database queries, and scale your cloud infrastructure to handle increased load."
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
                title="Custom SaaS Development Agency for Scalable MVPs | AAlchemists"
                description="End-to-end SaaS development services. From conceptualization to deployment, we build scalable software-as-a-service platforms."
                url="https://automationalchemists.com/services/saas-development"
                keywords="SaaS MVP development, custom SaaS development agency, SaaS product development services"
            />
            <SchemaMarkup
                type="ProfessionalService"
                data={{
                    name: "SaaS Development",
                    description: "End-to-end SaaS development services. From conceptualization to deployment, we build scalable software-as-a-service platforms.",
                    url: "https://automationalchemists.com/services/saas-development",
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
                            <Cloud className="w-4 h-4" /> B2B & B2C Software Engineering
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 font-display leading-tight">
                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">
                                Custom SaaS Development Agency
                            </span>
                            <br />for Scalable MVPs
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-foreground/80 mb-10 max-w-3xl mx-auto font-display leading-relaxed">
                            Turn your industry expertise into a recurring revenue engine. We engineer secure, multi-tenant software platforms designed to scale from your first ten beta testers to tens of thousands of enterprise users.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/contact">
                                <Button
                                    size="lg"
                                    className="bg-primary hover:bg-primary/90 text-background-dark px-8 py-6 text-base group font-display font-bold gold-foil-outline"
                                >
                                    Start Your SaaS Build
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to="/services/automation" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                Need to automate workflows first?
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
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display text-white">The Cost of Bad Architecture</h2>
                            <div className="space-y-6 text-foreground/80 text-lg leading-relaxed">
                                <p>
                                    Building a SaaS product is radically different than building a standard website. If your engineering team doesn't understand multi-tenant data isolation, horizontal scaling, or complex state management, your MVP will collapse under its own weight the moment you achieve product-market fit. Rebuilding a poorly architected platform can cost months of runway.
                                </p>
                                <p>
                                    <strong>AAlchemists builds SaaS platforms the right way from day one.</strong> As a specialized custom SaaS development agency, our founders architect your platform using enterprise-grade paradigms. We balance speed-to-market with rock-solid infrastructure so you can launch fast and scale safely.
                                </p>
                                <p>
                                    We don't just write functions; we engineer revenue-generating assets. We understand subscription billing edge-cases, user onboarding funnels, and the critical importance of a snappy, intuitive user interface.
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
                            <h3 className="text-2xl font-bold mb-6 font-display text-white">Our SaaS Engineering Philosophy</h3>
                            <ul className="space-y-5">
                                {[
                                    "Strict multi-tenant data isolation and security",
                                    "Serverless architecture for cost-effective scaling",
                                    "Lightning-fast, optimistic UI updates",
                                    "Direct integration with Stripe/Paddle billing",
                                    "Founders coding for founders"
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
                            SaaS Platform Deliverables
                        </h2>
                        <p className="text-foreground/70 max-w-2xl mx-auto text-lg">
                            We deliver a complete ecosystem, not just a codebase. Here is what we build for your SaaS.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Users,
                                title: "Authentication & RBAC",
                                desc: "Secure user authentication (OAuth, magic links) and granular Role-Based Access Control (Admin, Member, Viewer)."
                            },
                            {
                                icon: Server,
                                title: "Multi-Tenant Architecture",
                                desc: "Row-Level Security (RLS) and logical database separation to ensure user data remains strictly isolated."
                            },
                            {
                                icon: CreditCard,
                                title: "Subscription Billing",
                                desc: "Deep integration with Stripe for tiered pricing, usage-based billing, webhooks, and customer portals."
                            },
                            {
                                icon: Cloud,
                                title: "API Development",
                                desc: "Robust, documented RESTful or GraphQL APIs allowing third parties to integrate with your SaaS platform."
                            },
                            {
                                icon: Lock,
                                title: "Enterprise Security",
                                desc: "Protection against SQL injection, XSS, and CSRF attacks. Automated daily backups and compliance-ready infrastructure."
                            },
                            {
                                icon: BarChart3,
                                title: "Admin & Analytics Dashboard",
                                desc: "A super-admin portal for you to manage users, monitor system health, and track MRR and churn metrics."
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
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">Enterprise-Grade Stack</h2>
                        <p className="text-foreground/70 max-w-2xl mx-auto text-lg mb-12">
                            We rely on mature, proven technologies that power Fortune 500 platforms and fast-growing YC startups.
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                            {["Next.js App Router", "React Server Components", "Supabase", "PostgreSQL", "Prisma ORM", "Stripe API", "Tailwind CSS", "Redis", "AWS / Vercel Edge", "Docker"].map((tech, i) => (
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
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">The MVP Path to Market</h2>
                        <p className="text-foreground/70 text-lg">Our sprint-based methodology ensures you launch fast and iterate safely.</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        {[
                            { step: "01", title: "Product Strategy & Scoping", desc: "We aggressively cut unnecessary features to define the leanest, most impactful Minimum Viable Product (MVP)." },
                            { step: "02", title: "Database & Architecture", desc: "Before writing any UI code, we design the PostgreSQL schemas, API routes, and strictly define the multi-tenant security rules." },
                            { step: "03", title: "Core Engineering Sprints", desc: "We execute bi-weekly development sprints. You receive staging links constantly to test the platform as it takes shape." },
                            { step: "04", title: "Billing & Subscriptions", desc: "We implement secure payment gateways, webhook listeners, and provision the user tiers within your application." },
                            { step: "05", title: "Launch & Iterate", desc: "We deploy to production, monitor initial user behavior, and immediately transition into maintenance and feature-iteration cycles." }
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
                        Ready to build your software product?
                    </h2>
                    <p className="text-xl text-foreground/70 mb-10 max-w-2xl mx-auto">
                        Partner with our senior engineering team to architect a highly scalable, secure SaaS platform that drives recurring revenue.
                    </p>
                    <Link to="/contact">
                        <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-background-dark px-10 py-7 text-lg group font-display font-bold gold-foil-outline shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                        >
                            Discuss Your SaaS Concept
                            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </section>
            
            <Footer />
        </div>
    );
};

export default SaasDevelopment;
