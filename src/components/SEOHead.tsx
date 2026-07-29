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
    noindex?: boolean;
}

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.automationalchemists.com').replace(/\/$/, '');

const SEOHead = ({
    title,
    description,
    keywords,
    image = '/og-image.png',
    url,
    type = 'website',
    author,
    publishedTime,
    noindex,
}: SEOHeadProps) => {
    const siteName = 'Automation Alchemists';
    const fullTitle = title === 'Home' ? siteName : `${title} | ${siteName}`;
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    const currentUrl = url || `${SITE_URL}${pathname}`;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <meta name="author" content={author || siteName} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}

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
            <meta property="twitter:site" content="@AutomationAlchemists" />

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
