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
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
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
    let p_user_id = null;
    let p_email = null;
    let p_product_slug = null;
    let p_stripe_customer_id = null;
    let p_stripe_subscription_id = null;
    let p_stripe_price_id = null;
    let p_price_per_month = 0;
    let p_current_period_start = null;
    let p_current_period_end = null;
    let p_subscription_status = null;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      p_stripe_customer_id = session.customer as string;
      p_stripe_subscription_id = session.subscription as string;
      p_user_id = session.client_reference_id;
      p_email = session.customer_details?.email;
      p_product_slug = session.metadata?.product_slug;

      // Expand subscription to get accurate status and quantity
      if (p_stripe_subscription_id) {
        const subscription = await stripe.subscriptions.retrieve(p_stripe_subscription_id);
        p_subscription_status = subscription.status;
        p_current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
        p_current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
        
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
      p_subscription_status = 'past_due'; // or whatever Stripe set it to
      
      const lineItem = invoice.lines?.data[0];
      if (lineItem) {
        p_quantity = lineItem.quantity || 0; // extracted from invoice line item
      } else {
        p_quantity = 0; // fallback for non-quantity event parsing
      }
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      p_stripe_customer_id = charge.customer as string;
      // charge doesn't explicitly have a subscription without retrieving the invoice/payment intent
      // But we can try to get it if we really need to, however in this case we'd need a lookup
      // Wait, process_stripe_webhook_event requires stripe_subscription_id to do anything useful.
      // If charge.refunded doesn't have it, we might need to look it up, or we can just rely on customer.subscription.updated instead for cancellations.
      // We will look up the active subscription for the customer if missing.
      p_quantity = 0; // fallback
      
      if (!charge.invoice) {
        console.warn('Refund event without invoice - cannot determine subscription ID reliably');
      } else {
        const invoice = await stripe.invoices.retrieve(charge.invoice as string);
        p_stripe_subscription_id = invoice.subscription as string;
      }
    } else {
      // Ignored event
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Call our atomic RPC
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
    } else {
      console.warn(`Could not determine stripe_subscription_id for event ${event.id}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('Processing Error:', err);
    // Stripe retries on 500
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
