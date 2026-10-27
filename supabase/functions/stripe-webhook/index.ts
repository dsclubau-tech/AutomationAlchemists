import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.22.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
});

// Helper for HMAC-SHA256 phone hashing using Web Crypto API
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to resolve card fingerprint with fallback ordering:
// 1. subscription.default_payment_method (expanded object or retrieved from ID)
// 2. customer's invoice_settings.default_payment_method
// 3. stripe.paymentMethods.list({ customer, type: 'card', limit: 1 })
async function resolveCardFingerprint(
  stripeClient: Stripe,
  subscription: Stripe.Subscription,
  customerId: string | null
): Promise<string | null> {
  // 1. Check subscription.default_payment_method
  let pm: Stripe.PaymentMethod | string | null = subscription.default_payment_method as Stripe.PaymentMethod | string | null;
  if (typeof pm === 'string') {
    try {
      pm = await stripeClient.paymentMethods.retrieve(pm);
    } catch {
      pm = null;
    }
  }
  if (pm && typeof pm === 'object' && (pm as Stripe.PaymentMethod).card?.fingerprint) {
    return (pm as Stripe.PaymentMethod).card!.fingerprint;
  }

  const resolvedCustomerId = customerId ?? (typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id) ?? null;
  if (!resolvedCustomerId) return null;

  // 2. Fallback 1: customer's invoice_settings.default_payment_method
  try {
    const customer = await stripeClient.customers.retrieve(resolvedCustomerId, {
      expand: ['invoice_settings.default_payment_method'],
    });
    if (customer && !(customer as Stripe.DeletedCustomer).deleted) {
      let custPm = (customer as Stripe.Customer).invoice_settings?.default_payment_method as Stripe.PaymentMethod | string | null;
      if (typeof custPm === 'string') {
        try {
          custPm = await stripeClient.paymentMethods.retrieve(custPm);
        } catch {
          custPm = null;
        }
      }
      if (custPm && typeof custPm === 'object' && (custPm as Stripe.PaymentMethod).card?.fingerprint) {
        return (custPm as Stripe.PaymentMethod).card!.fingerprint;
      }
    }
  } catch {
    // proceed to next fallback
  }

  // 3. Fallback 2: stripe.paymentMethods.list({ customer, type: 'card', limit: 1 })
  try {
    const pms = await stripeClient.paymentMethods.list({
      customer: resolvedCustomerId,
      type: 'card',
      limit: 1,
    });
    if (pms?.data?.[0]?.card?.fingerprint) {
      return pms.data[0].card.fingerprint;
    }
  } catch {
    // ignore
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing Stripe signature or webhook secret.');
    return new Response('Missing Signature', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`⚠️ Webhook signature verification failed: ${errorMsg}`);
    return new Response(`Webhook Error: ${errorMsg}`, { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    let p_quantity = 0;
    let p_user_id: string | null = null;
    let p_email: string | null = null;
    let p_product_slug: string | null = null;
    let p_stripe_customer_id: string | null = null;
    let p_stripe_subscription_id: string | null = null;
    let p_stripe_price_id: string | null = null;
    let p_price_per_month = 0;
    let p_current_period_start: string | null = null;
    let p_current_period_end: string | null = null;
    let p_subscription_status: string | null = null;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      p_stripe_customer_id = session.customer as string;
      p_stripe_subscription_id = session.subscription as string;
      p_user_id = session.client_reference_id ?? session.metadata?.user_id ?? null;
      p_email = session.customer_details?.email ?? null;
      p_product_slug = session.metadata?.tool_slug ?? session.metadata?.product_slug ?? null;

      const isTrialMode = session.mode === 'subscription' && session.metadata?.trial === 'true';

      // Expand subscription to get accurate status, period, and quantity
      if (p_stripe_subscription_id) {
        const subscription = isTrialMode
          ? await stripe.subscriptions.retrieve(p_stripe_subscription_id, {
              expand: ['default_payment_method'],
            })
          : await stripe.subscriptions.retrieve(p_stripe_subscription_id);

        p_subscription_status = subscription.status;
        p_current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
        p_current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Secondary fallback to subscription metadata if session metadata was missing
        p_user_id = p_user_id ?? subscription.metadata?.user_id ?? null;
        p_product_slug = p_product_slug ?? subscription.metadata?.tool_slug ?? subscription.metadata?.product_slug ?? null;

        const item = subscription.items.data[0];
        if (item) {
          p_quantity = item.quantity || 1;
          p_stripe_price_id = item.price.id;
          p_price_per_month = (item.price.unit_amount || 0) / 100;
        }

        // Card-Required Free Trial processing
        if (isTrialMode) {
          // Resolve target access slug via trial_offers decoupling
          const toolSlug = session.metadata?.tool_slug ?? session.metadata?.product_slug ?? 'rccp';
          const { data: offerData } = await supabaseAdmin
            .from('trial_offers')
            .select('access_slug')
            .eq('tool_slug', toolSlug)
            .maybeSingle();

          const resolvedAccessSlug = offerData?.access_slug || toolSlug;

          // DUPLICATE-SUBSCRIPTION GUARD:
          // Look up user's existing subscriptions row for resolved access slug (service role, store_id IS NULL).
          // If a row exists with a DIFFERENT stripe_subscription_id and its status is not 'canceled',
          // this is a duplicate checkout: cancel the NEW Stripe subscription with stripe.subscriptions.cancel (no charge),
          // do NOT touch the database row, return HTTP 200 with {received:true, duplicate_subscription:true}.
          // If cancelling fails return HTTP 500 so Stripe retries.
          // If the stripe_subscription_id is the SAME, continue as today (retry of the same event).
          if (p_user_id) {
            const { data: existingSub, error: subErr } = await supabaseAdmin
              .from('subscriptions')
              .select('id, stripe_subscription_id, status')
              .eq('user_id', p_user_id)
              .eq('product_slug', resolvedAccessSlug)
              .is('store_id', null)
              .maybeSingle();

            if (subErr) {
              console.error('Error querying existing subscriptions for duplicate check:', subErr);
              throw subErr;
            }

            if (existingSub) {
              const isDifferentSub = existingSub.stripe_subscription_id !== p_stripe_subscription_id;
              const isNotCanceled = existingSub.status !== 'canceled';

              if (isDifferentSub && isNotCanceled) {
                console.warn(
                  `Duplicate trial checkout detected for user ${p_user_id}. Existing sub: ${existingSub.stripe_subscription_id}, new sub: ${p_stripe_subscription_id}. Cancelling new sub.`
                );
                try {
                  await stripe.subscriptions.cancel(p_stripe_subscription_id as string);
                } catch (cancelErr: unknown) {
                  const cancelMsg = cancelErr instanceof Error ? cancelErr.message : String(cancelErr);
                  console.error(`Failed to cancel duplicate subscription ${p_stripe_subscription_id}:`, cancelMsg);
                  return new Response(JSON.stringify({ error: `Failed to cancel duplicate subscription: ${cancelMsg}` }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                  });
                }

                // Return HTTP 200 with {received:true, duplicate_subscription:true} without touching the database row
                return new Response(JSON.stringify({ received: true, duplicate_subscription: true }), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' },
                });
              }
            }
          }

          if (subscription.status === 'trialing') {
            const cardFingerprint = await resolveCardFingerprint(
              stripe,
              subscription,
              p_stripe_customer_id
            );
            const customerPhone = session.customer_details?.phone ?? null;
            const pepper = Deno.env.get('TRIAL_IDENTITY_PEPPER');

            // If the pepper or the fingerprint is missing, return 500 so Stripe retries
            if (!pepper || !cardFingerprint) {
              console.error('Trial checkout missing required pepper or card fingerprint after all fallbacks.');
              return new Response(JSON.stringify({ error: 'Missing pepper or card fingerprint' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            const phoneHash = customerPhone
              ? await hmacSha256Hex(pepper, customerPhone.trim())
              : null;

            const trialEndIso = subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : p_current_period_end;

            // Call finalize_card_trial with service role
            const { data: finalizeData, error: finalizeErr } = await supabaseAdmin.rpc('finalize_card_trial', {
              p_user_id,
              p_tool_slug: toolSlug,
              p_email,
              p_card_fingerprint: cardFingerprint,
              p_phone_hash: phoneHash,
              p_trial_end: trialEndIso,
            });

            if (finalizeErr) {
              console.error('finalize_card_trial RPC error:', finalizeErr);
              throw finalizeErr;
            }

            const trialResult = finalizeData as { ok?: boolean; reason?: string; claim_id?: string } | null;

            if (!trialResult?.ok) {
              console.warn(`Trial denied for user ${p_user_id}: ${trialResult?.reason}. Cancelling subscription immediately.`);
              await stripe.subscriptions.cancel(p_stripe_subscription_id);
              // Return 200 without calling process_stripe_webhook_event
              return new Response(JSON.stringify({ received: true, trial_denied: trialResult?.reason }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            // Approved: set status to 'trialing' and period end to subscription trial_end
            p_subscription_status = 'trialing';
            p_current_period_end = trialEndIso;
          }
        }
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      p_stripe_customer_id = subscription.customer as string;
      p_stripe_subscription_id = subscription.id;
      p_subscription_status = subscription.status;
      p_current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
      p_current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Mirror cancel_at_period_end on customer.subscription.updated
      if (event.type === 'customer.subscription.updated') {
        const { error: mirrorErr } = await supabaseAdmin.rpc('mirror_cancel_at_period_end', {
          p_stripe_subscription_id: subscription.id,
          p_flag: subscription.cancel_at_period_end,
        });
        if (mirrorErr) {
          console.warn('mirror_cancel_at_period_end warning:', mirrorErr);
        }
      }

      // Extract user_id and product_slug from subscription metadata
      p_user_id = subscription.metadata?.user_id ?? null;
      p_product_slug = subscription.metadata?.tool_slug ?? subscription.metadata?.product_slug ?? null;

      // Attempt customer email extraction if available
      if (typeof subscription.customer === 'string') {
        try {
          const customerObj = await stripe.customers.retrieve(subscription.customer);
          if (!customerObj.deleted && customerObj.email) {
            p_email = customerObj.email;
          }
        } catch (custErr: unknown) {
          const custMsg = custErr instanceof Error ? custErr.message : String(custErr);
          console.warn(`Could not retrieve customer email for customer ${subscription.customer}:`, custMsg);
        }
      }
      
      const item = subscription.items.data[0];
      if (item) {
        p_quantity = item.quantity || 1;
        p_stripe_price_id = item.price.id;
        p_price_per_month = (item.price.unit_amount || 0) / 100;
      }
    } else if (event.type === 'customer.subscription.trial_will_end') {
      // Trial will end soon: no-op for now; reminder email is handled in a later phase
      return new Response(JSON.stringify({ received: true, handled: 'trial_will_end_noop' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      p_stripe_customer_id = invoice.customer as string;
      p_stripe_subscription_id = invoice.subscription as string;
      p_subscription_status = 'past_due';
      p_email = invoice.customer_email ?? null;
      
      if (p_stripe_subscription_id) {
        try {
          const sub = await stripe.subscriptions.retrieve(p_stripe_subscription_id);
          p_user_id = sub.metadata?.user_id ?? null;
          p_product_slug = sub.metadata?.tool_slug ?? sub.metadata?.product_slug ?? null;
          p_current_period_start = new Date(sub.current_period_start * 1000).toISOString();
          p_current_period_end = new Date(sub.current_period_end * 1000).toISOString();
        } catch (subErr: unknown) {
          const subMsg = subErr instanceof Error ? subErr.message : String(subErr);
          console.warn(`Could not retrieve subscription metadata for invoice ${invoice.id}:`, subMsg);
        }
      }

      const lineItem = invoice.lines?.data[0];
      p_quantity = lineItem ? (lineItem.quantity || 0) : 0;
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      p_stripe_customer_id = charge.customer as string;
      p_quantity = 0;
      
      if (charge.invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(charge.invoice as string);
          p_stripe_subscription_id = invoice.subscription as string;
          p_email = invoice.customer_email ?? null;

          if (p_stripe_subscription_id) {
            const sub = await stripe.subscriptions.retrieve(p_stripe_subscription_id);
            p_user_id = sub.metadata?.user_id ?? null;
            p_product_slug = sub.metadata?.tool_slug ?? sub.metadata?.product_slug ?? null;
          }
        } catch (invErr: unknown) {
          const invMsg = invErr instanceof Error ? invErr.message : String(invErr);
          console.warn(`Could not resolve subscription from refund invoice:`, invMsg);
        }
      } else {
        console.warn('Refund event without invoice - cannot determine subscription ID reliably');
      }
    } else {
      // Ignored event
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Call atomic database RPC
    if (p_stripe_subscription_id) {
      const { data, error } = await supabaseAdmin.rpc('process_stripe_webhook_event', {
        p_event_id: event.id,
        p_event_type: event.type,
        p_user_id,
        p_email,
        p_product_slug,
        p_stripe_customer_id,
        p_stripe_subscription_id,
        p_stripe_price_id,
        p_price_per_month,
        p_current_period_start,
        p_current_period_end,
        p_quantity,
        p_subscription_status
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      // Handle graceful "skipped" outcomes by returning 200 to halt Stripe retries
      const rpcMessage = (data as Record<string, unknown> | null)?.message;
      if (typeof rpcMessage === 'string' && rpcMessage.startsWith('skipped')) {
        console.log(`Event ${event.id} skipped gracefully: ${rpcMessage}`);
        return new Response(JSON.stringify({ received: true, skipped: rpcMessage }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    } else {
      console.warn(`Could not determine stripe_subscription_id for event ${event.id}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Processing Error:', errorMsg);
    // Stripe retries on 500
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
