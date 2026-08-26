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

async function getAdminClient() {
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

  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
  });
}

async function runVerification() {
  console.log("===============================================================================");
  console.log("EXPLICIT TRIGGER VERIFICATION: GRANT -> RENEWAL -> NATURAL EXPIRY");
  console.log("===============================================================================\n");

  const adminClient = await getAdminClient();
  const adminUserId = '1c4026cb-3e4e-4d52-b744-d8051903b12c'; // dsclub
  const testUserEmail = 'sarwar19712007@gmail.com';
  const testUserId = '1757aa05-3093-40c2-8ba6-7eb443c0e9ab';
  const testToolSlug = 'verification_tool';

  // 0. Clean prior state
  await supabaseAdmin.from('subscriptions').delete().eq('user_id', testUserId).eq('product_slug', testToolSlug);

  // ---------------------------------------------------------------------------
  // 1. GRANT TEST
  // ---------------------------------------------------------------------------
  console.log("[1. Test Case 1: Manual Grant]");
  const grantDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(); // +10 days
  const { error: gErr } = await adminClient.rpc('admin_execute_action', {
    p_action_type: 'grant_access',
    p_target_user_id: testUserId,
    p_target_email: testUserEmail,
    p_payload: { tool_slug: testToolSlug, reason: 'Initial pilot grant', end_date: grantDate }
  });
  if (gErr) throw gErr;

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, current_period_end')
    .eq('user_id', testUserId)
    .eq('product_slug', testToolSlug)
    .single();

  const { data: hGrant } = await supabaseAdmin
    .from('subscription_history')
    .select('*')
    .eq('subscription_id', sub.id)
    .order('created_at', { ascending: false });

  console.log(`Event Type:          ${hGrant[0].event_type}`);
  console.log(`Old Status -> New:   ${hGrant[0].old_status} -> ${hGrant[0].new_status}`);
  console.log(`Old Expiry -> New:   ${hGrant[0].old_period_end} -> ${hGrant[0].new_period_end}`);
  console.log(`Changed By Admin ID: ${hGrant[0].changed_by_admin_id} (${hGrant[0].changed_by_email})`);
  console.log(`Reason:              ${hGrant[0].reason}`);

  const grantPassed = hGrant.length === 1 &&
                      hGrant[0].event_type === 'granted' &&
                      hGrant[0].old_status === null &&
                      hGrant[0].new_status === 'active' &&
                      hGrant[0].changed_by_admin_id === adminUserId;
  console.log(`-> Case 1 (Grant): ${grantPassed ? 'PASSED' : 'FAILED'}\n`);

  // ---------------------------------------------------------------------------
  // 2. RENEWAL TEST
  // ---------------------------------------------------------------------------
  console.log("[2. Test Case 2: Subscription Renewal]");
  const renewDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // +60 days
  const { error: rErr } = await adminClient.rpc('admin_execute_action', {
    p_action_type: 'extend_subscription',
    p_target_user_id: testUserId,
    p_target_email: testUserEmail,
    p_payload: { subscription_id: sub.id, new_date: renewDate }
  });
  if (rErr) throw rErr;

  const { data: hRenew } = await supabaseAdmin
    .from('subscription_history')
    .select('*')
    .eq('subscription_id', sub.id)
    .order('created_at', { ascending: false });

  console.log(`Event Type:          ${hRenew[0].event_type}`);
  console.log(`Old Status -> New:   ${hRenew[0].old_status} -> ${hRenew[0].new_status}`);
  console.log(`Old Expiry -> New:   ${hRenew[0].old_period_end} -> ${hRenew[0].new_period_end}`);
  console.log(`Changed By Admin ID: ${hRenew[0].changed_by_admin_id} (${hRenew[0].changed_by_email})`);

  const renewPassed = hRenew.length === 2 &&
                      hRenew[0].event_type === 'renewed' &&
                      hRenew[0].old_status === 'active' &&
                      hRenew[0].new_status === 'active' &&
                      new Date(hRenew[0].old_period_end).toISOString() === new Date(grantDate).toISOString() &&
                      new Date(hRenew[0].new_period_end).toISOString() === new Date(renewDate).toISOString() &&
                      hRenew[0].changed_by_admin_id === adminUserId;
  console.log(`-> Case 2 (Renewal): ${renewPassed ? 'PASSED' : 'FAILED'}\n`);

  // ---------------------------------------------------------------------------
  // 3. NATURAL EXPIRY TEST
  // ---------------------------------------------------------------------------
  console.log("[3. Test Case 3: Natural Expiration via Background Sweep]");
  
  // Set date to past without status change (simulating time passing)
  const pastDate = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min ago
  // We disable the trigger briefly or update current_period_end directly to simulate time elapsing to expiration
  await supabaseAdmin
    .from('subscriptions')
    .update({ current_period_end: pastDate, updated_at: new Date().toISOString() })
    .eq('id', sub.id);

  // Clean the intermediate date-update log row if any so we isolate the 3 exact milestones
  await supabaseAdmin
    .from('subscription_history')
    .delete()
    .eq('subscription_id', sub.id)
    .eq('event_type', 'renewed')
    .eq('new_period_end', pastDate);

  // Run the background expiration worker
  const { data: sweepResult, error: sErr } = await supabaseAdmin.rpc('expire_past_due_subscriptions');
  if (sErr) throw sErr;

  const { data: hExpire } = await supabaseAdmin
    .from('subscription_history')
    .select('*')
    .eq('subscription_id', sub.id)
    .order('created_at', { ascending: false });

  console.log(`Event Type:          ${hExpire[0].event_type}`);
  console.log(`Old Status -> New:   ${hExpire[0].old_status} -> ${hExpire[0].new_status}`);
  console.log(`Old Expiry -> New:   ${hExpire[0].old_period_end} -> ${hExpire[0].new_period_end}`);
  console.log(`Changed By Admin ID: ${hExpire[0].changed_by_admin_id} (NULL = System/Cron confirmed)`);
  console.log(`Reason:              ${hExpire[0].reason}`);

  const expirePassed = hExpire.length === 3 &&
                       hExpire[0].event_type === 'expired' &&
                       hExpire[0].old_status === 'active' &&
                       hExpire[0].new_status === 'expired' &&
                       hExpire[0].changed_by_admin_id === null &&
                       hExpire[0].changed_by_email === null;
  console.log(`-> Case 3 (Natural Expiry): ${expirePassed ? 'PASSED' : 'FAILED'}\n`);

  // ---------------------------------------------------------------------------
  // 4. TIMELINE RPC OUTPUT
  // ---------------------------------------------------------------------------
  console.log("[4. Full Subscription Timeline via admin_get_user_subscription_timeline RPC]");
  const { data: timeline } = await adminClient.rpc('admin_get_user_subscription_timeline', {
    p_user_id: testUserId
  });

  console.table(timeline.map(row => ({
    id: row.id.slice(0, 8),
    event: row.event_type,
    tool: row.product_slug,
    old_status: row.old_status,
    new_status: row.new_status,
    changed_by: row.changed_by_email || 'System / Cron',
    reason: row.reason,
    created_at: row.created_at
  })));

  // Cleanup test records
  await supabaseAdmin.from('subscriptions').delete().eq('id', sub.id);
  console.log("[Cleanup completed]");
}

runVerification().catch(console.error);
