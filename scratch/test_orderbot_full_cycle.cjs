const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Parse .env
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

const ENTITLEMENT_CHECK_URL = `${SUPABASE_URL}/functions/v1/entitlement-check`;
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

async function httpPost(url, headers = {}, body = null) {
  const fetchHeaders = { ...headers };
  let fetchBody = body;
  if (body !== null && typeof body === 'object') {
    fetchHeaders['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: fetchHeaders,
    body: fetchBody
  });

  const status = res.status;
  const resHeaders = {};
  res.headers.forEach((val, key) => { resHeaders[key] = val; });
  
  let jsonBody = null;
  const rawText = await res.text();
  try {
    jsonBody = JSON.parse(rawText);
  } catch {
    jsonBody = rawText;
  }

  return { status, headers: resHeaders, body: jsonBody };
}

async function runOrderBotFullCycle() {
  console.log("===============================================================================");
  console.log("ORDERBOT CREDENTIAL FULL LIFECYCLE VERIFICATION (LIVE HTTP)");
  console.log("===============================================================================\n");

  const adminToken = await getAdminAccessToken();
  const realUserId = '1c4026cb-3e4e-4d52-b744-d8051903b12c'; // dsclub

  // 1. Generate OrderBot Credential
  console.log("[1. Live HTTP Issuance via admin-actions]");
  const issueRes = await httpPost(
    ADMIN_ACTIONS_URL,
    { Authorization: `Bearer ${adminToken}`, apikey: ANON_KEY },
    { action: 'generate_tool_credential', tool_slug: 'orderbot' }
  );

  console.log(`HTTP Status:  ${issueRes.status}`);
  console.log(`HTTP Body:   `, JSON.stringify(issueRes.body, null, 2));

  const credId = issueRes.body.credential_id;
  const rawToken = issueRes.body.raw_token;

  // 2. Test active entitlement check
  console.log("\n[2. Live HTTP Entitlement Check (Active State)]");
  const activeRes = await httpPost(
    ENTITLEMENT_CHECK_URL,
    { Authorization: `Bearer ${rawToken}` },
    { user_id: realUserId, product_slug: 'orderbot' }
  );
  console.log(`HTTP Status:  ${activeRes.status}`);
  console.log(`HTTP Body:   `, JSON.stringify(activeRes.body, null, 2));

  // 3. Revoke via admin-actions
  console.log("\n[3. Live HTTP Revocation via admin-actions]");
  const revokeRes = await httpPost(
    ADMIN_ACTIONS_URL,
    { Authorization: `Bearer ${adminToken}`, apikey: ANON_KEY },
    { action: 'revoke_tool_credential', credential_id: credId }
  );
  console.log(`HTTP Status:  ${revokeRes.status}`);
  console.log(`HTTP Body:   `, JSON.stringify(revokeRes.body, null, 2));

  // 4. Test entitlement check after revocation (Must be 401)
  console.log("\n[4. Live HTTP Entitlement Check (Post-Revocation -> Expect 401)]");
  const postRevokeRes = await httpPost(
    ENTITLEMENT_CHECK_URL,
    { Authorization: `Bearer ${rawToken}` },
    { user_id: realUserId, product_slug: 'orderbot' }
  );
  console.log(`HTTP Status:  ${postRevokeRes.status}`);
  console.log(`HTTP Headers:`, JSON.stringify(postRevokeRes.headers, null, 2));
  console.log(`HTTP Body:   `, JSON.stringify(postRevokeRes.body, null, 2));

  const success = issueRes.status === 200 &&
                  activeRes.status === 200 &&
                  revokeRes.status === 200 &&
                  postRevokeRes.status === 401;

  console.log(`\n===============================================================================`);
  console.log(`RESULT: ${success ? 'PASSED (Full lifecycle verified live over HTTPS)' : 'FAILED'}`);
  console.log(`===============================================================================`);

  // Clean up
  await supabaseAdmin.from('tool_credentials').delete().eq('id', credId);
}

runOrderBotFullCycle().catch(console.error);
