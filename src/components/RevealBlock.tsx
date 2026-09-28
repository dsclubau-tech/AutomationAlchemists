import React, { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

declare global {
  interface Window { __PRERENDER__?: boolean; }
}

export function useSafeAnimation() {
  const prefersReducedMotion = useReducedMotion();
  const isPrerender = typeof window !== "undefined" && window.__PRERENDER__ === true;
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

  const initial = shouldSkip ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 };
  const animate = { opacity: 1, y: 0 };
  const transition = { duration: 0.6, delay: shouldSkip ? 0 : delay, ease: [0.22, 1, 0.36, 1] };

  if (animateOnLoad) {
    return (
      <motion.div
        ref={ref}
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
      ref={ref}
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
