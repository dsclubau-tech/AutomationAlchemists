import express from 'express';
import path from 'node:path';
import puppeteer from 'puppeteer';

const artifactDir = 'C:/Users/USER/.gemini/antigravity/brain/0efa0ec5-f674-4e33-a17f-bc849c676512';
const distDir = path.resolve('dist');

const app = express();
app.use(express.static(distDir));
app.use((req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = 4198;
const server = app.listen(port, async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const mockUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'customer@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2026-01-01T00:00:00Z',
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: 'Alex Mercer' },
    };

    const mockSession = {
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: nowSec + 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUser,
    };

    const mockTools = [
      {
        id: '1',
        slug: 'rccp',
        name: 'Return Converter x CopyPaste Bot',
        status: 'available',
        price_monthly: 4.99,
        is_free: false,
        sort_order: 1,
      },
      {
        id: '2',
        slug: 'listflow',
        name: 'ListFlow',
        status: 'coming_soon',
        price_monthly: 59,
        is_free: false,
        sort_order: 2,
      },
    ];

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
    };

    async function captureState({ stateName, subscriptions, trialStatusData, desktopPath, mobilePath }) {
      const page = await browser.newPage();
      const consoleLogs = [];
      const networkRequests = [];

      page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
      page.on('request', req => networkRequests.push({ method: req.method(), url: req.url() }));

      await page.evaluateOnNewDocument((session) => {
        localStorage.setItem('sb-tdevgrwmafwrsmeymjzd-auth-token', JSON.stringify(session));
      }, mockSession);

      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (req.method() === 'OPTIONS') {
          const reqHeaders = req.headers()['access-control-request-headers'] || '*';
          req.respond({
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
              'Access-Control-Allow-Headers': reqHeaders,
            },
            body: '',
          });
          return;
        }

        if (url.includes('auth/v1/user') || url.includes('auth/v1/session') || url.includes('auth/v1/token')) {
          req.respond({
            status: 200,
            headers: corsHeaders,
            contentType: 'application/json',
            body: JSON.stringify(mockUser),
          });
        } else if (url.includes('rpc/get_trial_status')) {
          req.respond({
            status: 200,
            headers: corsHeaders,
            contentType: 'application/json',
            body: JSON.stringify(trialStatusData),
          });
        } else if (url.includes('rest/v1/subscriptions')) {
          req.respond({
            status: 200,
            headers: corsHeaders,
            contentType: 'application/json',
            body: JSON.stringify(subscriptions),
          });
        } else if (url.includes('rest/v1/tools')) {
          req.respond({
            status: 200,
            headers: corsHeaders,
            contentType: 'application/json',
            body: JSON.stringify(mockTools),
          });
        } else if (url.includes('rest/v1/tool_notifications')) {
          req.respond({
            status: 200,
            headers: corsHeaders,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else if (url.includes('rpc/get_user_store_count')) {
          req.respond({
            status: 200,
            headers: corsHeaders,
            contentType: 'application/json',
            body: JSON.stringify(0),
          });
        } else if (url.includes('trial_denials')) {
          console.error(`UNEXPECTED REQUEST to trial_denials: ${req.method()} ${url}`);
          req.respond({
            status: 403,
            headers: corsHeaders,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'permission denied for table trial_denials', code: '42501' }),
          });
        } else {
          req.continue();
        }
      });

      // Desktop (1280x800)
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(`http://localhost:${port}/dashboard`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: desktopPath, fullPage: true });
      console.log(`✓ [${stateName}] Saved desktop screenshot: ${desktopPath}`);

      // Mobile (360x740)
      await page.setViewport({ width: 360, height: 740 });
      await page.goto(`http://localhost:${port}/dashboard`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: mobilePath, fullPage: true });
      console.log(`✓ [${stateName}] Saved mobile screenshot: ${mobilePath}`);

      // Verify network requests contain ZERO trial_denials requests
      const denialRequests = networkRequests.filter(r => r.url.includes('trial_denials'));
      console.log(`✓ [${stateName}] Network check: ${denialRequests.length} requests to trial_denials (expected 0)`);
      if (denialRequests.length > 0) {
        throw new Error(`Found unexpected requests to trial_denials: ${JSON.stringify(denialRequests)}`);
      }

      await page.close();
      return { consoleLogs, networkRequests };
    }

    // STATE A: Denied + No Access
    console.log('Capturing State A: Denied + No Access...');
    await captureState({
      stateName: 'State A (Denied + No Access)',
      subscriptions: [],
      trialStatusData: {
        enabled: true,
        eligible: false,
        reason: 'card_already_used',
        already_claimed: false,
        has_access: false,
        denied_reason: 'card_already_used',
        slot_cap: 100,
        slots_left: 99,
        slots_taken: 1,
        trial_days: 30,
        card_denial_count: 1,
      },
      desktopPath: path.join(artifactDir, 'dashboard-denied-no-access-desktop.png'),
      mobilePath: path.join(artifactDir, 'dashboard-denied-no-access-mobile.png'),
    });

    // STATE B: Active Paid Subscription with Old Denial Row Present
    console.log('Capturing State B: Active Paid Subscription with Old Denial Row Present...');
    await captureState({
      stateName: 'State B (Active Paid with Old Denial)',
      subscriptions: [
        {
          product_slug: 'cpbot',
          status: 'active',
          current_period_end: '2026-12-05T00:00:00.000Z',
          cancel_at_period_end: false,
          is_trial: false,
          manually_granted: false,
          stripe_subscription_id: 'sub_live_paid_123',
          stripe_customer_id: 'cus_live_paid_123',
        },
      ],
      trialStatusData: {
        enabled: true,
        eligible: false,
        reason: 'already_has_access',
        already_claimed: false,
        has_access: true,
        denied_reason: 'card_already_used', // Old denial row present within 2 days!
        slot_cap: 100,
        slots_left: 99,
        slots_taken: 1,
        trial_days: 30,
        card_denial_count: 1,
      },
      desktopPath: path.join(artifactDir, 'dashboard-active-paid-with-denial-desktop.png'),
      mobilePath: path.join(artifactDir, 'dashboard-active-paid-with-denial-mobile.png'),
    });

    console.log('\nAll 4 screenshots captured successfully with clean browser console and 0 requests to trial_denials.');
  } catch (err) {
    console.error('Error during capture:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
