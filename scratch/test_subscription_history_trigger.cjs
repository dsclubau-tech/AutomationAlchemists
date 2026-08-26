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

async function runTriggerTests() {
  console.log("===============================================================================");
  console.log("TRIGGER VERIFICATION: SUBSCRIPTION HISTORY (GRANT, RENEW, EXPIRE)");
  console.log("===============================================================================\n");

  const adminClient = await getAdminClient();
  const adminUserId = '1c4026cb-3e4e-4d52-b744-d8051903b12c'; // dsclub
  const testUserEmail = 'sarwar19712007@gmail.com';
  const testUserId = '1757aa05-3093-40c2-8ba6-7eb443c0e9ab';
  const testToolSlug = 'trigger_test_tool';

  // Cleanup any leftover test subscriptions for this user
  await supabaseAdmin.from('subscriptions').delete().eq('user_id', testUserId).eq('product_slug', testToolSlug);

  // ---------------------------------------------------------------------------
  // TEST CASE 1: Test Grant (event_type = 'granted')
  // ---------------------------------------------------------------------------
  console.log("[Test Case 1: Initial Grant via Admin Action]");
  const initialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // +7 days

  const { data: grantResult, error: grantErr } = await adminClient.rpc('admin_execute_action', {
    p_action_type: 'grant_access',
    p_target_user_id: testUserId,
    p_target_email: testUserEmail,
    p_payload: {
      tool_slug: testToolSlug,
      reason: 'Automated test grant',
      end_date: initialEndDate
    }
  });

  if (grantErr) throw grantErr;
  console.log("-> Grant action executed successfully.");

  // Fetch the subscription row
  const { data: subRow1 } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id, email, product_slug, status, current_period_end')
    .eq('user_id', testUserId)
    .eq('product_slug', testToolSlug)
    .single();

  // Fetch history entries
  const { data: history1 } = await supabaseAdmin
    .from('subscription_history')
    .select('*')
    .eq('subscription_id', subRow1.id)
    .order('created_at', { ascending: false });

  console.log("-> History row 1 (Grant):", JSON.stringify(history1[0], null, 2));

  const case1Passed = history1.length === 1 &&
                      history1[0].event_type === 'granted' &&
                      history1[0].old_status === null &&
                      history1[0].new_status === 'active' &&
                      history1[0].changed_by_admin_id === adminUserId;
  console.log(`-> Case 1 Status: ${case1Passed ? 'PASSED' : 'FAILED'}\n`);

  // ---------------------------------------------------------------------------
  // TEST CASE 2: Test Renewal / Date Extension (event_type = 'renewed')
  // ---------------------------------------------------------------------------
  console.log("[Test Case 2: Renewal / Extension via Admin Action]");
  const renewedEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days

  const { data: renewResult, error: renewErr } = await adminClient.rpc('admin_execute_action', {
    p_action_type: 'extend_subscription',
    p_target_user_id: testUserId,
    p_target_email: testUserEmail,
    p_payload: {
      subscription_id: subRow1.id,
      new_date: renewedEndDate
    }
  });

  if (renewErr) throw renewErr;
  console.log("-> Extend/Renew action executed successfully.");

  const { data: history2 } = await supabaseAdmin
    .from('subscription_history')
    .select('*')
    .eq('subscription_id', subRow1.id)
    .order('created_at', { ascending: false });

  console.log("-> History row 2 (Renewal):", JSON.stringify(history2[0], null, 2));

  const case2Passed = history2.length === 2 &&
                      history2[0].event_type === 'renewed' &&
                      history2[0].old_status === 'active' &&
                      history2[0].new_status === 'active' &&
                      new Date(history2[0].old_period_end).toISOString() === new Date(initialEndDate).toISOString() &&
                      new Date(history2[0].new_period_end).toISOString() === new Date(renewedEndDate).toISOString() &&
                      history2[0].changed_by_admin_id === adminUserId;
  console.log(`-> Case 2 Status: ${case2Passed ? 'PASSED' : 'FAILED'}\n`);

  // ---------------------------------------------------------------------------
  // TEST CASE 3: Natural Expiration (event_type = 'expired', changed_by_admin_id = NULL)
  // ---------------------------------------------------------------------------
  console.log("[Test Case 3: Natural Expiry via expire_past_due_subscriptions()]");
  
  // Set current_period_end to 1 hour ago
  const pastEndDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from('subscriptions')
    .update({ current_period_end: pastEndDate })
    .eq('id', subRow1.id);

  // Execute background sweep function (simulating pg_cron system worker where auth.uid() is NULL)
  const { data: sweepCount, error: sweepErr } = await supabaseAdmin.rpc('expire_past_due_subscriptions');
  if (sweepErr) throw sweepErr;
  console.log(`-> Expiration sweep executed. Rows flipped to expired: ${sweepCount}`);

  // Fetch updated subscription row
  const { data: subRowExpired } = await supabaseAdmin
    .from('subscriptions')
    .select('status')
    .eq('id', subRow1.id)
    .single();

  console.log(`-> Subscription status is now: '${subRowExpired.status}'`);

  const { data: history3 } = await supabaseAdmin
    .from('subscription_history')
    .select('*')
    .eq('subscription_id', subRow1.id)
    .order('created_at', { ascending: false });

  console.log("-> History row 3 (Natural Expiry):", JSON.stringify(history3[0], null, 2));

  const case3Passed = subRowExpired.status === 'expired' &&
                      history3.length === 3 &&
                      history3[0].event_type === 'expired' &&
                      history3[0].old_status === 'active' &&
                      history3[0].new_status === 'expired' &&
                      history3[0].changed_by_admin_id === null; // Confirmed NULL (System / Cron, not misattributed)
  console.log(`-> Case 3 Status: ${case3Passed ? 'PASSED (changed_by_admin_id is correctly NULL)' : 'FAILED'}\n`);

  // ---------------------------------------------------------------------------
  // 4. Test admin_get_user_subscription_timeline RPC
  // ---------------------------------------------------------------------------
  console.log("[Test 4: admin_get_user_subscription_timeline RPC for Admin UI]");
  const { data: timeline, error: timelineErr } = await adminClient.rpc('admin_get_user_subscription_timeline', {
    p_user_id: testUserId
  });
  if (timelineErr) throw timelineErr;
  console.log(`-> Timeline RPC returned ${timeline.length} events for user ${testUserEmail}:`);
  console.table(timeline.map(t => ({
    event: t.event_type,
    tool: t.product_slug,
    old_status: t.old_status,
    new_status: t.new_status,
    changed_by: t.changed_by_email || 'System / Cron',
    time: t.created_at
  })));

  // Cleanup test subscription & history
  await supabaseAdmin.from('subscriptions').delete().eq('id', subRow1.id);
  console.log("\n[Cleanup] Test records cleaned up successfully.");

  const allPassed = case1Passed && case2Passed && case3Passed && timeline.length >= 3;
  console.log(`\n===============================================================================`);
  console.log(`OVERALL TRIGGER RESULT: ${allPassed ? 'ALL 3 TRIGGER CASES PASSED' : 'SOME TESTS FAILED'}`);
  console.log(`===============================================================================`);
}

runTriggerTests().catch(console.error);
