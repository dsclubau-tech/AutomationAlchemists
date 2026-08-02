import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Verify caller is an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse payload
    const body = await req.json();
    const { action, target_user_id, target_email } = body;

    if (action !== 'delete_user' && action !== 'delete_subscription') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_user') {
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: 'target_user_id required' }), { status: 400, headers: corsHeaders });
      }

      // A. Delete from subscriptions
      await supabaseAdmin.from('subscriptions').delete().eq('user_id', target_user_id);
      // B. Delete from profiles
      await supabaseAdmin.from('profiles').delete().eq('id', target_user_id);
      // C. Delete from auth.users
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
      if (deleteAuthError) throw new Error(`Failed to delete auth user: ${deleteAuthError.message}`);
    } else if (action === 'delete_subscription') {
      const { target_subscription_id } = body;
      if (!target_subscription_id) {
        return new Response(JSON.stringify({ error: 'target_subscription_id required' }), { status: 400, headers: corsHeaders });
      }
      
      const { error: deleteSubError } = await supabaseAdmin.from('subscriptions').delete().eq('id', target_subscription_id);
      if (deleteSubError) throw new Error(`Failed to delete subscription: ${deleteSubError.message}`);
    }

    // 4. Log to admin_audit_log
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: 'deleted_user',
        target_user_id: target_user_id,
        target_email: target_email,
        details: body
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
