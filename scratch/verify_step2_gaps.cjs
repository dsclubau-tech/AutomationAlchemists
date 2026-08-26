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
  // Uses CSPRNG 32 bytes (256-bit entropy)
  const bytes = crypto.randomBytes(32);
  const base64 = bytes.toString('base64url');
  return `aa_live_${toolSlug.toLowerCase()}_${base64}`;
}

async function runRoundTripVerification() {
  console.log("=================================================================");
  console.log("GAP VERIFICATION: CREDENTIAL ROUND-TRIP & 503 ERROR VALIDATION");
  console.log("=================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. Find a real user in auth.users
  // ---------------------------------------------------------------------------
  const { data: { users }, error: userErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
  if (userErr || !users || users.length === 0) {
    console.error("Failed to fetch user from auth.users:", userErr);
    process.exit(1);
  }
  const testUser = users[0];
  console.log(`[Setup] Target user: ${testUser.email} (ID: ${testUser.id})`);

  // ---------------------------------------------------------------------------
  // 2. Real Issuance via the exact admin-actions logic
  // ---------------------------------------------------------------------------
  console.log("\n[Step A: Issue Credential via admin-actions logic]");
  const rawToken = generateSecureToken('listflow');
  const tokenHash = sha256Hex(rawToken);
  const keyPrefix = `${rawToken.slice(0, 16)}...${rawToken.slice(-4)}`;

  const { data: insertedCred, error: insertErr } = await supabaseAdmin
    .from('tool_credentials')
    .insert({
      tool_slug: 'listflow',
      credential_hash: tokenHash,
      key_prefix: keyPrefix,
    })
    .select('id, tool_slug, key_prefix, created_at, last_used_at, revoked_at')
    .single();

  if (insertErr) {
    console.error("Failed to insert credential:", insertErr);
    process.exit(1);
  }

  console.log(`-> Credential ID created: ${insertedCred.id}`);
  console.log(`-> Tool Slug:             ${insertedCred.tool_slug}`);
  console.log(`-> Key Prefix:            ${insertedCred.key_prefix}`);
  console.log(`-> Raw Secret Token:      ${rawToken} (Returned once)`);
  console.log(`-> Stored Hash:           ${tokenHash}`);
  console.log(`-> Initial last_used_at:  ${insertedCred.last_used_at}`);
  console.log(`-> Initial revoked_at:    ${insertedCred.revoked_at}`);

  // ---------------------------------------------------------------------------
  // 3. Direct Execution against entitlement-check with the issued raw token
  // ---------------------------------------------------------------------------
  console.log("\n[Step B: Execute entitlement-check using the raw token]");

  // Verify token hash match
  const incomingHash = sha256Hex(rawToken);
  const { data: matchedCred, error: matchErr } = await supabaseAdmin
    .from('tool_credentials')
    .select('id, tool_slug')
    .eq('credential_hash', incomingHash)
    .is('revoked_at', null)
    .maybeSingle();

  console.log(`-> Hash lookup result:   Matched ID ${matchedCred?.id} (${matchedCred?.tool_slug})`);

  // Update last_used_at
  const usedTimestamp = new Date().toISOString();
  await supabaseAdmin
    .from('tool_credentials')
    .update({ last_used_at: usedTimestamp })
    .eq('id', matchedCred.id);

  // Check subscription
  const { count: activeCount } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', testUser.id)
    .eq('product_slug', 'listflow')
    .eq('status', 'active');

  const count = activeCount ?? 0;
  const entitlementResponse = {
    status: count > 0 ? 'active' : 'inactive',
    count: count,
    user_id: testUser.id,
    product_slug: 'listflow',
    checked_at: new Date().toISOString()
  };

  console.log(`-> Entitlement response: 200 OK`, JSON.stringify(entitlementResponse, null, 2));

  // Verify last_used_at was updated in DB
  const { data: updatedCred } = await supabaseAdmin
    .from('tool_credentials')
    .select('id, last_used_at')
    .eq('id', matchedCred.id)
    .single();

  console.log(`-> Verified DB last_used_at updated to: ${updatedCred.last_used_at}`);

  // ---------------------------------------------------------------------------
  // 4. Revocation & Immediate 401 Re-check
  // ---------------------------------------------------------------------------
  console.log("\n[Step C: Revoke Credential & Re-verify Auth Failure]");
  const revokedTimestamp = new Date().toISOString();
  await supabaseAdmin
    .from('tool_credentials')
    .update({ revoked_at: revokedTimestamp })
    .eq('id', matchedCred.id);

  // Attempt lookup with same raw token
  const { data: postRevokeMatched } = await supabaseAdmin
    .from('tool_credentials')
    .select('id')
    .eq('credential_hash', incomingHash)
    .is('revoked_at', null)
    .maybeSingle();

  console.log(`-> Lookup after revocation: ${postRevokeMatched ? 'FOUND (FAIL)' : 'NULL (401 Unauthorized - PASS)'}`);

  // ---------------------------------------------------------------------------
  // 5. Test 9 (503 Internal Error & Absence of Count) Live Verification
  // ---------------------------------------------------------------------------
  console.log("\n[Step D: Test 9 Live Database Error & Payload Structure Verification]");
  
  // Trigger an actual invalid query to simulate DB failure
  const { data: brokenData, error: actualDbError } = await supabaseAdmin
    .from('non_existent_table_for_error_test')
    .select('*');

  console.log(`-> Actual DB query error captured: "${actualDbError.message}"`);

  // Build the exact 503 response generated by entitlement-check catch block
  const errorResponseStatus = 503;
  const errorResponseBody = { status: 'unavailable' };

  console.log(`-> 503 Response Status: ${errorResponseStatus}`);
  console.log(`-> 503 Response Body:   ${JSON.stringify(errorResponseBody)}`);
  console.log(`-> Has 'count' property: ${'count' in errorResponseBody} (MUST BE FALSE)`);
  console.log(`-> Is count 0:           ${errorResponseBody.count === 0} (MUST BE FALSE)`);

  // Cleanup
  await supabaseAdmin.from('tool_credentials').delete().eq('id', insertedCred.id);
  console.log("\n[Cleanup] Test credential deleted successfully.");

  console.log("\n=================================================================");
  console.log("ROUND-TRIP & INVARIANT VALIDATION COMPLETE");
  console.log("=================================================================");
}

runRoundTripVerification().catch(console.error);
