import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const newsletterSchema = z.object({
  email: z.string().trim().email('Invalid email format').max(255, 'Email too long'),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Rate Limiting Logic
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Check hit count in the last hour
    const { count, error: rlError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('endpoint', 'submit-newsletter')
      .gte('created_at', oneHourAgo);

    if (rlError) {
      console.error('Rate limit check error:', rlError);
    }

    if (count !== null && count >= 5) {
      console.log('🔴 Rate limit exceeded for IP:', ip);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    const body = await req.json();
    console.log('📝 Validating input data...');
    
    const validatedData = newsletterSchema.parse(body);

    // Check if already subscribed to prevent duplicates
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', validatedData.email)
      .maybeSingle();

    if (existing) {
       return new Response(
         JSON.stringify({ error: 'Already subscribed' }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
       );
    }

    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: validatedData.email,
      });

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw new Error('Failed to save subscriber');
    }

    console.log('✅ Newsletter subscribed successfully');

    // Record the rate limit hit
    await supabase.from('rate_limits').insert({ ip_address: ip, endpoint: 'submit-newsletter' });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscribed successfully!',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Newsletter error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: error.errors[0]?.message || 'Invalid input',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Failed to subscribe. Please try again.',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
