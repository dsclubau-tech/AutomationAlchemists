const SUPABASE_URL = 'https://tdevgrwmafwrsmeymjzd.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZncndtYWZ3cnNtZXltanpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTUwMTUsImV4cCI6MjA5OTY3MTAxNX0.ABjbvx6JCNhUDTan541C6QwOriYG_xrC_H-FTXt2qOU';

async function test() {
  console.log('--- Test 4a: Direct SELECT against /rest/v1/subscriptions ---');
  const res1 = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?select=*`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    }
  });
  console.log(`Status: ${res1.status} ${res1.statusText}`);
  console.log(`Body:`, await res1.text());

  console.log('\n--- Test 4b: Call RPC get_active_subscription_count ---');
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_active_subscription_count`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_product_slug: 'orderbot'
    })
  });
  console.log(`Status: ${res2.status} ${res2.statusText}`);
  console.log(`Body:`, await res2.text());
}

test();
