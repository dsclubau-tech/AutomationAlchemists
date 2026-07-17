import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

// Define the routes to prerender
const routes = [
  '/',
  '/services/web-development',
  '/services/app-development',
  '/services/saas-development',
  '/services/automation',
  '/services/vibe-to-app',
  '/services/virtual-assistants',
  '/services/workflow-automation',
  '/tools'
];

/**
 * Note on Content Freshness:
 * Because this script prerenders the HTML at build time, any dynamic content
 * (e.g. from an API or CMS) that changes after the build will NOT be reflected 
 * in the prerendered HTML until the next deployment/build. 
 * Since the content is currently static, this is perfectly fine.
 */

async function prerender() {
  console.log('Starting prerender process...');

  // 1. Start a local server to serve the built SPA
  const app = express();
  
  // Serve static files from dist
  app.use(express.static(distDir));
  
  // SPA fallback for all routes
  app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });

  const port = 3000;
  const server = app.listen(port, () => {
    console.log(`Local server listening on port ${port} for prerendering...`);
  });

  try {
    // 2. Launch Puppeteer using @sparticuz/chromium
    console.log('Launching headless browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // 3. Visit each route and extract HTML
    for (const route of routes) {
      console.log(`Prerendering route: ${route}`);
      const page = await browser.newPage();
      
      // Navigate to the route
      await page.goto(`http://localhost:${port}${route}`, { waitUntil: 'networkidle0' });
      
      // Wait for any critical rendering to finish
      // Just to be safe for any async helmet tags
      await new Promise(r => setTimeout(r, 1000));
      
      // Get the fully rendered HTML
      const html = await page.content();
      
      // 4. Save the HTML to the appropriate directory in dist
      const routePath = route === '/' ? 'index.html' : `${route}/index.html`;
      const filePath = path.join(distDir, routePath);
      
      // Create directories if they don't exist
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      
      // Write the HTML
      fs.writeFileSync(filePath, html);
      console.log(`Saved ${filePath}`);
      
      await page.close();
    }

    await browser.close();
    console.log('Prerendering complete!');
  } catch (error) {
    console.error('Error during prerendering:', error);
    process.exit(1);
  } finally {
    server.close();
  }
}

prerender();
