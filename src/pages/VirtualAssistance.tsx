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
import { ArrowRight } from "lucide-react";
import { RevealBlock } from "@/components/RevealBlock";
import { RevealText } from "@/components/RevealText";

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
            <RevealBlock animateOnLoad delay={0}>
              <p className="text-teal-600 font-semibold tracking-wide uppercase font-display">
                Real people. Real progress.
              </p>
            </RevealBlock>
            
            <RevealText 
              text="Get Things Off Your Plate - For Real" 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-teal-900 font-display" 
              animateOnLoad 
              delay={0.1}
            />
            
            <RevealBlock animateOnLoad delay={0.2}>
              <p className="text-lg sm:text-xl text-teal-900/80 font-display leading-relaxed">
                Real virtual assistants who pick up the work, handle it, and keep you moving. Not a chatbot, not a queue - a person.
              </p>
            </RevealBlock>

            <RevealBlock animateOnLoad delay={0.3} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90 w-full sm:w-auto font-semibold focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
                <Link to="/contact">Get Started</Link>
              </Button>
              <Button onClick={scrollToFirstStory} variant="outline" size="lg" className="w-full sm:w-auto border-teal-600/20 text-teal-900 hover:bg-teal-900 hover:text-white font-semibold focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-mint-50">
                See How It Works
              </Button>
            </RevealBlock>
          </div>
        </section>

        {/* Stories Section */}
        <div className="flex flex-col w-full">
          {activeStories.map((story, index) => (
            <div key={story.id} id={`story-section-${index}`} className="w-full">
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
                  <RevealBlock key={i} delay={i * 0.1}>
                    <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-mint-50 mb-4 font-display">
                      {stat.value}
                    </p>
                    <p className="text-lg text-mint-50/80 font-display">
                      {stat.label}
                    </p>
                  </RevealBlock>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pricing Section */}
        <section className="bg-mint-50 py-24 px-4 sm:px-6 lg:px-8 border-t border-teal-600/10">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12 justify-between items-start md:items-end">
            <div className="flex-1 md:max-w-[60%] space-y-6">
              <RevealBlock delay={0}>
                <p className="text-xs font-semibold tracking-widest uppercase text-teal-600 font-display">
                  SIMPLE PRICING
                </p>
              </RevealBlock>
              
              <RevealText 
                text="Start with the work you need handled." 
                className="text-4xl sm:text-5xl font-extrabold leading-tight text-teal-900 font-display" 
                delay={0.1}
              />
              
              <RevealBlock delay={0.2}>
                <p className="text-lg text-teal-900/80 leading-relaxed max-w-md font-display">
                  No invented packages or surprise commitments. Tell us what's on your plate and we'll map the right support.
                </p>
              </RevealBlock>
            </div>
            
            <RevealBlock delay={0.3} className="w-full md:w-auto shrink-0 pb-1">
              <Link 
                to="/contact" 
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold border border-teal-700 text-teal-700 rounded-md hover:bg-teal-800 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-mint-50"
              >
                Book a call for pricing
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </RevealBlock>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VirtualAssistance;
