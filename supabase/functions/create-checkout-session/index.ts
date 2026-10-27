import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.22.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Verify token with anon client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service-role client for administrative queries (overrides, pricing, guards)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // SERVER-SIDE CHECKOUT ENABLED GUARD
    if (Deno.env.get('CHECKOUT_ENABLED') !== 'true') {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        return new Response(JSON.stringify({ error: 'Checkout is not available yet' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json();
    const { product_slug } = body;

    if (!product_slug) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For single-seat products (everything except 'orderbot'), force quantity = 1 server-side, ignoring client value.
    // Orderbot keeps the client quantity.
    const effectiveQuantity = product_slug === 'orderbot' ? Number(body.quantity) : 1;

    if (product_slug === 'orderbot' && (!effectiveQuantity || effectiveQuantity < 1)) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve target access slug via trial_offers decoupling
    const { data: offerData } = await supabaseAdmin
      .from('trial_offers')
      .select('access_slug')
      .eq('tool_slug', product_slug)
      .maybeSingle();

    const resolvedAccessSlug = offerData?.access_slug || product_slug;

    // DOUBLE-CHARGE GUARD: Reject if user already has an active or trialing subscription.
    // Skip for Order Bot: multi-slot product; extra stores are bought through the same checkout.
    if (product_slug !== 'orderbot') {
      const { data: existingSubs } = await supabaseAdmin
        .from('subscriptions')
        .select('id, status, is_trial, current_period_end')
        .eq('user_id', user.id)
        .eq('product_slug', resolvedAccessSlug)
        .is('store_id', null)
        .in('status', ['active', 'trialing']);

      const hasActiveSub = (existingSubs || []).some(
        (sub: { current_period_end: string | null }) =>
          !sub.current_period_end || new Date(sub.current_period_end) > new Date()
      );

      if (hasActiveSub) {
        return new Response(JSON.stringify({
          error: 'You already have an active subscription for this tool.',
          code: 'already_subscribed',
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // TRIAL ELIGIBILITY CHECK (Migration 034)
    // For tool rccp, inspect trial eligibility via service-role RPC.
    let isEligibleTrial = false;
    let trialDays = 0;
    let trialEligibilityReason: string | null = null;

    if (product_slug === 'rccp') {
      const { data: eligibility, error: eligibilityError } = await supabaseAdmin
        .rpc('trial_eligibility_for', {
          p_user_id: user.id,
          p_tool_slug: 'rccp',
        });

      if (!eligibilityError && eligibility) {
        if (eligibility.eligible) {
          isEligibleTrial = true;
          trialDays = Number(eligibility.trial_days) || 30;
        } else {
          trialEligibilityReason = eligibility.reason || 'not_eligible';
        }
      } else if (eligibilityError) {
        console.warn('trial_eligibility_for error:', eligibilityError);
        trialEligibilityReason = 'rpc_error';
      }
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Resolve Stripe product ID via existing lookup key
    const prices = await stripe.prices.list({
      lookup_keys: [product_slug],
      active: true,
      expand: ['data.product'],
    });

    if (prices.data.length === 0) {
      return new Response(JSON.stringify({ error: `No active price found for slug: ${product_slug}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseStripePrice = prices.data[0];
    const productId = typeof baseStripePrice.product === 'object'
      ? (baseStripePrice.product as Stripe.Product).id
      : (baseStripePrice.product as string);

    // SERVER-SIDE PRICE RESOLUTION
    // 1. Fetch current catalog price from public.tools
    const { data: toolData } = await supabaseAdmin
      .from('tools')
      .select('price_monthly')
      .eq('slug', product_slug)
      .maybeSingle();

    // 2. Fetch active per-user discount override
    const nowIso = new Date().toISOString();
    const { data: override } = await supabaseAdmin
      .from('user_price_overrides')
      .select('kind, amount_cents, percent_off')
      .eq('user_id', user.id)
      .eq('tool_slug', product_slug)
      .is('revoked_at', null)
      .lte('starts_at', nowIso)
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let finalUnitAmount: number | null = null;
    let priceSource = 'stripe_lookup_fallback';

    if (toolData && toolData.price_monthly !== null && toolData.price_monthly !== undefined) {
      const basePriceCents = Math.round(Number(toolData.price_monthly) * 100);

      if (override) {
        if (override.kind === 'fixed_price' && override.amount_cents !== null && override.amount_cents !== undefined) {
          finalUnitAmount = override.amount_cents;
          priceSource = 'user_override';
        } else if (override.kind === 'percent_off' && override.percent_off !== null && override.percent_off !== undefined) {
          finalUnitAmount = Math.round(basePriceCents * (1 - Number(override.percent_off) / 100));
          priceSource = 'user_override';
        }
      }

      if (finalUnitAmount === null) {
        finalUnitAmount = basePriceCents;
        priceSource = 'admin_price';
      }
    }

    // Minimum Stripe amount check (minimum 50 cents AUD)
    if (finalUnitAmount !== null && finalUnitAmount < 50) {
      return new Response(JSON.stringify({
        error: 'Calculated price is below the minimum allowed amount.',
        code: 'price_too_low',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build Checkout line item using price_data
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (finalUnitAmount !== null) {
      lineItems = [
        {
          price_data: {
            currency: 'aud',
            unit_amount: finalUnitAmount,
            recurring: { interval: 'month' },
            product: productId,
          },
          quantity: effectiveQuantity,
        },
      ];
    } else {
      // Fallback to static price ID if DB price is unavailable
      lineItems = [
        {
          price: baseStripePrice.id,
          quantity: effectiveQuantity,
        },
      ];
    }

    const origin = req.headers.get('Origin') || 'https://automationalchemists.com';

    // Metadata payload set on BOTH session and subscription_data
    const sessionMetadata: Record<string, string> = {
      user_id: user.id,
      tool_slug: product_slug,
      price_source: priceSource,
    };

    const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: sessionMetadata,
      subscription_data: {
        metadata: sessionMetadata,
      },
      line_items: lineItems,
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/tools/${product_slug}`,
    };

    // If eligible for trial: configure subscription trial options
    if (isEligibleTrial) {
      sessionMetadata.trial = 'true';
      sessionCreateParams.metadata = sessionMetadata;
      sessionCreateParams.subscription_data = {
        metadata: sessionMetadata,
        trial_period_days: trialDays,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
      };
      sessionCreateParams.payment_method_collection = 'always';
      sessionCreateParams.phone_number_collection = {
        enabled: true,
      };

      const startDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      const formattedDate = startDate.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const displayPrice = finalUnitAmount !== null
        ? (finalUnitAmount % 100 === 0 ? (finalUnitAmount / 100).toString() : (finalUnitAmount / 100).toFixed(2))
        : (toolData?.price_monthly ? Number(toolData.price_monthly).toString() : '9');

      sessionCreateParams.custom_text = {
        submit: {
          message: `${trialDays} days free, then A$${displayPrice}/month starting ${formattedDate}. Cancel anytime before then.`,
        },
      };
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create(sessionCreateParams);

    const responsePayload: Record<string, unknown> = {
      url: session.url,
      trial: isEligibleTrial,
    };

    if (!isEligibleTrial && product_slug === 'rccp') {
      responsePayload.reason = trialEligibilityReason || 'not_eligible';
    }

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error in create-checkout-session:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
