import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useState, useEffect } from "react";

interface Testimonial {
    id: string;
    name: string;
    role: string;
    company: string;
    content: string;
    rating: number;
    avatar?: string;
}

const testimonials: Testimonial[] = [
    {
        id: "1",
        name: "Sarah Chen",
        role: "CEO",
        company: "TechFlow Solutions",
        content: "AAlchemists transformed our operations. The virtual assistant they provided handles tasks that used to take our team hours. We've seen a 40% increase in productivity since partnering with them.",
        rating: 5,
    },
    {
        id: "2",
        name: "Marcus Rodriguez",
        role: "Founder",
        company: "E-Commerce Empire",
        content: "The workflow automation they built for our e-commerce business is incredible. Orders, inventory, and customer support all run on autopilot now. Best investment we've made.",
        rating: 5,
    },
    {
        id: "3",
        name: "Emily Thompson",
        role: "Operations Director",
        company: "Growth Ventures",
        content: "From concept to launch in 3 weeks. Their Vibe-to-App service turned our idea into a fully functional app. The team's expertise and communication were exceptional throughout.",
        rating: 5,
    },
];

const Testimonials = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const currentTestimonial = testimonials[activeIndex];

    return (
        <section className="py-20 bg-surface-dark/50">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">
                        What Our Clients Say
                    </h2>
                    <p className="text-text-muted max-w-2xl mx-auto font-display">
                        Real results from businesses that trusted us with their automation journey
                    </p>
                </motion.div>

                <div className="max-w-4xl mx-auto">
                    <div className="relative min-h-[350px] md:min-h-[300px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTestimonial.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="bg-background-dark border border-primary/20 rounded-2xl p-8 md:p-12"
                            >
                                <Quote className="w-12 h-12 text-primary/30 mb-6" />

                                <p className="text-lg md:text-xl text-white/90 mb-8 font-display leading-relaxed">
                                    "{currentTestimonial.content}"
                                </p>

                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                                            {currentTestimonial.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold font-display">{currentTestimonial.name}</h4>
                                            <p className="text-text-muted text-sm font-display">
                                                {currentTestimonial.role} at {currentTestimonial.company}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-1">
                                        {[...Array(currentTestimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 text-primary fill-primary" />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Dots indicator */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                className={`h-2 min-h-0 rounded-full transition-all duration-300 ${index === activeIndex
                                    ? "bg-primary w-6"
                                    : "bg-primary/30 hover:bg-primary/50 w-2"
                                    }`}
                                aria-label={`View testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
