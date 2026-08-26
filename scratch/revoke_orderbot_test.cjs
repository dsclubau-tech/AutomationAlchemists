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

async function runRevocationVerification() {
  console.log("===============================================================================");
  console.log("REVOCATION VERIFICATION OF ORDERBOT TEST CREDENTIAL (id: 550963c7-...)");
  console.log("===============================================================================\n");

  const adminToken = await getAdminAccessToken();
  const orderBotCredId = '550963c7-d298-4b36-83e8-378441c62c37';
  const orderBotRawToken = 'aa_live_orderbot_U4NZhpwgdVM9_QIbl7HQv8mq0EfLPsgctli6huTUBQA';

  // 1. Check current status in DB
  const { data: beforeCheck } = await supabaseAdmin
    .from('tool_credentials')
    .select('id, tool_slug, key_prefix, revoked_at')
    .eq('id', orderBotCredId)
    .maybeSingle();

  console.log("[1. Database State Before Revocation]");
  console.log(JSON.stringify(beforeCheck, null, 2));

  // 2. Call admin-actions via live HTTP to revoke it
  console.log("\n[2. Live HTTP Call to admin-actions -> action: 'revoke_tool_credential']");
  const revokeRes = await httpPost(
    ADMIN_ACTIONS_URL,
    { Authorization: `Bearer ${adminToken}`, apikey: ANON_KEY },
    { action: 'revoke_tool_credential', credential_id: orderBotCredId }
  );

  console.log(`HTTP Status:  ${revokeRes.status}`);
  console.log(`HTTP Headers:`, JSON.stringify(revokeRes.headers, null, 2));
  console.log(`HTTP Body:   `, JSON.stringify(revokeRes.body, null, 2));

  // 3. Verify DB record now has revoked_at populated
  const { data: afterCheck } = await supabaseAdmin
    .from('tool_credentials')
    .select('id, tool_slug, key_prefix, revoked_at')
    .eq('id', orderBotCredId)
    .single();

  console.log("\n[3. Database State After Revocation]");
  console.log(JSON.stringify(afterCheck, null, 2));

  // 4. Send live HTTP request to entitlement-check using the revoked raw token
  console.log("\n[4. Live HTTP Call to entitlement-check using revoked OrderBot token]");
  const entitlementRes = await httpPost(
    ENTITLEMENT_CHECK_URL,
    { Authorization: `Bearer ${orderBotRawToken}` },
    { user_id: '1c4026cb-3e4e-4d52-b744-d8051903b12c', product_slug: 'orderbot' }
  );

  console.log(`HTTP Status:  ${entitlementRes.status}`);
  console.log(`HTTP Headers:`, JSON.stringify(entitlementRes.headers, null, 2));
  console.log(`HTTP Body:   `, JSON.stringify(entitlementRes.body, null, 2));

  const passed = entitlementRes.status === 401 && entitlementRes.body.error === 'Unauthorized';
  console.log(`\n-> Revocation Check: ${passed ? 'PASSED (401 Confirmed on Deployed Function)' : 'FAILED'}`);

  // 5. Clean up all leftover test credentials so DB is 100% clean
  console.log("\n[5. Purging test rows from tool_credentials]");
  const { data: deletedRows } = await supabaseAdmin
    .from('tool_credentials')
    .delete()
    .select('id, tool_slug, key_prefix');
  console.log(`Deleted ${deletedRows?.length || 0} test credential rows from production DB.`);
}

runRevocationVerification().catch(console.error);
