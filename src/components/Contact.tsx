import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "dsclub.au@outlook.com"
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
    <section id="contact" className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-6">
        {/* Section Header with Broken Gold Line */}
        <div className="mb-16">
          <div className="ml-0 w-1/2 mb-4">
            <div className="broken-gold-line h-[1.5px] opacity-40"></div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className="text-left px-4"
          >
            <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight mb-6 font-display">
              Let's Work Together
            </h2>
            <p className="text-white/80 text-base font-normal leading-relaxed max-w-3xl font-display">
              Ready to launch for real? Get a custom plan and pricing made for your idea.
            </p>
          </motion.div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col gap-4 p-6 bg-surface-dark/50 border border-primary/20 rounded-lg singularity-shadow"
            >
              <div className="flex items-start gap-4">
                <info.icon className="w-6 h-6 text-primary mt-1" />
                <div>
                  <p className="font-semibold text-white font-display">{info.label}</p>
                  <p className="text-white/70 text-sm font-display">{info.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-left px-4"
        >
          <Button
            size="lg"
            className="relative flex w-fit cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-primary text-background-dark text-base font-bold tracking-wide gold-foil-outline hover:brightness-110 transition-all singularity-shadow font-display"
          >
            Tell Us About It
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
