import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Code, Cloud, Smartphone, Check, ArrowRight, Bot, Database, Palette, Globe, Cpu, Zap, Shield, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import {
  Expandable,
  ExpandableCard,
  ExpandableCardContent,
  ExpandableCardHeader,
  ExpandableCardFooter,
  ExpandableContent,
  ExpandableTrigger,
} from "@/components/ui/expandable";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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

interface Service {
  id: string;
  title: string;
  slug?: string | null;
  description: string;
  features: string[] | null;
  icon: string;
  color_gradient: string | null;
}

// Default services for fallback
const defaultServices: Service[] = [
  {
    id: "1",
    icon: "Code",
    title: "Web Development",
    description: "Transform your digital presence with high-performance, responsive websites and web applications. We utilize modern frameworks and best practices to ensure your site is fast, secure, and SEO-friendly, providing an exceptional user experience that drives growth.",
    features: ["Modern Frameworks", "SEO Optimized", "Responsive Design", "High Performance"],
    color_gradient: "from-blue-500 to-purple-600",
  },
  {
    id: "2",
    icon: "Cloud",
    title: "Automation",
    description: "Streamline your business operations with our advanced automation solutions. From cloud infrastructure management to CI/CD pipelines, we help you reduce manual effort, minimize errors, and accelerate delivery, allowing your team to focus on innovation.",
    features: ["Cloud Infrastructure", "CI/CD Pipelines", "Process Automation", "Error Reduction"],
    color_gradient: "from-purple-500 to-pink-600",
  },
  {
    id: "3",
    icon: "Smartphone",
    title: "Mobile Development",
    description: "Reach your audience wherever they are with our custom mobile application development services. Whether native or cross-platform, we build intuitive, feature-rich apps for iOS and Android that engage users and extend your brand's reach.",
    features: ["iOS & Android", "Cross-platform", "Native Performance", "User Centric"],
    color_gradient: "from-green-500 to-teal-600",
  },
];

// Badge colors based on index
const badgeColors = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
];

const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setServices(data as Service[]);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        // Keep default services on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Code;
  };

  const getShortDesc = (description: string) => {
    // Get first sentence or first 100 characters
    const firstSentence = description.split('.')[0];
    return firstSentence.length > 100 ? firstSentence.substring(0, 100) + '...' : firstSentence + '.';
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-main time-fold-ripple overflow-x-hidden">
      <SEOHead
        title="Services"
        description="Explore our comprehensive automation services: Vibe-to-App execution, 24/7 Virtual Assistants, Workflow Automation, and custom software development."
        keywords="automation services, virtual assistants, workflow automation, app development, software development"
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

        {/* Directional Node Divider */}
        <div className="w-full flex items-center gap-4">
          <div className="directional-node"></div>
          <div className="flex-grow h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
        </div>

        {/* Virtual Assistant Section */}
        <section className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-surface-dark/50 border border-primary/20 rounded-2xl p-6 sm:p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Content */}
              <div className="space-y-6">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-main font-display">
                  Virtual Assistant
                </h2>
                <p className="text-text-muted text-sm sm:text-base md:text-lg leading-relaxed font-display">
                  More than just a virtual assistant—a dedicated partner invested in your success. We hand-pick elite operators who learn your voice, anticipate your needs, and manage your chaotic schedule with empathy and discretion. They bring the human touch you need, with the technical competence to master your systems instantly.
                </p>

                {/* Feature List */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-text-muted font-display text-sm sm:text-base">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Handles Admin to Ops</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted font-display text-sm sm:text-base">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Self-Managing & Proactive</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted font-display text-sm sm:text-base">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Quick to Learn Your Tools</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted font-display text-sm sm:text-base">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Runs Daily Operations</span>
                  </div>
                </div>

                {/* Quote */}
                <div className="border-l-4 border-primary pl-4 py-2">
                  <p className="text-text-muted italic font-display text-sm sm:text-base">
                    "If someone can do a task at least 70% as well as you, hand it off."
                  </p>
                </div>

                {/* CTA Button */}
                <Link to="/contact">
                  <Button className="bg-primary text-background-dark hover:brightness-110 transition-all font-display text-sm sm:text-base h-10 sm:h-12 px-6">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Get Your Virtual Assistant
                  </Button>
                </Link>
              </div>

              {/* Visual Element */}
              <div className="relative hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-3xl"></div>
                <div className="relative bg-surface-dark border border-primary/30 rounded-2xl p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-text-main font-semibold font-display">Your Elite Operator</p>
                      <p className="text-text-muted text-sm font-display">Available when you need them</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-primary/20 rounded-full w-full"></div>
                    <div className="h-2 bg-primary/30 rounded-full w-3/4"></div>
                    <div className="h-2 bg-primary/20 rounded-full w-5/6"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary font-display">Inbox Zero</div>
                    <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary font-display">Calendar</div>
                    <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary font-display">CRM</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Directional Node Divider */}
        <div className="w-full flex items-center gap-4">
          <div className="flex-grow h-px bg-gradient-to-l from-primary/50 to-transparent"></div>
          <div className="directional-node"></div>
        </div>

        {/* Services Grid */}
        <section ref={ref} className="w-full flex flex-col gap-4 sm:gap-6">
          <h2 className="text-text-main text-2xl sm:text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl font-display">Core Services</h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start justify-items-center w-full">
              {services.map((service, index) => {
                const IconComponent = getIcon(service.icon);
                const features = service.features || [];
                const badgeColor = badgeColors[index % badgeColors.length];

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="w-full max-w-[380px]"
                  >
                    <Expandable
                      expandDirection="both"
                      expandBehavior="replace"
                      onExpandStart={() => console.log(`Expanding ${service.title}...`)}
                    >
                      {({ isExpanded }) => (
                        <ExpandableTrigger>
                          <ExpandableCard
                            className="bg-surface-dark/50 border-primary/20 hover:border-primary/40 w-full max-w-[380px] sm:max-w-none"
                            collapsedSize={{ width: 340, height: 340 }}
                            expandedSize={{ width: 380, height: 580 }}
                            hoverToExpand={true}
                            expandDelay={200}
                            collapseDelay={300}
                          >
                            <ExpandableCardHeader className="p-4 sm:p-6">
                              <div className="flex flex-col gap-2 w-full">
                                {/* Badge on top */}
                                <div className="flex justify-end">
                                  <Badge className={`${badgeColor} whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 font-semibold shadow-lg`}>
                                    {index === 0 ? 'Most Popular' : index === 1 ? 'Enterprise Ready' : 'Featured'}
                                  </Badge>
                                </div>
                                {/* Icon and Title */}
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                                  </div>
                                  <h3 className="text-text-main text-base sm:text-lg font-semibold leading-tight font-display">
                                    {service.title}
                                  </h3>
                                </div>
                              </div>
                            </ExpandableCardHeader>

                            <ExpandableCardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                              <p className="text-text-muted text-xs sm:text-sm font-normal leading-normal font-display mb-3 sm:mb-4">
                                {isExpanded ? service.description : getShortDesc(service.description)}
                              </p>

                              <ExpandableContent preset="blur-md" stagger staggerChildren={0.1}>
                                <div className="space-y-2 sm:space-y-3 pt-2">
                                  <h4 className="font-medium text-xs sm:text-sm text-text-main font-display flex items-center">
                                    <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-primary flex-shrink-0" />
                                    Key Features:
                                  </h4>
                                  {features.map((feature, i) => (
                                    <div
                                      key={i}
                                      className="flex items-start gap-2 text-xs sm:text-sm text-text-muted font-display pl-4 sm:pl-6"
                                    >
                                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0 mt-0.5" />
                                      <span className="break-words whitespace-normal overflow-hidden">{feature}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4 sm:mt-6 space-y-2">
                                  <Link to={`/services/${service.slug || service.id}`} className="block">
                                    <Button className="w-full bg-primary text-background-dark hover:brightness-110 transition-all font-display text-xs sm:text-sm h-9 sm:h-10">
                                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                      Learn More
                                    </Button>
                                  </Link>
                                  {isExpanded && (
                                    <Link to="/contact" className="block">
                                      <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10 font-display text-xs sm:text-sm h-9 sm:h-10">
                                        Get Started
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </ExpandableContent>
                            </ExpandableCardContent>

                            {/* Collapsed state hint */}
                            {!isExpanded && (
                              <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
                                <div className="flex items-center justify-between w-full text-[10px] sm:text-xs text-text-muted font-display border-t border-primary/10 pt-3">
                                  <span>Hover to expand</span>
                                  <span className="text-primary">↓</span>
                                </div>
                              </div>
                            )}

                            {/* Expanded state hint */}
                            <ExpandableContent preset="slide-up">
                              <ExpandableCardFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                                <div className="flex items-center justify-between w-full text-[10px] sm:text-xs text-text-muted font-display border-t border-primary/10 pt-3">
                                  <span>Hover to collapse</span>
                                  <span className="text-primary">↑</span>
                                </div>
                              </ExpandableCardFooter>
                            </ExpandableContent>
                          </ExpandableCard>
                        </ExpandableTrigger>
                      )}
                    </Expandable>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Directional Node Divider */}
        <div className="w-full flex items-center gap-4">
          <div className="flex-grow h-px bg-gradient-to-l from-primary/50 to-transparent"></div>
          <div className="directional-node"></div>
        </div>

        {/* CTA Section */}
        <section className="bg-white/5 border border-primary/20 fractal-border-rev shadow-singularity p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 mb-12 sm:mb-16">
          <div className="text-center md:text-left">
            <h3 className="text-text-main text-xl sm:text-2xl md:text-3xl font-bold font-display">Transcend Your Potential.</h3>
            <p className="text-text-muted mt-1 text-sm sm:text-base font-display">Let's architect your future with intelligent automation.</p>
          </div>
          <Link to="/contact">
            <Button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden h-10 sm:h-12 px-4 sm:px-6 bg-primary text-background-dark text-sm sm:text-base font-bold leading-normal tracking-[0.015em] fractal-border gold-foil-micro hover:brightness-110 transition-all flex-shrink-0 font-display whitespace-nowrap">
              <span className="truncate">Request a Consultation</span>
            </Button>
          </Link>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Services;
