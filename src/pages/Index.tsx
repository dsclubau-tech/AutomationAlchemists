import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FileUpload from "@/components/FileUpload";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import SEOHead from "@/components/SEOHead";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import SchemaMarkup from "@/components/SchemaMarkup";

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
    <div className="min-h-screen bg-background-dark text-text-main time-fold-ripple overflow-x-hidden">
      <SEOHead
        title="AAlchemists — Custom Web Development, App Development & SaaS Automation Agency"
        description="AAlchemists is a global services platform specializing in web development, Android/Flutter app development, SaaS solutions, and automation consulting."
        keywords="web development, app development, SaaS development, workflow automation, global services, Flutter, Android"
      />
      <SchemaMarkup
        type="Organization"
        data={{
          name: "AAlchemists",
          url: "https://automationalchemists.com",
          logo: "https://automationalchemists.com/og-image.png",
          description: "Global services platform for web development, Android/Flutter app development, SaaS, and automation consulting.",
          sameAs: [
            "https://twitter.com/AAlchemists"
          ]
        }}
      />
      <PageLoader pageName="Home" />
      <Navigation />

      <Hero />

      {/* Main Content Wrapper with max-width */}
      <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-16 md:gap-24 pt-12">
        {/* Broken Gold Line Divider */}
        <div className="ml-auto w-[60%] my-2 px-6">
          <div className="broken-gold-line h-[1.5px] opacity-40"></div>
        </div>

        <About />

        {/* Services Preview Section */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="ml-0 w-[50%] mb-12">
              <div className="broken-gold-line h-[1.5px] opacity-40"></div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-display">
                Our Services
              </h2>
              <p className="text-lg text-white/70 max-w-3xl mx-auto mb-12 font-display">
                Comprehensive solutions tailored to meet your unique business needs
              </p>
              <Link to="/services">
                <Button size="lg" className="group hover:scale-105 transition-transform bg-primary text-background-dark font-bold font-display gold-foil-outline">
                  View All Services
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <Testimonials />

        <Newsletter />

        <Footer />
      </div>
    </div>
  );
};

export default Index;
