import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

// ==============================================================================
// Dynamic CORS Configuration
// Allows production domains and local development environments (ports 8080, 5173, 3000, ngrok)
// ==============================================================================
const ALLOWED_ORIGINS = [
  'https://automationalchemists.com',
  'https://www.automationalchemists.com',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || req.headers.get('origin') || '';
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.ngrok-free.dev') ||
    origin.endsWith('.ngrok.io');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// Helper: SHA-256 Hashing
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Generate Cryptographically Secure Random Base64URL string (32 bytes = 256-bit entropy)
function generateSecureToken(toolSlug: string): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const base64 = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `aa_live_${toolSlug.toLowerCase()}_${base64}`;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Verify caller has a valid token and is an admin
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
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

    const allowedActions = [
      'create_user',
      'delete_user',
      'delete_subscription',
      'generate_tool_credential',
      'revoke_tool_credential',
    ];

    if (!allowedActions.includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_user') {
      const { email, password, full_name, phone, is_admin } = body;
      
      if (!email || typeof email !== 'string' || !email.trim()) {
        return new Response(JSON.stringify({ error: 'Email is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!password || typeof password !== 'string' || password.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      // 1. Create auth user with metadata (triggers handle_new_user -> public.profiles row)
      const { data: newAuthData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password.trim(),
        email_confirm: true,
        user_metadata: {
          full_name: full_name?.trim() || null,
          phone: phone?.trim() || null,
          terms_accepted: true,
        },
      });

      if (createAuthError || !newAuthData?.user) {
        throw new Error(createAuthError?.message || 'Failed to create user');
      }

      const createdUserId = newAuthData.user.id;

      // 2. If is_admin is selected, update public.profiles
      if (is_admin) {
        const { error: adminUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({ is_admin: true, updated_at: new Date().toISOString() })
          .eq('id', createdUserId);

        if (adminUpdateError) {
          console.error('Failed to set is_admin on profile:', adminUpdateError);
        }
      }

      // 3. Audit log
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: 'created_user',
        target_user_id: createdUserId,
        target_email: cleanEmail,
        details: {
          full_name: full_name?.trim() || null,
          phone: phone?.trim() || null,
          is_admin: !!is_admin,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: createdUserId,
            email: cleanEmail,
            full_name: full_name?.trim() || null,
            phone: phone?.trim() || null,
            is_admin: !!is_admin,
            created_at: newAuthData.user.created_at,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (action === 'delete_user' && target_user_id === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_user') {
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: 'target_user_id required' }), { status: 400, headers: corsHeaders });
      }

      // 1. Delete DB records (stores, subscriptions, profiles)
      const { error: storesErr } = await supabaseAdmin.from('stores').delete().eq('user_id', target_user_id);
      if (storesErr) throw new Error(`Failed to delete user stores: ${storesErr.message}`);

      const { error: subsErr } = await supabaseAdmin.from('subscriptions').delete().eq('user_id', target_user_id);
      if (subsErr) throw new Error(`Failed to delete user subscriptions: ${subsErr.message}`);

      const { error: profileErr } = await supabaseAdmin.from('profiles').delete().eq('id', target_user_id);
      if (profileErr) throw new Error(`Failed to delete user profile: ${profileErr.message}`);

      // 2. Delete from auth.users via GoTrue API
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
      
      if (deleteAuthError) {
        console.error(`INCONSISTENCY ERROR: DB records deleted for user ${target_user_id}, but auth.users deletion failed.`, deleteAuthError);
        throw new Error(`Database records were deleted, but failed to delete auth user: ${deleteAuthError.message}`);
      }
    } else if (action === 'delete_subscription') {
      const { target_subscription_id } = body;
      if (!target_subscription_id) {
        return new Response(JSON.stringify({ error: 'target_subscription_id required' }), { status: 400, headers: corsHeaders });
      }
      
      const { error: deleteSubError } = await supabaseAdmin.from('subscriptions').delete().eq('id', target_subscription_id);
      if (deleteSubError) throw new Error(`Failed to delete subscription: ${deleteSubError.message}`);
    } else if (action === 'generate_tool_credential') {
      const { tool_slug } = body;
      if (!tool_slug || typeof tool_slug !== 'string' || !tool_slug.trim()) {
        return new Response(JSON.stringify({ error: 'tool_slug is required' }), { status: 400, headers: corsHeaders });
      }

      const cleanSlug = tool_slug.trim().toLowerCase();

      // 1. Cryptographically secure random token generation (256-bit entropy via CSPRNG)
      const rawToken = generateSecureToken(cleanSlug);

      // 2. Hash token with SHA-256 for persistent storage
      const tokenHash = await sha256Hex(rawToken);
      const keyPrefix = `${rawToken.slice(0, 16)}...${rawToken.slice(-4)}`;

      // 3. Store in tool_credentials (NEVER store raw token)
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('tool_credentials')
        .insert({
          tool_slug: cleanSlug,
          credential_hash: tokenHash,
          key_prefix: keyPrefix,
        })
        .select('id, created_at')
        .single();

      if (insertError) {
        throw new Error(`Failed to store tool credential: ${insertError.message}`);
      }

      // 4. Audit log (without raw token or hash)
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: 'generated_tool_credential',
        details: {
          credential_id: inserted.id,
          tool_slug: cleanSlug,
          key_prefix: keyPrefix,
        },
      });

      // 5. Return raw token exactly ONCE to admin
      return new Response(
        JSON.stringify({
          success: true,
          credential_id: inserted.id,
          tool_slug: cleanSlug,
          key_prefix: keyPrefix,
          raw_token: rawToken, // Returned strictly once here. Never saved in plaintext anywhere.
          created_at: inserted.created_at,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (action === 'revoke_tool_credential') {
      const { credential_id } = body;
      if (!credential_id) {
        return new Response(JSON.stringify({ error: 'credential_id is required' }), { status: 400, headers: corsHeaders });
      }

      const { data: updated, error: revokeError } = await supabaseAdmin
        .from('tool_credentials')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', credential_id)
        .select('id, tool_slug, key_prefix')
        .single();

      if (revokeError) {
        throw new Error(`Failed to revoke credential: ${revokeError.message}`);
      }

      // Audit log
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: 'revoked_tool_credential',
        details: {
          credential_id: updated.id,
          tool_slug: updated.tool_slug,
          key_prefix: updated.key_prefix,
        },
      });

      return new Response(JSON.stringify({ success: true, revoked_credential: updated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 4. Log standard actions to admin_audit_log
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: action === 'delete_user' ? 'deleted_user' : 'deleted_subscription',
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
