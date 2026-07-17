import { motion, useSpring, useTransform } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Award, Users, Globe, Hourglass } from "lucide-react";

// Animated counter component
const AnimatedNumber = ({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  // Initialize to the target value so prerendered/static HTML shows real numbers
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (isInView) {
      // Reset to 0 and animate up when the element scrolls into view
      setDisplayValue(0);
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

        // Easing function for smooth deceleration
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.floor(easeOutQuart * value));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {displayValue}{suffix}
    </span>
  );
};

// Parse value to extract number and suffix (e.g., "500+ Hours" -> { num: 500, suffix: "+ Hours" })
const parseValue = (value: string): { hasNumber: boolean; num: number; prefix: string; suffix: string } => {
  const match = value.match(/^(\D*)(\d+)(.*)$/);
  if (match) {
    return {
      hasNumber: true,
      prefix: match[1] || "",
      num: parseInt(match[2], 10),
      suffix: match[3] || ""
    };
  }
  return { hasNumber: false, num: 0, prefix: "", suffix: value };
};

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
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-6 font-display">
              About AAlchemists
            </h2>
            <p className="text-white/80 text-sm sm:text-base font-normal leading-relaxed max-w-3xl font-display">
              When your vision outgrows the limits of vibe-coded prototypes, we step in.
              You define the idea; we build, package, and deploy the full product end-to-end.
              The result: a polished, launch-ready solution built to scale and built to earn.
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {stats.map((stat, index) => {
            const parsed = parseValue(stat.value);

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col gap-3 sm:gap-4 rounded-2xl border border-primary/20 bg-surface-dark p-4 sm:p-5 hover:border-primary/40 transition-all h-full"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-white text-base sm:text-lg font-bold font-display">
                    {parsed.hasNumber ? (
                      <>
                        {parsed.prefix}
                        <AnimatedNumber value={parsed.num} suffix={parsed.suffix} duration={2} />
                      </>
                    ) : (
                      stat.value
                    )}
                  </h2>
                  <p className="text-white/70 text-xs sm:text-sm font-normal leading-relaxed font-display">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;
