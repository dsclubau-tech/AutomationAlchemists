import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero.webm";

const Hero = () => {
    return (
        <section id="home" className="hero-section relative min-h-[520px] md:min-h-[600px] flex items-end overflow-hidden w-full singularity-shadow">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source src={heroImage} type="video/webm" />
                </video>
                {/* QGX Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-background-dark/90 via-background-dark/40 to-background-dark/90" />
            </div>

            {/* Fractal Corner Decorations */}
            <div className="fractal-corner-tl" />
            <div className="fractal-corner-br" />

            <div className="container mx-auto px-8 md:px-12 py-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-3xl text-left flex flex-col gap-6"
                >
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-4xl md:text-6xl font-black tracking-tighter spatial-distortion-glow font-display">
                            Transform Your Business with Automation Alchemists
                        </h1>
                        <h2 className="text-white/80 text-base md:text-lg font-normal leading-relaxed font-display">
                            You Dream It, We Build It. No Coding Walls, No Deploy Drama - Just Automation, AI and Passive Income.
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <Link to="/services">
                            <Button
                                size="lg"
                                className="relative flex w-fit cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-primary text-background-dark text-base font-bold tracking-wide gold-foil-outline hover:brightness-110 transition-all singularity-shadow font-display group"
                            >
                                Discover Our Solutions
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link to="/learn">
                            <Button
                                size="lg"
                                variant="outline"
                                className="relative flex w-fit cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-background-dark text-primary-light border-primary/50 hover:bg-primary/10 transition-colors font-display"
                            >
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
