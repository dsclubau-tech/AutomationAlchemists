import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Video, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
// Define type based on database schema
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
};

const Learn = () => {
  const [contents, setContents] = useState<EducationalContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContents();
  }, []);

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

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'animation':
        return <Sparkles className="w-5 h-5" />;
      case 'text':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'animation':
        return 'Animation';
      case 'text':
        return 'Article';
      default:
        return 'Content';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Learn About Our Services
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore our comprehensive guides, videos, and concepts to understand how we can help transform your business.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : contents.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <p className="text-muted-foreground text-lg">
                  No content available yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {contents.map((content, index) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-primary">
                              {getContentIcon(content.content_type)}
                            </div>
                            <Badge variant="secondary">
                              {getContentTypeLabel(content.content_type)}
                            </Badge>
                          </div>
                          <CardTitle className="text-2xl mb-2">{content.title}</CardTitle>
                          {content.description && (
                            <CardDescription className="text-base">
                              {content.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {content.content_type === 'video' && content.video_url && (
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                          <video
                            controls
                            className="w-full h-full"
                            src={content.video_url}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      
                      {content.content_type === 'animation' && content.video_url && (
                        <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          <img
                            src={content.video_url}
                            alt={content.title}
                            className="max-w-full h-auto"
                          />
                        </div>
                      )}
                      
                      {content.content_type === 'text' && content.content_text && (
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                            {content.content_text}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Learn;