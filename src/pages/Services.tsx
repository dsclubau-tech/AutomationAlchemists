import { motion } from "framer-motion";
import { useEffect, useState } from "react";
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

interface Service {
  id: string;
  title: string;
  slug?: string | null;
  description: string;
  features: string[] | null;
  icon: string;
  color_gradient: string | null;
  quote: string | null;
  visual_tags: string[] | null;
}

const Services = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        if (data) {
          setServices(data as Service[]);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Code;
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

        {/* Dynamic Service Sections from Database */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          services.map((service, index) => {
            const IconComponent = getIcon(service.icon);
            const features = service.features || [];
            const visualTags = service.visual_tags || [];

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
                    className="bg-surface-dark/50 border border-primary/20 rounded-2xl p-6 sm:p-8 md:p-12"
                  >
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                      {/* Content */}
                      <div className="space-y-6">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-main font-display">
                          {service.title}
                        </h2>
                        <p className="text-text-muted text-sm sm:text-base md:text-lg leading-relaxed font-display">
                          {service.description}
                        </p>

                        {/* Feature List */}
                        {features.length > 0 && (
                          <div className="grid grid-cols-2 gap-4">
                            {features.slice(0, 4).map((feature, i) => (
                              <div key={i} className="flex items-center gap-2 text-text-muted font-display text-sm sm:text-base">
                                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Quote */}
                        {service.quote && (
                          <div className="border-l-4 border-primary pl-4 py-2">
                            <p className="text-text-muted italic font-display text-sm sm:text-base">
                              "{service.quote}"
                            </p>
                          </div>
                        )}

                        {/* CTA Button */}
                        <Link to="/contact">
                          <Button className="bg-primary text-background-dark hover:brightness-110 transition-all font-display text-sm sm:text-base h-10 sm:h-12 px-6">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Get Started with {service.title}
                          </Button>
                        </Link>
                      </div>

                      {/* Visual Element */}
                      <div className="relative hidden md:block">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-3xl"></div>
                        <div className="relative bg-surface-dark border border-primary/30 rounded-2xl p-8 space-y-4">
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
                            <div className="flex gap-2 flex-wrap">
                              {visualTags.map((tag, i) => (
                                <div key={i} className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary font-display">
                                  {tag}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </section>
              </div>
            );
          })
        )}

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
