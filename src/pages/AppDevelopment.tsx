import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
    ArrowRight, 
    Smartphone, 
    Layers, 
    Zap, 
    ShieldCheck, 
    Globe,
    Wifi,
    CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import SchemaMarkup from "@/components/SchemaMarkup";

const AppDevelopment = () => {
    const faqs = [
        {
            question: "Why should we choose Flutter over native iOS and Android development?",
            answer: "Flutter allows us to write a single codebase that compiles to native ARM code for both iOS and Android. This cuts development time and maintenance costs by nearly 50% without sacrificing the 60fps native performance or device-specific UI patterns your users expect."
        },
        {
            question: "Can you rescue an existing app development project?",
            answer: "Yes. Our senior engineers routinely take over legacy or stalled Android and iOS codebases. We perform a deep technical audit, refactor the technical debt, and can either stabilize your native apps or migrate them efficiently to a cross-platform framework."
        },
        {
            question: "Do you handle the App Store and Google Play submission process?",
            answer: "Yes, we handle the entire deployment lifecycle. We manage the provisioning profiles, certificates, asset generation, and the rigorous review processes for both the Apple App Store and Google Play Store to ensure a successful launch."
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
                title="Flutter App Development for iOS & Android | AAlchemists"
                description="Top-tier Android and Flutter app development. We create cross-platform mobile apps with native performance to reach your global audience."
                url="https://automationalchemists.com/services/app-development"
                keywords="Flutter app development company, Android app development services, cross-platform mobile app development"
            />
            <SchemaMarkup
                type="ProfessionalService"
                data={{
                    name: "App Development",
                    description: "Top-tier Android and Flutter app development. We create cross-platform mobile apps with native performance to reach your global audience.",
                    url: "https://automationalchemists.com/services/app-development",
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
                            <Smartphone className="w-4 h-4" /> Cross-Platform Mobile Solutions
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 font-display leading-tight">
                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">
                                Flutter App Development
                            </span>
                            <br />for iOS & Android
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-foreground/80 mb-10 max-w-3xl mx-auto font-display leading-relaxed">
                            We engineer native-feeling mobile applications that dominate both app stores. Cut your development time in half with cross-platform architecture without compromising on performance, UI complexity, or device hardware integration.
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
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display text-white">The Dual-Codebase Dilemma</h2>
                            <div className="space-y-6 text-foreground/80 text-lg leading-relaxed">
                                <p>
                                    Building for mobile used to mean a painful choice: either fund two completely separate engineering teams to build native iOS and Android apps, or settle for a sluggish, web-wrapped hybrid app that feels cheap to your users. Maintaining dual codebases means twice the bugs, twice the deployment headaches, and feature disparity between your Apple and Android users.
                                </p>
                                <p>
                                    <strong>AAlchemists eliminates this friction.</strong> By leveraging Dart and the Flutter SDK, our senior developers compile a single, pristine codebase directly into native ARM machine code. Your app gets direct hardware access, fluid 60-120fps animations, and a pixel-perfect UI.
                                </p>
                                <p>
                                    As a boutique Flutter app development company, we don't just write code—we architect resilient mobile ecosystems designed for massive user acquisition and retention.
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
                            <h3 className="text-2xl font-bold mb-6 font-display text-white">Why Partner With Us?</h3>
                            <ul className="space-y-5">
                                {[
                                    "Native iOS and Android delivery from day one",
                                    "Deep expertise in complex state management",
                                    "Direct integration with device hardware APIs",
                                    "Strict adherence to Apple HIG & Material Design",
                                    "Zero outsourcing—you speak directly to the builders"
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
                            Core Mobile Capabilities
                        </h2>
                        <p className="text-foreground/70 max-w-2xl mx-auto text-lg">
                            We deliver comprehensive, end-to-end mobile engineering services.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Layers,
                                title: "Custom UI/UX Engineering",
                                desc: "Platform-aware interfaces that dynamically adapt styling to match iOS and Android native design languages."
                            },
                            {
                                icon: Globe,
                                title: "Offline-First Architecture",
                                desc: "Robust local caching (SQLite/Hive) ensuring your app remains functional even when connectivity drops."
                            },
                            {
                                icon: Zap,
                                title: "Hardware Integration",
                                desc: "Seamless utilization of device cameras, GPS, Bluetooth, biometric authentication, and push notifications."
                            },
                            {
                                icon: ShieldCheck,
                                title: "Secure Data Handling",
                                desc: "Encrypted local storage, certificate pinning, and secure OAuth flows to protect sensitive user data."
                            },
                            {
                                icon: Wifi,
                                title: "Real-Time Sync",
                                desc: "WebSocket and WebRTC integrations for live chat, streaming data, and instant cross-device synchronization."
                            },
                            {
                                icon: Smartphone,
                                title: "App Store Publishing",
                                desc: "Complete management of the complex provisioning, building, and review processes for both major app stores."
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
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">Mobile Engineering Stack</h2>
                        <p className="text-foreground/70 max-w-2xl mx-auto text-lg mb-12">
                            We utilize the most advanced frameworks available for cross-platform mobile app development.
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                            {["Flutter", "Dart", "Swift (iOS Native)", "Kotlin (Android Native)", "Firebase", "Supabase", "SQLite", "Riverpod / BLoC", "Fastlane", "Codemagic CI/CD"].map((tech, i) => (
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
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">Our Engineering Process</h2>
                        <p className="text-foreground/70 text-lg">A systematic approach to bringing robust mobile applications to market.</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        {[
                            { step: "01", title: "Technical Scoping", desc: "We define the exact feature matrix, third-party API requirements, and hardware dependencies required for your mobile application." },
                            { step: "02", title: "System Architecture", desc: "Our senior engineers design the state management approach, local database schemas, and data synchronization flows." },
                            { step: "03", title: "Iterative Engineering", desc: "We build your app in transparent sprint cycles. You receive TestFlight and Google Play Console invites to test the app on your actual devices as it's built." },
                            { step: "04", title: "Native QA Testing", desc: "We test across a matrix of physical iOS and Android devices to ensure flawless UI rendering on different screen sizes and operating system versions." },
                            { step: "05", title: "Deployment & Maintenance", desc: "We handle the rigorous app store review processes and establish CI/CD pipelines for seamless future updates." }
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
                        Ready to dominate the app stores?
                    </h2>
                    <p className="text-xl text-foreground/70 mb-10 max-w-2xl mx-auto">
                        Partner with our technical founders to engineer a high-performance Flutter app that scales globally.
                    </p>
                    <Link to="/contact">
                        <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-background-dark px-10 py-7 text-lg group font-display font-bold gold-foil-outline shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                        >
                            Start Your App Project
                            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </section>
            
            <Footer />
        </div>
    );
};

export default AppDevelopment;
