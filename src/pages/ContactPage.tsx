import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log("Form submitted:", formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            {/* Hero Section */}
            <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
                <div className="container mx-auto px-6 py-32 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 font-determination">
                            <span className="bg-gradient-to-r from-neon-green via-cyan to-neon-bright bg-clip-text text-transparent">
                                Contact the Alchemists
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-foreground mb-8 max-w-3xl mx-auto font-determination">
                            Let's turn your vision into reality. Reach out and start your transformation journey.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Contact Info + Form */}
            <section className="py-24 bg-gradient-subtle">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        {/* Contact Information */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-determination">
                                Get in Touch
                            </h2>
                            <p className="text-sm text-muted-foreground mb-8 font-determination">
                                Have a project in mind? Questions about our services? We're here to help. Reach out through any channel below.
                            </p>

                            <div className="space-y-6">
                                {[
                                    {
                                        icon: Mail,
                                        label: "Email",
                                        value: "dsclub.au@outlook.com",
                                        link: "mailto:dsclub.au@outlook.com"
                                    },
                                    {
                                        icon: Phone,
                                        label: "Phone",
                                        value: "+1 (555) 123-4567",
                                        link: "tel:+15551234567"
                                    },
                                    {
                                        icon: MapPin,
                                        label: "Location",
                                        value: "Operating Internationally",
                                        link: null
                                    }
                                ].map((contact, index) => (
                                    <motion.div
                                        key={contact.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex items-start gap-4 p-6 bg-card rounded-xl shadow-card"
                                    >
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                            <contact.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-primary mb-1 font-determination">{contact.label}</h3>
                                            {contact.link ? (
                                                <a href={contact.link} className="text-xs text-muted-foreground hover:text-accent transition-colors font-determination">
                                                    {contact.value}
                                                </a>
                                            ) : (
                                                <p className="text-xs text-muted-foreground font-determination">{contact.value}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-8 p-6 bg-card rounded-xl shadow-card">
                                <h3 className="text-base font-bold text-primary mb-4 font-determination">
                                    Business Hours
                                </h3>
                                <div className="space-y-2 text-xs text-muted-foreground font-determination">
                                    <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                                    <p>Saturday: 10:00 AM - 4:00 PM EST</p>
                                    <p>Sunday: Closed</p>
                                    <p className="text-accent mt-4">24/7 Support for Enterprise Clients</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="p-8 bg-card rounded-2xl shadow-card"
                        >
                            <h2 className="text-2xl font-bold text-primary mb-6 font-determination">
                                Send Us a Message
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-xs font-bold text-primary mb-2 font-determination">
                                        Your Name
                                    </label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="font-determination text-xs"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-xs font-bold text-primary mb-2 font-determination">
                                        Email Address
                                    </label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className="font-determination text-xs"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-xs font-bold text-primary mb-2 font-determination">
                                        Subject
                                    </label>
                                    <Input
                                        id="subject"
                                        name="subject"
                                        type="text"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Project Inquiry"
                                        className="font-determination text-xs"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-xs font-bold text-primary mb-2 font-determination">
                                        Message
                                    </label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tell us about your project..."
                                        rows={6}
                                        className="font-determination text-xs resize-none"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-determination text-sm"
                                >
                                    Send Message
                                    <Send className="ml-2 w-4 h-4" />
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Why Contact Us */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6 font-determination">
                            What Happens Next?
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                step: "1",
                                title: "Quick Response",
                                desc: "We'll get back to you within 24 hours with an initial assessment"
                            },
                            {
                                step: "2",
                                title: "Discovery Call",
                                desc: "Schedule a free consultation to discuss your project in detail"
                            },
                            {
                                step: "3",
                                title: "Custom Proposal",
                                desc: "Receive a tailored proposal with timeline, pricing, and next steps"
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center p-8 bg-card rounded-xl shadow-card"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-xl font-bold text-primary font-determination">{item.step}</span>
                                </div>
                                <h3 className="text-base font-bold text-primary mb-2 font-determination">{item.title}</h3>
                                <p className="text-xs text-muted-foreground font-determination">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ContactPage;
