import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Cloud, Smartphone, Check, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Code,
    title: "Web Development",
    description: "Transform your digital presence with high-performance, responsive websites and web applications. We utilize modern frameworks and best practices to ensure your site is fast, secure, and SEO-friendly, providing an exceptional user experience that drives growth.",
    features: ["Modern Frameworks", "SEO Optimized", "Responsive Design", "High Performance"]
  },
  {
    icon: Cloud,
    title: "Automation",
    description: "Streamline your business operations with our advanced automation solutions. From cloud infrastructure management to CI/CD pipelines, we help you reduce manual effort, minimize errors, and accelerate delivery, allowing your team to focus on innovation.",
    features: ["Cloud Infrastructure", "CI/CD Pipelines", "Process Automation", "Error Reduction"]
  },
  {
    icon: Smartphone,
    title: "Mobile Development",
    description: "Reach your audience wherever they are with our custom mobile application development services. Whether native or cross-platform, we build intuitive, feature-rich apps for iOS and Android that engage users and extend your brand's reach.",
    features: ["iOS & Android", "Cross-platform", "Native Performance", "User Centric"]
  },
];

const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background-dark text-text-main time-fold-ripple overflow-x-hidden">
      <Navigation />

      {/* Fractal Corner Frames */}
      <div className="pointer-events-none absolute top-0 left-0 h-32 w-32 md:h-48 md:w-48" style={{ background: 'radial-gradient(circle at top left, rgba(212,175,55,0.2) 0%, transparent 50%)' }}></div>
      <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 md:h-48 md:w-48" style={{ background: 'radial-gradient(circle at bottom right, rgba(212,175,55,0.15) 0%, transparent 50%)' }}></div>

      <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-16 md:gap-24 pt-32 px-6">
        {/* Hero Section */}
        <section className="flex flex-col items-start gap-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-2"
          >
            <h1 className="text-text-main text-4xl md:text-6xl font-black tracking-tighter spatial-distortion-glow font-display">
              Architects of Automation
            </h1>
            <p className="text-text-muted text-base md:text-xl font-normal leading-relaxed max-w-2xl font-display">
              Harnessing quantum principles and hyper-dimensional geometry to build the next generation of intelligent solutions.
            </p>
          </motion.div>
        </section>

        {/* Directional Node Divider */}
        <div className="w-full flex items-center gap-4">
          <div className="directional-node"></div>
          <div className="flex-grow h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
        </div>

        {/* Services Grid */}
        <section ref={ref} className="w-full flex flex-col gap-6">
          <h2 className="text-text-main text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl font-display">Core Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
                className="group flex flex-col gap-4 p-6 bg-surface-dark/50 border border-primary/20 rounded-2xl shadow-singularity transition-all hover:border-primary/40 hover:-translate-y-1 h-full"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <service.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-text-main text-xl font-medium leading-normal font-display">{service.title}</h3>
                </div>

                <p className="text-text-muted text-sm font-normal leading-normal mt-1 font-display">
                  {service.description}
                </p>

                <div className="space-y-2 pt-4">
                  {service.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={hoveredIndex === index ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 text-sm text-text-muted font-display"
                    >
                      <Check className="w-4 h-4 text-primary" />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Directional Node Divider */}
        <div className="w-full flex items-center gap-4">
          <div className="flex-grow h-px bg-gradient-to-l from-primary/50 to-transparent"></div>
          <div className="directional-node"></div>
        </div>

        {/* CTA Section */}
        <section className="bg-white/5 border border-primary/20 fractal-border-rev shadow-singularity p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 mb-16">
          <div className="text-center md:text-left">
            <h3 className="text-text-main text-2xl md:text-3xl font-bold font-display">Transcend Your Potential.</h3>
            <p className="text-text-muted mt-1 font-display">Let's architect your future with intelligent automation.</p>
          </div>
          <Link to="/contact">
            <Button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden h-12 px-6 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em] fractal-border gold-foil-micro hover:brightness-110 transition-all flex-shrink-0 font-display">
              <span className="truncate">Request a Consultation</span>
            </Button>
          </Link>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Services;
