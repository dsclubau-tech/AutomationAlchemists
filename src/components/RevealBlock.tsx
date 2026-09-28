import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export function useSafeAnimation() {
  const prefersReducedMotion = useReducedMotion();
  const isPrerender = typeof navigator !== "undefined" && /HeadlessChrome/.test(navigator.userAgent);
  return prefersReducedMotion || isPrerender;
}

interface RevealBlockProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  animateOnLoad?: boolean;
}

export const RevealBlock: React.FC<RevealBlockProps> = ({ children, delay = 0, className = "", animateOnLoad = false }) => {
  const skipAnimation = useSafeAnimation();

  const initial = skipAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 };
  const animate = { opacity: 1, y: 0 };
  const transition = { duration: 0.6, delay: skipAnimation ? 0 : delay, ease: [0.22, 1, 0.36, 1] };

  if (animateOnLoad) {
    return (
      <motion.div
        initial={initial}
        animate={animate}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: "-20%" }}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};
