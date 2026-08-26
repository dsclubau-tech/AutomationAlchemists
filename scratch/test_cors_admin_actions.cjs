const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY);

const ADMIN_ACTIONS_URL = `${SUPABASE_URL}/functions/v1/admin-actions`;

async function getAdminAccessToken() {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'dsclub.au@gmail.com'
  });
  if (error) throw error;
  
  const { data: sessionData, error: verifyErr } = await supabaseAnon.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: 'magiclink'
  });
  if (verifyErr) throw verifyErr;
  return sessionData.session.access_token;
}

async function runCorsVerification() {
  console.log("===============================================================================");
  console.log("CORS & BROWSER PREFLIGHT VERIFICATION FOR http://localhost:8080");
  console.log("===============================================================================\n");

  const adminToken = await getAdminAccessToken();

  // 1. Browser OPTIONS Preflight Request from localhost:8080
  console.log("[1. Live HTTP OPTIONS Preflight from Origin: http://localhost:8080]");
  const preflightRes = await fetch(ADMIN_ACTIONS_URL, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:8080',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization, content-type, apikey, x-client-info',
    }
  });

  const preflightHeaders = {};
  preflightRes.headers.forEach((v, k) => { preflightHeaders[k] = v; });

  console.log(`Preflight HTTP Status: ${preflightRes.status}`);
  console.log(`Access-Control-Allow-Origin:  ${preflightHeaders['access-control-allow-origin']}`);
  console.log(`Access-Control-Allow-Methods: ${preflightHeaders['access-control-allow-methods']}`);
  console.log(`Access-Control-Allow-Headers: ${preflightHeaders['access-control-allow-headers']}`);

  const preflightPass = preflightRes.status === 200 &&
                        preflightHeaders['access-control-allow-origin'] === 'http://localhost:8080';
  console.log(`-> Preflight Check: ${preflightPass ? 'PASSED' : 'FAILED'}\n`);

  // 2. Browser POST Request from localhost:8080 (delete_subscription)
  console.log("[2. Live HTTP POST from Origin: http://localhost:8080 (delete_subscription)]");
  // Create disposable sub
  const testSubSlug = `cors_test_sub_${Date.now()}`;
  const { data: testSub } = await supabaseAdmin.from('subscriptions').insert({
    user_id: '1c4026cb-3e4e-4d52-b744-d8051903b12c',
    email: 'dsclub.au@gmail.com',
    product_slug: testSubSlug,
    status: 'active',
    manually_granted: true,
    grant_reason: 'CORS verification test'
  }).select('id').single();

  const postSubRes = await fetch(ADMIN_ACTIONS_URL, {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:8080',
      'Authorization': `Bearer ${adminToken}`,
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'delete_subscription', target_subscription_id: testSub.id })
  });

  const postSubHeaders = {};
  postSubRes.headers.forEach((v, k) => { postSubHeaders[k] = v; });
  const postSubBody = await postSubRes.json();

  console.log(`POST HTTP Status: ${postSubRes.status}`);
  console.log(`Access-Control-Allow-Origin: ${postSubHeaders['access-control-allow-origin']}`);
  console.log(`Body:`, JSON.stringify(postSubBody, null, 2));

  // 3. Browser POST Request from localhost:8080 (delete_user)
  console.log("\n[3. Live HTTP POST from Origin: http://localhost:8080 (delete_user)]");
  const tempEmail = `cors_test_user_${Date.now()}@example.com`;
  const { data: tempUser } = await supabaseAdmin.auth.admin.createUser({
    email: tempEmail,
    password: 'TempPassword123!',
    email_confirm: true
  });

  const postUserRes = await fetch(ADMIN_ACTIONS_URL, {
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:8080',
      'Authorization': `Bearer ${adminToken}`,
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'delete_user', target_user_id: tempUser.user.id, target_email: tempEmail })
  });

  const postUserHeaders = {};
  postUserRes.headers.forEach((v, k) => { postUserHeaders[k] = v; });
  const postUserBody = await postUserRes.json();

  console.log(`POST HTTP Status: ${postUserRes.status}`);
  console.log(`Access-Control-Allow-Origin: ${postUserHeaders['access-control-allow-origin']}`);
  console.log(`Body:`, JSON.stringify(postUserBody, null, 2));

  // 4. Production Domain Origin Test (https://automationalchemists.com)
  console.log("\n[4. Live HTTP OPTIONS from Production Origin: https://automationalchemists.com]");
  const prodPreflight = await fetch(ADMIN_ACTIONS_URL, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://automationalchemists.com',
      'Access-Control-Request-Method': 'POST',
    }
  });
  const prodHeaders = {};
  prodPreflight.headers.forEach((v, k) => { prodHeaders[k] = v; });
  console.log(`Prod Preflight HTTP Status: ${prodPreflight.status}`);
  console.log(`Access-Control-Allow-Origin:  ${prodHeaders['access-control-allow-origin']}`);

  // 5. Untrusted Domain Origin Test (Should return fallback default origin)
  console.log("\n[5. Live HTTP OPTIONS from Untrusted Origin: https://evil-site.com]");
  const untrustedPreflight = await fetch(ADMIN_ACTIONS_URL, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://evil-site.com',
      'Access-Control-Request-Method': 'POST',
    }
  });
  const untrustedHeaders = {};
  untrustedPreflight.headers.forEach((v, k) => { untrustedHeaders[k] = v; });
  console.log(`Untrusted Preflight HTTP Status: ${untrustedPreflight.status}`);
  console.log(`Access-Control-Allow-Origin:     ${untrustedHeaders['access-control-allow-origin']} (Must NOT be evil-site.com)`);

  const allPassed = preflightPass &&
                    postSubRes.status === 200 &&
                    postUserRes.status === 200 &&
                    prodHeaders['access-control-allow-origin'] === 'https://automationalchemists.com' &&
                    untrustedHeaders['access-control-allow-origin'] === 'https://automationalchemists.com';

  console.log("\n===============================================================================");
  console.log(`CORS ALLOWLIST RESULT: ${allPassed ? 'ALL CORS CHECKS PASSED' : 'CORS CHECK FAILED'}`);
  console.log("===============================================================================");
}

runCorsVerification().catch(console.error);
