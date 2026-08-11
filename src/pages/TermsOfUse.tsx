import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const TermsOfUse = () => {
    return (
        <div className="min-h-screen bg-[#aaccd6] text-[#1c1b1b] selection:bg-[#112E81] selection:text-white">
            <Navigation />

            <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden pt-20">
                <div className="container mx-auto px-6 py-20 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 font-display">
                            <span className="text-[#00195c]">
                                Terms of Use
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-[#444651] mb-8 max-w-3xl mx-auto font-display">
                            Please read these terms carefully before using our services.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="pb-24">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-[#c5c5d3]/30">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-[#00195c] mb-4 font-display">1. Acceptance of Terms</h2>
                                <p className="text-sm text-[#444651] font-display leading-relaxed">
                                    By accessing and using Automation Alchemists services, you accept and agree to be bound by the terms and provision of this agreement.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[#00195c] mb-4 font-display">2. Use License</h2>
                                <p className="text-sm text-[#444651] font-display leading-relaxed mb-4">
                                    Permission is granted to temporarily access the materials (information or software) on Automation Alchemists' website for personal, non-commercial transitory viewing only.
                                </p>
                                <p className="text-sm text-[#444651] font-display leading-relaxed">
                                    This is the grant of a license, not a transfer of title, and under this license you may not:
                                </p>
                                <ul className="list-disc list-inside text-sm text-[#444651] font-display mt-2 space-y-2 leading-relaxed">
                                    <li>Modify or copy the materials</li>
                                    <li>Use the materials for any commercial purpose or for any public display</li>
                                    <li>Attempt to reverse engineer any software contained on Automation Alchemists' website</li>
                                    <li>Remove any copyright or other proprietary notations from the materials</li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[#00195c] mb-4 font-display">3. Service Description</h2>
                                <p className="text-sm text-[#444651] font-display leading-relaxed">
                                    Automation Alchemists provides automation solutions, virtual assistants, and workflow automation services. We reserve the right to modify or discontinue services at any time without notice.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[#00195c] mb-4 font-display">4. User Responsibilities</h2>
                                <p className="text-sm text-[#444651] font-display leading-relaxed">
                                    You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[#00195c] mb-4 font-display">5. Limitation of Liability</h2>
                                <p className="text-sm text-[#444651] font-display leading-relaxed">
                                    In no event shall Automation Alchemists or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website or services.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[#00195c] mb-4 font-display">6. Revisions</h2>
                                <p className="text-sm text-[#444651] font-display leading-relaxed">
                                    Automation Alchemists may revise these terms of use at any time without notice. By using this website and our services, you are agreeing to be bound by the current version of these Terms of Use.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[#00195c] mb-4 font-display">7. Contact Information</h2>
                                <p className="text-sm text-[#444651] font-display leading-relaxed">
                                    If you have any questions about these Terms of Use, please contact us at{" "}
                                    <a href="mailto:dsclub.au@outlook.com" className="text-[#112E81] hover:underline font-medium">
                                        dsclub.au@outlook.com
                                    </a>
                                </p>
                            </div>

                            <div className="pt-8 border-t border-[#c5c5d3]/50">
                                <p className="text-xs text-[#8c8e9b] font-display">
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
