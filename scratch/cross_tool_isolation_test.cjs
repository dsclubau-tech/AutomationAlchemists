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

async function executeEntitlementCheck(headers, bodyPayload) {
  try {
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

    // Update last_used_at
    await supabaseAdmin
      .from('tool_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', credential.id);

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
      matched_tool_slug: credential.tool_slug,
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
      body: { status: 'unavailable' }
    };
  }
}

async function runCrossToolIsolationTest() {
  console.log("=================================================");
  console.log("CROSS-TOOL ISOLATION TEST: LISTFLOW vs ORDERBOT");
  console.log("=================================================\n");

  // 1. Get real test user
  const { data: { users }, error: userErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
  if (userErr || !users || users.length === 0) {
    console.error("Failed to load user:", userErr);
    process.exit(1);
  }
  const realUser = users[0];
  const userId = realUser.id;
  console.log(`[Target User] ${realUser.email} (${userId})\n`);

  // 2. Issue ListFlow Credential
  const rawListFlowToken = generateSecureToken('listflow');
  const listFlowHash = sha256Hex(rawListFlowToken);
  const listFlowPrefix = `${rawListFlowToken.slice(0, 16)}...${rawListFlowToken.slice(-4)}`;

  const { data: listFlowCred, error: errLF } = await supabaseAdmin
    .from('tool_credentials')
    .insert({
      tool_slug: 'listflow',
      credential_hash: listFlowHash,
      key_prefix: listFlowPrefix
    })
    .select('id, tool_slug, key_prefix')
    .single();

  if (errLF) {
    console.error("Error creating ListFlow credential:", errLF);
    process.exit(1);
  }
  console.log(`[Tool 1 Issued] ID: ${listFlowCred.id} | tool_slug: '${listFlowCred.tool_slug}' | prefix: ${listFlowCred.key_prefix}`);

  // 3. Issue OrderBot Credential
  const rawOrderBotToken = generateSecureToken('orderbot');
  const orderBotHash = sha256Hex(rawOrderBotToken);
  const orderBotPrefix = `${rawOrderBotToken.slice(0, 16)}...${rawOrderBotToken.slice(-4)}`;

  const { data: orderBotCred, error: errOB } = await supabaseAdmin
    .from('tool_credentials')
    .insert({
      tool_slug: 'orderbot',
      credential_hash: orderBotHash,
      key_prefix: orderBotPrefix
    })
    .select('id, tool_slug, key_prefix')
    .single();

  if (errOB) {
    console.error("Error creating OrderBot credential:", errOB);
    process.exit(1);
  }
  console.log(`[Tool 2 Issued] ID: ${orderBotCred.id} | tool_slug: '${orderBotCred.tool_slug}' | prefix: ${orderBotCred.key_prefix}\n`);

  // 4. Initial State: Both credentials call entitlement-check independently
  console.log("--- PHASE 1: Both tools active simultaneously ---");

  const resLF_initial = await executeEntitlementCheck(
    { Authorization: `Bearer ${rawListFlowToken}` },
    { user_id: userId, product_slug: 'listflow' }
  );
  console.log("ListFlow Request -> Status:", resLF_initial.status, "| Matched Tool:", resLF_initial.matched_tool_slug);
  console.log("                Body:", JSON.stringify(resLF_initial.body));

  const resOB_initial = await executeEntitlementCheck(
    { Authorization: `Bearer ${rawOrderBotToken}` },
    { user_id: userId, product_slug: 'orderbot' }
  );
  console.log("OrderBot Request -> Status:", resOB_initial.status, "| Matched Tool:", resOB_initial.matched_tool_slug);
  console.log("                Body:", JSON.stringify(resOB_initial.body));

  const phase1Pass = resLF_initial.status === 200 &&
                     resLF_initial.matched_tool_slug === 'listflow' &&
                     resOB_initial.status === 200 &&
                     resOB_initial.matched_tool_slug === 'orderbot';

  console.log(`\n[Phase 1 Result] Independent Dual-Tool Authentication: ${phase1Pass ? 'PASSED' : 'FAILED'}\n`);

  // 5. Revoke ONLY ListFlow
  console.log(`--- PHASE 2: Revoking ONLY ListFlow (ID: ${listFlowCred.id}) ---`);
  const revokeTime = new Date().toISOString();
  await supabaseAdmin
    .from('tool_credentials')
    .update({ revoked_at: revokeTime })
    .eq('id', listFlowCred.id);

  console.log(`ListFlow credential marked revoked_at = ${revokeTime}`);

  // 6. Test both tools after ListFlow revocation
  console.log("\n--- PHASE 3: Post-Revocation Verification ---");

  // Call with revoked ListFlow token
  const resLF_postRevoke = await executeEntitlementCheck(
    { Authorization: `Bearer ${rawListFlowToken}` },
    { user_id: userId, product_slug: 'listflow' }
  );
  console.log("1. Revoked ListFlow Request -> Status:", resLF_postRevoke.status, "| Body:", JSON.stringify(resLF_postRevoke.body));

  // Call with untouched OrderBot token
  const resOB_postRevoke = await executeEntitlementCheck(
    { Authorization: `Bearer ${rawOrderBotToken}` },
    { user_id: userId, product_slug: 'orderbot' }
  );
  console.log("2. Untouched OrderBot Request -> Status:", resOB_postRevoke.status, "| Matched Tool:", resOB_postRevoke.matched_tool_slug);
  console.log("                              Body:", JSON.stringify(resOB_postRevoke.body));

  const listFlowRevokedCorrectly = resLF_postRevoke.status === 401 && resLF_postRevoke.body.error === 'Unauthorized';
  const orderBotStillWorking = resOB_postRevoke.status === 200 && resOB_postRevoke.matched_tool_slug === 'orderbot';
  const phase3Pass = listFlowRevokedCorrectly && orderBotStillWorking;

  console.log("\n=================================================");
  console.log("CROSS-TOOL ISOLATION SUMMARY");
  console.log("=================================================");
  console.log(`[${listFlowRevokedCorrectly ? 'PASS' : 'FAIL'}] 1. ListFlow (revoked) returns 401 Unauthorized`);
  console.log(`[${orderBotStillWorking ? 'PASS' : 'FAIL'}] 2. OrderBot (untouched) still returns 200 OK (${resOB_postRevoke.matched_tool_slug})`);
  console.log(`\nOVERALL CROSS-TOOL ISOLATION: ${phase3Pass ? 'PASSED (Zero Cross-Tool Side Effects)' : 'FAILED'}`);

  // Clean up
  await supabaseAdmin.from('tool_credentials').delete().in('id', [listFlowCred.id, orderBotCred.id]);
  console.log("\n[Cleanup] Test credentials cleaned up.");
}

runCrossToolIsolationTest().catch(console.error);
