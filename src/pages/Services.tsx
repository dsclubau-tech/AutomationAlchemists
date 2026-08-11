import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code, Cloud, Smartphone, Check, ArrowRight, Bot, Database, Palette, Globe, Cpu, Zap, Shield, Loader2, Mail } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code,
  Cloud,
  Smartphone,
  Bot,
  Database,
  Palette,
  Globe,
  Cpu,
  Zap,
  Shield,
};

const servicesData = [
  {
    id: "workflow-automation",
    title: "Workflow Automation",
    description: "We design and implement automated workflows that eliminate repetitive manual tasks, reduce human error, and free your team to focus on high-value work. From automating internal approvals to connecting your CRM, invoicing, and reporting tools, every workflow is custom-built around how your business actually operates.",
    features: [
      "Process Mapping & Optimization",
      "Custom Automation Workflows",
      "Third-Party Tool Integration",
      "Time & Cost Savings Reports"
    ],
    ctaText: "Get Started with Workflow Automation",
    quickAnswer: "Workflow automation is the use of software to perform repetitive business tasks — like data entry, approvals, and notifications.",
    icon: "Zap",
    visualTags: ["Automation", "Efficiency", "Workflows"]
  },
  {
    id: "custom-business-tools",
    title: "Custom Business Tools",
    description: "Off-the-shelf software rarely fits every part of your business. We build custom internal tools, dashboards, and applications designed around your exact workflows",
    features: [
      "Custom Dashboards & Portals",
      "Internal Tool Development",
      "Scalable Architecture",
      "Ongoing Support & Updates"
    ],
    ctaText: "Get Started with Custom Tools",
    quickAnswer: "A custom business tool is software built specifically for one company's workflows rather than a generic off-the-shelf product.",
    icon: "Code",
    visualTags: ["Dashboards", "Internal Tools", "Scalable"]
  },
  {
    id: "api-integration",
    title: "API Integration",
    description: "Secure, real-time API integrations that connect your CRM, payment systems, and internal tools.\n\nDisconnected software creates duplicate data, wasted time, and costly mistakes. We connect your CRM, payment systems, marketing tools, and internal platforms through secure, reliable API integrations.",
    features: [
      "Third-Party API Connections",
      "Custom API Development",
      "Secure Data Syncing",
      "Real-Time System Updates"
    ],
    ctaText: "Get Started with API Integration",
    quickAnswer: "API integration connects two or more software systems so they can automatically share data, eliminating manual data entry between platforms.",
    icon: "Globe",
    visualTags: ["API", "Integration", "Data Sync"]
  },
  {
    id: "saas-tools",
    title: "SaaS Tools",
    description: "Whether you're launching a new product or scaling an existing platform, we design and build SaaS applications that are secure, scalable, and built for growth.",
    features: [
      "MVP to Full-Scale Development",
      "Multi-Tenant Architecture",
      "Subscription & Billing Systems",
      "Cloud-Native Infrastructure"
    ],
    ctaText: "Get Started with SaaS Development",
    quickAnswer: "SaaS (Software-as-a-Service) development is the process of building cloud-based software that customers access through subscriptions rather than one-time purchases.",
    icon: "Cloud",
    visualTags: ["SaaS", "Cloud", "Subscriptions"]
  },
  {
    id: "virtual-assistance",
    title: "Virtual Assistance",
    description: "Free up hours in your week with skilled virtual assistant support tailored to your business. From inbox and calendar management to research, data entry, and customer support, our virtual assistants handle the day-to-day so you can focus on growth.",
    features: [
      "Admin & Inbox Management",
      "Data Entry & Research",
      "Customer Support Assistance",
      "Flexible Hourly Plans"
    ],
    ctaText: "Get Started with Virtual Assistance",
    quickAnswer: "A virtual assistant is a remote professional who handles administrative, technical, or creative tasks for a business without being physically present.",
    icon: "Bot",
    visualTags: ["Virtual Assistant", "Support", "Admin"]
  }
];

const Services = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Code;
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-main time-fold-ripple overflow-x-hidden">
      <SEOHead
        title="Services"
        description="Explore our comprehensive automation services: Virtual Assistants, Workflow Automation, API Integration, and Custom software development."
        keywords="automation services, virtual assistants, workflow automation, app development, software development, SaaS"
      />
      <PageLoader pageName="Services" />
      <Navigation />

      {/* Fractal Corner Frames */}
      <div className="pointer-events-none absolute top-0 left-0 h-32 w-32 md:h-48 md:w-48" style={{ background: 'radial-gradient(circle at top left, rgba(212,175,55,0.2) 0%, transparent 50%)' }}></div>
      <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 md:h-48 md:w-48" style={{ background: 'radial-gradient(circle at bottom right, rgba(212,175,55,0.15) 0%, transparent 50%)' }}></div>

      <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-12 sm:gap-16 md:gap-24 pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6">
        {/* Hero Section */}
        <section className="flex flex-col items-start gap-4 sm:gap-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-2"
          >
            <h1 className="text-text-main text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter spatial-distortion-glow font-display">
              We Build Systems That Scale.
            </h1>
            <p className="text-text-muted text-sm sm:text-base md:text-xl font-normal leading-relaxed max-w-2xl font-display">
              Stop trading time for money. We design custom automation workflows that handle your repetitive tasks, so you can focus on growth.
            </p>
          </motion.div>
        </section>

        {/* Dynamic Service Sections from Hardcoded Data */}
        {servicesData.map((service, index) => {
          const IconComponent = getIcon(service.icon);
          const features = service.features || [];
          const visualTags = service.visualTags || [];

          return (
            <div key={service.id}>
              {/* Directional Node Divider */}
              <div className="w-full flex items-center gap-4 mb-12">
                {index % 2 === 0 ? (
                  <>
                    <div className="flex-grow h-px bg-gradient-to-l from-primary/50 to-transparent"></div>
                    <div className="directional-node"></div>
                  </>
                ) : (
                  <>
                    <div className="directional-node"></div>
                    <div className="flex-grow h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
                  </>
                )}
              </div>

              {/* Service Section */}
              <section className="w-full mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 * index }}
                  className="bg-surface-dark/50 border border-primary/20 rounded-2xl p-6 sm:p-8 md:p-12 group"
                >
                  <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Content */}
                    <div className="space-y-6">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-main font-display">
                        {service.title}
                      </h2>
                      <div className="text-text-muted text-sm sm:text-base md:text-lg leading-relaxed font-display whitespace-pre-line">
                        {service.description}
                      </div>

                      {/* Feature List */}
                      {features.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-text-muted font-display text-sm sm:text-base">
                              <Check className="w-5 h-5 text-primary flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Answer (Mobile Only, since Desktop uses hover effect) */}
                      <div className="md:hidden mt-4 overflow-hidden">
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                          <h4 className="text-primary font-display font-bold mb-1 text-sm">Quick Answer</h4>
                          <p className="text-text-muted text-sm font-display">{service.quickAnswer}</p>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="pt-2 sm:pt-4">
                        <Link to="/contact">
                          <Button className="bg-primary text-background-dark hover:brightness-110 transition-all font-display text-sm sm:text-base h-10 sm:h-12 px-6">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            {service.ctaText}
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Visual Element (Desktop) */}
                    <div className="relative hidden md:block h-[300px]">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-3xl"></div>
                      <div className="relative bg-surface-dark border border-primary/30 rounded-2xl p-8 h-full flex flex-col justify-center overflow-hidden">
                        
                        {/* Default visual state */}
                        <div className="transition-all duration-500 ease-in-out group-hover:opacity-0 group-hover:scale-95 absolute inset-0 p-8 flex flex-col justify-center space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              <IconComponent className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-text-main font-semibold font-display">{service.title}</p>
                              <p className="text-text-muted text-sm font-display">Ready to transform your business</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 bg-primary/20 rounded-full w-full"></div>
                            <div className="h-2 bg-primary/30 rounded-full w-3/4"></div>
                            <div className="h-2 bg-primary/20 rounded-full w-5/6"></div>
                          </div>
                          {visualTags.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-2">
                              {visualTags.map((tag, i) => (
                                <div key={i} className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary font-display">
                                  {tag}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Hover Quick Answer state */}
                        <div className="opacity-0 scale-105 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 ease-in-out absolute inset-0 p-8 flex flex-col justify-center items-center text-center bg-surface-dark/95 backdrop-blur-sm rounded-2xl z-10">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                            <Bot className="w-6 h-6 text-primary" />
                          </div>
                          <h4 className="text-primary font-display font-bold mb-3 text-lg">Quick Answer</h4>
                          <p className="text-white/90 text-sm md:text-base font-display leading-relaxed">
                            {service.quickAnswer}
                          </p>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                </motion.div>
              </section>
            </div>
          );
        })}

        {/* Newsletter Subscription Section */}
        <section className="bg-white/5 border border-primary/20 fractal-border-rev shadow-singularity p-6 sm:p-8 md:p-12 mb-12 sm:mb-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="text-text-main text-xl sm:text-2xl md:text-3xl font-bold font-display mb-2">Stay Ahead of the Curve</h3>
            <p className="text-text-muted text-sm sm:text-base font-display mb-6">
              Get exclusive automation tips, workflow templates, and industry insights delivered to your inbox.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!email.trim()) return;

                setIsSubscribing(true);
                try {
                  const { error } = await supabase
                    .from('newsletter_subscribers')
                    .insert([{ email: email.trim() }]);

                  if (error) {
                    if (error.code === '23505') {
                      toast({
                        title: 'Already Subscribed',
                        description: 'This email is already on our list!',
                      });
                    } else {
                      throw error;
                    }
                  } else {
                    toast({
                      title: 'Subscribed!',
                      description: 'Welcome to the newsletter. Check your inbox soon!',
                    });
                    setEmail('');
                  }
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Failed to subscribe. Please try again.',
                    variant: 'destructive',
                  });
                } finally {
                  setIsSubscribing(false);
                }
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 bg-background-dark border-primary/30 text-text-main placeholder:text-text-muted focus:border-primary h-12"
              />
              <Button
                type="submit"
                disabled={isSubscribing}
                className="bg-primary text-background-dark hover:brightness-110 transition-all font-display text-sm sm:text-base h-12 px-6 whitespace-nowrap"
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            </form>
            <p className="text-text-muted text-xs mt-4 font-display">
              No spam, unsubscribe anytime.
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Services;

