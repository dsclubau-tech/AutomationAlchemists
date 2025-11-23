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
    <section id="about" className="py-24 bg-gradient-subtle" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl text-primary mb-6">
            About AAlchemists
          </h2>
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
            When your vision outgrows the limits of vibe-coded prototypes, we step in.
            You define the idea; we build, package, and deploy the full product end-to-end.
            The result: a polished, launch-ready solution built to scale and built to earn.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 60px -10px rgba(0, 204, 51, 0.4), 0 0 0 2px rgba(0, 204, 51, 0.5)"
              }}
              className="text-center p-8 bg-card rounded-2xl shadow-card cursor-pointer transition-all duration-300 hover:border-primary/50 border-2 border-transparent"
            >
              <motion.div
                className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <stat.icon className="w-8 h-8 text-primary" />
              </motion.div>
              <div className="text-xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
