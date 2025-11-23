import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Contact from "@/components/Contact";
import ContactForm from "@/components/ContactForm";
import FileUpload from "@/components/FileUpload";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  // Handle hash navigation when page loads
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Remove the # from the hash
      const id = hash.replace('#', '');
      // Wait a bit for the page to render
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <About />

      {/* Services Preview Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Our Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
              Comprehensive solutions tailored to meet your unique business needs
            </p>
            <Link to="/services">
              <Button size="lg" className="group hover:scale-105 transition-transform">
                View All Services
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Contact />
      <ContactForm />

      <Footer />
    </div>
  );
};

export default Index;
