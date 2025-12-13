/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Play, ArrowRight, Brain, Zap, DollarSign, ShoppingCart, FileText, BookOpen, LayoutGrid, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analytics } from '@/utils/analytics';
import { usePerformance } from '@/hooks/usePerformance';
import { HoverVideoPlayer, MiniPlayer, ExpandedPlayer } from '@/components/ui/hover-video-player';
import vaVideo from '@/assets/learn/VA.mp4';
import robot1 from '@/assets/learn/robot1.png';
import robot2 from '@/assets/learn/robot2.png';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  is_active: boolean;
  display_order: number | null;
};

type Article = {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  video_url: string | null;
  author: string | null;
  read_time: string | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid, Brain, Zap, DollarSign, ShoppingCart, FileText, BookOpen,
};

const Learn = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const [miniPlayerOpen, setMiniPlayerOpen] = useState(false);
  const [expandedPlayerOpen, setExpandedPlayerOpen] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string | null>(null);

  usePerformance('Learn');

  useEffect(() => {
    analytics.trackPageView('/learn');
    fetchData();
  }, []);

  const allFeaturedArticles = articles.filter(a => a.is_featured);

  useEffect(() => {
    if (activeFilter !== 'all' || allFeaturedArticles.length <= 1) return;
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % allFeaturedArticles.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeFilter, allFeaturedArticles.length]);

  useEffect(() => {
    setFeaturedIndex(0);
  }, [activeFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedPlayerOpen) {
          setExpandedPlayerOpen(false);
        } else if (miniPlayerOpen) {
          setMiniPlayerOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedPlayerOpen, miniPlayerOpen]);

  const handleOpenMiniPlayer = (videoSrc: string) => {
    setCurrentVideoSrc(videoSrc);
    setMiniPlayerOpen(true);
  };

  const handleCloseMiniPlayer = () => {
    setMiniPlayerOpen(false);
    setCurrentVideoSrc(null);
  };

  const handleExpandFromMini = () => {
    setMiniPlayerOpen(false);
    setExpandedPlayerOpen(true);
  };

  const handleCloseExpanded = () => {
    setExpandedPlayerOpen(false);
    setCurrentVideoSrc(null);
  };

  const fetchData = async () => {
    setIsLoading(true);
    const { data: catData } = await (supabase as any)
      .from('learn_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (catData) {
      setCategories(catData as Category[]);
    }
    const { data: artData } = await (supabase as any)
      .from('learn_articles')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true });
    if (artData) {
      setArticles(artData as Article[]);
    }
    setIsLoading(false);
  };

  const categoryFiltered = activeFilter === 'all'
    ? articles
    : articles.filter(article => {
      const category = categories.find(c => c.id === article.category_id);
      return category?.slug === activeFilter;
    });

  const filteredArticles = searchQuery.trim()
    ? categoryFiltered.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : categoryFiltered;

  const getCurrentFeaturedArticle = (): Article | null => {
    if (activeFilter === 'all') {
      if (allFeaturedArticles.length > 0) {
        return allFeaturedArticles[featuredIndex % allFeaturedArticles.length];
      }
      return null;
    } else {
      const categoryId = categories.find(c => c.slug === activeFilter)?.id;
      return articles.find(a => a.is_featured && a.category_id === categoryId) || null;
    }
  };

  const featuredArticle = getCurrentFeaturedArticle();

  const goToPrevFeatured = () => {
    setFeaturedIndex(prev => prev === 0 ? allFeaturedArticles.length - 1 : prev - 1);
  };

  const goToNextFeatured = () => {
    setFeaturedIndex(prev => (prev + 1) % allFeaturedArticles.length);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || LayoutGrid;
    return <IconComponent className="w-4 h-4" />;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <SEOHead
        title="Learn"
        description="Explore our library of research, analysis, and success stories. Master automation, AI, and passive income strategies."
        keywords="automation tutorials, AI guides, passive income, case studies, e-commerce automation"
      />
      <img src={robot1} alt="" className="absolute left-8 top-32 w-24 h-24 opacity-5 pointer-events-none rotate-12 hidden lg:block" />
      <img src={robot2} alt="" className="absolute left-12 top-96 w-32 h-32 opacity-5 pointer-events-none -rotate-6 hidden lg:block" />
      <img src={robot1} alt="" className="absolute left-6 bottom-64 w-28 h-28 opacity-5 pointer-events-none rotate-[-15deg] hidden lg:block" />
      <img src={robot2} alt="" className="absolute left-10 bottom-32 w-24 h-24 opacity-5 pointer-events-none rotate-6 hidden lg:block" />
      <img src={robot2} alt="" className="absolute right-8 top-40 w-28 h-28 opacity-5 pointer-events-none -rotate-12 hidden lg:block" />
      <img src={robot1} alt="" className="absolute right-12 top-[500px] w-24 h-24 opacity-5 pointer-events-none rotate-6 hidden lg:block" />
      <img src={robot2} alt="" className="absolute right-6 bottom-80 w-32 h-32 opacity-5 pointer-events-none rotate-[-8deg] hidden lg:block" />
      <img src={robot1} alt="" className="absolute right-10 bottom-40 w-26 h-26 opacity-5 pointer-events-none -rotate-6 hidden lg:block" />

      <AnimatePresence>
        {miniPlayerOpen && currentVideoSrc && (
          <MiniPlayer
            videoSrc={currentVideoSrc}
            isOpen={miniPlayerOpen}
            onClose={handleCloseMiniPlayer}
            onExpand={handleExpandFromMini}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandedPlayerOpen && currentVideoSrc && (
          <ExpandedPlayer
            videoSrc={currentVideoSrc}
            isOpen={expandedPlayerOpen}
            onClose={handleCloseExpanded}
          />
        )}
      </AnimatePresence>

      <Navigation />

      <section className="relative pt-32 pb-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Quantum Insights</h1>
            <p className="text-lg text-gray-400 max-w-3xl mb-8">
              Explore our library of research, analysis, and success stories.
            </p>

            <div className="relative max-w-md mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-10 py-6 bg-gray-900/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mb-12">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeFilter === category.slug ? 'default' : 'outline'}
                  onClick={() => setActiveFilter(category.slug)}
                  className={`rounded-lg px-6 py-2 transition-all flex items-center gap-2 ${activeFilter === category.slug ? 'bg-primary text-black border-primary shadow-lg' : 'bg-transparent text-white border-gray-700 hover:border-primary hover:text-primary'}`}
                >
                  {getIcon(category.icon)}
                  {category.name}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="space-y-12">
            {featuredArticle && !searchQuery && (
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={featuredArticle.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-gray-700/50 rounded-2xl overflow-hidden group hover:border-primary/60 transition-all duration-300">
                      <div className="grid md:grid-cols-2 gap-8 p-8">
                        <div className="relative w-full h-48 md:h-72">
                          {featuredArticle.video_url ? (
                            <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-800">
                              <HoverVideoPlayer
                                videoSrc={featuredArticle.video_url || vaVideo}
                                className="rounded-xl"
                                onMiniPlayer={() => handleOpenMiniPlayer(featuredArticle.video_url || vaVideo)}
                              />
                            </div>
                          ) : featuredArticle.featured_image ? (
                            <img src={featuredArticle.featured_image} alt={featuredArticle.title} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                              <div className="text-5xl font-bold text-primary/30">AA</div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full w-fit mb-4">Featured</span>
                          <h2 className="text-3xl md:text-4xl font-bold mb-5 group-hover:text-primary transition-colors">{featuredArticle.title}</h2>
                          <p className="text-gray-300 mb-6">{featuredArticle.excerpt}</p>
                          <div className="flex items-center gap-3 mb-6">
                            <span className="text-sm text-gray-400">{getCategoryName(featuredArticle.category_id)}</span>
                            {featuredArticle.read_time && <span className="text-sm text-gray-500">• {featuredArticle.read_time}</span>}
                          </div>
                          <Link to={`/learn/${featuredArticle.slug}`}>
                            <Button className="bg-primary text-black hover:bg-primary/90 w-fit px-6 py-6 font-semibold">
                              Read Article
                              <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </AnimatePresence>

                {activeFilter === 'all' && allFeaturedArticles.length > 1 && (
                  <>
                    <button onClick={goToPrevFeatured} className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-gray-900/90 hover:bg-primary text-white hover:text-black rounded-full flex items-center justify-center transition-all z-10">
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={goToNextFeatured} className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-gray-900/90 hover:bg-primary text-white hover:text-black rounded-full flex items-center justify-center transition-all z-10">
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <div className="flex justify-center gap-2 mt-4">
                      {allFeaturedArticles.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFeaturedIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${idx === featuredIndex ? 'bg-primary w-6' : 'bg-gray-600 hover:bg-gray-500'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {!featuredArticle && !searchQuery && (
              <Card className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-gray-700/50 rounded-2xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div className="relative w-full h-48 md:h-72 rounded-xl overflow-hidden bg-gray-800">
                    <HoverVideoPlayer videoSrc={vaVideo} className="rounded-xl" onMiniPlayer={() => handleOpenMiniPlayer(vaVideo)} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full w-fit mb-4">Latest</span>
                    <h2 className="text-3xl md:text-4xl font-bold mb-5">Virtual Assistant Automation</h2>
                    <p className="text-gray-300 mb-6">Discover how automation is redefining efficiency in business processes.</p>
                    <Link to="/contact">
                      <Button className="bg-primary text-black hover:bg-primary/90 w-fit px-6 py-6 font-semibold">
                        Access Now <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}

            {searchQuery && (
              <div className="text-gray-400">
                Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} for "{searchQuery}"
              </div>
            )}

            {filteredArticles.length > 0 && !searchQuery && (
              <div className="flex items-center justify-center py-4">
                <div className="h-px w-12 bg-primary"></div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredArticles.filter(a => !a.is_featured || searchQuery).length === 0 ? (
              <Card className="bg-gray-900/90 border-gray-700/50 rounded-xl">
                <CardContent className="py-20 text-center">
                  <p className="text-gray-400 text-lg">
                    {searchQuery ? 'No articles match your search.' : 'No additional content available yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.filter(a => !a.is_featured || searchQuery).map((article, index) => (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                    <Link to={`/learn/${article.slug}`} className="block h-full">
                      <Card className="bg-gray-900/90 border-gray-700/50 rounded-xl overflow-hidden group hover:border-primary/60 transition-all h-full flex flex-col">
                        <div className="relative aspect-video overflow-hidden bg-gray-800">
                          {article.video_url ? (
                            <div className="relative w-full h-full">
                              <img src={article.featured_image || ''} alt={article.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <div className="w-14 h-14 rounded-full bg-primary/95 flex items-center justify-center">
                                  <Play className="w-7 h-7 text-black ml-0.5" fill="currentColor" />
                                </div>
                              </div>
                            </div>
                          ) : article.featured_image ? (
                            <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                              <div className="text-5xl font-bold text-primary/30">AA</div>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-7 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-primary font-medium">{getCategoryName(article.category_id)}</span>
                            {article.read_time && <span className="text-xs text-gray-500">• {article.read_time}</span>}
                          </div>
                          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                          <p className="text-gray-300 text-sm mb-5 flex-1 line-clamp-3">{article.excerpt || 'Discover insights and strategies.'}</p>
                          <div className="text-primary font-semibold flex items-center">
                            Read More <ArrowRight className="ml-2 w-4 h-4" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
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