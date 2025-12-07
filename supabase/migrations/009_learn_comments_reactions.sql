-- Migration: Learn Comments and Reactions System
-- Creates tables for article comments and reactions (likes)

-- ============================================
-- ARTICLE REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.article_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.learn_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL DEFAULT 'like', -- like, love, helpful, insightful
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, user_id, reaction_type)
);

-- ============================================
-- ARTICLE COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.learn_articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMMENT LIKES TABLE (for tracking who liked a comment)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.article_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_ip TEXT, -- For anonymous like tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id),
    UNIQUE(comment_id, user_ip)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_article_reactions_article ON public.article_reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_reactions_user ON public.article_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_article ON public.article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_parent ON public.article_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_approved ON public.article_comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes(comment_id);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - ARTICLE REACTIONS
-- ============================================
DROP POLICY IF EXISTS "Allow users to view all reactions" ON public.article_reactions;
CREATE POLICY "Allow users to view all reactions" ON public.article_reactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to add reactions" ON public.article_reactions;
CREATE POLICY "Allow authenticated users to add reactions" ON public.article_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own reactions" ON public.article_reactions;
CREATE POLICY "Allow users to delete own reactions" ON public.article_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - ARTICLE COMMENTS
-- ============================================
DROP POLICY IF EXISTS "Allow public to view approved comments" ON public.article_comments;
CREATE POLICY "Allow public to view approved comments" ON public.article_comments
    FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Allow anyone to submit comments" ON public.article_comments;
CREATE POLICY "Allow anyone to submit comments" ON public.article_comments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to edit own comments" ON public.article_comments;
CREATE POLICY "Allow users to edit own comments" ON public.article_comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access to comments" ON public.article_comments;
CREATE POLICY "Allow admin full access to comments" ON public.article_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- RLS POLICIES - COMMENT LIKES
-- ============================================
DROP POLICY IF EXISTS "Allow anyone to view comment likes" ON public.comment_likes;
CREATE POLICY "Allow anyone to view comment likes" ON public.comment_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anyone to like comments" ON public.comment_likes;
CREATE POLICY "Allow anyone to like comments" ON public.comment_likes
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to unlike own likes" ON public.comment_likes;
CREATE POLICY "Allow users to unlike own likes" ON public.comment_likes
    FOR DELETE USING (auth.uid() = user_id OR user_ip IS NOT NULL);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_article_comments_updated_at ON public.article_comments;
CREATE TRIGGER update_article_comments_updated_at
    BEFORE UPDATE ON public.article_comments
    FOR EACH ROW EXECUTE FUNCTION update_learn_updated_at();

-- ============================================
-- FUNCTION TO UPDATE COMMENT LIKES COUNT
-- ============================================
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.article_comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.article_comments 
        SET likes_count = GREATEST(0, likes_count - 1) 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON public.comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- ============================================
-- VIEW FOR ARTICLE REACTION COUNTS
-- ============================================
CREATE OR REPLACE VIEW public.article_reaction_counts AS
SELECT 
    article_id,
    reaction_type,
    COUNT(*) as count
FROM public.article_reactions
GROUP BY article_id, reaction_type;
