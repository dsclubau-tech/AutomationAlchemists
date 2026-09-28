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
                    {/* Header is now above the columns to keep it first on mobile */}
                    <div className="mb-8 lg:mb-16 bg-[#EEF7F5] rounded-2xl p-8 sm:p-12 text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl font-bold tracking-tight text-teal-900 lg:text-5xl font-display mb-3">
                            Let's Talk Automation
                        </h1>
                        <p className="text-base sm:text-lg font-medium text-teal-600/80 font-display">
                            No sales pitch on the first call. Just a straight answer on whether automation fixes your problem.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-stretch">
                        {/* Left column (contact details). On mobile, comes after the form (order-2). On desktop, it is left (lg:order-1). */}
                        <div className="flex flex-col h-full order-2 lg:order-1">
                            <div className="rounded-2xl shadow-sm hover:shadow-[0px_4px_20px_rgba(10,54,61,0.05)] transition-shadow border border-teal-600/20 bg-white p-5 sm:p-8 h-full flex flex-col justify-center">
                                <h3 className="text-lg sm:text-xl font-bold text-teal-900 font-display mb-6">Get in touch</h3>
                                <div className="space-y-6 sm:space-y-8">
                                    {/* Email Row */}
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-mint-50 flex flex-shrink-0 items-center justify-center mt-0.5">
                                            <Mail className="text-teal-600 w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                                        </div>
                                        <div className="flex flex-col min-w-0 w-full">
                                            <p className="text-xs sm:text-sm font-semibold text-teal-900/80 font-display">Email us</p>
                                            <a href="mailto:contact@automationalchemists.com" aria-label="Email contact@automationalchemists.com" className="text-sm sm:text-base font-medium text-teal-900 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-sm transition-colors min-h-[44px] flex items-center w-full break-words sm:break-normal">
                                                contact@automationalchemists.com
                                            </a>
                                        </div>
                                    </div>

                                    {/* WhatsApp Row */}
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-mint-50 flex flex-shrink-0 items-center justify-center mt-0.5">
                                            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="#25D366" className="w-4 h-4 sm:w-5 sm:h-5">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                            </svg>
                                        </div>
                                        <div className="flex flex-col min-w-0 w-full">
                                            <p className="text-xs sm:text-sm font-semibold text-teal-900/80 font-display">WhatsApp <span className="font-normal text-teal-900/60 text-[10px] sm:text-xs">(Messages only)</span></p>
                                            <div className="flex flex-col mt-1 w-full gap-2">
                                                <a href="https://wa.me/61404242373" aria-label="Message Australia office on WhatsApp" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base font-medium text-teal-900 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-sm transition-colors min-h-[44px] flex flex-col sm:grid sm:grid-cols-[100px_1fr] sm:items-center w-full group">
                                                    <span className="text-teal-900/80 font-normal text-xs sm:text-base">Australia:</span> 
                                                    <span className="whitespace-nowrap inline-flex items-center gap-2 group-hover:text-teal-600">+61 404 242 373</span>
                                                </a>
                                                <a href="https://wa.me/8801346831069" aria-label="Message Bangladesh office on WhatsApp" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base font-medium text-teal-900 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-sm transition-colors min-h-[44px] flex flex-col sm:grid sm:grid-cols-[100px_1fr] sm:items-center w-full group">
                                                    <span className="text-teal-900/80 font-normal text-xs sm:text-base">Bangladesh:</span> 
                                                    <span className="whitespace-nowrap inline-flex items-center gap-2 group-hover:text-teal-600">+880 134 683 1069</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Offices Row */}
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-mint-50 flex flex-shrink-0 items-center justify-center mt-0.5">
                                            <MapPin className="text-teal-600 w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                                        </div>
                                        <div className="flex flex-col min-w-0 w-full">
                                            <p className="text-xs sm:text-sm font-semibold text-teal-900/80 font-display mb-2">Offices</p>
                                            <div className="flex flex-col gap-4 w-full">
                                                <div>
                                                    <p className="text-xs sm:text-sm font-semibold text-teal-900 font-display">Australia</p>
                                                    <a href="https://www.google.com/maps/search/?api=1&query=3%2F33-37+Warialda+St%2C+Kogarah+NSW+2217" aria-label="View Australia office on Google Maps" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base text-teal-900 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-sm transition-colors min-h-[44px] flex items-center py-1">
                                                        3/33-37 Warialda St, Kogarah NSW 2217
                                                    </a>
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-semibold text-teal-900 font-display">Bangladesh</p>
                                                    <a href="https://www.google.com/maps/search/?api=1&query=Room+315%2C+4th+Floor%2C+Al+Rashid+Market%2C+Malopara%2C+Rajshahi+6100" aria-label="View Bangladesh office on Google Maps" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base text-teal-900 hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-sm transition-colors min-h-[44px] flex items-center py-1">
                                                        Room 315, 4th Floor, Al Rashid Market, Malopara, Rajshahi 6100
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right column (Expandable form trigger panel). On mobile, comes first (order-1). On desktop, it is right (lg:order-2). */}
                        <div className="flex flex-col h-full order-1 lg:order-2">
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
