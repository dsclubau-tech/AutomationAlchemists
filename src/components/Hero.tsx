import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero.png";

const Hero = () => {
  return (
    <section className="hero-section relative min-h-screen flex items-center justify-start overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-background/80 md:bg-background/60" />
      </div>

      <div className="container mx-auto px-6 py-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mr-auto text-left"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-determination leading-tight">
            <span className="bg-gradient-to-r from-evil-green via-evil-toxic to-necro-purple bg-clip-text text-transparent hero-text-outline">
              Transform Your Business with
            </span>
            <span className="block mt-2 bg-gradient-to-r from-evil-green via-evil-toxic to-necro-purple bg-clip-text text-transparent hero-text-outline font-determination">
              Automation Alchemists
            </span>
          </h1>

          <p className="text-base md:text-xl lg:text-2xl mb-4 font-determination bg-gradient-to-r from-evil-toxic to-evil-green bg-clip-text text-transparent">
            You Dream It, We Build It.
          </p>
          <p className="text-base md:text-lg mb-8 max-w-2xl font-determination bg-gradient-to-r from-evil-toxic to-evil-green bg-clip-text text-transparent opacity-90">
            No Coding Walls, No Deploy Drama - Just Automation, AI and Passive Income.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
            <Link to="/services">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-base group font-determination w-full sm:w-auto"
              >
                Explore Services
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/learn">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-necro-purple/50 text-foreground hover:bg-necro-purple/10 px-8 py-6 text-base backdrop-blur-sm font-determination w-full sm:w-auto"
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
