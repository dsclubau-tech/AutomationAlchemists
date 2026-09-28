import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const contactInfo = [
  {
    icon: Mail,
    label: "General Inquiries",
    value: <a href="mailto:contact@automationalchemists.com" className="hover:text-white transition-colors">contact@automationalchemists.com</a>
  },
  {
    icon: Phone,
    label: "WhatsApp (messages only)",
    value: (
      <div className="flex flex-col gap-1 mt-1">
        <div>Australia: <a href="https://wa.me/61404242373" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline">+61 404 242 373</a></div>
        <div>Bangladesh: <a href="https://wa.me/8801346831069" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline">+880 134 683 1069</a></div>
      </div>
    )
  },
  {
    icon: MapPin,
    label: "Offices",
    value: (
      <div className="flex flex-col gap-2 mt-1">
        <div><strong className="text-white">Australia:</strong><br/>3/33-37 Warialda St, Kogarah NSW 2217</div>
        <div><strong className="text-white">Bangladesh:</strong><br/>Room 315, 4th Floor, Al Rashid Market, Malopara, Rajshahi 6100</div>
      </div>
    )
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
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-6 font-display">
              Let's Work Together
            </h2>
            <p className="text-white/80 text-sm sm:text-base font-normal leading-relaxed max-w-3xl font-display">
              Ready to launch for real? Get a custom plan and pricing made for your idea.
            </p>
          </motion.div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 items-stretch">
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 bg-surface-dark/50 border border-primary/20 rounded-2xl singularity-shadow h-full"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <info.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary mt-1" />
                <div>
                  <p className="font-semibold text-white text-sm sm:text-base font-display">{info.label}</p>
                  <div className="text-white/70 text-xs sm:text-sm font-display break-words">{info.value}</div>
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
          <Link to="/contact">
            <Button
              size="lg"
              className="relative flex w-fit cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 sm:h-12 px-4 sm:px-6 bg-primary text-background-dark text-sm sm:text-base font-bold tracking-wide gold-foil-outline hover:brightness-110 transition-all singularity-shadow font-display"
            >
              Tell Us About It
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
