import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Loader2, Code, Cloud, Smartphone, Bot, Database, Palette, Globe, Cpu, Zap, Shield, Play } from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Code, Cloud, Smartphone, Bot, Database, Palette, Globe, Cpu, Zap, Shield,
};

interface Service {
    id: string;
    title: string;
    slug: string | null;
    description: string;
    detailed_content: string | null;
    short_description: string | null;
    features: string[] | null;
    icon: string;
    color_gradient: string | null;
    images: string[] | null;
    video_url: string | null;
}

const ServiceDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [service, setService] = useState<Service | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showVideo, setShowVideo] = useState(false);

    useEffect(() => {
        const fetchService = async () => {
            if (!slug) return;

            try {
                // Try to find by slug first, then by id
                let { data, error } = await supabase
                    .from('services')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error || !data) {
                    // Try by id
                    const result = await supabase
                        .from('services')
                        .select('*')
                        .eq('id', slug)
                        .single();
                    data = result.data;
                    error = result.error;
                }

                if (error) throw error;
                setService(data as unknown as Service);
            } catch (error) {
                console.error('Error fetching service:', error);
                navigate('/services');
            } finally {
                setIsLoading(false);
            }
        };

        fetchService();
    }, [slug, navigate]);

    const getIcon = (iconName: string) => {
        return iconMap[iconName] || Code;
    };

    // Convert YouTube URL to embed URL
    const getEmbedUrl = (url: string) => {
        if (url.includes('youtube.com/watch')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            return `https://player.vimeo.com/video/${videoId}`;
        }
        return url;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center gap-4">
                <p className="text-text-muted">Service not found</p>
                <Link to="/services">
                    <Button variant="outline" className="border-primary/30 text-primary">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Services
                    </Button>
                </Link>
            </div>
        );
    }

    const IconComponent = getIcon(service.icon);
    const features = service.features || [];
    const images = service.images || [];

    return (
        <div className="min-h-screen bg-background-dark text-text-main overflow-x-hidden">
            <Navigation />

            {/* Fractal Corner Frames */}
            <div className="pointer-events-none absolute top-0 left-0 h-32 w-32 md:h-48 md:w-48" style={{ background: 'radial-gradient(circle at top left, rgba(212,175,55,0.2) 0%, transparent 50%)' }}></div>
            <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 md:h-48 md:w-48" style={{ background: 'radial-gradient(circle at bottom right, rgba(212,175,55,0.15) 0%, transparent 50%)' }}></div>

            <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-8 sm:gap-12 pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6 pb-12">
                {/* Back Button */}
                <Link to="/services" className="inline-flex items-center text-text-muted hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Services
                </Link>

                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col gap-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-2xl border border-primary/30">
                            <IconComponent className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">Service</Badge>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main font-display">
                                {service.title}
                            </h1>
                        </div>
                    </div>

                    <p className="text-lg sm:text-xl text-text-muted leading-relaxed font-display max-w-3xl">
                        {service.short_description || service.description}
                    </p>
                </motion.section>

                {/* Video Section */}
                {service.video_url && (
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="w-full"
                    >
                        {showVideo ? (
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-primary/30">
                                <iframe
                                    src={getEmbedUrl(service.video_url)}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowVideo(true)}
                                className="relative w-full aspect-video rounded-2xl overflow-hidden border border-primary/30 bg-surface-dark group cursor-pointer"
                            >
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/40 transition-colors">
                                    <div className="w-20 h-20 flex items-center justify-center bg-primary rounded-full group-hover:scale-110 transition-transform">
                                        <Play className="w-8 h-8 text-background-dark ml-1" />
                                    </div>
                                </div>
                                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-text-main font-display text-sm">
                                    Watch Overview Video
                                </p>
                            </button>
                        )}
                    </motion.section>
                )}

                {/* Features Section */}
                {features.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-surface-dark/50 border border-primary/20 rounded-2xl p-6 sm:p-8"
                    >
                        <h2 className="text-2xl font-bold text-text-main font-display mb-6">Key Features</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-3 text-text-muted font-display">
                                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Detailed Content Section */}
                {service.detailed_content && (
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="prose prose-invert prose-primary max-w-none"
                    >
                        <h2 className="text-2xl font-bold text-text-main font-display mb-6">About This Service</h2>
                        <div
                            className="text-text-muted leading-relaxed font-display whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: service.detailed_content.replace(/\n/g, '<br />') }}
                        />
                    </motion.section>
                )}

                {/* Full Description if no detailed content */}
                {!service.detailed_content && (
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <h2 className="text-2xl font-bold text-text-main font-display mb-6">About This Service</h2>
                        <p className="text-text-muted leading-relaxed font-display whitespace-pre-wrap">
                            {service.description}
                        </p>
                    </motion.section>
                )}

                {/* Image Gallery */}
                {images.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <h2 className="text-2xl font-bold text-text-main font-display mb-6">Gallery</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((image, index) => (
                                <div key={index} className="aspect-video rounded-xl overflow-hidden border border-primary/20">
                                    <img
                                        src={image}
                                        alt={`${service.title} - Image ${index + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* CTA Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="bg-surface-dark/50 border border-primary/20 rounded-2xl p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div>
                        <h3 className="text-2xl font-bold text-text-main font-display">Ready to Get Started?</h3>
                        <p className="text-text-muted mt-1 font-display">Let's discuss how we can help with your {service.title.toLowerCase()} needs.</p>
                    </div>
                    <Link to="/contact">
                        <Button className="bg-primary text-background-dark hover:brightness-110 transition-all font-display h-12 px-8">
                            Contact Us
                        </Button>
                    </Link>
                </motion.section>

                <Footer />
            </div>
        </div>
    );
};

export default ServiceDetail;
