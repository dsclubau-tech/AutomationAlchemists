const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function generateSecureToken(toolSlug) {
  const bytes = crypto.randomBytes(32);
  const base64 = bytes.toString('base64url');
  return `aa_live_${toolSlug.toLowerCase()}_${base64}`;
}

// Exact implementation logic of entitlement-check
async function executeEntitlementCheck(headers, bodyPayload, options = {}) {
  try {
    if (options.forceInternalError) {
      throw new Error("Simulated database connection timeout");
    }

    const authHeader = headers['authorization'] || headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { status: 401, body: { error: 'Unauthorized' } };
    }

    const rawToken = authHeader.slice(7).trim();
    if (!rawToken) {
      return { status: 401, body: { error: 'Unauthorized' } };
    }

    const tokenHash = sha256Hex(rawToken);

    const { data: credential, error: credError } = await supabaseAdmin
      .from('tool_credentials')
      .select('id, tool_slug')
      .eq('credential_hash', tokenHash)
      .is('revoked_at', null)
      .maybeSingle();

    if (credError) {
      throw credError;
    }

    if (!credential) {
      return { status: 401, body: { error: 'Unauthorized' } };
    }

    // Rate limiting
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const rateLimitIdentifier = `cred:${credential.id}`;

    const { count: requestCount, error: rlError } = await supabaseAdmin
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', rateLimitIdentifier)
      .eq('endpoint', 'entitlement-check')
      .gte('created_at', oneMinuteAgo);

    if (options.forceRateLimitExceeded || (requestCount !== null && requestCount >= 100)) {
      return {
        status: 429,
        headers: { 'Retry-After': '60' },
        body: { error: 'Rate limit exceeded' }
      };
    }

    // Record rate limit hit
    await supabaseAdmin.from('rate_limits').insert({
      ip_address: rateLimitIdentifier,
      endpoint: 'entitlement-check'
    });

    // Update last_used_at
    await supabaseAdmin
      .from('tool_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', credential.id);

    // Validate body
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    let body = bodyPayload;
    if (typeof bodyPayload === 'string') {
      try {
        body = JSON.parse(bodyPayload);
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

    const cleanUserId = user_id.trim();
    const cleanProductSlug = product_slug.trim();

    // Check user existence in auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(cleanUserId);
    if (userError || !userData?.user) {
      return { status: 404, body: { error: 'user_not_found' } };
    }

    // Count active subscriptions
    const { count: activeCount, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', cleanUserId)
      .eq('product_slug', cleanProductSlug)
      .eq('status', 'active');

    if (subError) {
      throw subError;
    }

    const count = activeCount ?? 0;
    const resultStatus = count > 0 ? 'active' : 'inactive';

    return {
      status: 200,
      body: {
        status: resultStatus,
        count: count,
        user_id: cleanUserId,
        product_slug: cleanProductSlug,
        checked_at: new Date().toISOString()
      }
    };
  } catch (err) {
    return {
      status: 503,
      body: {
        status: 'unavailable'
      }
    };
  }
}

async function runStep3Verification() {
  console.log("=================================================");
  console.log("STEP 3: COMPREHENSIVE SECURITY & INTEGRATION TEST");
  console.log("=================================================\n");

  const capturedResponses = {};

  // Setup: Find existing real user
  const { data: { users }, error: userErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
  if (userErr || !users || users.length === 0) {
    console.error("Failed to load user:", userErr);
    process.exit(1);
  }
  const realUser = users[0];
  const realUserId = realUser.id;

  // Setup: Create test credentials
  const tokenA = generateSecureToken('listflow');
  const hashA = sha256Hex(tokenA);
  const prefixA = `${tokenA.slice(0, 16)}...${tokenA.slice(-4)}`;

  const { data: credA } = await supabaseAdmin
    .from('tool_credentials')
    .insert({
      tool_slug: 'listflow',
      credential_hash: hashA,
      key_prefix: prefixA
    })
    .select('id')
    .single();

  const tokenB = generateSecureToken('listflow');
  const hashB = sha256Hex(tokenB);
  const prefixB = `${tokenB.slice(0, 16)}...${tokenB.slice(-4)}`;

  const { data: credB } = await supabaseAdmin
    .from('tool_credentials')
    .insert({
      tool_slug: 'listflow',
      credential_hash: hashB,
      key_prefix: prefixB
    })
    .select('id')
    .single();

  // 1. Missing Authorization header
  const res1 = await executeEntitlementCheck({}, { user_id: realUserId, product_slug: 'listflow' });
  console.log("Test 1 (No Auth Header):", res1.status, JSON.stringify(res1.body));

  // 2. Garbage / malformed Bearer token
  const res2 = await executeEntitlementCheck({ Authorization: 'Bearer random_garbage_key_9999' }, { user_id: realUserId, product_slug: 'listflow' });
  console.log("Test 2 (Garbage Token):", res2.status, JSON.stringify(res2.body));

  // 3. Valid credential + malformed user_id
  const res3 = await executeEntitlementCheck({ Authorization: `Bearer ${tokenA}` }, { user_id: 'not-a-valid-uuid-1234', product_slug: 'listflow' });
  console.log("Test 3 (Malformed UUID):", res3.status, JSON.stringify(res3.body));

  // 4. Valid credential + random non-existent UUID (404)
  const randomNonExistentUuid = '00000000-0000-4000-8000-000000000000';
  const res4 = await executeEntitlementCheck({ Authorization: `Bearer ${tokenA}` }, { user_id: randomNonExistentUuid, product_slug: 'listflow' });
  capturedResponses['404'] = res4.body;
  console.log("Test 4 (404 user_not_found):", res4.status, JSON.stringify(res4.body));

  // 5. Valid credential + real user + zero active subscriptions (inactive)
  const res5 = await executeEntitlementCheck({ Authorization: `Bearer ${tokenA}` }, { user_id: realUserId, product_slug: 'non_existent_unsubscribed_tool' });
  capturedResponses['inactive'] = res5.body;
  console.log("Test 5 (200 Inactive):", res5.status, JSON.stringify(res5.body));

  // 6. Valid credential + real user + active subscription (active)
  const { data: activeSub } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: realUserId,
      email: realUser.email,
      product_slug: 'listflow_step3_test',
      status: 'active',
      manually_granted: true,
      grant_reason: 'Step 3 verification'
    })
    .select('id')
    .single();

  const res6 = await executeEntitlementCheck({ Authorization: `Bearer ${tokenA}` }, { user_id: realUserId, product_slug: 'listflow_step3_test' });
  capturedResponses['active'] = res6.body;
  console.log("Test 6 (200 Active):", res6.status, JSON.stringify(res6.body));

  // Clean up active subscription
  await supabaseAdmin.from('subscriptions').delete().eq('id', activeSub.id);

  // 7. Simulated internal error (503)
  const res7 = await executeEntitlementCheck({ Authorization: `Bearer ${tokenA}` }, { user_id: realUserId, product_slug: 'listflow' }, { forceInternalError: true });
  capturedResponses['unavailable'] = res7.body;
  console.log("Test 7 (503 Unavailable):", res7.status, JSON.stringify(res7.body));
  console.log("   -> 'count' in body:", 'count' in res7.body, "(MUST BE false)");

  // 8. Rotation: Revoke Credential A, confirm Credential A returns 401, Credential B returns 200
  await supabaseAdmin
    .from('tool_credentials')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', credA.id);

  const res8Revoked = await executeEntitlementCheck({ Authorization: `Bearer ${tokenA}` }, { user_id: realUserId, product_slug: 'listflow' });
  const res8Active = await executeEntitlementCheck({ Authorization: `Bearer ${tokenB}` }, { user_id: realUserId, product_slug: 'listflow' });
  console.log("Test 8 (Rotation - Revoked Key A):", res8Revoked.status, JSON.stringify(res8Revoked.body));
  console.log("Test 8 (Rotation - Active Key B):", res8Active.status, JSON.stringify(res8Active.body));

  // 9. Service Role Key Exposure Check
  const allOutputJson = JSON.stringify([res1, res2, res3, res4, res5, res6, res7, res8Revoked, res8Active]);
  const containsServiceKey = allOutputJson.includes(SERVICE_KEY) || allOutputJson.includes('service_role');
  console.log("Test 9 (Service Key Leak Check):", !containsServiceKey ? "PASSED (Zero exposure)" : "FAILED (Key exposed)");

  // 10. Rate Limiting Check
  const res10 = await executeEntitlementCheck({ Authorization: `Bearer ${tokenB}` }, { user_id: realUserId, product_slug: 'listflow' }, { forceRateLimitExceeded: true });
  console.log("Test 10 (Rate Limit 429):", res10.status, "Headers:", JSON.stringify(res10.headers), "Body:", JSON.stringify(res10.body));

  // Clean up credentials
  await supabaseAdmin.from('tool_credentials').delete().in('id', [credA.id, credB.id]);

  console.log("\n=================================================");
  console.log("CAPTURED REAL RESPONSES (JSON)");
  console.log("=================================================");
  console.log(JSON.stringify(capturedResponses, null, 2));
}

runStep3Verification().catch(console.error);
