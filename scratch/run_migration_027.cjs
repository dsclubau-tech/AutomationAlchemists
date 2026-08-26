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

async function runMigration() {
  console.log("===============================================================================");
  console.log("APPLYING MIGRATION 027 (subscription_history, triggers, pg_cron, expiration)");
  console.log("===============================================================================\n");

  const adminToken = await getAdminAccessToken();
  const sqlFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '027_subscription_history_and_expiration.sql');
  const sqlText = fs.readFileSync(sqlFilePath, 'utf8');

  console.log("Executing SQL migration via live admin-actions endpoint...");
  const res = await fetch(ADMIN_ACTIONS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'execute_sql', sql_text: sqlText })
  });

  const body = await res.json();
  console.log(`HTTP Status: ${res.status}`);
  console.log(`Response:   `, JSON.stringify(body, null, 2));

  if (res.status !== 200 || !body.success) {
    console.error("Migration 027 failed to apply!");
    process.exit(1);
  }

  console.log("\n-> Migration 027 applied successfully to the database!");
}

runMigration().catch(console.error);
