import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Cloud, Smartphone } from "lucide-react";

const services = [
    {
        icon: Code,
        title: "Web Development",
        description: "Transform your digital presence with high-performance, responsive websites and web applications. We utilize modern frameworks and best practices to ensure your site is fast, secure, and SEO-friendly, providing an exceptional user experience that drives growth."
    },
    {
        icon: Cloud,
        title: "Automation",
        description: "Streamline your business operations with our advanced automation solutions. From cloud infrastructure management to CI/CD pipelines, we help you reduce manual effort, minimize errors, and accelerate delivery, allowing your team to focus on innovation."
    },
    {
        icon: Smartphone,
        title: "Mobile Development",
        description: "Reach your audience wherever they are with our custom mobile application development services. Whether native or cross-platform, we build intuitive, feature-rich apps for iOS and Android that engage users and extend your brand's reach."
    },
];

const Services = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section id="services" className="py-24 bg-background" ref={ref}>
            <div className="container mx-auto px-6">
                {/* Section Header with Broken Gold Line */}
                <div className="mb-16">
                    <div className="ml-0 w-1/2 mb-4">
                        <div className="broken-gold-line h-[1.5px] opacity-40"></div>
                    </div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.6 }}
                        className="text-white text-2xl sm:text-3xl font-bold tracking-tight px-4 font-display"
                    >
                        Our Services
                    </motion.h2>
                </div>

                {/* Services Grid with Fractal Borders */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {services.map((service, index) => (
                        <motion.div
                            key={service.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-5 bg-surface-dark/50 rounded-2xl singularity-shadow border border-primary/10 hover:border-primary/40 transition-all hover:-translate-y-1 h-full"
                        >
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                                    <service.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                                </div>
                                <p className="text-primary-light text-base sm:text-lg font-bold font-display">{service.title}</p>
                            </div>
                            <p className="text-white/70 text-xs sm:text-sm font-normal leading-relaxed font-display">
                                {service.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
