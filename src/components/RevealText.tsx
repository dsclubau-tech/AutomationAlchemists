import React, { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSafeAnimation } from "./RevealBlock";

interface RevealTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateOnLoad?: boolean;
}

export const RevealText: React.FC<RevealTextProps> = ({ text, delay = 0, className = "", animateOnLoad = false }) => {
  const skipAnimation = useSafeAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const [forceVisible, setForceVisible] = useState(false);

  useLayoutEffect(() => {
    if (typeof document !== "undefined" && document.documentElement.hasAttribute("data-prerendered")) {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setForceVisible(true);
        }
      }
    }
  }, []);

  const shouldSkip = skipAnimation || forceVisible;
  const words = text.split(" ");

  const container = {
    hidden: { opacity: shouldSkip ? 1 : 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldSkip ? 0 : 0.05,
        delayChildren: shouldSkip ? 0 : delay,
      }
    }
  };

  const child = {
    hidden: { y: shouldSkip ? 0 : "100%" },
    show: { 
      y: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } 
    }
  };

  const MotionTag = animateOnLoad ? motion.div : motion.div;

  return (
    <MotionTag
      ref={ref}
      className={className}
      variants={container}
      initial="hidden"
      animate={animateOnLoad ? "show" : undefined}
      whileInView={!animateOnLoad ? "show" : undefined}
      viewport={!animateOnLoad ? { once: true, margin: "-20%" } : undefined}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span 
          key={i} 
          className="inline-block overflow-hidden pb-2 -mb-2 mr-[0.25em] last:mr-0 align-bottom"
          aria-hidden="true"
        >
          <motion.span 
            className="inline-block" 
            variants={child}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
};
