import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
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
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 font-display">
                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">
                                Privacy Policy
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-display">
                            Your privacy is important to us. Learn how we collect, use, and protect your information.
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
                                <h2 className="text-2xl font-bold text-primary mb-4 font-display">1. Information We Collect</h2>
                                <p className="text-sm text-muted-foreground font-display mb-4">
                                    We collect information that you provide directly to us, including:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground font-display space-y-2">
                                    <li>Name and contact information</li>
                                    <li>Email address</li>
                                    <li>Business information</li>
                                    <li>Payment information</li>
                                    <li>Communications with us</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-display">2. How We Use Your Information</h2>
                                <p className="text-sm text-muted-foreground font-display mb-4">
                                    We use the information we collect to:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground font-display space-y-2">
                                    <li>Provide, maintain, and improve our services</li>
                                    <li>Process transactions and send related information</li>
                                    <li>Send you technical notices and support messages</li>
                                    <li>Respond to your comments and questions</li>
                                    <li>Monitor and analyze trends and usage</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-display">3. Information Sharing</h2>
                                <p className="text-sm text-muted-foreground font-display">
                                    We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground font-display mt-2 space-y-2">
                                    <li>With your consent</li>
                                    <li>To comply with legal obligations</li>
                                    <li>To protect our rights and safety</li>
                                    <li>With service providers who assist in our operations</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-display">4. Data Security</h2>
                                <p className="text-sm text-muted-foreground font-display">
                                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-display">5. Cookies and Tracking</h2>
                                <p className="text-sm text-muted-foreground font-display">
                                    We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-display">6. Your Rights</h2>
                                <p className="text-sm text-muted-foreground font-display mb-4">
                                    You have the right to:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground font-display space-y-2">
                                    <li>Access your personal information</li>
                                    <li>Correct inaccurate data</li>
                                    <li>Request deletion of your data</li>
                                    <li>Object to processing of your data</li>
                                    <li>Request data portability</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-display">7. Changes to This Policy</h2>
                                <p className="text-sm text-muted-foreground font-display">
                                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-primary mb-4 font-display">8. Contact Us</h2>
                                <p className="text-sm text-muted-foreground font-display">
                                    If you have any questions about this Privacy Policy, please contact us at{" "}
                                    <a href="mailto:dsclub.au@outlook.com" className="text-accent hover:underline">
                                        dsclub.au@outlook.com
                                    </a>
                                </p>
                            </div>

                            <div className="pt-8 border-t border-border">
                                <p className="text-xs text-muted-foreground font-display">
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

export default PrivacyPolicy;
