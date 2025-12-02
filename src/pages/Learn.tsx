import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { analytics } from '@/utils/analytics';
import { usePerformance } from '@/hooks/usePerformance';
import { HoverVideoPlayer } from '@/components/ui/hover-video-player';
import vaVideo from '@/assets/learn/VA.mp4';
import robot1 from '@/assets/learn/robot1.png';
import robot2 from '@/assets/learn/robot2.png';

type EducationalContent = {
  id: string;
  title: string;
  description: string | null;
  content_type: 'text' | 'video' | 'animation';
  content_text: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  display_order: number | null;
  published: boolean | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  category?: string | null;
};

const Learn = () => {
  const [contents, setContents] = useState<EducationalContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  usePerformance('Learn');

  useEffect(() => {
    analytics.trackPageView('/learn');
    fetchContents();
  }, []);

  // Geometric Hover Lock: Track global mouse position to handle closing
  useEffect(() => {
    if (!isVideoHovered) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Calculate the "safe zone" based on viewport dimensions
      // Video is 65vw wide, 36.5625vw high, centered
      const vw = window.innerWidth;
      const vh = window.innerHeight; // Use innerHeight for vertical centering check

      const videoWidth = vw * 0.65;
      const videoHeight = vw * 0.365625; // Aspect ratio based on width

      const centerX = vw / 2;
      const centerY = window.innerHeight / 2; // Fixed center is viewport center

      const halfWidth = videoWidth / 2;
      const halfHeight = videoHeight / 2;

      // Add a small buffer (e.g., 20px) to prevent accidental closing at edges
      const buffer = 20;

      const minX = centerX - halfWidth - buffer;
      const maxX = centerX + halfWidth + buffer;
      const minY = centerY - halfHeight - buffer;
      const maxY = centerY + halfHeight + buffer;

      const isInside =
        e.clientX >= minX &&
        e.clientX <= maxX &&
        e.clientY >= minY &&
        e.clientY <= maxY;

      if (!isInside) {
        // Mouse is outside the geometric safe zone -> Close video
        // We can use a small debounce here too if desired, but immediate is usually better for "feeling" the edge
        setIsVideoHovered(false);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isVideoHovered]);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setIsVideoHovered(true);
  };

  // We don't need handleMouseLeave anymore because the global listener handles closing
  // But we keep it as a fallback for the non-expanded state
  const handleMouseLeave = () => {
    if (!isVideoHovered) {
      // If not expanded yet (e.g. just entering/leaving quickly), standard behavior
      setIsVideoHovered(false);
    }
    // If expanded, do nothing here. Global listener takes over.
  };

  const fetchContents = async () => {
    const { data, error } = await supabase
      .from('educational_content')
      .select('*')
      .eq('published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setContents(data as EducationalContent[]);
    }
    setIsLoading(false);
  };

  const filters = ['All', 'Whitepapers', 'Industry Analysis', 'Case Studies', 'Webinars'];

  const filteredContents = activeFilter === 'All'
    ? contents
    : contents.filter(content => {
      if (activeFilter === 'Whitepapers') return content.content_type === 'text';
      if (activeFilter === 'Webinars') return content.content_type === 'video';
      if (activeFilter === 'Case Studies') return content.content_type === 'animation';
      return true;
    });

  const regularContents = filteredContents;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <img src={robot1} alt="" className="absolute left-8 top-32 w-24 h-24 opacity-5 pointer-events-none rotate-12 hidden lg:block" />
      <img src={robot2} alt="" className="absolute left-12 top-96 w-32 h-32 opacity-5 pointer-events-none -rotate-6 hidden lg:block" />
      <img src={robot1} alt="" className="absolute left-6 bottom-64 w-28 h-28 opacity-5 pointer-events-none rotate-[-15deg] hidden lg:block" />
      <img src={robot2} alt="" className="absolute left-10 bottom-32 w-24 h-24 opacity-5 pointer-events-none rotate-6 hidden lg:block" />
      <img src={robot2} alt="" className="absolute right-8 top-40 w-28 h-28 opacity-5 pointer-events-none -rotate-12 hidden lg:block" />
      <img src={robot1} alt="" className="absolute right-12 top-[500px] w-24 h-24 opacity-5 pointer-events-none rotate-6 hidden lg:block" />
      <img src={robot2} alt="" className="absolute right-6 bottom-80 w-32 h-32 opacity-5 pointer-events-none rotate-[-8deg] hidden lg:block" />
      <img src={robot1} alt="" className="absolute right-10 bottom-40 w-26 h-26 opacity-5 pointer-events-none -rotate-6 hidden lg:block" />

      {/* Backdrop overlay - placed early in DOM so video can be on top */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVideoHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-none"
        style={{
          zIndex: isVideoHovered ? 105 : -1
        }}
      />

      <Navigation />

      <section className="relative pt-32 pb-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Quantum Insights</h1>
            <p className="text-lg text-gray-400 max-w-3xl mb-8">
              Explore our library of research, analysis, and success stories. Delve into the quantum realm of automation and discover the future of industry.
            </p>
            <div className="flex flex-wrap gap-3 mb-12">
              {filters.map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? 'default' : 'outline'}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-lg px-6 py-2 transition-all ${activeFilter === filter ? 'bg-primary text-black border-primary shadow-lg' : 'bg-transparent text-white border-gray-700 hover:border-primary hover:text-primary'}`}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="space-y-12">
            {/* Replaced motion.div with standard div to prevent transform context issue with fixed positioning */}
            <div style={{ position: 'relative', zIndex: isVideoHovered ? 120 : 1 }}>
              <Card className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-gray-700/50 rounded-2xl overflow-visible group hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  {/* Wrapper to preserve layout space when video becomes fixed */}
                  <div className="w-96 h-72 relative z-10">
                    <motion.div
                      animate={isVideoHovered ? "expanded" : "collapsed"}
                      style={{ zIndex: isVideoHovered ? 110 : 1 }}
                      variants={{
                        collapsed: {
                          width: "24rem",
                          height: "18rem",
                          position: "relative" as const,
                          left: 0,
                          top: 0,
                          x: 0,
                          y: 0
                        },
                        expanded: {
                          width: "65vw",
                          height: "36.5625vw",
                          position: "fixed" as const,
                          left: "50%",
                          top: "50%",
                          x: "-50%",
                          y: "-50%"
                        }
                      }}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                      className="rounded-xl overflow-hidden bg-gray-800 shadow-2xl"
                    >
                      <HoverVideoPlayer videoSrc={vaVideo} enableControls={true} className="rounded-xl" />
                    </motion.div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="inline-block mb-4">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">Latest Report</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-5 group-hover:text-primary transition-colors leading-tight">Featured: Virtual Assistant Automation</h2>
                    <p className="text-gray-300 mb-6 leading-relaxed text-base">
                      Discover how quantum-inspired algorithms are redefining efficiency and providing unprecedented insights into complex business processes.
                    </p>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-sm text-gray-400 capitalize font-medium">Webinar</span>
                    </div>
                    <Button className="mt-2 bg-primary text-black hover:bg-primary/90 w-fit group/btn rounded-lg px-6 py-6 font-semibold shadow-lg hover:shadow-xl transition-all">
                      Access Now
                      <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {regularContents.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <div className="h-px w-12 bg-primary"></div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : regularContents.length === 0 ? (
              <Card className="bg-gray-900/90 border-gray-700/50 rounded-xl">
                <CardContent className="py-20 text-center">
                  <p className="text-gray-400 text-lg">No additional content available yet. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularContents.map((content, index) => (
                  <motion.div key={content.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                    <Card className="bg-gray-900/90 backdrop-blur-sm border-gray-700/50 rounded-xl overflow-hidden group hover:border-primary/60 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col">
                      <div className="relative aspect-video overflow-hidden bg-gray-800">
                        {content.content_type === 'video' && content.video_url ? (
                          <div className="relative w-full h-full">
                            <video className="w-full h-full object-cover" poster={content.thumbnail_url || undefined}>
                              <source src={content.video_url} type="video/mp4" />
                            </video>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors cursor-pointer">
                              <div className="w-14 h-14 rounded-full bg-primary/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-7 h-7 text-black ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                          </div>
                        ) : content.thumbnail_url ? (
                          <img src={content.thumbnail_url} alt={content.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <div className="text-5xl font-bold text-primary/30">AA</div>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-7 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{content.title}</h3>
                        <p className="text-gray-300 text-sm mb-5 flex-1 line-clamp-3 leading-relaxed">
                          {content.description || 'Exploring the synergies between machine learning and supply chain management.'}
                        </p>
                        <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto font-semibold group/link justify-start">
                          Read More
                          <ArrowRight className="ml-2 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Learn;