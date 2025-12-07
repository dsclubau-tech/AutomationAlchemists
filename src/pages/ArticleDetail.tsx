/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Clock, User, Calendar, Play, ChevronLeft, ChevronRight, X, Heart, MessageCircle, ThumbsUp, Send, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Category = {
    id: string;
    name: string;
    slug: string;
    icon: string;
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
    images: string[] | null;
    author: string | null;
    read_time: string | null;
    is_featured: boolean;
    is_published: boolean;
    created_at: string;
};

type Comment = {
    id: string;
    article_id: string;
    author_name: string;
    content: string;
    likes_count: number;
    created_at: string;
    is_approved: boolean;
};

type ReactionCounts = {
    like: number;
    love: number;
    helpful: number;
};

const ArticleDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const { toast } = useToast();
    const [article, setArticle] = useState<Article | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [reactions, setReactions] = useState<ReactionCounts>({ like: 0, love: 0, helpful: 0 });
    const [userReaction, setUserReaction] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const [commentName, setCommentName] = useState('');
    const [commentContent, setCommentContent] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const fetchArticle = useCallback(async () => {
        if (!slug) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data: artData, error: artError } = await (supabase as any)
                .from('learn_articles')
                .select('*')
                .eq('slug', slug)
                .eq('is_published', true)
                .single();

            if (artError) throw artError;
            if (!artData) {
                setError('Article not found');
                return;
            }

            setArticle(artData as Article);

            if (artData.category_id) {
                const { data: catData } = await (supabase as any)
                    .from('learn_categories')
                    .select('*')
                    .eq('id', artData.category_id)
                    .single();

                if (catData) {
                    setCategory(catData as Category);
                }

                const { data: relatedData } = await (supabase as any)
                    .from('learn_articles')
                    .select('*')
                    .eq('category_id', artData.category_id)
                    .eq('is_published', true)
                    .neq('id', artData.id)
                    .limit(3);

                if (relatedData) {
                    setRelatedArticles(relatedData as Article[]);
                }
            }

            await fetchComments(artData.id);
            await fetchReactions(artData.id);
        } catch (err) {
            setError('Failed to load article');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    const fetchComments = async (articleId: string) => {
        try {
            const { data } = await (supabase as any)
                .from('article_comments')
                .select('*')
                .eq('article_id', articleId)
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            if (data) {
                setComments(data as Comment[]);
            }
        } catch (err) {
            console.error('Failed to fetch comments:', err);
        }
    };

    const fetchReactions = async (articleId: string) => {
        try {
            const { data } = await (supabase as any)
                .from('article_reaction_counts')
                .select('*')
                .eq('article_id', articleId);

            if (data) {
                const counts: ReactionCounts = { like: 0, love: 0, helpful: 0 };
                data.forEach((r: any) => {
                    if (r.reaction_type in counts) {
                        counts[r.reaction_type as keyof ReactionCounts] = r.count;
                    }
                });
                setReactions(counts);
            }
        } catch (err) {
            console.error('Failed to fetch reactions:', err);
        }
    };

    const handleReaction = async (reactionType: string) => {
        if (!article) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast({
                    title: "Sign in required",
                    description: "Please sign in to react to articles.",
                    variant: "destructive"
                });
                return;
            }

            if (userReaction === reactionType) {
                await (supabase as any)
                    .from('article_reactions')
                    .delete()
                    .eq('article_id', article.id)
                    .eq('user_id', user.id)
                    .eq('reaction_type', reactionType);

                setUserReaction(null);
                setReactions(prev => ({
                    ...prev,
                    [reactionType]: Math.max(0, prev[reactionType as keyof ReactionCounts] - 1)
                }));
            } else {
                if (userReaction) {
                    await (supabase as any)
                        .from('article_reactions')
                        .delete()
                        .eq('article_id', article.id)
                        .eq('user_id', user.id);

                    setReactions(prev => ({
                        ...prev,
                        [userReaction]: Math.max(0, prev[userReaction as keyof ReactionCounts] - 1)
                    }));
                }

                await (supabase as any)
                    .from('article_reactions')
                    .insert({
                        article_id: article.id,
                        user_id: user.id,
                        reaction_type: reactionType
                    });

                setUserReaction(reactionType);
                setReactions(prev => ({
                    ...prev,
                    [reactionType]: prev[reactionType as keyof ReactionCounts] + 1
                }));
            }
        } catch (err) {
            console.error('Failed to handle reaction:', err);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!article || !commentName.trim() || !commentContent.trim()) {
            toast({
                title: "Missing information",
                description: "Please fill in your name and comment.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmittingComment(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            await (supabase as any)
                .from('article_comments')
                .insert({
                    article_id: article.id,
                    user_id: user?.id || null,
                    author_name: commentName.trim(),
                    content: commentContent.trim(),
                    is_approved: false
                });

            toast({
                title: "Comment submitted!",
            });

            setCommentName('');
            setCommentContent('');
        } catch (err) {
            console.error('Failed to submit comment:', err);
            toast({
                title: "Failed to submit",
                description: "Please try again later.",
                variant: "destructive"
            });
        } finally {
            setIsSubmittingComment(false);
        }
    };

    useEffect(() => {
        fetchArticle();
    }, [fetchArticle]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const allImages = article?.images?.filter(img => img.trim()) || [];

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setLightboxIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = () => {
        setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    const getVideoEmbed = (url: string) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('youtu.be')
                ? url.split('/').pop()
                : new URLSearchParams(new URL(url).search).get('v');
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('vimeo.com')) {
            const videoId = url.split('/').pop();
            return `https://player.vimeo.com/video/${videoId}`;
        }
        return url;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navigation />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navigation />
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                    <h1 className="text-4xl font-bold text-gray-400">{error || 'Article not found'}</h1>
                    <Link to="/learn">
                        <Button className="bg-primary text-black hover:bg-primary/90">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Learn
                        </Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navigation />

            <section className="relative pt-24 pb-12">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

                <div className="container mx-auto max-w-5xl px-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                        <Link to="/learn" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-8 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Articles
                        </Link>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
                        <div className="flex flex-wrap items-center gap-4">
                            {category && (
                                <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-sm font-medium">
                                    {category.name}
                                </Badge>
                            )}
                            {article.is_featured && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-4 py-1.5 text-sm font-medium">
                                    Featured
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">{article.title}</h1>

                        {article.excerpt && (
                            <p className="text-xl text-gray-400 leading-relaxed max-w-3xl">{article.excerpt}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 pt-2">
                            {article.author && (
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span>{article.author}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(article.created_at)}</span>
                            </div>
                            {article.read_time && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{article.read_time}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {(article.featured_image || article.video_url) && (
                <section className="pb-12 px-6">
                    <div className="container mx-auto max-w-5xl">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="rounded-2xl overflow-hidden border border-gray-800 bg-gray-900/50">
                            {article.video_url ? (
                                <div className="relative aspect-video">
                                    {article.video_url.includes('youtube') || article.video_url.includes('vimeo') ? (
                                        <iframe src={getVideoEmbed(article.video_url)} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                    ) : (
                                        <video controls className="w-full h-full object-cover" poster={article.featured_image || undefined}>
                                            <source src={article.video_url} type="video/mp4" />
                                        </video>
                                    )}
                                </div>
                            ) : article.featured_image ? (
                                <img src={article.featured_image} alt={article.title} className="w-full aspect-video object-cover" />
                            ) : null}
                        </motion.div>
                    </div>
                </section>
            )}

            <section className="pb-12 px-6">
                <div className="container mx-auto max-w-4xl">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="prose prose-invert prose-lg max-w-none">
                        {article.content && (
                            <div
                                className="text-gray-300 leading-relaxed space-y-6"
                                dangerouslySetInnerHTML={{
                                    __html: article.content.includes('<')
                                        ? article.content
                                        : article.content.split('\n\n').map(p => `<p>${p}</p>`).join('')
                                }}
                            />
                        )}
                    </motion.div>
                </div>
            </section>

            {allImages.length > 0 && (
                <section className="pb-12 px-6">
                    <div className="container mx-auto max-w-5xl">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
                            <h2 className="text-2xl font-bold mb-8 text-white">Gallery</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {allImages.map((img, index) => (
                                    <motion.div key={index} whileHover={{ scale: 1.02 }} className="relative aspect-video rounded-xl overflow-hidden cursor-pointer border border-gray-800 bg-gray-900/50 group" onClick={() => openLightbox(index)}>
                                        <img src={img} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    <Play className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>
            )}

            <section className="pb-12 px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Did you find this helpful?</h3>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                onClick={() => handleReaction('like')}
                                className={`flex items-center gap-2 ${userReaction === 'like' ? 'bg-primary/20 border-primary text-primary' : 'border-gray-700 text-gray-400 hover:border-primary hover:text-primary'}`}
                            >
                                <ThumbsUp className="w-4 h-4" />
                                Like ({reactions.like})
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleReaction('love')}
                                className={`flex items-center gap-2 ${userReaction === 'love' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-400'}`}
                            >
                                <Heart className="w-4 h-4" />
                                Love ({reactions.love})
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleReaction('helpful')}
                                className={`flex items-center gap-2 ${userReaction === 'helpful' ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-gray-700 text-gray-400 hover:border-green-500 hover:text-green-400'}`}
                            >
                                <MessageCircle className="w-4 h-4" />
                                Helpful ({reactions.helpful})
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="pb-12 px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Comments ({comments.length})
                        </h3>

                        <form onSubmit={handleSubmitComment} className="mb-8 space-y-4">
                            <Input
                                placeholder="Your name"
                                value={commentName}
                                onChange={(e) => setCommentName(e.target.value)}
                                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                            />
                            <Textarea
                                placeholder="Write a comment..."
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                rows={3}
                                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 resize-none"
                            />
                            <Button type="submit" disabled={isSubmittingComment} className="bg-primary text-black hover:bg-primary/90">
                                {isSubmittingComment ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )}
                                Submit Comment
                            </Button>
                        </form>

                        <div className="space-y-4">
                            {comments.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="bg-gray-800/30 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-white">{comment.author_name}</span>
                                            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                                        </div>
                                        <p className="text-gray-300">{comment.content}</p>
                                        {comment.likes_count > 0 && (
                                            <div className="mt-2 flex items-center gap-1 text-gray-500 text-sm">
                                                <ThumbsUp className="w-3 h-3" />
                                                {comment.likes_count}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {relatedArticles.length > 0 && (
                <section className="pb-12 px-6">
                    <div className="container mx-auto max-w-5xl">
                        <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {relatedArticles.map((relArticle) => (
                                <Link key={relArticle.id} to={`/learn/${relArticle.slug}`} className="block group">
                                    <Card className="bg-gray-900/90 border-gray-700/50 rounded-xl overflow-hidden hover:border-primary/60 transition-all h-full">
                                        <div className="aspect-video overflow-hidden bg-gray-800">
                                            {relArticle.featured_image ? (
                                                <img src={relArticle.featured_image} alt={relArticle.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                                    <div className="text-4xl font-bold text-primary/30">AA</div>
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-5">
                                            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{relArticle.title}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-2">{relArticle.excerpt}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Explore More Articles</h3>
                            <p className="text-gray-400">Discover more insights and strategies in our learning center.</p>
                        </div>
                        <Link to="/learn">
                            <Button className="bg-primary text-black hover:bg-primary/90 px-8 py-6 text-lg font-semibold">
                                View All Articles
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {lightboxOpen && allImages.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
                        <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10" onClick={closeLightbox}>
                            <X className="w-8 h-8" />
                        </button>

                        {allImages.length > 1 && (
                            <>
                                <button className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 p-2" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                                    <ChevronLeft className="w-10 h-10" />
                                </button>
                                <button className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 p-2" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                                    <ChevronRight className="w-10 h-10" />
                                </button>
                            </>
                        )}

                        <motion.img key={lightboxIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} src={allImages[lightboxIndex]} alt={`Gallery image ${lightboxIndex + 1}`} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                            {lightboxIndex + 1} / {allImages.length}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
};

export default ArticleDetail;
