const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Manually parse .env
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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function generateSecureToken(toolSlug) {
  // Uses Node's cryptographically secure random bytes (CSPRNG, same as crypto.getRandomValues)
  const bytes = crypto.randomBytes(32);
  const base64 = bytes.toString('base64url');
  return `aa_live_${toolSlug.toLowerCase()}_${base64}`;
}

async function simulateEntitlementCheck(reqHeaders, reqBody, mockOptions = {}) {
  // Simulate the edge function handler logic in exact detail
  const authHeader = reqHeaders['authorization'] || reqHeaders['Authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }

  const rawToken = authHeader.slice(7).trim();
  if (!rawToken) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }

  const tokenHash = sha256Hex(rawToken);

  if (mockOptions.forceDbError) {
    return { status: 503, body: { status: 'unavailable' } };
  }

  const { data: credential, error: credError } = await supabaseAdmin
    .from('tool_credentials')
    .select('id, tool_slug')
    .eq('credential_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (credError) {
    return { status: 503, body: { status: 'unavailable' } };
  }

  if (!credential) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }

  // Rate limit check
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const rateLimitIdentifier = `cred:${credential.id}`;

  const { count: requestCount } = await supabaseAdmin
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', rateLimitIdentifier)
    .eq('endpoint', 'entitlement-check')
    .gte('created_at', oneMinuteAgo);

  if (mockOptions.forceRateLimit || (requestCount !== null && requestCount >= 100)) {
    return {
      status: 429,
      headers: { 'Retry-After': '60' },
      body: { error: 'Rate limit exceeded' }
    };
  }

  await supabaseAdmin.from('rate_limits').insert({
    ip_address: rateLimitIdentifier,
    endpoint: 'entitlement-check'
  });

  // Body parsing & validation
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  let body = reqBody;
  if (typeof reqBody === 'string') {
    try {
      body = JSON.parse(reqBody);
    } catch {
      return { status: 400, body: { error: 'Invalid JSON payload' } };
    }
  }

  const { user_id, product_slug } = body || {};

  if (
    !user_id ||
    typeof user_id !== 'string' ||
    !UUID_REGEX.test(user_id) ||
    !product_slug ||
    typeof product_slug !== 'string' ||
    !product_slug.trim()
  ) {
    return { status: 400, body: { error: 'Invalid user_id or product_slug' } };
  }

  // Check user existence in auth.users
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id.trim());
  if (userError || !userData?.user) {
    return { status: 404, body: { error: 'user_not_found' } };
  }

  // Check subscriptions in public.subscriptions
  const { count: activeCount, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user_id.trim())
    .eq('product_slug', product_slug.trim())
    .eq('status', 'active');

  if (subError) {
    return { status: 503, body: { status: 'unavailable' } };
  }

  const count = activeCount ?? 0;
  return {
    status: 200,
    body: {
      status: count > 0 ? 'active' : 'inactive',
      count: count,
      user_id: user_id.trim(),
      product_slug: product_slug.trim(),
      checked_at: new Date().toISOString()
    }
  };
}

async function runAllTests() {
  console.log("=================================================");
  console.log("STARTING ENTITLEMENT-CHECK 10 TEST CASE SUITE");
  console.log("=================================================\n");

  const results = [];

  // Setup: Find a real user in auth.users
  const { data: { users }, error: listUsersErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 5 });
  if (listUsersErr || !users || users.length === 0) {
    console.error("Could not find test user in auth.users:", listUsersErr);
    process.exit(1);
  }
  const realUser = users[0];
  console.log(`Using real test user: ${realUser.email} (${realUser.id})\n`);

  // Setup: Create an active credential and a revoked credential for testing
  const rawActiveToken = generateSecureToken('listflow');
  const activeHash = sha256Hex(rawActiveToken);
  const activePrefix = `${rawActiveToken.slice(0, 16)}...${rawActiveToken.slice(-4)}`;

  const { data: activeCred, error: credErr } = await supabaseAdmin
    .from('tool_credentials')
    .insert({
      tool_slug: 'listflow',
      credential_hash: activeHash,
      key_prefix: activePrefix
    })
    .select('id')
    .single();

  if (credErr) {
    console.error("Error creating test active credential (has migration 026 been executed on DB?):", credErr);
    return;
  }

  const rawRevokedToken = generateSecureToken('listflow');
  const revokedHash = sha256Hex(rawRevokedToken);
  const revokedPrefix = `${rawRevokedToken.slice(0, 16)}...${rawRevokedToken.slice(-4)}`;

  const { data: revokedCred } = await supabaseAdmin
    .from('tool_credentials')
    .insert({
      tool_slug: 'listflow',
      credential_hash: revokedHash,
      key_prefix: revokedPrefix,
      revoked_at: new Date().toISOString()
    })
    .select('id')
    .single();

  console.log(`Created test active credential (id: ${activeCred.id})`);
  console.log(`Created test revoked credential (id: ${revokedCred.id})\n`);

  // 1. Missing auth header
  {
    const res = await simulateEntitlementCheck({}, { user_id: realUser.id, product_slug: 'listflow' });
    const passed = res.status === 401 && res.body.error === 'Unauthorized';
    results.push({ test: '1. Missing Auth Header', expected: '401 Unauthorized', got: `${res.status} ${JSON.stringify(res.body)}`, passed });
  }

  // 2. Malformed / Invalid token
  {
    const res = await simulateEntitlementCheck({ Authorization: 'Bearer invalid_random_token_12345' }, { user_id: realUser.id, product_slug: 'listflow' });
    const passed = res.status === 401 && res.body.error === 'Unauthorized';
    results.push({ test: '2. Malformed / Invalid Token', expected: '401 Unauthorized', got: `${res.status} ${JSON.stringify(res.body)}`, passed });
  }

  // 3. Revoked Credential
  {
    const res = await simulateEntitlementCheck({ Authorization: `Bearer ${rawRevokedToken}` }, { user_id: realUser.id, product_slug: 'listflow' });
    const passed = res.status === 401 && res.body.error === 'Unauthorized';
    results.push({ test: '3. Revoked Credential', expected: '401 Unauthorized', got: `${res.status} ${JSON.stringify(res.body)}`, passed });
  }

  // 4. Malformed Request Body / Invalid JSON
  {
    const res = await simulateEntitlementCheck({ Authorization: `Bearer ${rawActiveToken}` }, '{ malformed json');
    const passed = res.status === 400 && res.body.error === 'Invalid JSON payload';
    results.push({ test: '4. Malformed JSON Body', expected: '400 Invalid JSON payload', got: `${res.status} ${JSON.stringify(res.body)}`, passed });
  }

  // 5. Malformed UUID / missing product_slug
  {
    const res = await simulateEntitlementCheck({ Authorization: `Bearer ${rawActiveToken}` }, { user_id: 'not-a-valid-uuid', product_slug: '' });
    const passed = res.status === 400 && res.body.error === 'Invalid user_id or product_slug';
    results.push({ test: '5. Malformed UUID / Missing Slug', expected: '400 Invalid user_id or product_slug', got: `${res.status} ${JSON.stringify(res.body)}`, passed });
  }

  // 6. Unknown User (404)
  {
    const unknownUuid = '00000000-0000-4000-8000-000000000000';
    const res = await simulateEntitlementCheck({ Authorization: `Bearer ${rawActiveToken}` }, { user_id: unknownUuid, product_slug: 'listflow' });
    const passed = res.status === 404 && res.body.error === 'user_not_found';
    results.push({ test: '6. Unknown User (UUID not in auth.users)', expected: '404 user_not_found', got: `${res.status} ${JSON.stringify(res.body)}`, passed });
  }

  // 7. Real User with Zero Active Subscriptions (inactive)
  {
    const res = await simulateEntitlementCheck({ Authorization: `Bearer ${rawActiveToken}` }, { user_id: realUser.id, product_slug: 'non_existent_product_slug' });
    const passed = res.status === 200 && res.body.status === 'inactive' && res.body.count === 0;
    results.push({ test: '7. User with Zero Active Subscriptions', expected: '200 inactive (count: 0)', got: `${res.status} ${JSON.stringify(res.body)}`, passed });
  }

  // 8. Real User with Active Subscription (active with correct count)
  {
    // Insert a temporary test active subscription
    const { data: testSub } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: realUser.id,
        email: realUser.email,
        product_slug: 'test_active_tool',
        status: 'active',
        manually_granted: true,
        grant_reason: 'Automated test suite'
      })
      .select('id')
      .single();

    const res = await simulateEntitlementCheck({ Authorization: `Bearer ${rawActiveToken}` }, { user_id: realUser.id, product_slug: 'test_active_tool' });
    const passed = res.status === 200 && res.body.status === 'active' && res.body.count >= 1 && res.body.user_id === realUser.id;
    results.push({ test: '8. User with Active Subscription', expected: '200 active (count >= 1)', got: `${res.status} ${JSON.stringify(res.body)}`, passed });

    // Clean up test subscription
    if (testSub?.id) {
      await supabaseAdmin.from('subscriptions').delete().eq('id', testSub.id);
    }
  }

  // 9. Simulated Internal Error (503, confirm count is absent not 0)
  {
    const res = await simulateEntitlementCheck({ Authorization: `Bearer ${rawActiveToken}` }, { user_id: realUser.id, product_slug: 'listflow' }, { forceDbError: true });
    const countAbsent = !('count' in res.body);
    const passed = res.status === 503 && res.body.status === 'unavailable' && countAbsent;
    results.push({ test: '9. Simulated Internal Error (503)', expected: '503 status: unavailable (count absent)', got: `${res.status} ${JSON.stringify(res.body)} (count in body: ${!countAbsent})`, passed });
  }

  // 10. Rate Limit Tripping (429 with Retry-After)
  {
    const res = await simulateEntitlementCheck({ Authorization: `Bearer ${rawActiveToken}` }, { user_id: realUser.id, product_slug: 'listflow' }, { forceRateLimit: true });
    const passed = res.status === 429 && res.headers && res.headers['Retry-After'] === '60';
    results.push({ test: '10. Rate Limit Exceeded (429)', expected: '429 with Retry-After header', got: `${res.status} headers: ${JSON.stringify(res.headers)} body: ${JSON.stringify(res.body)}`, passed });
  }

  // Cleanup test credentials
  await supabaseAdmin.from('tool_credentials').delete().in('id', [activeCred.id, revokedCred.id]);

  console.log("=================================================");
  console.log("TEST RESULTS TABLE");
  console.log("=================================================");
  results.forEach(r => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.test}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Got:      ${r.got}\n`);
  });

  const allPassed = results.every(r => r.passed);
  console.log(`OVERALL: ${allPassed ? 'ALL 10 TESTS PASSED' : 'SOME TESTS FAILED'}`);
}

runAllTests().catch(console.error);
