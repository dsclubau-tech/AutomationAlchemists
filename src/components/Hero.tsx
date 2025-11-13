import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15
        }}
      />
      <div className="absolute inset-0 bg-gradient-hero opacity-90 z-0" />
      
      <div className="container mx-auto px-6 py-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Transform Your Business with 
            <span className="block mt-2 text-accent">Innovative Solutions</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
            We deliver cutting-edge digital services that drive growth, 
            enhance efficiency, and position your business for success.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg group"
            >
              Explore Services
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
  size="lg"
  variant="outline"
  className="border-2 border-white/30 text-gray-900 dark:text-white hover:bg-white/10 px-8 py-6 text-lg backdrop-blur-sm"
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
