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

const port = 4199;
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

      await page.close();
      return { consoleLogs, networkRequests };
    }

    // STATE 1: status canceled + future period end -> Locked, no "access until"
    console.log('Capturing State 1: status canceled + future period end -> Locked...');
    await captureState({
      stateName: 'State 1 (Canceled + Future End -> Locked)',
      subscriptions: [
        {
          id: 'sub-1',
          user_id: mockUser.id,
          product_slug: 'cpbot',
          status: 'canceled',
          current_period_end: '2026-12-05T00:00:00Z',
          cancel_at_period_end: false,
          is_trial: false,
        },
      ],
      trialStatusData: {
        enabled: true,
        eligible: false,
        reason: 'not_eligible',
        already_claimed: false,
        has_access: false,
        denied_reason: null,
        slot_cap: 100,
        slots_left: 98,
        slots_taken: 2,
        trial_days: 30,
        card_denial_count: 0,
      },
      desktopPath: path.join(artifactDir, 'dashboard-v1153-state1-canceled-locked-desktop.png'),
      mobilePath: path.join(artifactDir, 'dashboard-v1153-state1-canceled-locked-mobile.png'),
    });

    // STATE 2: active + cancel_at_period_end -> Cancelling with access-until
    console.log('Capturing State 2: active + cancel_at_period_end -> Cancelling...');
    await captureState({
      stateName: 'State 2 (Active + cancel_at_period_end -> Cancelling)',
      subscriptions: [
        {
          id: 'sub-2',
          user_id: mockUser.id,
          product_slug: 'cpbot',
          status: 'active',
          current_period_end: '2026-12-05T00:00:00Z',
          cancel_at_period_end: true,
          is_trial: false,
        },
      ],
      trialStatusData: {
        enabled: true,
        eligible: false,
        reason: 'already_has_access',
        already_claimed: false,
        has_access: true,
        denied_reason: null,
        slot_cap: 100,
        slots_left: 98,
        slots_taken: 2,
        trial_days: 30,
        card_denial_count: 0,
      },
      desktopPath: path.join(artifactDir, 'dashboard-v1153-state2-cancelling-access-until-desktop.png'),
      mobilePath: path.join(artifactDir, 'dashboard-v1153-state2-cancelling-access-until-mobile.png'),
    });

    // STATE 3: denied + eligible, count 2 -> both buttons
    console.log('Capturing State 3: denied + eligible, count 2 -> both buttons...');
    await captureState({
      stateName: 'State 3 (Denied + Eligible + Count 2 -> Both Buttons)',
      subscriptions: [],
      trialStatusData: {
        enabled: true,
        eligible: true,
        reason: 'ok',
        already_claimed: false,
        has_access: false,
        denied_reason: 'card_already_used',
        slot_cap: 100,
        slots_left: 98,
        slots_taken: 2,
        trial_days: 30,
        card_denial_count: 2,
      },
      desktopPath: path.join(artifactDir, 'dashboard-v1153-state3-denied-eligible-count2-desktop.png'),
      mobilePath: path.join(artifactDir, 'dashboard-v1153-state3-denied-eligible-count2-mobile.png'),
    });

    // STATE 4: denied + not eligible -> Subscribe only with generic copy
    console.log('Capturing State 4: denied + not eligible -> Subscribe only...');
    await captureState({
      stateName: 'State 4 (Denied + Not Eligible -> Subscribe Only)',
      subscriptions: [
        {
          id: 'sub-4',
          user_id: mockUser.id,
          product_slug: 'cpbot',
          status: 'canceled',
          current_period_end: '2026-12-05T00:00:00Z',
          cancel_at_period_end: false,
          is_trial: false,
        },
      ],
      trialStatusData: {
        enabled: true,
        eligible: false,
        reason: 'not_eligible',
        already_claimed: false,
        has_access: false,
        denied_reason: 'card_already_used',
        slot_cap: 100,
        slots_left: 98,
        slots_taken: 2,
        trial_days: 30,
        card_denial_count: 2,
      },
      desktopPath: path.join(artifactDir, 'dashboard-v1153-state4-denied-ineligible-subscribe-only-desktop.png'),
      mobilePath: path.join(artifactDir, 'dashboard-v1153-state4-denied-ineligible-subscribe-only-mobile.png'),
    });

    // STATE 5: denied + count 3 -> Subscribe only (capped)
    console.log('Capturing State 5: denied + count 3 -> Subscribe only (capped)...');
    await captureState({
      stateName: 'State 5 (Denied + Count 3 -> Subscribe Only Capped)',
      subscriptions: [],
      trialStatusData: {
        enabled: true,
        eligible: true,
        reason: 'ok',
        already_claimed: false,
        has_access: false,
        denied_reason: 'card_already_used',
        slot_cap: 100,
        slots_left: 97,
        slots_taken: 3,
        trial_days: 30,
        card_denial_count: 3,
      },
      desktopPath: path.join(artifactDir, 'dashboard-v1153-state5-denied-capped-count3-desktop.png'),
      mobilePath: path.join(artifactDir, 'dashboard-v1153-state5-denied-capped-count3-mobile.png'),
    });

    console.log('SUCCESS: All 5 states (10 screenshots) captured successfully!');
  } finally {
    await browser.close();
    server.close();
  }
});
