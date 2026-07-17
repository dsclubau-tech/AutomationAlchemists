import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const baseUrl = 'https://automationalchemists.com';

const routes = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/services', changefreq: 'monthly', priority: 0.9 },
  { url: '/services/web-development', changefreq: 'monthly', priority: 0.9 },
  { url: '/services/app-development', changefreq: 'monthly', priority: 0.9 },
  { url: '/services/saas-development', changefreq: 'monthly', priority: 0.9 },
  { url: '/services/automation', changefreq: 'monthly', priority: 0.9 },
  { url: '/services/vibe-to-app', changefreq: 'monthly', priority: 0.8 },
  { url: '/services/virtual-assistants', changefreq: 'monthly', priority: 0.8 },
  { url: '/services/workflow-automation', changefreq: 'monthly', priority: 0.8 },
  { url: '/tools', changefreq: 'monthly', priority: 0.8 },
  { url: '/company', changefreq: 'monthly', priority: 0.7 },
  { url: '/mission', changefreq: 'monthly', priority: 0.7 },
  { url: '/contact', changefreq: 'yearly', priority: 0.6 }
];

function generateSitemap() {
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  // Write to public folder so Vite builds it into dist
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml);
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);
  
  console.log('sitemap.xml and robots.txt generated successfully in public/');
}

generateSitemap();
