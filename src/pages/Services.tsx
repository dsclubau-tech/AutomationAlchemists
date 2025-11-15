import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Cloud, Smartphone, Lock, Database, Zap, Check, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Icon mapping for dynamic rendering
const iconMap: Record<string, any> = {
  Code,
  Cloud,
  Smartphone,
  Lock,
  Database,
  Zap,
};

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  color_gradient: string | null;
}

const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
      } else if (data) {
        setServices(data);
      }
      setLoading(false);
    };

    fetchServices();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
                  Our Services
                </span>
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-muted-foreground mb-8"
            >
              Comprehensive solutions tailored to meet your unique business needs
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section ref={ref} className="py-20 px-6">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Loading services...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => {
                const IconComponent = iconMap[service.icon] || Code;
                return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                  className="h-full"
                >
                  <Card className="h-full border-border transition-all duration-300 hover:shadow-elegant hover:-translate-y-2 overflow-hidden relative group">
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${service.color_gradient || 'from-primary to-accent'} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                      animate={hoveredIndex === index ? { scale: 1.05 } : { scale: 1 }}
                    />
                    
                    <CardHeader>
                      <motion.div
                        className={`w-14 h-14 bg-gradient-to-br ${service.color_gradient || 'from-primary to-accent'} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                        animate={hoveredIndex === index ? { rotate: 360, scale: 1.1 } : { rotate: 0, scale: 1 }}
                        transition={{ duration: 0.6 }}
                      >
                        {/* FIX: text-foreground instead of text-white */}
                        <IconComponent className="w-7 h-7 text-foreground" />
                      </motion.div>
                      <CardTitle className="text-2xl text-foreground">{service.title}</CardTitle>
                    </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <CardDescription className="text-base text-muted-foreground">
                      {service.description}
                    </CardDescription>
                    
                    <div className="space-y-2 pt-4">
                      {service.features.map((feature, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={hoveredIndex === index ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="w-4 h-4 text-accent" />
                          <span>{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={hoveredIndex === index ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Button variant="ghost" className="w-full mt-4 group/btn">
                        Learn More 
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-primary to-accent rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"
            />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Let's discuss how our services can help transform your business
              </p>
              <Button size="lg" variant="secondary" className="text-lg px-8 hover:scale-105 transition-transform">
                Contact Us Today
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
