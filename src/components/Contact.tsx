import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@aalchemists.com"
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (555) 123-4567"
  },
  {
    icon: MapPin,
    label: "Location",
    value: "San Francisco, CA"
  }
];

const Contact = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="py-24 bg-gradient-subtle" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Let's Work Together
            </h2>
            <p className="text-lg text-muted-foreground">
              Ready to launch for real? Get a custom plan and pricing made for your idea.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 bg-card rounded-xl shadow-card"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="font-semibold text-primary mb-1">{info.label}</div>
                <div className="text-muted-foreground">{info.value}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-lg"
            >
              Tell Us About It
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
