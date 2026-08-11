import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Services = () => {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [isSubscribing, setIsSubscribing] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubscribing(true);
        try {
            const { error } = await supabase
                .from('newsletter_subscribers')
                .insert([{ email: email.trim() }]);

            if (error) {
                if (error.code === '23505') {
                    toast({
                        title: 'Already Subscribed',
                        description: 'This email is already on our list!',
                    });
                } else {
                    throw error;
                }
            } else {
                toast({
                    title: 'Subscribed!',
                    description: 'Welcome to the newsletter. Check your inbox soon!',
                });
                setEmail('');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to subscribe. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubscribing(false);
        }
    };

    return (
        <div className="bg-[#aaccd6] text-[#1c1b1b] antialiased selection:bg-[#112E81] selection:text-white min-h-screen">
            <SEOHead
                title="Services - Automation Alchemists"
                description="Explore our comprehensive automation services: Virtual Assistants, Workflow Automation, API Integration, and Custom software development."
                keywords="automation services, virtual assistants, workflow automation, app development, software development, SaaS"
            />
            <Navigation />

            {/* Hero Section */}
            <header className="pt-32 pb-24 px-4 sm:px-6 md:px-12 bg-[#112E81] text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
                    <div>
                        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">We Build Systems That Scale.</h1>
                        <p className="font-body-lg text-lg md:text-xl text-[#f6f3f2] mb-8 max-w-xl">
                            Stop trading time for money. We design custom automation workflows that handle your repetitive tasks, so you can focus on growth.
                        </p>
                        <button className="bg-white text-[#112E81] px-8 py-4 rounded font-semibold text-sm hover:shadow-lg transition-all duration-300 border border-transparent hover:border-white">
                            Explore Our Services
                        </button>
                    </div>
                    <div className="hidden md:block h-96 rounded-xl overflow-hidden relative">
                        <div className="bg-cover bg-center w-full h-full opacity-80 mix-blend-screen" 
                             title="A futuristic and abstract representation of interconnected systems and data flows, rendered in a 3D glassmorphic style. The scene features translucent, glowing geometric nodes connected by streams of light blue and white energy lines against a dark navy blue backdrop. The lighting is sophisticated and dramatic, emphasizing the transformative power of automation technology in a highly polished, professional corporate aesthetic." 
                             style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCLLmGH6qwwRckySg-kAdC-oinHfdvNBci4RhQThq5zL6rPjkJ2CuYcQkUjNLb5YNwEhHmGRVzdEZIrZssM76d-2wDOjMfw6layhmRrlvyw_Bj20joGq5d7LZbXOHgPWRzcmPioJ5MTNjqMu2RezK_YK0Mo9Ite6SDuQ2TC9-9hty7zSjmej2QHEisFp2sL1aoLhqN8uAvtd_pmclpq7vojIXy4dFTTDojaaTXE4VdN4O96O3yBPtgyJA')" }}></div>
                    </div>
                </div>
            </header>

            {/* Services Container */}
            <main className="py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-32">
                
                {/* Workflow Automation */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
                    <div className="md:col-span-6 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#112E81]/10 text-[#112E81] rounded-full font-medium text-xs">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            Workflow Automation
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-[#00195c]">Workflow Automation</h2>
                        <p className="font-body-md text-base text-[#444651]">
                            We design and implement automated workflows that eliminate repetitive manual tasks, reduce human error, and free your team to focus on high-value work. From automating internal approvals to connecting your CRM, invoicing, and reporting tools, every workflow is custom-built around how your business actually operates.
                        </p>
                        <ul className="space-y-4 font-body-md text-base text-[#1c1b1b]">
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Process Mapping &amp; Optimization</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Custom Automation Workflows</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Third-Party Tool Integration</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Time &amp; Cost Savings Reports</li>
                        </ul>
                        <div className="mt-8 p-6 bg-white border border-[#c5c5d3]/30 rounded-xl shadow-sm hover:shadow-[0px_4px_20px_rgba(17,46,129,0.04)] transition-shadow">
                            <h4 className="font-semibold text-sm text-[#00195c] mb-2 flex items-center gap-2"><span className="material-symbols-outlined">lightbulb</span> Quick Answer</h4>
                            <p className="font-body-md text-sm text-[#444651]">Workflow automation is the use of software to perform repetitive business tasks — like data entry, approvals, and notifications.</p>
                        </div>
                        <Link className="inline-flex items-center gap-2 mt-6 font-semibold text-sm text-[#00195c] hover:text-[#4647AE] transition-colors" to="/contact">
                            Get Started with Workflow Automation <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                    </div>
                    <div className="md:col-span-6">
                        <div className="bg-white rounded-xl overflow-hidden border border-[#c5c5d3]/30 shadow-sm hover:shadow-lg transition-all duration-300 p-8">
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Automation</span>
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Efficiency</span>
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Workflows</span>
                            </div>
                            <div className="h-64 rounded-lg overflow-hidden mb-6 relative">
                                <div className="bg-cover bg-center w-full h-full" 
                                     title="A stylized 3D illustration showing a conveyor belt of glowing blue and gold geometric shapes being processed and organized by robotic arms, symbolizing automated workflows. The style is modern corporate glassmorphism, with a clean white and sky blue background, bright lighting, and an overall sense of pristine efficiency." 
                                     style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAhbtYbStfQHf_EfpEE00RhYUu43JAIx0HHRnHFdpyxg6h-SOm0s8AdkEilRzwLzOQIGO6LJV_LioAMDE_1GXpDb_XB9CcB7tZxDmjYc_dWEiugTtkjjDrfHd-GdT4OaFkr0a24NoqiMiFkwXvNSOn-Zera22aMhFe5ilyG_5rxYVkym1jpiTQr2D4JLD1HwDC9pX54CuSzFbsX9re42y7_N0MB2ytwF5zeSiiDyYNmFLcoSGO8eneM-A')" }}></div>
                            </div>
                            <h3 className="font-display font-semibold text-2xl text-[#00195c] mb-2">Ready to transform your business</h3>
                        </div>
                    </div>
                </section>

                {/* Custom Business Tools */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
                    <div className="md:col-span-6 md:order-last space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#112E81]/10 text-[#112E81] rounded-full font-medium text-xs">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>build</span>
                            Custom Business Tools
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-[#00195c]">Custom Business Tools</h2>
                        <p className="font-body-md text-base text-[#444651]">
                            Off-the-shelf software rarely fits every part of your business. We build custom internal tools, dashboards, and applications designed around your exact workflows
                        </p>
                        <ul className="space-y-4 font-body-md text-base text-[#1c1b1b]">
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Custom Dashboards &amp; Portals</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Internal Tool Development</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Scalable Architecture</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Ongoing Support &amp; Updates</li>
                        </ul>
                        <div className="mt-8 p-6 bg-white border border-[#c5c5d3]/30 rounded-xl shadow-sm hover:shadow-[0px_4px_20px_rgba(17,46,129,0.04)] transition-shadow">
                            <h4 className="font-semibold text-sm text-[#00195c] mb-2 flex items-center gap-2"><span className="material-symbols-outlined">lightbulb</span> Quick Answer</h4>
                            <p className="font-body-md text-sm text-[#444651]">A custom business tool is software built specifically for one company's workflows rather than a generic off-the-shelf product.</p>
                        </div>
                        <Link className="inline-flex items-center gap-2 mt-6 font-semibold text-sm text-[#00195c] hover:text-[#4647AE] transition-colors" to="/contact">
                            Get Started with Custom Tools <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                    </div>
                    <div className="md:col-span-6 md:order-first">
                        <div className="bg-white rounded-xl overflow-hidden border border-[#c5c5d3]/30 shadow-sm hover:shadow-lg transition-all duration-300 p-8">
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Dashboards</span>
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Internal Tools</span>
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Scalable</span>
                            </div>
                            <div className="h-64 rounded-lg overflow-hidden mb-6 relative">
                                <div className="bg-cover bg-center w-full h-full" 
                                     title="A sophisticated UI dashboard mockup rendered in 3D isometric perspective. The dashboard features clean charts, graphs, and data modules in shades of deep blue, sky blue, and gold, floating slightly above a pristine white surface. The design conveys precision, customization, and modern corporate intelligence." 
                                     style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuArHfB5Ce9MwX-M7tCRbS-bJnlZZwIVEJKA11nvqI7nQt7crfSSZY_YPSh_fund6z5Wqd9y5BXGXkc-0XwWgNTay-inTocR-HZaGU29wp-VVPyiRfotxmH_KumkKoHjsQtazhBbA546xDSgNhGq5hIi0t-Lc4ceoFJYcaofyxXY2St3qAVJhlH9lsAQRu-ZYcUfzxbdYsTbDl0wKoSAojorLmcf9pIBERtnqe4a6SxsnHBiaiKr4rWUvw')" }}></div>
                            </div>
                            <h3 className="font-display font-semibold text-2xl text-[#00195c] mb-2">Ready to transform your business</h3>
                        </div>
                    </div>
                </section>

                {/* API Integration */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
                    <div className="md:col-span-6 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#112E81]/10 text-[#112E81] rounded-full font-medium text-xs">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
                            API Integration
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-[#00195c]">API Integration</h2>
                        <p className="font-body-md text-base text-[#444651]">
                            Secure, real-time API integrations that connect your CRM, payment systems, and internal tools. Disconnected software creates duplicate data, wasted time, and costly mistakes. We connect your CRM, payment systems, marketing tools, and internal platforms through secure, reliable API integrations.
                        </p>
                        <ul className="space-y-4 font-body-md text-base text-[#1c1b1b]">
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Third-Party API Connections</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Custom API Development</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Secure Data Syncing</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Real-Time System Updates</li>
                        </ul>
                        <div className="mt-8 p-6 bg-white border border-[#c5c5d3]/30 rounded-xl shadow-sm hover:shadow-[0px_4px_20px_rgba(17,46,129,0.04)] transition-shadow">
                            <h4 className="font-semibold text-sm text-[#00195c] mb-2 flex items-center gap-2"><span className="material-symbols-outlined">lightbulb</span> Quick Answer</h4>
                            <p className="font-body-md text-sm text-[#444651]">API integration connects two or more software systems so they can automatically share data, eliminating manual data entry between platforms.</p>
                        </div>
                        <Link className="inline-flex items-center gap-2 mt-6 font-semibold text-sm text-[#00195c] hover:text-[#4647AE] transition-colors" to="/contact">
                            Get Started with API Integration <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                    </div>
                    <div className="md:col-span-6">
                        <div className="bg-white rounded-xl overflow-hidden border border-[#c5c5d3]/30 shadow-sm hover:shadow-lg transition-all duration-300 p-8">
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">API</span>
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Integration</span>
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Data Sync</span>
                            </div>
                            <div className="h-64 rounded-lg overflow-hidden mb-6 relative">
                                <div className="bg-cover bg-center w-full h-full" 
                                     title="An abstract visualization of digital APIs, featuring glowing data streams bridging disconnected floating platforms. The color palette emphasizes a high-tech modern corporate look with deep indigo blues, vibrant sky blues, and shimmering gold accents. The glassmorphic surfaces reflect the light, creating a sense of secure, high-speed data transfer." 
                                     style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDgfJxpkwRUWw7CldHCvREyXa7g3ru-h2ix0BoQQxMU3etHXXLrT0VJPS7nc5R_6E7UydzORycw0CQFWn5CdmokARhgVOZf8lNIxNuCphOh3S1cLLCXGwHnQP408ev_Aeko4v-PUzXQgPwSNcybjLoK-HWvpefs5dczrLehTtVE8TB3ypfVQfVLQEvjoYZnTv9sKM82gr73Qvc9ioMofeHlYGA95kudrbbjjxalmToD3p-v_3tsV5gwJg')" }}></div>
                            </div>
                            <h3 className="font-display font-semibold text-2xl text-[#00195c] mb-2">Ready to transform your business</h3>
                        </div>
                    </div>
                </section>

                {/* SaaS Tools */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
                    <div className="md:col-span-6 md:order-last space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#112E81]/10 text-[#112E81] rounded-full font-medium text-xs">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
                            SaaS Tools
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-[#00195c]">SaaS Tools</h2>
                        <p className="font-body-md text-base text-[#444651]">
                            Whether you're launching a new product or scaling an existing platform, we design and build SaaS applications that are secure, scalable, and built for growth.
                        </p>
                        <ul className="space-y-4 font-body-md text-base text-[#1c1b1b]">
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> MVP to Full-Scale Development</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Multi-Tenant Architecture</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Subscription &amp; Billing Systems</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Cloud-Native Infrastructure</li>
                        </ul>
                        <div className="mt-8 p-6 bg-white border border-[#c5c5d3]/30 rounded-xl shadow-sm hover:shadow-[0px_4px_20px_rgba(17,46,129,0.04)] transition-shadow">
                            <h4 className="font-semibold text-sm text-[#00195c] mb-2 flex items-center gap-2"><span className="material-symbols-outlined">lightbulb</span> Quick Answer</h4>
                            <p className="font-body-md text-sm text-[#444651]">SaaS (Software-as-a-Service) development is the process of building cloud-based software that customers access through subscriptions rather than one-time purchases.</p>
                        </div>
                        <Link className="inline-flex items-center gap-2 mt-6 font-semibold text-sm text-[#00195c] hover:text-[#4647AE] transition-colors" to="/contact">
                            Get Started with SaaS Development <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                    </div>
                    <div className="md:col-span-6 md:order-first">
                        <div className="bg-white rounded-xl overflow-hidden border border-[#c5c5d3]/30 shadow-sm hover:shadow-lg transition-all duration-300 p-8">
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">SaaS</span>
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Cloud</span>
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Subscriptions</span>
                            </div>
                            <div className="h-64 rounded-lg overflow-hidden mb-6 relative">
                                <div className="bg-cover bg-center w-full h-full" 
                                     title="A conceptual rendering of a scalable cloud infrastructure, depicted as multi-layered translucent glass panes hovering in a pristine white space. Soft blue and gold light diffuses through the layers, symbolizing secure, modern SaaS architecture. The visual style is immaculate, high-trust, and technologically advanced." 
                                     style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDdLfM3DBlRlUG3lwuwx5xfLrjW8m3DcqhRteXmmUG94tEN37vJOsvfbnePbTcxVfUYhJXJov9ho0iye2JuTpPGnVOh9geuTzacbFGFNTAhgADsGgVJ8OzXiUJhvNuoTwT09J2thNo-568443E2XG1p7mSD_8i4eF-S7lz3kQBQETtk5r05n6_l9hVDvTwzOSn_WD5XovoNZCeB7a31keABK2W-xwvIZ8Pns_p2w1IR1onRPIalDA5r1Q')" }}></div>
                            </div>
                            <h3 className="font-display font-semibold text-2xl text-[#00195c] mb-2">Ready to transform your business</h3>
                        </div>
                    </div>
                </section>

                {/* Virtual Assistance */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
                    <div className="md:col-span-6 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#112E81]/10 text-[#112E81] rounded-full font-medium text-xs">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                            Virtual Assistance
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-[#00195c]">Virtual Assistance</h2>
                        <p className="font-body-md text-base text-[#444651]">
                            Free up hours in your week with skilled virtual assistant support tailored to your business. From inbox and calendar management to research, data entry, and customer support, our virtual assistants handle the day-to-day so you can focus on growth.
                        </p>
                        <ul className="space-y-4 font-body-md text-base text-[#1c1b1b]">
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Admin &amp; Inbox Management</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Data Entry &amp; Research</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Customer Support Assistance</li>
                            <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#D4AF37]">check_circle</span> Flexible Hourly Plans</li>
                        </ul>
                        <div className="mt-8 p-6 bg-white border border-[#c5c5d3]/30 rounded-xl shadow-sm hover:shadow-[0px_4px_20px_rgba(17,46,129,0.04)] transition-shadow">
                            <h4 className="font-semibold text-sm text-[#00195c] mb-2 flex items-center gap-2"><span className="material-symbols-outlined">lightbulb</span> Quick Answer</h4>
                            <p className="font-body-md text-sm text-[#444651]">A virtual assistant is a remote professional who handles administrative, technical, or creative tasks for a business without being physically present.</p>
                        </div>
                        <Link className="inline-flex items-center gap-2 mt-6 font-semibold text-sm text-[#00195c] hover:text-[#4647AE] transition-colors" to="/contact">
                            Get Started with Virtual Assistance <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                    </div>
                    <div className="md:col-span-6">
                        <div className="bg-white rounded-xl overflow-hidden border border-[#c5c5d3]/30 shadow-sm hover:shadow-lg transition-all duration-300 p-8">
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Virtual Assistant</span>
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Support</span>
                                <span className="px-3 py-1 bg-[#aaccd6]/30 text-[#00195c] font-medium text-xs rounded-full">Admin</span>
                            </div>
                            <div className="h-64 rounded-lg overflow-hidden mb-6 relative">
                                <div className="bg-cover bg-center w-full h-full" 
                                     title="A clean, modern workspace scene rendered in a minimalist 3D style. A floating digital calendar, glowing inbox icon, and subtle graph elements surround a sleek laptop, representing virtual assistance. The setting is bright and professional, utilizing sky blue backgrounds with deep blue and white accents." 
                                     style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAJS3V-ZoZymtz5ueu3wfFEql3nSAtpj66-4L85foZkKas8ujklk8AbDv3GTgsafm0xFQ5jhvD8s4T_izY0hbO0NpakzRW3eUSxuQnbTBfvUpJuAU0gPq7oCPdLY4EBjWpyDXW4Q4aGG6PpqS_Zguk63lPl55Gr3rgmSleiJ0OOKlsqss_noKvW0k6mFhlUK5KcmihrhY2VPjabdCw0mNjuU3t8g26sKYnZdMVIeEtLJQVr0AYBG1kcLQ')" }}></div>
                            </div>
                            <h3 className="font-display font-semibold text-2xl text-[#00195c] mb-2">Ready to transform your business</h3>
                        </div>
                    </div>
                </section>
            </main>

            {/* Newsletter Section */}
            <section className="py-24 bg-white border-t border-[#c5c5d3]/30 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#112E81] to-transparent pointer-events-none"></div>
                <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 text-center relative z-10">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-[#00195c] mb-4">Stay Ahead of the Curve</h2>
                    <p className="font-body-lg text-lg text-[#444651] mb-8">
                        Get exclusive automation tips, workflow templates, and industry insights delivered to your inbox.
                    </p>
                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                        <input 
                            className="flex-1 px-4 py-3 border border-[#c5c5d3] rounded-lg focus:outline-none focus:border-[#AACCD6] focus:ring-2 focus:ring-[#AACCD6]/20 font-body-md text-base bg-[#fcf8f8]" 
                            placeholder="Enter your email" 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button 
                            className="bg-gradient-to-r from-[#112E81] to-[#4647AE] text-white px-8 py-3 rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]" 
                            type="submit"
                            disabled={isSubscribing}
                        >
                            {isSubscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Subscribe"}
                        </button>
                    </form>
                    <p className="mt-4 font-medium text-xs text-[#757683]">No spam, unsubscribe anytime.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Services;


