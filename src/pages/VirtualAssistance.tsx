import React from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import SEOHead from "@/components/SEOHead";
import SchemaMarkup from "@/components/SchemaMarkup";
import { virtualAssistanceStories, virtualAssistanceStats } from "@/data/virtualAssistance";
import { StorySection } from "@/components/StorySection";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const VirtualAssistance = () => {
  const activeStories = virtualAssistanceStories.filter(s => s.enabled);
  const activeStats = virtualAssistanceStats.filter(s => s.enabled);

  const scrollToFirstStory = (e: React.MouseEvent) => {
    e.preventDefault();
    const firstStory = document.getElementById('story-section-0');
    if (firstStory) {
      firstStory.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-mint-50 text-teal-900 antialiased selection:bg-teal-600 selection:text-white overflow-x-hidden">
      <SEOHead
        title="Virtual Assistance | Automation Alchemists"
        description="Real virtual assistants who pick up the work, handle it, and keep you moving. Not a chatbot, not a queue - a person."
        url="https://automationalchemists.com/virtual-assistance"
        keywords="virtual assistant, dedicated assistant, business operations, task delegation"
      />
      <SchemaMarkup
        type="ProfessionalService"
        data={{
          name: "Virtual Assistance",
          description: "Real virtual assistants who pick up the work, handle it, and keep you moving.",
          url: "https://automationalchemists.com/virtual-assistance",
          provider: {
            "@type": "Organization",
            "name": "Automation Alchemists"
          }
        }}
      />
      <PageLoader pageName="Virtual Assistance" />
      <Navigation />

      <main className="pt-28 lg:pt-32 pb-0">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl pb-16 sm:pb-24">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-teal-600 font-semibold tracking-wide uppercase font-display"
            >
              Real people. Real progress.
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-teal-900 font-display"
            >
              Get Things Off Your Plate - For Real
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-teal-900/80 font-display leading-relaxed"
            >
              Real virtual assistants who pick up the work, handle it, and keep you moving. Not a chatbot, not a queue - a person.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button asChild size="lg" className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 w-full sm:w-auto font-semibold">
                <Link to="/contact">Get Started</Link>
              </Button>
              <Button onClick={scrollToFirstStory} variant="outline" size="lg" className="w-full sm:w-auto border-teal-600/20 text-teal-900 hover:bg-teal-900/5 font-semibold">
                See How It Works
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Stories Section */}
        <div className="flex flex-col space-y-8 pb-16 sm:pb-24">
          {activeStories.map((story, index) => (
            <div key={story.id} id={`story-section-${index}`}>
              <StorySection story={story} index={index} />
            </div>
          ))}
        </div>

        {/* Proof/Stats Section (Only renders if there are enabled stats) */}
        {activeStats.length > 0 && (
          <section className="bg-teal-900 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-center">
                {activeStats.map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-mint-50 mb-4 font-display">
                      {stat.value}
                    </p>
                    <p className="text-lg text-mint-50/80 font-display">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pricing Strip */}
        <section className="bg-[#EEF7F5] py-24 px-4 sm:px-6 lg:px-8 border-y border-teal-600/10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-teal-900 font-display">
              Start with the work you need handled.
            </h2>
            <div>
              <Button asChild size="lg" className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 font-semibold shadow-lg hover:shadow-xl transition-all">
                <Link to="/contact">Book a call for pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 text-center bg-mint-50">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-teal-900 font-display">
              Ready to hand something off?
            </h2>
            <div>
              <Button asChild size="lg" className="bg-teal-900 text-white hover:bg-teal-800 font-semibold shadow-md">
                <Link to="/contact">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VirtualAssistance;
