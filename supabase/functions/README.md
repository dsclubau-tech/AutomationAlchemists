# Supabase Edge Functions - Development Guide

## 📋 Overview

This directory contains Supabase Edge Functions for the backend logic of your application. Edge Functions are serverless TypeScript/JavaScript functions that run on Deno and automatically scale with your traffic.

## 🏗️ Architecture

```
supabase/functions/
├── submit-contact/        # Contact form submission handler
│   └── index.ts          # Main handler with validation & storage
└── README.md             # This file
```

## 🚀 Local Development Setup

### Prerequisites

1. **Install Supabase CLI**
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # Windows (via Scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   
   # Linux
   curl -sL https://github.com/supabase/cli/releases/latest/download/supabase-linux-x64.tar.gz | tar -xz
   ```

2. **Install Deno** (optional, for linting/testing)
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

### Environment Setup

Create a `.env` file in the `supabase/functions` directory:

```bash
# supabase/functions/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

⚠️ **IMPORTANT**: Never commit the `.env` file to version control!

### Running Functions Locally

```bash
# Start all functions
supabase functions serve

# Start specific function
supabase functions serve submit-contact

# With custom port
supabase functions serve --env-file .env
```

Local endpoint: `http://localhost:54321/functions/v1/{function-name}`

## 📝 Available Functions

### 1. submit-contact

**Purpose**: Handles contact form submissions with validation and file attachments.

**Endpoint**: `/submit-contact`

**Method**: POST

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I'd like to discuss a project...",
  "attachments": ["optional-file-path1", "optional-file-path2"]
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Message sent successfully!"
}
```

**Response Error** (400/500):
```json
{
  "error": "Validation failed",
  "details": "Name must be at least 2 characters"
}
```

**Testing Locally**:
```bash
curl -X POST http://localhost:54321/functions/v1/submit-contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message with sufficient length"
  }'
```

**With Authentication**:
```bash
curl -X POST http://localhost:54321/functions/v1/submit-contact \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Authenticated User",
    "email": "user@example.com",
    "message": "Message from authenticated user"
  }'
```

## 🧪 Testing

### Manual Testing

1. Start the function locally
2. Use curl, Postman, or Thunder Client
3. Check console logs for debugging

### Unit Testing (Future Enhancement)

```typescript
// Example test structure
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

Deno.test("validates contact form data", () => {
  // Test implementation
});
```

## 📦 Deployment

### Automatic Deployment

Functions are automatically deployed when you push code to your Lovable Cloud project. No manual steps required!

### Manual Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy submit-contact

# With custom project
supabase functions deploy --project-ref your-project-ref
```

### Verify Deployment

```bash
# View function logs
supabase functions logs submit-contact

# View real-time logs
supabase functions logs submit-contact --follow
```

## 🔒 Security Best Practices

### 1. Input Validation
- ✅ Always use Zod or similar schema validation
- ✅ Validate on both client and server side
- ✅ Set maximum string lengths to prevent abuse
- ✅ Sanitize inputs (trim, lowercase where appropriate)

### 2. Authentication
- ✅ Use `auth.getUser()` to verify JWT tokens
- ✅ Extract user_id from authenticated requests
- ✅ Support both authenticated and anonymous requests where appropriate
- ❌ Never trust client-provided user_id without verification

### 3. Error Handling
- ✅ Log detailed errors server-side for debugging
- ✅ Return generic error messages to clients
- ❌ Never expose internal error details to users
- ✅ Use appropriate HTTP status codes

### 4. CORS Configuration
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust for production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Always handle OPTIONS requests
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### 5. Environment Variables
- ✅ Use `Deno.env.get()` for secrets
- ✅ Store sensitive keys in Supabase Secrets
- ❌ Never hardcode credentials
- ✅ Use service role key for admin operations

## 🛠️ Common Patterns

### Pattern 1: Authentication Check

```typescript
// Extract user ID from JWT
const authHeader = req.headers.get('Authorization');
let userId: string | null = null;

if (authHeader) {
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  userId = user?.id ?? null;
}
```

### Pattern 2: Input Validation

```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});

try {
  const validated = schema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({ error: error.errors[0].message }),
      { status: 400, headers: corsHeaders }
    );
  }
}
```

### Pattern 3: Database Operations

```typescript
// Always use Supabase client methods, never raw SQL
const { data, error } = await supabase
  .from('table_name')
  .insert({ column: value });

if (error) {
  console.error('Database error:', error);
  throw new Error('Operation failed');
}
```

### Pattern 4: Storage Operations

```typescript
// Upload file
const { error } = await supabase.storage
  .from('bucket-name')
  .upload(filePath, fileData);

// Create signed URL (for private buckets)
const { data } = await supabase.storage
  .from('bucket-name')
  .createSignedUrl(filePath, 3600); // 1 hour expiry
```

## 📊 Monitoring & Debugging

### View Logs

**Via Lovable Cloud UI**:
1. Go to Backend → Edge Functions
2. Select function
3. View logs tab

**Via CLI**:
```bash
# Recent logs
supabase functions logs submit-contact

# Live logs
supabase functions logs submit-contact --follow

# Filter by level
supabase functions logs submit-contact --level error
```

### Debug Tips

1. **Use console.log extensively**:
   ```typescript
   console.log('📨 Request received:', { method: req.method });
   console.log('✅ Validation passed');
   console.error('❌ Error occurred:', error);
   ```

2. **Check request headers**:
   ```typescript
   console.log('Headers:', Object.fromEntries(req.headers));
   ```

3. **Test authentication**:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser(token);
   console.log('User:', user?.id ?? 'anonymous');
   ```

4. **Verify environment variables**:
   ```typescript
   console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL'));
   ```

## 🚨 Common Issues & Solutions

### Issue: CORS Errors

**Symptom**: Browser console shows CORS policy error

**Solution**:
```typescript
// Always include CORS headers in ALL responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

// Include in all responses
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

### Issue: Authentication Fails

**Symptom**: User is null despite being logged in

**Solution**:
```typescript
// Ensure client passes Authorization header
const { data, error } = await supabase.functions.invoke('function-name', {
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
  body: { data },
});
```

### Issue: Validation Errors

**Symptom**: Zod throws errors for valid data

**Solution**:
- Check schema matches expected data types
- Use `.trim()` for strings to handle whitespace
- Use `.optional()` for non-required fields

### Issue: Database Insert Fails

**Symptom**: RLS policy violation

**Solution**:
1. Check RLS policies on the table
2. Use service role key for admin operations
3. Ensure user_id matches authenticated user

## 🎯 Performance Optimization

1. **Cold Start Optimization**:
   - Keep imports minimal
   - Use lazy loading where possible
   - Cache frequently accessed data

2. **Database Queries**:
   - Use `.select()` to fetch only needed columns
   - Add indexes on frequently queried columns
   - Use `.limit()` for pagination

3. **File Uploads**:
   - Validate file size before processing
   - Use streaming for large files
   - Implement retry logic for failures

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Manual](https://deno.land/manual)
- [Zod Documentation](https://zod.dev/)
- [Lovable Cloud Docs](https://docs.lovable.dev/features/cloud)

## 🆘 Getting Help

1. Check function logs first
2. Review this README for common issues
3. Test locally with curl/Postman
4. Check Supabase Discord community
5. Review edge function documentation

## 🔄 Future Enhancements

Potential improvements to consider:

- [ ] Rate limiting per IP/user
- [ ] Email notifications via Resend/SendGrid
- [ ] Webhook integrations
- [ ] Automated testing suite
- [ ] Performance monitoring
- [ ] Error tracking (Sentry integration)
- [ ] Caching layer (Redis)
- [ ] Queue system for heavy processing

---

**Last Updated**: Check git commit history for latest changes

**Maintainer**: Development team

**Questions?** Create an issue or check the Lovable Cloud documentation.