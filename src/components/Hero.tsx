import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero.jpg";

const Hero = () => {
  return (
    <section className="hero-section relative min-h-screen flex items-start justify-start overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="container mx-auto px-6 py-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mr-auto text-left"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-6 font-determination">
            <span className="bg-gradient-to-r from-blue-600 via-purple-400 to-saffron bg-clip-text text-transparent hero-text-outline">Transform Your Business with</span>
            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-purple-400 to-saffron bg-clip-text text-transparent hero-text-outline font-determination">Automation Alchemists</span>
          </h1>

          <p className="text-base md:text-2xl mb-1 max-w-2xl font-determination bg-gradient-to-r from-saffron-light to-blue-900 bg-clip-text text-transparent">
            You Dream It, We Build It.
          </p>
          <p className="text-base md:text-xl mb-8 max-w-2xl font-determination bg-gradient-to-r from-saffron-light to-blue-900 bg-clip-text text-transparent">
            No Coding Walls, No Deploy Drama - Just Automation, Ai and Passive Income.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-base group font-determination"
            >
              Explore Services
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-saffron/50 text-foreground hover:bg-saffron/10 px-8 py-6 text-base backdrop-blur-sm font-determination"
            >
              Learn More
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
