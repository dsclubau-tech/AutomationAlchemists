import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
    ArrowRight, 
    Cog, 
    TrendingUp, 
    Network, 
    Cpu, 
    Settings2,
    FileCode2,
    CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import SchemaMarkup from "@/components/SchemaMarkup";

const Automation = () => {
    const faqs = [
        {
            question: "What is business process automation?",
            answer: "Business process automation involves using software to execute recurring tasks and workflows that previously required manual human effort. By writing custom scripts or utilizing platforms like Make and Zapier, we connect your disconnected software tools so data flows automatically between them."
        },
        {
            question: "How do we know if a process can be automated?",
            answer: "If a task is repetitive, rule-based, and involves digital data, it can almost always be automated. Common examples include lead routing from your website to your CRM, automatic invoice generation from closed deals, and syncing inventory data across multiple storefronts."
        },
        {
            question: "Do you use no-code tools or custom scripts?",
            answer: "Both, depending on your needs. For standard integrations, we leverage enterprise iPaaS platforms like Make (Integromat) or Zapier for rapid deployment. For complex or highly secure environments, our engineers write custom Node.js or Python microservices to handle the automation securely."
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
                title="Custom Workflow Automation for Growing Businesses | AAlchemists"
                description="Streamline your operations with our workflow automation consulting. We integrate AI and automation tools to save time and boost efficiency."
                url="https://automationalchemists.com/services/automation"
                keywords="business process automation services, workflow automation agency, custom automation solutions"
            />
            <SchemaMarkup
                type="ProfessionalService"
                data={{
                    name: "Workflow Automation",
                    description: "Streamline your operations with our workflow automation consulting. We integrate AI and automation tools to save time and boost efficiency.",
                    url: "https://automationalchemists.com/services/automation",
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
                            <Cog className="w-4 h-4" /> Operations Engineering
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 font-display leading-tight">
                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">
                                Custom Workflow Automation
                            </span>
                            <br />for Growing Businesses
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-foreground/80 mb-10 max-w-3xl mx-auto font-display leading-relaxed">
                            Stop paying humans to do the work of machines. We audit your operational bottlenecks and architect intelligent, automated workflows that eliminate manual data entry, reduce costly errors, and liberate your team to focus on high-leverage growth.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/contact">
                                <Button
                                    size="lg"
                                    className="bg-primary hover:bg-primary/90 text-background-dark px-8 py-6 text-base group font-display font-bold gold-foil-outline"
                                >
                                    Audit Your Workflows
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to="/services/saas-development" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                Looking to build a full SaaS instead?
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
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display text-white">The Hidden Cost of Manual Operations</h2>
                            <div className="space-y-6 text-foreground/80 text-lg leading-relaxed">
                                <p>
                                    As companies scale, their software ecosystems fracture. Sales uses Salesforce, marketing uses HubSpot, finance uses QuickBooks, and operations lives in Google Sheets. Without an automated bridge between these systems, your most expensive asset—your employees—spend hours every week manually copying and pasting data between tabs.
                                </p>
                                <p>
                                    <strong>AAlchemists engineers connectivity.</strong> As a specialized workflow automation agency, we map your fragmented data silos and deploy robust integrations that run silently in the background 24/7. We replace brittle, manual human processes with deterministic logic.
                                </p>
                                <p>
                                    From triggering complex onboarding sequences the moment a Stripe payment clears, to automatically enriching CRM records using AI, our custom automation solutions transform chaotic operations into streamlined, scalable systems.
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
                            <h3 className="text-2xl font-bold mb-6 font-display text-white">Our Automation Approach</h3>
                            <ul className="space-y-5">
                                {[
                                    "Deep audits of your current operational bottlenecks",
                                    "Platform-agnostic integration architecture",
                                    "Focus on data security and privacy compliance",
                                    "Comprehensive error handling and alerting systems",
                                    "Clear documentation for your internal team"
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
                            Automation Deliverables
                        </h2>
                        <p className="text-foreground/70 max-w-2xl mx-auto text-lg">
                            We don't just connect apps; we engineer reliable, self-healing business systems.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Network,
                                title: "CRM & Marketing Sync",
                                desc: "Bi-directional data flows between Salesforce, HubSpot, ActiveCampaign, and your internal databases."
                            },
                            {
                                icon: FileCode2,
                                title: "Custom API Middleware",
                                desc: "Bespoke Node.js or Python scripts to connect legacy software systems that lack modern native integrations."
                            },
                            {
                                icon: Cpu,
                                title: "AI Integration Pipelines",
                                desc: "Automatic routing of incoming data through OpenAI or Claude APIs for summarization, categorization, and sentiment analysis."
                            },
                            {
                                icon: Settings2,
                                title: "Financial Operations",
                                desc: "Automated invoice generation, payment reconciliation, and Stripe-to-accounting-software synchronization."
                            },
                            {
                                icon: TrendingUp,
                                title: "Sales Enablement",
                                desc: "Automated lead enrichment, instant Slack/Teams notifications for high-value prospects, and intelligent email sequencing."
                            },
                            {
                                icon: Cog,
                                title: "Error Handling & Logging",
                                desc: "Sophisticated fail-safes that catch API timeouts, alert your team via Slack, and automatically retry failed tasks."
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
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">Integration Ecosystem</h2>
                        <p className="text-foreground/70 max-w-2xl mx-auto text-lg mb-12">
                            We utilize industry-standard iPaaS platforms alongside custom code to execute business process automation services flawlessly.
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                            {["Make (Integromat)", "Zapier", "Node.js (Custom Scripts)", "Python", "AWS Lambda", "OpenAI API", "Stripe API", "HubSpot API", "Salesforce REST API", "Airtable"].map((tech, i) => (
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
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">How We Automate</h2>
                        <p className="text-foreground/70 text-lg">A systematic approach to diagnosing and eliminating operational inefficiencies.</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        {[
                            { step: "01", title: "Workflow Auditing", desc: "We interview your key stakeholders to map out existing manual processes, identifying the highest-ROI opportunities for automation." },
                            { step: "02", title: "Systems Architecture", desc: "We design the data flow architecture, selecting the right tools (iPaaS vs. custom code) and defining exact API endpoints." },
                            { step: "03", title: "Development & Integration", desc: "Our engineers build the automated sequences in a sandbox environment, ensuring secure authentication and robust error handling." },
                            { step: "04", title: "Shadow Testing", desc: "We run the automated systems in parallel with your manual processes to verify data accuracy without disrupting live operations." },
                            { step: "05", title: "Deployment & Training", desc: "We push the workflows live, monitor their execution, and provide comprehensive documentation for your operations team." }
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
                        Stop doing robot work manually.
                    </h2>
                    <p className="text-xl text-foreground/70 mb-10 max-w-2xl mx-auto">
                        Partner with our engineers to architect custom automation solutions that scale your output without scaling your headcount.
                    </p>
                    <Link to="/contact">
                        <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-background-dark px-10 py-7 text-lg group font-display font-bold gold-foil-outline shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                        >
                            Automate Your Operations
                            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </section>
            
            <Footer />
        </div>
    );
};

export default Automation;
