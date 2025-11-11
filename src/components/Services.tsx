import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Cloud, Smartphone, Lock, Database, Zap } from "lucide-react";

const services = [
  {
    icon: Code,
    title: "Web Development",
    description: "Custom websites and web applications built with cutting-edge technologies for optimal performance and user experience."
  },
  {
    icon: Cloud,
    title: "Cloud Services",
    description: "Scalable cloud infrastructure solutions to power your applications with reliability and security."
  },
  {
    icon: Smartphone,
    title: "Mobile Development",
    description: "Native and cross-platform mobile applications that deliver seamless experiences across all devices."
  },
  {
    icon: Lock,
    title: "Cybersecurity",
    description: "Comprehensive security solutions to protect your digital assets and ensure compliance with industry standards."
  },
  {
    icon: Database,
    title: "Data Analytics",
    description: "Transform raw data into actionable insights with our advanced analytics and business intelligence solutions."
  },
  {
    icon: Zap,
    title: "Digital Transformation",
    description: "End-to-end digital transformation services to modernize your business processes and infrastructure."
  }
];

const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="services" className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Our Services
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Comprehensive solutions tailored to meet your unique business needs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-elegant transition-shadow duration-300 border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-primary">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
