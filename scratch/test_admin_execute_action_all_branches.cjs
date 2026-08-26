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

  return {
    client: createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
    }),
    adminUserId: sessionData.user.id
  };
}

async function testAllAdminBranches() {
  console.log("===============================================================================");
  console.log("TESTING ALL BRANCHES OF admin_execute_action (POST-REWRITE RE-VERIFICATION)");
  console.log("===============================================================================\n");

  const { client: adminClient, adminUserId } = await getAdminClient();
  const testTargetEmail = 'sarwar19712007@gmail.com';
  const testTargetId = '1757aa05-3093-40c2-8ba6-7eb443c0e9ab';

  // ---------------------------------------------------------------------------
  // 1. Branch: edit_profile
  // ---------------------------------------------------------------------------
  console.log("[1. Testing branch: edit_profile]");
  const originalProfile = await supabaseAdmin.from('profiles').select('full_name, phone').eq('id', testTargetId).single();
  
  const testName = 'Sarwar Test User';
  const testPhone = '+1234567890';
  const { data: editRes, error: editErr } = await adminClient.rpc('admin_execute_action', {
    p_action_type: 'edit_profile',
    p_target_user_id: testTargetId,
    p_target_email: testTargetEmail,
    p_payload: { full_name: testName, phone: testPhone }
  });
  if (editErr) throw editErr;

  const { data: updatedProfile } = await supabaseAdmin.from('profiles').select('full_name, phone').eq('id', testTargetId).single();
  const editPassed = updatedProfile.full_name === testName && updatedProfile.phone === testPhone;
  console.log(`-> edit_profile result: ${editPassed ? 'PASSED' : 'FAILED'} (Name: "${updatedProfile.full_name}", Phone: "${updatedProfile.phone}")`);

  // Restore original
  await supabaseAdmin.from('profiles').update({ full_name: originalProfile.data.full_name, phone: originalProfile.data.phone }).eq('id', testTargetId);

  // ---------------------------------------------------------------------------
  // 2. Branch: toggle_admin
  // ---------------------------------------------------------------------------
  console.log("\n[2. Testing branch: toggle_admin]");
  const { data: toggleRes1, error: toggleErr1 } = await adminClient.rpc('admin_execute_action', {
    p_action_type: 'toggle_admin',
    p_target_user_id: testTargetId,
    p_target_email: testTargetEmail,
    p_payload: { is_admin: true }
  });
  if (toggleErr1) throw toggleErr1;

  const { data: profAdminTrue } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', testTargetId).single();

  const { data: toggleRes2, error: toggleErr2 } = await adminClient.rpc('admin_execute_action', {
    p_action_type: 'toggle_admin',
    p_target_user_id: testTargetId,
    p_target_email: testTargetEmail,
    p_payload: { is_admin: false }
  });
  if (toggleErr2) throw toggleErr2;

  const { data: profAdminFalse } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', testTargetId).single();
  const togglePassed = profAdminTrue.is_admin === true && profAdminFalse.is_admin === false;
  console.log(`-> toggle_admin result: ${togglePassed ? 'PASSED' : 'FAILED'} (Toggled True then False)`);

  // ---------------------------------------------------------------------------
  // 3. Branch: revoke_access
  // ---------------------------------------------------------------------------
  console.log("\n[3. Testing branch: revoke_access]");
  // Create disposable sub
  const { data: tempSub } = await supabaseAdmin.from('subscriptions').insert({
    user_id: testTargetId,
    email: testTargetEmail,
    product_slug: 'revoke_test_tool',
    status: 'active',
    manually_granted: true,
    grant_reason: 'Testing revoke_access branch'
  }).select('id').single();

  const { data: revokeRes, error: revokeErr } = await adminClient.rpc('admin_execute_action', {
    p_action_type: 'revoke_access',
    p_target_user_id: testTargetId,
    p_target_email: testTargetEmail,
    p_payload: { subscription_id: tempSub.id }
  });
  if (revokeErr) throw revokeErr;

  const { data: revokedSub } = await supabaseAdmin.from('subscriptions').select('status').eq('id', tempSub.id).single();
  const revokePassed = revokedSub.status === 'inactive';
  console.log(`-> revoke_access result: ${revokePassed ? 'PASSED' : 'FAILED'} (Status is now "${revokedSub.status}")`);
  await supabaseAdmin.from('subscriptions').delete().eq('id', tempSub.id);

  // ---------------------------------------------------------------------------
  // 4. Branch: change_tool_status
  // ---------------------------------------------------------------------------
  console.log("\n[4. Testing branch: change_tool_status]");
  const originalTool = await supabaseAdmin.from('tools').select('status, maintenance_message, price_monthly').eq('slug', 'cpbot').single();

  const { data: toolRes, error: toolErr } = await adminClient.rpc('admin_execute_action', {
    p_action_type: 'change_tool_status',
    p_target_user_id: adminUserId,
    p_target_email: 'dsclub.au@gmail.com',
    p_payload: {
      tool_slug: 'cpbot',
      status: originalTool.data.status,
      maintenance_message: 'All systems operational',
      price: originalTool.data.price_monthly
    }
  });
  if (toolErr) throw toolErr;

  const { data: updatedTool } = await supabaseAdmin.from('tools').select('status, maintenance_message, price_monthly').eq('slug', 'cpbot').single();
  const toolPassed = updatedTool.maintenance_message === 'All systems operational';
  console.log(`-> change_tool_status result: ${toolPassed ? 'PASSED' : 'FAILED'} (Tool maintenance message updated)`);

  // Restore original maintenance message if needed
  await supabaseAdmin.from('tools').update({ maintenance_message: originalTool.data.maintenance_message }).eq('slug', 'cpbot');

  // ---------------------------------------------------------------------------
  // 5. Verify admin_audit_log entries
  // ---------------------------------------------------------------------------
  console.log("\n[5. Checking admin_audit_log entries for all executed actions]");
  const { data: auditRows } = await supabaseAdmin
    .from('admin_audit_log')
    .select('action, target_email, created_at')
    .order('created_at', { ascending: false })
    .limit(4);
  console.table(auditRows);

  const allBranchesPassed = editPassed && togglePassed && revokePassed && toolPassed;
  console.log(`\n===============================================================================`);
  console.log(`admin_execute_action BRANCHES RESULT: ${allBranchesPassed ? 'ALL 4 BRANCHES PASSED' : 'SOME FAILED'}`);
  console.log(`===============================================================================`);
}

testAllAdminBranches().catch(console.error);
