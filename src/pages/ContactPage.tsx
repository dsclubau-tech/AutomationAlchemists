import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { ExpandableContactForm } from "@/components/ExpandableContactForm";

const ContactPage = () => {
    return (
        <div className="min-h-screen bg-background-dark text-text-main time-fold-ripple overflow-x-hidden">
            <PageLoader pageName="Contact" />
            <Navigation />

            {/* Fractal Corner Frames */}
            <div className="pointer-events-none absolute top-0 left-0 h-1/2 w-1/2 opacity-20" style={{ background: 'radial-gradient(circle at top left, rgba(212,175,55,0.4) 0%, transparent 40%)' }}></div>
            <div className="pointer-events-none absolute bottom-0 right-0 h-1/2 w-1/2 opacity-20" style={{ background: 'radial-gradient(circle at bottom right, rgba(212,175,55,0.4) 0%, transparent 40%)' }}></div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24">
                <div className="broken-gold-line my-4 opacity-50"></div>

                <main className="py-16 sm:py-24">
                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
                        <div className="flex flex-col">
                            <div className="mb-8">
                                <h1 className="text-4xl font-black tracking-[-0.033em] text-white lg:text-5xl font-display">
                                    Open a Quantum Channel
                                </h1>
                                <p className="mt-3 text-base font-normal text-text-muted font-display">
                                    Initiate a dialogue to reshape your operational reality.
                                </p>
                            </div>

                            <div className="mt-8 rounded-2xl shadow-singularity border border-primary/20 bg-surface-dark/50 p-8 backdrop-blur-sm">
                                <h3 className="text-xl font-bold text-white font-display">Direct Coordinates</h3>
                                <div className="mt-6 space-y-6 text-text-main">
                                    <div className="flex items-start gap-4">
                                        <MapPin className="mt-1 text-primary w-5 h-5" />
                                        <div>
                                            <p className="font-semibold font-display">Address</p>
                                            <p className="text-text-muted font-display">3/33-37 Warialda St<br />Kogarah NSW 2217</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Mail className="mt-1 text-primary w-5 h-5" />
                                        <div>
                                            <p className="font-semibold font-display">Email</p>
                                            <p className="text-text-muted font-display">dsclub.au@outlook.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Phone className="mt-1 text-primary w-5 h-5" />
                                        <div>
                                            <p className="font-semibold font-display">Phone</p>
                                            <p className="text-text-muted font-display">+61 404 242 373</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Business Hours */}
                            <div className="mt-8 rounded-2xl shadow-singularity border border-primary/20 bg-surface-dark/50 p-8 backdrop-blur-sm">
                                <h3 className="text-xl font-bold text-white font-display mb-4">Temporal Availability</h3>
                                <div className="space-y-2 text-sm text-text-muted font-display">
                                    <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                                    <p>Saturday: 10:00 AM - 4:00 PM EST</p>
                                    <p>Sunday: Closed</p>
                                    <p className="text-primary mt-4 font-bold">24/7 Support for Enterprise Clients</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <ExpandableContactForm />
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
};

export default ContactPage;
