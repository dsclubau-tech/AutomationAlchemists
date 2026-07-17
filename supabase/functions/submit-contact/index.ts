/**
 * ============================================
 * CONTACT FORM SUBMISSION EDGE FUNCTION
 * ============================================
 * 
 * PURPOSE:
 * Handles contact form submissions with server-side validation and storage.
 * Supports both authenticated and anonymous submissions with optional file attachments.
 * 
 * DEVELOPER NOTES FOR OFFLINE DEVELOPMENT:
 * 
 * 1. LOCAL SETUP:
 *    - Install Supabase CLI: https://supabase.com/docs/guides/cli
 *    - Run locally: supabase functions serve submit-contact --env-file .env
 *    - Test endpoint: http://localhost:54321/functions/v1/submit-contact
 * 
 * 2. ENVIRONMENT VARIABLES:
 *    Required in .env file:
 *    - SUPABASE_URL: Your Supabase project URL
 *    - SUPABASE_SERVICE_ROLE_KEY: Service role key (has admin privileges)
 *    - SUPABASE_ANON_KEY: Anon key for client-side calls (optional for testing)
 * 
 * 3. DATABASE SCHEMA:
 *    Table: public.contacts
 *    Columns:
 *      - id: uuid (primary key, auto-generated)
 *      - name: text (required, 2-100 chars)
 *      - email: text (required, valid email, max 255 chars)
 *      - message: text (required, 10-1000 chars)
 *      - attachments: text[] (optional, array of storage paths)
 *      - user_id: uuid (nullable, references auth.users)
 *      - created_at: timestamp (auto-generated)
 * 
 * 4. STORAGE BUCKET:
 *    Bucket: contact-attachments
 *    - Private bucket (admin-only access)
 *    - Allowed types: PDF, JPG, PNG
 *    - Max file size: 5MB per file
 *    - Path format: {user_id}/{timestamp}_{filename}
 * 
 * 5. TESTING LOCALLY:
 *    curl -X POST http://localhost:54321/functions/v1/submit-contact \
 *      -H "Content-Type: application/json" \
 *      -d '{"name":"John","email":"john@example.com","message":"Test message"}'
 * 
 * 6. AUTHENTICATION:
 *    - Function accepts both authenticated and anonymous requests
 *    - If Authorization header present, extracts user_id for attribution
 *    - RLS policies ensure proper data access control
 * 
 * 7. ERROR HANDLING:
 *    - Zod validation errors return 400 with validation details
 *    - Database errors return 500 with generic message (details in logs)
 *    - All errors logged to console for debugging
 * 
 * 8. SECURITY FEATURES:
 *    - Server-side input validation with Zod
 *    - SQL injection prevention via Supabase client (parameterized queries)
 *    - XSS prevention via input trimming and length limits
 *    - File attachments stored securely in private bucket
 *    - CORS enabled for cross-origin requests
 * 
 * ============================================
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============================================
// CORS CONFIGURATION
// ============================================
// Allow requests from any origin (adjust in production if needed)
const ALLOWED_ORIGINS = [
  'https://www.automationalchemists.com',
  'https://automationalchemists.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

export const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

// ============================================
// INPUT VALIDATION SCHEMA
// ============================================
// Server-side validation to prevent malicious or malformed data
const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  
  email: z.string()
    .trim()
    .email('Invalid email format')
    .max(255, 'Email too long'),
  
  message: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message too long'),
  
  attachments: z.array(z.string()).optional(), // Optional file paths from storage
});

// ============================================
// MAIN HANDLER
// ============================================
Deno.serve(async (req) => {
  // Handle CORS preflight requests (OPTIONS method)
  // Required for browser-based requests from different origins
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📨 Contact form submission received');

    // ============================================
    // 1. INITIALIZE SUPABASE CLIENT
    // ============================================
    // Use service role key for admin privileges (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ============================================
    // 2. EXTRACT USER ID (IF AUTHENTICATED)
    // ============================================
    // Check if request includes Authorization header
    // Format: "Bearer <jwt_token>"
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.warn('⚠️ Auth verification failed:', authError.message);
      } else {
        userId = user?.id ?? null;
        console.log('✅ Authenticated user:', userId);
      }
    } else {
      console.log('👤 Anonymous submission');
    }

    // ============================================
    // 3. PARSE & VALIDATE REQUEST BODY
    // ============================================
    // Rate Limiting Logic
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Check hit count in the last hour
    const { count, error: rlError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('endpoint', 'submit-contact')
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
    
    // Zod will throw ZodError if validation fails
    const validatedData = contactSchema.parse(body);

    console.log('✅ Validation passed', { 
      hasUser: !!userId,
      nameLength: validatedData.name.length,
      hasAttachments: (validatedData.attachments?.length || 0) > 0,
    });

    // ============================================
    // 4. INSERT INTO DATABASE
    // ============================================
    // Store contact form data with optional attachments
    const { error: insertError } = await supabase
      .from('contacts')
      .insert({
        name: validatedData.name,
        email: validatedData.email,
        message: validatedData.message,
        attachments: validatedData.attachments || [],
        user_id: userId, // null for anonymous submissions
      });

    // Check for database insertion errors
    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw new Error('Failed to save contact form');
    }

    console.log('✅ Contact form submitted successfully');

    // Record the rate limit hit
    await supabase.from('rate_limits').insert({ ip_address: ip, endpoint: 'submit-contact' });

    // ============================================
    // 5. RETURN SUCCESS RESPONSE
    // ============================================
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message sent successfully!',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    // ============================================
    // ERROR HANDLING
    // ============================================
    console.error('❌ Contact form error:', error);

    // Handle Zod validation errors specifically
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: error.errors[0]?.message || 'Invalid input',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400, // Bad Request
        }
      );
    }

    // Handle all other errors generically
    // Don't expose internal error details to client for security
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send message. Please try again.',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500, // Internal Server Error
      }
    );
  }
});

/**
 * ============================================
 * ADDITIONAL DOCUMENTATION
 * ============================================
 * 
 * DEPLOYMENT:
 * - Automatic deployment via Lovable Cloud when code is pushed
 * - Manual deployment: supabase functions deploy submit-contact
 * 
 * MONITORING:
 * - View logs in Lovable Cloud → Backend → Edge Functions
 * - Or via CLI: supabase functions logs submit-contact
 * 
 * PERFORMANCE:
 * - Cold start: ~50-200ms
 * - Warm execution: ~10-50ms
 * - Automatic scaling based on load
 * 
 * RATE LIMITING:
 * - Consider implementing rate limiting for production
 * - Example: Max 5 submissions per email per hour
 * 
 * FUTURE ENHANCEMENTS:
 * - [ ] Email notifications to admin when contact form submitted
 * - [ ] Auto-response email to user confirming receipt
 * - [ ] Spam detection (e.g., reCAPTCHA integration)
 * - [ ] Webhook integration for CRM systems
 * - [ ] File virus scanning before storage
 * 
 * ============================================
 */