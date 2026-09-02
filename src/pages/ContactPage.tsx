/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import SEOHead from "@/components/SEOHead";
import { Mail, Phone, MapPin } from "lucide-react";
import { ExpandableContactForm } from "@/components/ExpandableContactForm";

interface ContactSettings {
    address: { line1: string; line2: string };
    email: string;
    phone: string;
    hours: { weekdays: string; saturday: string; sunday: string; enterprise: string };
}

const defaultSettings: ContactSettings = {
    address: { line1: '3/33-37 Warialda St', line2: 'Kogarah NSW 2217' },
    email: 'dsclub.au@outlook.com',
    phone: '+61 404 242 373',
    hours: {
        weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM AEST',
        saturday: 'Saturday: 10:00 AM - 4:00 PM AEST',
        sunday: 'Sunday: Closed',
        enterprise: '24/7 Support for Enterprise Clients'
    }
};

const ContactPage = () => {
    const [settings, setSettings] = useState<ContactSettings>(defaultSettings);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data, error } = await (supabase as any)
                    .from('site_settings')
                    .select('*')
                    .in('key', ['contact_address', 'contact_email', 'contact_phone', 'business_hours']);

                if (error) throw error;

                if (data && data.length > 0) {
                    const newSettings = { ...defaultSettings };
                    data.forEach((item: any) => {
                        const value = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
                        switch (item.key) {
                            case 'contact_address':
                                newSettings.address = value;
                                break;
                            case 'contact_email':
                                newSettings.email = value;
                                break;
                            case 'contact_phone':
                                newSettings.phone = value;
                                break;
                            case 'business_hours':
                                newSettings.hours = value;
                                break;
                        }
                    });
                    setSettings(newSettings);
                }
            } catch (error) {
                console.error('Error fetching contact settings:', error);
            }
        };

        fetchSettings();
    }, []);

    return (
 <div className="min-h-screen bg-mint-50 text-teal-900 antialiased selection:bg-teal-600 selection:text-white overflow-x-hidden">
            <SEOHead
                title="Contact"
                description="Get in touch with Automation Alchemists. We're ready to help transform your business with automation, AI, and custom solutions."
                keywords="contact, get in touch, automation inquiry, business consultation"
            />
            <PageLoader pageName="Contact" />
            <Navigation />

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32">
                <main className="pb-16 sm:pb-24">
                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
                        <div className="flex flex-col">
                            <div className="mb-8 bg-[#EEF7F5] rounded-2xl p-8 sm:p-12 text-center">
                                <h1 className="text-4xl font-bold tracking-tight text-teal-900 lg:text-5xl font-display mb-3">
                                    Let's Talk Automation
                                </h1>
                                <p className="text-base sm:text-lg font-medium text-teal-600/80 font-display">
                                    No sales pitch on the first call. Just a straight answer on whether automation fixes your problem.
                                </p>
                            </div>

                            <div className="mt-8 rounded-2xl shadow-sm hover:shadow-[0px_4px_20px_rgba(10,54,61,0.05)] transition-shadow border border-teal-600/20 bg-white p-8">
                                <h3 className="text-xl font-bold text-teal-900 font-display">Direct Coordinates</h3>
 <div className="mt-6 space-y-6 text-teal-900">
                                    <div className="flex items-start gap-4">
 <MapPin className="mt-1 text-teal-600 w-5 h-5" />
                                        <div>
                                            <p className="font-semibold font-display">Address</p>
                                            <p className="text-teal-900/80 font-display">
                                                {settings.address.line1}<br />{settings.address.line2}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
 <Mail className="mt-1 text-teal-600 w-5 h-5" />
                                        <div>
                                            <p className="font-semibold font-display">Email</p>
                                            <p className="text-teal-900/80 font-display">{settings.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
 <Phone className="mt-1 text-teal-600 w-5 h-5" />
                                        <div>
                                            <p className="font-semibold font-display">Phone</p>
                                            <p className="text-teal-900/80 font-display">{settings.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Business Hours */}
                            <div className="mt-8 rounded-2xl shadow-sm hover:shadow-[0px_4px_20px_rgba(10,54,61,0.05)] transition-shadow border border-teal-600/20 bg-white p-8">
                                <h3 className="text-xl font-bold text-teal-900 font-display mb-4">Temporal Availability</h3>
                                <div className="space-y-2 text-sm text-teal-900/80 font-display">
                                    <p>{settings.hours.weekdays}</p>
                                    <p>{settings.hours.saturday}</p>
                                    <p>{settings.hours.sunday}</p>
 <p className="text-teal-600 mt-4 font-bold">{settings.hours.enterprise}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <ExpandableContactForm />
                        </div>
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default ContactPage;
