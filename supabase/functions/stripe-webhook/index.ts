import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.22.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
});

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

      // Expand subscription to get accurate status, period, and quantity
      if (p_stripe_subscription_id) {
        const subscription = await stripe.subscriptions.retrieve(p_stripe_subscription_id);
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
