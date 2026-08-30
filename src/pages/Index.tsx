import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
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
import { toolsData } from "@/data/tools";

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
    <div className="min-h-screen bg-mint-50 text-teal-900 time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white flex flex-col">
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

      {/* Main Content Wrapper */}
      <main className="relative w-full max-w-7xl mx-auto flex flex-col">
        <About />

        {/* Featured Tools Marquee Section */}
        <section className="pt-16 md:pt-20 pb-0 overflow-hidden">
          <div className="container mx-auto px-6 mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-teal-600 font-display mb-2">
              Featured Tools & Solutions
            </h2>
            <p className="text-teal-900/80 text-sm sm:text-base font-display max-w-2xl mx-auto">
              Proprietary automation tools built to scale operations and eliminate manual friction.
            </p>
          </div>

          <div className="relative w-full overflow-hidden py-4">
            <style>{`
              @keyframes marquee-scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee-scroll {
                display: flex;
                width: max-content;
                animation: marquee-scroll 25s linear infinite;
              }
              .animate-marquee-scroll:hover {
                animation-play-state: paused;
              }
            `}</style>

            {/* Gradient edge masks for smooth fade in/out */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-mint-50 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-mint-50 to-transparent z-10" />

            <div className="animate-marquee-scroll flex items-center gap-8 sm:gap-12 pl-6">
              {/* Render tools duplicated for a seamless 50% translation loop */}
              {[...Array(4)].map((_, loopIdx) => (
                <div key={loopIdx} className="flex items-center gap-8 sm:gap-12 flex-shrink-0">
                  {toolsData.map((tool) => {
                    const Icon = tool.icon;
                    const isExternal = tool.slug === 'rccp';
                    const targetUrl = isExternal ? 'https://rccp.automationalchemists.com' : `/tools/${tool.slug}`;

                    const itemContent = (
                      <div className="flex items-center gap-3 px-3 py-2 text-teal-900 group cursor-pointer whitespace-nowrap transition-colors">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                          {tool.slug === 'rccp' ? (
                            <img src="/images/rccp-logo.png" alt={tool.name} className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" />
                          ) : Icon ? (
                            <Icon className="w-6 h-6 text-teal-600 group-hover:scale-110 transition-transform" />
                          ) : null}
                        </div>
                        <span className="font-display font-semibold text-base sm:text-lg md:text-xl text-teal-900 group-hover:text-teal-600 transition-colors tracking-tight">
                          {tool.name}
                        </span>
                        <span className="text-teal-600/30 text-xs ml-4 sm:ml-6">✦</span>
                      </div>
                    );

                    return isExternal ? (
                      <a
                        key={`${loopIdx}-${tool.id}`}
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block hover:opacity-90 transition-opacity"
                      >
                        {itemContent}
                      </a>
                    ) : (
                      <Link
                        key={`${loopIdx}-${tool.id}`}
                        to={targetUrl}
                        className="inline-block hover:opacity-90 transition-opacity"
                      >
                        {itemContent}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Preview Section */}
        <section className="pt-16 md:pt-20 pb-0">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-teal-600 mb-4 font-display">
                Our Services
              </h2>
              <p className="text-base sm:text-lg text-teal-900/80 max-w-3xl mx-auto mb-8 font-display">
                Comprehensive solutions tailored to meet your unique business needs
              </p>
              <Link to="/services">
                <Button size="lg" className="group hover:scale-105 transition-transform bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 shadow-md font-bold font-display border-none px-6 py-3">
                  View All Services
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <Testimonials />
      </main>

      {/* Full-width Footer */}
      <div className="mt-16 md:mt-20">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
