import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const TermsOfUse = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden pt-20">
                <div className="container mx-auto px-6 py-32 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 font-determination">
                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">
                                Terms of Use
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-determination">
                            Please read these terms carefully before using our services.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="py-24 bg-gradient-subtle">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto prose prose-invert">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="space-y-8 text-foreground"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-determination">1. Acceptance of Terms</h2>
                                <p className="text-sm text-muted-foreground font-determination">
                                    By accessing and using AAlchemists services, you accept and agree to be bound by the terms and provision of this agreement.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-determination">2. Use License</h2>
                                <p className="text-sm text-muted-foreground font-determination mb-4">
                                    Permission is granted to temporarily access the materials (information or software) on AAlchemists' website for personal, non-commercial transitory viewing only.
                                </p>
                                <p className="text-sm text-muted-foreground font-determination">
                                    This is the grant of a license, not a transfer of title, and under this license you may not:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground font-determination mt-2 space-y-2">
                                    <li>Modify or copy the materials</li>
                                    <li>Use the materials for any commercial purpose or for any public display</li>
                                    <li>Attempt to reverse engineer any software contained on AAlchemists' website</li>
                                    <li>Remove any copyright or other proprietary notations from the materials</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-determination">3. Service Description</h2>
                                <p className="text-sm text-muted-foreground font-determination">
                                    AAlchemists provides automation solutions, virtual assistants, and workflow automation services. We reserve the right to modify or discontinue services at any time without notice.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-determination">4. User Responsibilities</h2>
                                <p className="text-sm text-muted-foreground font-determination">
                                    You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-determination">5. Limitation of Liability</h2>
                                <p className="text-sm text-muted-foreground font-determination">
                                    In no event shall AAlchemists or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website or services.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-determination">6. Revisions</h2>
                                <p className="text-sm text-muted-foreground font-determination">
                                    AAlchemists may revise these terms of use at any time without notice. By using this website and our services, you are agreeing to be bound by the current version of these Terms of Use.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-determination">7. Contact Information</h2>
                                <p className="text-sm text-muted-foreground font-determination">
                                    If you have any questions about these Terms of Use, please contact us at{" "}
                                    <a href="mailto:dsclub.au@outlook.com" className="text-accent hover:underline">
                                        dsclub.au@outlook.com
                                    </a>
                                </p>
                            </div>

                            <div className="pt-8 border-t border-border">
                                <p className="text-xs text-muted-foreground font-determination">
                                    Last updated: {new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default TermsOfUse;
