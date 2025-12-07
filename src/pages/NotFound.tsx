import { Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const NotFound = () => {
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen bg-background-dark text-text-main overflow-hidden">
      <Navigation />

      {/* Background effects */}
      <div className="pointer-events-none absolute top-0 left-0 h-1/2 w-1/2 opacity-20" style={{ background: 'radial-gradient(circle at top left, rgba(212,175,55,0.3) 0%, transparent 50%)' }}></div>
      <div className="pointer-events-none absolute bottom-0 right-0 h-1/2 w-1/2 opacity-20" style={{ background: 'radial-gradient(circle at bottom right, rgba(212,175,55,0.3) 0%, transparent 50%)' }}></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl"
        >
          {/* 404 Number with Gold Glow */}
          <div className="relative mb-8">
            <h1 className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary/60 to-transparent leading-none">
              404
            </h1>
            <div className="absolute inset-0 text-[120px] md:text-[180px] font-black text-primary/10 blur-2xl leading-none">
              404
            </div>
          </div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-display">
              Lost in the Quantum Realm
            </h2>
            <p className="text-text-muted text-base md:text-lg mb-8 font-display max-w-md mx-auto">
              The page you're looking for has been transmuted into the void.
              Let's get you back to familiar coordinates.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/">
              <Button
                size="lg"
                className="bg-primary text-background-dark hover:bg-primary/90 font-bold px-8 py-6 rounded-lg gold-foil-outline group"
              >
                <Home className="w-5 h-5 mr-2" />
                Return Home
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.history.back()}
              className="border-primary/50 text-primary hover:bg-primary/10 px-8 py-6 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 pt-8 border-t border-primary/20"
          >
            <p className="text-text-muted text-sm mb-4 font-display">Popular destinations:</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/services" className="text-primary hover:text-primary-light transition-colors font-display text-sm">
                Services
              </Link>
              <span className="text-primary/30">•</span>
              <Link to="/pricing" className="text-primary hover:text-primary-light transition-colors font-display text-sm">
                Pricing
              </Link>
              <span className="text-primary/30">•</span>
              <Link to="/learn" className="text-primary hover:text-primary-light transition-colors font-display text-sm">
                Learn
              </Link>
              <span className="text-primary/30">•</span>
              <Link to="/contact" className="text-primary hover:text-primary-light transition-colors font-display text-sm">
                Contact
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
