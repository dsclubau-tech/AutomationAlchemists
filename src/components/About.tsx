import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Award, Users, Globe, Hourglass } from "lucide-react";

const stats = [
  { icon: Users, label: "Ecommerce Expertise", value: "5+ Years" },
  { icon: Globe, label: "Remotely And Flexibly", value: "Operating Internationally" },
  { icon: Hourglass, label: "Through Automation & Workflow Optimization. Custom-built solutions designed around your exact needs.", value: "500+ Hours Saved" }
];

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-24 bg-background" ref={ref}>
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
              About AAlchemists
            </h2>
            <p className="text-white/80 text-base font-normal leading-relaxed max-w-3xl font-display">
              When your vision outgrows the limits of vibe-coded prototypes, we step in.
              You define the idea; we build, package, and deploy the full product end-to-end.
              The result: a polished, launch-ready solution built to scale and built to earn.
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-surface-dark p-5 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-4">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-white text-lg font-bold font-display">{stat.value}</h2>
                <p className="text-white/70 text-sm font-normal leading-relaxed font-display">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
