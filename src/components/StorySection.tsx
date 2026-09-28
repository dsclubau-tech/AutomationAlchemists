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

  const contentBlock = (
    <div className="flex flex-col justify-center space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-teal-600 tracking-wide uppercase font-display">
          A real assistant - one clear outcome
        </p>
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-mint-50 text-teal-900 font-bold text-sm">
            0{story.step}
          </span>
          <span className="text-teal-900/70 font-medium font-display">{story.label}</span>
        </div>
      </div>
      
      <h2 className="text-3xl sm:text-4xl font-bold text-teal-900 font-display">
        {story.title}
      </h2>
      
      <div className="space-y-4 text-lg text-teal-900/80 font-display">
        {story.paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="pt-2">
        <Link 
          to={story.ctaHref || "/contact"} 
          className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-sm"
        >
          More details <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );

  const videoBlock = (
    <div className="relative w-full aspect-video sm:aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-lg bg-teal-900/5 flex items-center justify-center">
      {story.videoSrc ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
          poster={story.posterSrc}
          // Accept multiple sources if provided (e.g. video.mp4, video.webm). For now we assume videoSrc is a string pointing to an mp4 or webm.
        >
          {story.videoSrc.endsWith('.webm') && <source src={story.videoSrc} type="video/webm" />}
          <source src={story.videoSrc.replace('.webm', '.mp4')} type="video/mp4" />
          {/* Fallback poster will show if video formats aren't supported */}
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
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Mobile: Always stacked with text first (or video first). Let's do text first, then video on mobile.
              Desktop: Alternate based on isImageRight */}
          <div className={`order-2 ${isImageRight ? 'lg:order-1' : 'lg:order-2'}`}>
            {isImageRight ? contentBlock : videoBlock}
          </div>
          <div className={`order-1 ${isImageRight ? 'lg:order-2' : 'lg:order-1'}`}>
            {isImageRight ? videoBlock : contentBlock}
          </div>
        </div>
      </div>
    </motion.section>
  );
};
