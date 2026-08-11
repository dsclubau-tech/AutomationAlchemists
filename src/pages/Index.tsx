import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FileUpload from "@/components/FileUpload";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import SEOHead from "@/components/SEOHead";
import Testimonials from "@/components/Testimonials";
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
        title="Automation Alchemists — Custom Web Development, App Development & SaaS Automation Agency"
        description="Automation Alchemists is a global services platform specializing in web development, Android/Flutter app development, SaaS solutions, and automation consulting."
        keywords="web development, app development, SaaS development, workflow automation, global services, Flutter, Android"
      />
      <SchemaMarkup
        type="Organization"
        data={{
          name: "Automation Alchemists",
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

        {/* Carousel Section */}
        <section className="py-12 overflow-hidden">
          <div className="container mx-auto px-6 mb-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-display mb-4">
              Featured Tools & Solutions
            </h2>
          </div>
          
          <div className="relative w-full overflow-hidden">
            <style>{`
              @keyframes scroll-carousel {
                0% { transform: translateX(0); }
                100% { transform: translateX(calc(-280px * 4 - 1.5rem * 4)); }
              }
              .animate-infinite-scroll {
                animation: scroll-carousel 20s linear infinite;
                width: max-content;
              }
              .animate-infinite-scroll:hover {
                animation-play-state: paused;
              }
              .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
            
            <div className="flex gap-6 animate-infinite-scroll hide-scrollbar pl-6">
              {/* Duplicate the cards once to create the infinite loop effect */}
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-6">
                  {/* Card 1 */}
                  <a href="https://rccp.automationalchemists.com" target="_blank" rel="noreferrer" 
                     className="flex-none w-[280px] h-[180px] rounded-[12px] border border-primary/20 hover:border-[#D4AF37] transition-all flex flex-col justify-end group relative overflow-hidden"
                     style={{
                         backgroundImage: "url('/images/rccp-logo.png')",
                         backgroundSize: "cover",
                         backgroundPosition: "center",
                         backgroundRepeat: "no-repeat"
                     }}>
                      <div className="absolute inset-0" style={{ background: "rgba(0, 0, 0, 0.55)" }}></div>
                      <div className="relative z-10 p-6 w-full">
                          <h3 className="text-white font-bold font-display text-lg mb-1 group-hover:text-primary transition-colors">Return Converter × CP Bot</h3>
                          <p className="text-white/90 text-sm font-display">Order Fulfilment & Returns</p>
                      </div>
                  </a>

                  {/* Card 2 */}
                  <Link to="/tools/listflow" className="flex-none w-[280px] h-[180px] bg-[#111] rounded-[12px] border border-primary/20 hover:border-[#D4AF37] transition-all p-6 flex flex-col justify-between group relative overflow-hidden">
                      <div className="flex justify-between items-start">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold">✨</span>
                          </div>
                          <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Coming Soon</span>
                      </div>
                      <div>
                          <h3 className="text-white font-bold font-display text-lg mb-1 group-hover:text-primary transition-colors">ListFlow</h3>
                          <p className="text-text-muted text-sm font-display">Product Management</p>
                      </div>
                  </Link>

                  {/* Card 3 */}
                  <Link to="/tools/orderbot" className="flex-none w-[280px] h-[180px] bg-[#111] rounded-[12px] border border-primary/20 hover:border-[#D4AF37] transition-all p-6 flex flex-col justify-between group relative overflow-hidden">
                      <div className="flex justify-between items-start">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold">⚡</span>
                          </div>
                          <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Coming Soon</span>
                      </div>
                      <div>
                          <h3 className="text-white font-bold font-display text-lg mb-1 group-hover:text-primary transition-colors">Order Bot</h3>
                          <p className="text-text-muted text-sm font-display">Notifications</p>
                      </div>
                  </Link>

                  {/* Card 4 */}
                  <Link to="/tools/invoicegen" className="flex-none w-[280px] h-[180px] bg-[#111] rounded-[12px] border border-primary/20 hover:border-[#D4AF37] transition-all p-6 flex flex-col justify-between group relative overflow-hidden">
                      <div className="flex justify-between items-start">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold">📄</span>
                          </div>
                          <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Coming Soon</span>
                      </div>
                      <div>
                          <h3 className="text-white font-bold font-display text-lg mb-1 group-hover:text-primary transition-colors">Invoice Generator</h3>
                          <p className="text-text-muted text-sm font-display">Invoicing</p>
                      </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

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


        <Footer />
      </div>
    </div>
  );
};

export default Index;
