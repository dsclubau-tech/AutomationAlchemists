import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const responseHeaders = {
  'Content-Type': 'application/json',
};

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: responseHeaders,
    });
  }

  let matchedToolSlug: string | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[entitlement-check] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable');
      return new Response(JSON.stringify({ status: 'unavailable' }), {
        status: 503,
        headers: responseHeaders,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Extract Bearer token
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    const rawToken = authHeader.slice(7).trim();
    if (!rawToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    const tokenHash = await sha256Hex(rawToken);

    // Look up active credential in database
    const { data: credential, error: credError } = await supabaseAdmin
      .from('tool_credentials')
      .select('id, tool_slug')
      .eq('credential_hash', tokenHash)
      .is('revoked_at', null)
      .maybeSingle();

    if (credError) {
      console.error('[entitlement-check] Database error checking credential:', credError.message);
      return new Response(JSON.stringify({ status: 'unavailable' }), {
        status: 503,
        headers: responseHeaders,
      });
    }

    if (!credential) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    matchedToolSlug = credential.tool_slug;

    // 2. Update Credential last_used_at
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from('tool_credentials')
      .update({ last_used_at: nowIso })
      .eq('id', credential.id);

    // 3. Per-Credential Rate Limiting (100 req / min)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const rateLimitIdentifier = `cred:${credential.id}`;

    const { count: requestCount } = await supabaseAdmin
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', rateLimitIdentifier)
      .eq('endpoint', 'entitlement-check')
      .gte('created_at', oneMinuteAgo);

    if (requestCount !== null && requestCount >= 100) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          ...responseHeaders,
          'Retry-After': '60',
        },
      });
    }

    await supabaseAdmin
      .from('rate_limits')
      .insert({
        ip_address: rateLimitIdentifier,
        endpoint: 'entitlement-check',
      });

    // 4. Validate Request Body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    const { user_id, product_slug } = body ?? {};

    if (
      !user_id ||
      typeof user_id !== 'string' ||
      !UUID_REGEX.test(user_id) ||
      !product_slug ||
      typeof product_slug !== 'string' ||
      !product_slug.trim()
    ) {
      return new Response(JSON.stringify({ error: 'Invalid user_id or product_slug' }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    const cleanUserId = user_id.trim();
    const cleanProductSlug = product_slug.trim();

    // 5. Verify User Existence in auth.users
    const { data: userData, error: userLookupError } = await supabaseAdmin.auth.admin.getUserById(cleanUserId);

    if (userLookupError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'user_not_found' }), {
        status: 404,
        headers: responseHeaders,
      });
    }

    // 6. Count Active Subscriptions
    const { count: activeCount, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', cleanUserId)
      .eq('product_slug', cleanProductSlug)
      .eq('status', 'active')
      .or(`current_period_end.is.null,current_period_end.gt.${nowIso}`);

    if (subError) {
      console.error('[entitlement-check] Database error querying subscriptions:', subError.message);
      return new Response(JSON.stringify({ status: 'unavailable' }), {
        status: 503,
        headers: responseHeaders,
      });
    }

    const count = activeCount ?? 0;
    const resultStatus = count > 0 ? 'active' : 'inactive';
    const checkedAt = new Date().toISOString();

    return new Response(
      JSON.stringify({
        status: resultStatus,
        count: count,
        user_id: cleanUserId,
        product_slug: cleanProductSlug,
        checked_at: checkedAt,
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (err: any) {
    console.error(`[entitlement-check] ${matchedToolSlug ?? 'unknown'} | 503 unexpected_error:`, err?.message || err);
    return new Response(JSON.stringify({ status: 'unavailable' }), {
      status: 503,
      headers: responseHeaders,
    });
  }
});
