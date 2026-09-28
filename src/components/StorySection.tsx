import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, VideoOff } from "lucide-react";
import { VirtualAssistanceStory } from "@/data/virtualAssistance";
import { motion } from "framer-motion";

interface StorySectionProps {
  story: VirtualAssistanceStory;
  index: number;
}

function useIntersectionVideoPlayer(ref: React.RefObject<HTMLVideoElement>) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch((e) => console.log("Video autoplay blocked or failed:", e));
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.1 } // Start playing when 10% visible
    );

    observer.observe(video);
    return () => observer.unobserve(video);
  }, [ref]);
}

export const StorySection: React.FC<StorySectionProps> = ({ story, index }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useIntersectionVideoPlayer(videoRef);

  // Alternate sides based on index (even/odd)
  const isImageRight = index % 2 === 0;
  
  // Alternating background colors
  const isDark = index % 2 === 0;
  const sectionBgClass = isDark ? "bg-teal-900 text-mint-50" : "bg-mint-50 text-teal-900";
  const stepLabelClass = isDark ? "text-mint-50" : "text-teal-600";
  const numberBgClass = isDark ? "bg-mint-50 text-teal-900" : "bg-teal-900 text-mint-50";
  const labelClass = isDark ? "text-mint-50/70" : "text-teal-900/70";
  const titleClass = isDark ? "text-mint-50" : "text-teal-900";
  const bodyClass = isDark ? "text-mint-50/80" : "text-teal-900/80";

  const contentBlock = (
    <div className="flex flex-col justify-center space-y-6">
      <div className="space-y-2">
        <p className={`text-sm font-semibold tracking-wide uppercase font-display ${stepLabelClass}`}>
          A real assistant - one clear outcome
        </p>
        <div className="flex items-center gap-3">
          <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${numberBgClass}`}>
            0{story.step}
          </span>
          <span className={`font-medium font-display ${labelClass}`}>{story.label}</span>
        </div>
      </div>
      
      <h2 className={`text-3xl sm:text-4xl font-bold font-display ${titleClass}`}>
        {story.title}
      </h2>
      
      <div className={`space-y-4 text-lg font-display ${bodyClass}`}>
        {story.paragraphs.map((para, i) => (
          <p key={i}>
            {para.lead && <span className="font-bold font-display">{para.lead} </span>}
            {para.text}
          </p>
        ))}
      </div>
    </div>
  );

  const videoBlock = (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-teal-900/5 flex items-center justify-center">
      {story.videoSrc ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={`${story.videoSrc}#t=0.1`} type="video/mp4" />
        </video>
      ) : (
        <div className="flex flex-col items-center justify-center text-teal-900/40 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-mint-50 flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-teal-600/50" />
          </div>
          <p className="font-medium font-display text-sm">Visual pending</p>
        </div>
      )}
    </div>
  );

  return (
    <section className={`w-full py-16 sm:py-24 ${sectionBgClass}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className={`order-2 ${isImageRight ? 'lg:order-1' : 'lg:order-2'}`}>
            {contentBlock}
          </div>
          <div className={`order-1 ${isImageRight ? 'lg:order-2' : 'lg:order-1'}`}>
            {videoBlock}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
