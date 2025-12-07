import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article';
    author?: string;
    publishedTime?: string;
}

const SEOHead = ({
    title,
    description,
    keywords,
    image = '/og-image.png',
    url,
    type = 'website',
    author,
    publishedTime,
}: SEOHeadProps) => {
    const siteName = 'AAlchemists';
    const fullTitle = title === 'Home' ? siteName : `${title} | ${siteName}`;
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <meta name="author" content={author || siteName} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={currentUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />
            <meta property="twitter:site" content="@AAlchemists" />

            {/* Article specific */}
            {type === 'article' && publishedTime && (
                <meta property="article:published_time" content={publishedTime} />
            )}
            {type === 'article' && author && (
                <meta property="article:author" content={author} />
            )}

            {/* Canonical URL */}
            <link rel="canonical" href={currentUrl} />
        </Helmet>
    );
};

export default SEOHead;
