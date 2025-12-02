import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Code, Cloud, Smartphone, Check, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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

const services = [
  {
    icon: Code,
    title: "Web Development",
    shortDesc: "Transform your digital presence with high-performance, responsive websites.",
    description: "Transform your digital presence with high-performance, responsive websites and web applications. We utilize modern frameworks and best practices to ensure your site is fast, secure, and SEO-friendly, providing an exceptional user experience that drives growth.",
    features: ["Modern Frameworks", "SEO Optimized", "Responsive Design", "High Performance"],
    badge: "Most Popular",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
  },
  {
    icon: Cloud,
    title: "Automation",
    shortDesc: "Streamline your business operations with advanced automation solutions.",
    description: "Streamline your business operations with our advanced automation solutions. From cloud infrastructure management to CI/CD pipelines, we help you reduce manual effort, minimize errors, and accelerate delivery, allowing your team to focus on innovation.",
    features: ["Cloud Infrastructure", "CI/CD Pipelines", "Process Automation", "Error Reduction"],
    badge: "Enterprise Ready",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
  },
  {
    icon: Smartphone,
    title: "Mobile Development",
    shortDesc: "Reach your audience wherever they are with custom mobile apps.",
    description: "Reach your audience wherever they are with our custom mobile application development services. Whether native or cross-platform, we build intuitive, feature-rich apps for iOS and Android that engage users and extend your brand's reach.",
    features: ["iOS & Android", "Cross-platform", "Native Performance", "User Centric"],
    badge: "Cross-Platform",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
  },
];

const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background-dark text-text-main time-fold-ripple overflow-x-hidden">
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
              Architects of Automation
            </h1>
            <p className="text-text-muted text-sm sm:text-base md:text-xl font-normal leading-relaxed max-w-2xl font-display">
              Harnessing quantum principles and hyper-dimensional geometry to build the next generation of intelligent solutions.
            </p>
          </motion.div>
        </section>

        {/* Directional Node Divider */}
        <div className="w-full flex items-center gap-4">
          <div className="directional-node"></div>
          <div className="flex-grow h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
        </div>

        {/* Services Grid */}
        <section ref={ref} className="w-full flex flex-col gap-4 sm:gap-6">
          <h2 className="text-text-main text-2xl sm:text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl font-display">Core Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start justify-items-center w-full">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="w-full max-w-[340px]"
              >
                <Expandable
                  expandDirection="both"
                  expandBehavior="replace"
                  onExpandStart={() => console.log(`Expanding ${service.title}...`)}
                >
                  {({ isExpanded }) => (
                    <ExpandableTrigger>
                      <ExpandableCard
                        className="bg-surface-dark/50 border-primary/20 hover:border-primary/40 w-full max-w-[340px] sm:max-w-none"
                        collapsedSize={{ width: 300, height: 260 }}
                        expandedSize={{ width: 340, height: 540 }}
                        hoverToExpand={true}
                        expandDelay={200}
                        collapseDelay={300}
                      >
                        <ExpandableCardHeader className="p-4 sm:p-6">
                          <div className="flex justify-between items-start w-full gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                                <service.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                              </div>
                              <h3 className="text-text-main text-base sm:text-lg font-semibold leading-tight font-display truncate">
                                {service.title}
                              </h3>
                            </div>
                            <Badge className={`${service.badgeColor} flex-shrink-0 whitespace-nowrap text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 font-semibold shadow-lg ${service.badge === 'Most Popular' ? 'shadow-blue-500/50' :
                              service.badge === 'Enterprise Ready' ? 'shadow-purple-500/50' :
                                'shadow-green-500/50'
                              }`}>
                              {service.badge}
                            </Badge>
                          </div>
                        </ExpandableCardHeader>

                        <ExpandableCardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                          <p className="text-text-muted text-xs sm:text-sm font-normal leading-normal font-display mb-3 sm:mb-4">
                            {isExpanded ? service.description : service.shortDesc}
                          </p>

                          <ExpandableContent preset="blur-md" stagger staggerChildren={0.1}>
                            <div className="space-y-2 sm:space-y-3 pt-2">
                              <h4 className="font-medium text-xs sm:text-sm text-text-main font-display flex items-center">
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-primary flex-shrink-0" />
                                Key Features:
                              </h4>
                              {service.features.map((feature, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs sm:text-sm text-text-muted font-display pl-4 sm:pl-6"
                                >
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                                  <span className="break-words">{feature}</span>
                                </div>
                              ))}
                            </div>

                            <div className="mt-4 sm:mt-6 space-y-2">
                              <Button className="w-full bg-primary text-background-dark hover:brightness-110 transition-all font-display text-xs sm:text-sm h-9 sm:h-10">
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                Learn More
                              </Button>
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

                        <ExpandableContent preset="slide-up">
                          <ExpandableCardFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                            <div className="flex items-center justify-between w-full text-[10px] sm:text-xs text-text-muted font-display">
                              <span>Hover to {isExpanded ? 'collapse' : 'expand'}</span>
                              <span className="text-primary">→</span>
                            </div>
                          </ExpandableCardFooter>
                        </ExpandableContent>
                      </ExpandableCard>
                    </ExpandableTrigger>
                  )}
                </Expandable>
              </motion.div>
            ))}
          </div>
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
