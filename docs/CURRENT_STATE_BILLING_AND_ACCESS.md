# Current State: Billing and Access Architecture

This document provides a factual, line-by-line audit of how billing, access gating, product slugs, and admin capabilities operate across Automation Alchemists as of October 23, 2026.

---

## 1. Data Model

All schema specifications below are derived directly from the live database snapshot (`live_db_snapshot.txt`), which supersedes repo migration files.

### 1.1 The `subscriptions` Table

#### Columns (`live_db_snapshot.txt:195-316`)
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | NO | `null` | Foreign key referencing `auth.users(id)` |
| `email` | `text` | NO | `null` | Customer email |
| `product_slug` | `text` | NO | `null` | Product identifier (`cpbot`, `orderbot`, `listflow`, etc.) |
| `status` | `text` | NO | `'inactive'::text` | Access status (`active`, `inactive`, `expired`, `canceled`) |
| `stripe_customer_id` | `text` | YES | `null` | Stripe customer object ID (`cus_...`) |
| `stripe_subscription_id` | `text` | YES | `null` | Stripe subscription object ID (`sub_...`) |
| `stripe_price_id` | `text` | YES | `null` | Stripe price ID (`price_...`) |
| `price_per_month` | `numeric` | YES | `null` | Monthly billing rate in AUD |
| `current_period_start` | `timestamptz` | YES | `null` | Start timestamp of current billing period |
| `current_period_end` | `timestamptz` | YES | `null` | Expiration / renewal timestamp of access |
| `cancel_at_period_end` | `boolean` | YES | `false` | Stripe auto-cancellation flag |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `manually_granted` | `boolean` | YES | `false` | True if provisioned via admin panel |
| `grant_reason` | `text` | YES | `null` | Note/reason entered during admin grant |
| `granted_by_admin_id` | `uuid` | YES | `null` | Foreign key to `auth.users(id)` for granting admin |
| `store_id` | `text` | YES | `null` | Multi-store slot identifier (used by Order Bot) |
| `store_name` | `text` | YES | `null` | Human-readable store label (e.g., "eBay Store 1") |
| `max_stores` | `integer` | YES | `1` | Maximum store slots provisioned |

#### Constraints & Foreign Keys (`live_db_snapshot.txt:335-352`)
- **`subscriptions_pkey`**: `PRIMARY KEY (id)`
- **`subscriptions_user_id_fkey`**: `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- **`subscriptions_granted_by_admin_id_fkey`**: `FOREIGN KEY (granted_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL`
- **`subscriptions_stripe_subscription_id_key`**: `UNIQUE (stripe_subscription_id)`

#### Indexes (`live_db_snapshot.txt:317-324`)
- `subscriptions_pkey` (unique btree on `id`)
- `subscriptions_stripe_subscription_id_key` (unique btree on `stripe_subscription_id`)
- `subscriptions_user_product_store_unique` (unique btree on `(user_id, product_slug, store_id) WHERE (store_id IS NOT NULL)`)
- `subscriptions_user_product_no_store_unique` (unique btree on `(user_id, product_slug) WHERE (store_id IS NULL)`)
- `idx_subscriptions_user_product` (btree on `(user_id, product_slug)`)
- `idx_subscriptions_stripe_id` (btree on `stripe_subscription_id`)

#### Triggers and History Logging (`live_db_snapshot.txt:325-328`)
1. **`update_subscriptions_modtime`**: `BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_modified_column()`
2. **`trg_subscription_history`**: `AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION log_subscription_history()`
   - Defined in `supabase/migrations/027_subscription_history_and_expiration.sql:51-160`.
   - On `INSERT`: logs event `granted` with `new_status`, `new_period_end`, `changed_by_admin_id` (`auth.uid()`), and `grant_reason` to `public.subscription_history`.
   - On `UPDATE`: logs only if `status` or `current_period_end` changed:
     - `active` → `expired`: logs `expired` with reason `'Natural expiration'` and `changed_by_admin_id = NULL`.
     - `active` → `inactive`: logs `revoked`.
     - `current_period_end` updated while remaining `active`: logs `renewed`.
     - Other transitions: logs `status_changed`.

### 1.2 Status & `current_period_end` Semantics
- **`status`**:
  - `'active'`: User is currently entitled to use the tool.
  - `'inactive'`: Access was manually revoked by an administrator via `admin_execute_action('revoke_access')`.
  - `'expired'`: Access elapsed due to natural time expiration (`current_period_end <= now()`) or payment failure (`invoice.payment_failed` / `past_due`).
  - `'canceled'`: Stripe subscription was cancelled (`customer.subscription.deleted`) or refunded (`charge.refunded`).
- **`current_period_end`**:
  - `NULL`: Represents permanent / lifetime access. Treated as valid indefinitely in `check_product_subscription` and `get_active_subscription_count` via `(current_period_end IS NULL OR current_period_end > now())`.
  - `timestamptz`: The exact moment access expires.

### 1.3 The pg_cron Expiry Job (`live_db_snapshot.txt:2-8, 28-30`)
- **Job Name**: `expire-past-due-subscriptions`
- **Schedule**: `* * * * *` (runs every 60 seconds)
- **Command**: `SELECT public.expire_past_due_subscriptions()`
- **Stored Procedure**:
  ```sql
  CREATE OR REPLACE FUNCTION public.expire_past_due_subscriptions()
   RETURNS integer
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path TO 'public', 'pg_temp'
  AS $function$
  DECLARE
    v_updated int;
  BEGIN
    UPDATE public.subscriptions
    SET status = 'expired',
        updated_at = now()
    WHERE status = 'active'
      AND current_period_end IS NOT NULL
      AND current_period_end <= now();
      
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
  END;
  $function$
  ```
  Every minute, this job checks for any active subscription whose `current_period_end` is in the past, changes `status` to `'expired'`, and triggers `trg_subscription_history` to log an audit entry.

---

## 2. Slug Map

### 2.1 Slugs in `public.tools` vs `subscriptions` vs Stripe Lookup Keys
| Catalog Slug (`tools.slug`) | Tool Name | Live Status | Live Price | Present in `subscriptions.product_slug`? | Stripe Lookup Key |
|---|---|---|---|---|---|
| `rccp` | CP Bot & Return Converter | `available` | $9.00 | **NO** | `rccp` |
| `cpbot` | CP Bot | `hidden` | $9.00 | **YES** | `cpbot` |
| `orderbot` | Order Bot | `available` | $7.00 | **YES** | `orderbot` |
| `listflow` | ListFlow | `coming_soon` | $59.00 | **YES** | `listflow` |
| `invoicegen` | Invoice Generator | `coming_soon` | $5.00 | **NO** | `invoicegen` |
| `returnlabels` | Return Label Generator | `hidden` | $0.00 (`is_free: true`) | **NO** | N/A |
| N/A (`disposable_test_sub`) | Test artifact | N/A | N/A | **YES** | N/A |

### 2.2 Where Does the CP Bot App Live & How Is It Gated? (Confirmed 23 Oct 2026)
The CP Bot web application and Chrome extension reside in a **separate repository** (a dual-product Next.js 16 App Router application hosting the Return Converter at `/main` and CP Bot at `/cp-bot/*`, deployed to Vercel at `rccp.automationalchemists.com`).

Based on written answers from the CP Bot developer (Raf) on 23 Oct 2026:
- **Entitlement Slug**: The CP Bot unlock slug is **CONFIRMED as 'cpbot'**. The dashboard calls `check_product_subscription` with the single argument `p_product_slug = 'cpbot'`.
- **CORRECTION on Paid Gating**: Earlier notes stated CP Bot had no paid gating. **Wrong.** The CP Bot web dashboard (`/cp-bot` pages) **IS gated by `check_product_subscription`**, operating in **strict mode (fail closed)**: if the RPC errors, everyone is locked out.
- **Chrome Extension Gating Status**: The Chrome extension is **NOT gated today**. The gate ships in extension **v1.0.5.3**, currently pending Chrome Web Store review. **DO NOT open the public trial until it is live.**
- **Expiration & Caching Behavior**: The RPC itself checks `current_period_end`, so the web dashboard locks on the next page load after expiry. The extension caches a real answer for 5 minutes (a fresh check on popup open).
- **Single RPC Invariant**: **Never create a second overload of `check_product_subscription`**: it would lock out every paying customer.
- **Database Tables Status**:
  - `cp_bot_licenses` is **unused** (obsolete).
  - `cp_bot_config` and `cp_bot_settings` are **IN USE and must never be dropped or renamed**.
  - Other tables CP Bot uses: `cp_bot_activity_log`, `cp_bot_fulfillments`, `cp_bot_gift_templates`, `cp_bot_insight_cards`, `cp_bot_cloud_clipboard`, `label_history`.
- **Return Converter Gating & Testing**:
  - Return Converter is gated **only by sign-in** (no subscription check).
  - There is no staging environment: all testing is against production, so always use a dedicated test account.
- **Developer Notification Requests**:
  - The CP Bot developer asked to be told:
    - (a) Before the Stripe/webhook changes go live.
    - (b) When trials go live.

### 2.3 Resolution of Paid Checkout Slug `rccp` to Entitlement Slug `cpbot`
1. **Catalog vs Access Slug**:
   - The marketing site, `/tools`, `/tools/rccp`, and `/cart` operate with marketing catalog slug `'rccp'`.
   - In Part B, `public.resolve_access_slug('rccp')` and `create-checkout-session` dynamically resolve the entitlement access slug from `public.trial_offers.access_slug` (confirmed as `'cpbot'`).
2. **Access Unlock**:
   - Webhook inserts/upserts subscriptions with `product_slug = 'cpbot'`.
   - The customer dashboard (`src/pages/Dashboard.tsx:448, 551`) checks for `product_slug === 'cpbot'` and displays active status.
   - The CP Bot web dashboard calls `check_product_subscription(p_product_slug = 'cpbot')` which matches the active row and grants access.

---

## 3. Access Check

### 3.1 `check_product_subscription` (`live_db_snapshot.txt:23-26`)
```sql
CREATE OR REPLACE FUNCTION public.check_product_subscription(p_product_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'has_access', true,
    'status', s.status,
    'current_period_end', s.current_period_end,
    'is_free', t.is_free
  ) INTO v_result
  FROM subscriptions s
  JOIN tools t ON t.slug = s.product_slug
  WHERE s.user_id = auth.uid()
    AND s.product_slug = p_product_slug
    AND s.status = 'active'
    AND (s.current_period_end IS NULL OR s.current_period_end > now())
  LIMIT 1;

  IF v_result IS NULL THEN
    SELECT jsonb_build_object(
      'has_access', true,
      'status', 'free',
      'current_period_end', null,
      'is_free', true
    ) INTO v_result
    FROM tools
    WHERE slug = p_product_slug
      AND is_free = true;
  END IF;

  RETURN COALESCE(v_result, jsonb_build_object(
    'has_access', false,
    'status', null,
    'current_period_end', null,
    'is_free', false
  ));
END;
$function$
```
- **Inputs**: `p_product_slug text` (single argument, reverted in migration `029`).
- **Logic**: Inspects caller's session `auth.uid()`. Finds active, non-expired subscription for the slug. If none found, checks if `tools.is_free = true`.
  - The RPC itself evaluates `current_period_end` via `AND (s.current_period_end IS NULL OR s.current_period_end > now())`, so callers lock on the next request/page load immediately after expiry without waiting for batch cron jobs.
- **Callers**:
  - **CP Bot Web Dashboard (`/cp-bot` pages)**: Calls `check_product_subscription(p_product_slug = 'cpbot')` in strict mode (fail closed: if the RPC errors or throws, everyone is locked out). Locks on next page load after subscription expiry.
  - **Chrome Extension**: Not calling today. Gated logic ships in extension `v1.0.5.3` (pending Chrome Web Store review). Once live, caches a real answer for 5 minutes, with a fresh check on popup open.
  - **Website (`src/`)**: Zero calls (reads `public.subscriptions` directly via Supabase client SDK).
  - **Edge Functions**: Zero calls.
- **CRITICAL INVARIANT**:
  - **Never create a second overload of `check_product_subscription`**: PostgREST cannot resolve overloaded functions without exact parameter types and will throw ambiguity errors (`PGRST204` / `400`), which in fail-closed strict mode locks out every paying customer.


### 3.2 `get_active_subscription_count` (`live_db_snapshot.txt:33-35`)
```sql
CREATE OR REPLACE FUNCTION public.get_active_subscription_count(p_user_id uuid, p_product_slug text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_is_admin boolean;
  v_count int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: authentication required';
  END IF;

  IF auth.uid() != p_user_id THEN
    SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
    IF v_is_admin IS NOT TRUE THEN
      RAISE EXCEPTION 'Unauthorized: Cannot view subscriptions for another user';
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND product_slug = p_product_slug
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > now());

  RETURN v_count;
END;
$function$
```
- **Inputs**: Requires two arguments: `p_user_id uuid, p_product_slug text`.
- **Callers**:
  - `src/pages/ToolDetail.tsx:57-59`: Calls `supabase.rpc('get_active_subscription_count', { p_product_slug: tool.slug })`. This call is **broken at runtime** because it omits `p_user_id`, causing Supabase RPC lookup to fail with a schema signature mismatch. The error is swallowed in `ToolDetail.tsx:63-65` and defaults to count `null`.
  - `supabase/functions/entitlement-check/index.ts`: Does **not** use the RPC. It queries `subscriptions` directly via `supabaseAdmin.from('subscriptions').select('*', { count: 'exact' })` (lines 166-173).

### 3.3 Caching
- **Client Side**: No React Query caching, service worker, or memory caching is configured for subscriptions.
- **Database Side**: `check_product_subscription` is marked `STABLE` (allows Postgres query caching within a single transaction).
- **Edge Function Rate Limiting**: `entitlement-check/index.ts:97-124` enforces 100 requests/minute per credential hash using the `rate_limits` table, but caches no responses.

---

## 4. Webhook Pipeline

### 4.1 Parameter Derivation (`supabase/functions/stripe-webhook/index.ts`)
- **`checkout.session.completed`** (`lines 54-76`):
  - `p_stripe_customer_id`: `session.customer`
  - `p_stripe_subscription_id`: `session.subscription`
  - `p_user_id`: `session.client_reference_id`
  - `p_email`: `session.customer_details?.email`
  - `p_product_slug`: `session.metadata?.product_slug`
  - `p_quantity`, `p_stripe_price_id`, `p_price_per_month`: Retrieved via Stripe SDK `stripe.subscriptions.retrieve(session.subscription)`.
- **`customer.subscription.updated` & `customer.subscription.deleted`** (`lines 77-93`):
  - `p_stripe_customer_id`: `subscription.customer`
  - `p_stripe_subscription_id`: `subscription.id`
  - `p_subscription_status`: `subscription.status`
  - `p_quantity`, `p_stripe_price_id`, `p_price_per_month`: From `subscription.items.data[0]`.
  - **`p_user_id`, `p_email`, `p_product_slug`**: **NEVER SET.** They remain `null` (initialized at lines 43-45).
- **`invoice.payment_failed`** (`lines 94-105`):
  - Sets `p_subscription_status = 'past_due'`.
  - `p_user_id`, `p_email`, `p_product_slug`: **REMAIN NULL**.
- **`charge.refunded`** (`lines 106-122`):
  - Resolves `invoice.subscription`. `p_user_id`, `p_email`, `p_product_slug`: **REMAIN NULL**.

### 4.2 `process_stripe_webhook_event` Logic (`live_db_snapshot.txt:38-41`)
1. **Idempotency**: Inserts `p_event_id` into `stripe_webhook_events`. If duplicate, exits immediately (`{"success": true, "message": "already processed"}`).
2. **Status Mapping**:
   - `checkout.session.completed`: If `trialing` or `active` → `'active'`.
   - `customer.subscription.updated`: If `past_due` → `'expired'`; else `'active'`.
   - `customer.subscription.deleted`: `'canceled'`.
   - `invoice.payment_failed`: `'expired'`.
   - `charge.refunded`: `'canceled'`.
3. **Reconciliation**:
   - If `v_new_status != 'active'`: Updates all matching rows with `stripe_subscription_id = p_stripe_subscription_id` to `v_new_status`.
   - If `v_new_status == 'active'`: Compares `v_active_count` to `p_quantity`:
     - If count == quantity: updates `current_period_end`.
     - If count < quantity: updates existing, then runs `FOR i IN 1..v_delta LOOP INSERT INTO subscriptions (user_id, email, product_slug, ...) VALUES (p_user_id, p_email, p_product_slug, ...)`.
     - If count > quantity: sets newest rows to `'expired'` (`ORDER BY created_at DESC LIMIT v_delta`), then updates survivors.

### 4.3 Why `customer.subscription.updated` Returns HTTP 500
During Order Bot testing (or any scenario where quantity increases or `customer.subscription.updated` fires before `checkout.session.completed` has inserted the initial row):
1. `stripe-webhook/index.ts` passes `p_user_id = null`, `p_email = null`, and `p_product_slug = null`.
2. Because `v_active_count < p_quantity` (e.g. 0 < 1, or 1 < 2 stores), `process_stripe_webhook_event` enters the `INSERT INTO subscriptions` branch.
3. In `public.subscriptions`, `user_id`, `email`, and `product_slug` are strictly `NOT NULL` (`live_db_snapshot.txt:203-219`).
4. PostgreSQL immediately throws an exception:
   `null value in column "user_id" of relation "subscriptions" violates not-null constraint`.
5. Furthermore, `public.subscriptions` has a strict unique constraint on `stripe_subscription_id` (`subscriptions_stripe_subscription_id_key` at `live_db_snapshot.txt:319, 346`). If `v_active_count >= 1`, inserting a second row with the same `stripe_subscription_id` also crashes with:
   `duplicate key value violates unique constraint "subscriptions_stripe_subscription_id_key"`.
6. In `stripe-webhook/index.ts:145-148`:
   ```ts
   if (error) {
     console.error('RPC Error:', error);
     throw error;
   }
   ```
7. The caught error triggers `lines 157-160`:
   ```ts
   return new Response(JSON.stringify({ error: err.message }), { status: 500 });
   ```
   yielding an HTTP 500 back to Stripe.

---

## 5. Checkout Functionality

### 5.1 `create-checkout-session` (`supabase/functions/create-checkout-session/index.ts`)
- **Request**: `POST` to `/functions/v1/create-checkout-session`
  - Headers: `Authorization: Bearer <user_jwt>`, `Content-Type: application/json`
  - Body: `{ product_slug: string, quantity: number }`
  - Validation: Requires `product_slug` and `quantity >= 1` (lines 63-70).
- **JWT Verification** (`lines 15-36`):
  - Strips `Bearer ` prefix.
  - Verifies token via `supabase.auth.getUser(token)` with the anon client.
- **`CHECKOUT_ENABLED` Admin Guard** (`lines 38-60`):
  - Checks `Deno.env.get('CHECKOUT_ENABLED') !== 'true'`.
  - When checkout is not enabled globally, it initializes an administrative Supabase client using `SUPABASE_SERVICE_ROLE_KEY` and queries `profiles.is_admin` for `user.id`.
  - If user is not admin, returns HTTP 403 `{"error": "Checkout is not available yet"}`.
- **Price Resolution** (`lines 76-88`):
  - Resolves price strictly via Stripe Price lookup key:
    ```ts
    const prices = await stripe.prices.list({
      lookup_keys: [product_slug],
      active: true,
      expand: ['data.product'],
    });
    ```
  - If no active price in Stripe has `lookup_key === product_slug`, returns HTTP 400 `No active price found for slug: ${product_slug}`.
- **Currency**:
  - Currency is inherited directly from the Stripe Price object (configured in Stripe as AUD).
- **Metadata Attached** (`lines 94-110`):
  - `customer_email`: `user.email`
  - `client_reference_id`: `user.id`
  - `metadata`: `{ product_slug: product_slug }`
- **Response**: HTTP 200 `{ url: session.url }`.

### 5.2 Is a Stripe Product ID Stored Anywhere?
- **NO.**
- `public.tools` does not have a `stripe_product_id` column (`live_db_snapshot.txt:87-140`).
- `public.subscriptions` only stores `stripe_customer_id`, `stripe_subscription_id`, and `stripe_price_id` (`live_db_snapshot.txt:226-243`).
- No hardcoded `prod_` identifiers exist in the repository.

### 5.3 What Must Change to Charge from `public.tools.price_monthly`
To charge amounts dynamically from the database using inline `price_data` instead of pre-created Stripe Price lookup keys:
1. In `create-checkout-session/index.ts`:
   - Query `public.tools` for `price_monthly`, `name`, and `status` for the given `product_slug`.
   - Calculate unit amount in cents: `const unitAmount = Math.round(tool.price_monthly * 100);`.
   - Map to an existing Stripe Product ID (or use `price_data.product_data` with the tool name).
   - Replace `line_items: [{ price: priceId, quantity }]` with:
     ```ts
     line_items: [
       {
         price_data: {
           currency: 'aud',
           product: stripeProductId, // or product_data: { name: tool.name }
           unit_amount: unitAmount,
           recurring: { interval: 'month' },
         },
         quantity: quantity,
       },
     ]
     ```
2. In `stripe-webhook/index.ts` / `process_stripe_webhook_event`:
   - Ensure the webhook extracts `price.unit_amount` correctly from the ad-hoc price object created by Stripe for the session.

---

## 6. Admin Capabilities

### 6.1 Admin Panel Structure
- **Gating**: `src/components/AdminLayout.tsx:56-79` checks `profiles.is_admin = true`. Non-admins are redirected to `/`.
- **Pages & Routes (`src/App.tsx:93-105`)**:
  - `/admin`: `AdminOverview.tsx` (MRR calculation, active subscription count, user metrics)
  - `/admin/subscriptions`: `AdminSubscriptions.tsx` (granting, extending, revoking access)
  - `/admin/tools`: `AdminTools.tsx` (editing tool catalog status, price, maintenance message)
  - `/admin/audit-log`: `AdminAuditLog.tsx` (read-only viewer of `admin_audit_log`)
  - `/admin/users`: `AdminUsers.tsx` (user list, toggle admin, edit profile, delete user)
  - `/admin/contact-submissions`: `AdminContactSubmissions.tsx`
  - `/admin/pricing`: `AdminPricing.tsx`
  - `/admin/services`: `AdminServices.tsx`
  - `/admin/learn`: `AdminLearn.tsx`
  - `/admin/contact`: `AdminContact.tsx`
  - `/admin/newsletter`: `AdminNewsletter.tsx`
  - `/admin/content`: `AdminContent.tsx`

### 6.2 `admin_execute_action` & Audit Logging (`live_db_snapshot.txt:18-21`)
All administrative mutations execute through `public.admin_execute_action(p_action_type, p_target_user_id, p_target_email, p_payload)`:
- Verifies `profiles.is_admin = true` for `auth.uid()`.
- Supported actions:
  - `extend_subscription` / `shorten_subscription`: updates `current_period_end` and recalculates `status` (`'active'` if date is null or future, else `'expired'`).
  - `grant_access`: upserts into `subscriptions` (supports multi-store via `store_id`).
  - `revoke_access`: updates `subscriptions.status = 'inactive'`.
  - `change_tool_status`: updates `public.tools.status`, `price_monthly`, and `maintenance_message`.
  - `edit_profile`: updates `full_name`, `phone` in `public.profiles`.
  - `toggle_admin`: updates `is_admin` in `public.profiles`.
- **Automatic Audit Logging**:
  Every successful action writes to `public.admin_audit_log` with `admin_user_id`, `admin_email`, `action`, `target_user_id`, `target_email`, and `details` (`p_payload`).

### 6.3 How `AdminTools` Edits Price and Status (`src/pages/AdminTools.tsx:96-106`)
`AdminTools.tsx` invokes:
```ts
const { data, error } = await supabase.rpc('admin_execute_action', {
  p_action_type: 'change_tool_status',
  p_target_user_id: null,
  p_target_email: null,
  p_payload: {
    tool_slug: editTool.slug,
    status: editStatus,
    price: editPrice,
    maintenance_message: editStatus === 'maintenance' ? editMessage : null
  }
});
```

### 6.4 How to Add a New Admin Panel and Action
1. **Database Action**: Add an `ELSIF p_action_type = 'your_action' THEN ...` branch inside `admin_execute_action` in SQL.
2. **Page Component**: Create `src/pages/AdminYourFeature.tsx`, wrapped with `<AdminLayout title="..." description="...">`.
3. **Navigation**: Add `{ path: "/admin/your-feature", label: "...", icon: Icon, description: "..." }` to `navItems` in `src/components/AdminLayout.tsx:33-46`.
4. **Router**: Add `<Route path="/admin/your-feature" element={<AdminYourFeature />} />` in `src/App.tsx`.
5. **Execution**: Call `supabase.rpc('admin_execute_action', { p_action_type: 'your_action', ... })`.

---

## 7. User-Facing Pages & Account Flow

### 7.1 Page Functions
- **Dashboard (`src/pages/Dashboard.tsx`)**:
  - Displays user's active tools (`activeTools`), unpurchased tools (`availableTools`), and upcoming tools (`comingSoonTools`).
  - Subscriptions are fetched via direct client query `supabase.from('subscriptions').select('*').eq('user_id', user.id)` (lines 310-315).
  - Shows renewal dates and lifetime badges.
- **Account Settings (`src/pages/Account.tsx`)**:
  - Displays profile inputs: Full Name, Phone, Country, Referral Source.
  - Displays metadata: Account Created Date (`created_at`) and Terms Accepted Date (`terms_accepted_at`).
  - Offers password update and account deletion forms.
  - **Does NOT display any subscription or billing data.**
- **Billing (`src/pages/Billing.tsx`)**:
  - A static placeholder page stating: *"Billing Portal Coming Soon: We are currently integrating our billing provider. Soon you will be able to manage all your tool subscriptions and payment methods here."*
  - **Does NOT display live subscription or payment method data.**

### 7.2 What "Profile" Means in the Site
The `public.profiles` table (`live_db_snapshot.txt:141-194`) is a 1-to-1 extension of `auth.users(id)`:
- Columns: `id`, `full_name`, `avatar_url`, `created_at`, `updated_at`, `country`, `phone`, `referral_source`, `terms_accepted`, `terms_accepted_at`, `is_admin`, `notify_product_launches`, `notify_account_activity`.
- Automatically created on user sign-up via the `handle_new_user()` trigger (`supabase/migrations/014_profiles_signup_fields.sql:10-31`).
- Contains the authoritative `is_admin` flag.

### 7.3 Sign-Up and Sign-In Flow (`src/pages/Auth.tsx`, `src/hooks/useAuth.tsx`)
- **Email Confirmation**:
  - `useAuth.tsx:66-72` passes `emailRedirectTo: `${window.location.origin}/`` to `supabase.auth.signUp`.
  - In `Auth.tsx:222-226`, the client immediately displays a success toast and redirects to `'/'`. It does not instruct the user to verify an email or check their inbox.
- **Redirect / Next Parameter**:
  - `/auth` has **no support** for a `?redirect=` or `?next=` parameter.
- **Landing Destination**:
  - New user sign-up: Lands on `/` (homepage).
  - Existing user login: Lands on `/` (homepage). If user has `admin` role in `user_roles`, lands on `/admin` (`Auth.tsx:241-248`).

---

## 8. RCCP Touchpoints

### 8.1 The 4 Touchpoints
1. **RCCP Hero CTA**:
   - Location: `src/pages/tools/RccpToolPage.tsx:207-218`.
   - Primary button: "Get CP Bot — AUD $9/mo" (rendered via `renderAccessButton`).
   - Secondary button: "Use Free Tool" (direct link to `https://rccp.automationalchemists.com`).
2. **RCCP Closing CTA**:
   - Location: `src/pages/tools/RccpToolPage.tsx:423-437`.
   - Centered CTA card with "Get CP Bot — AUD $9/mo" (rendered via `renderAccessButton`).
3. **Tools Page RCCP Card**:
   - Location: `src/pages/Tools.tsx:130-185`.
   - Shows badge "Free" & "Paid".
   - Links: "Use Free Tool" (`https://rccp.automationalchemists.com`), "Get CP Bot" (`handleGetAccess('rccp')`), "Learn more" (`/tools/rccp`).
4. **Dashboard Card**:
   - Location: `src/pages/Dashboard.tsx:117-168, 545-554`.
   - `rccp` is hardcoded to always be in `activeTools` (line 430).
   - If `!hasCpBotSub`: Displays "↩️ Return Converter — Active" and "🔒 CP Bot — Locked", with an "Unlock CP Bot — AUD $9/mo" link pointing to `/#`.
   - If `hasCpBotSub`: Displays "↩️ Return Converter — Active" and "🤖 CP Bot — Active", with "Open Tools" pointing to `https://rccp.automationalchemists.com`.

### 8.2 `handleGetAccessLogic` (`src/lib/checkout.ts:1-27`)
```ts
export const handleGetAccessLogic = (slug: string, user: any, toast: any) => {
    if (import.meta.env.VITE_CHECKOUT_ENABLED !== 'true') {
        window.location.href = "/contact";
        return;
    }

    if (!user) {
        toast({
            title: "Authentication Required",
            description: "Please sign in or create an account to get access to this tool.",
            variant: "destructive"
        });
        setTimeout(() => {
            window.location.href = "/auth";
        }, 1500);
        return;
    }

    const existingCartStr = localStorage.getItem('cart');
    let cart = existingCartStr ? JSON.parse(existingCartStr) : [];
    if (!cart.includes(slug)) {
        cart.push(slug);
    }
    localStorage.setItem('cart', JSON.stringify(cart));

    window.location.href = "/cart";
};
```
- Status Gating:
  - If tool `status === 'maintenance'`: renders disabled button with `maintenance_message || 'Under maintenance'`.
  - If tool `status === 'coming_soon'`: renders disabled button "Coming Soon".
  - If tool `status === 'available'`: renders interactive button calling `handleGetAccessLogic`.
- Note: On `Dashboard.tsx:136-140`, the "Unlock CP Bot" button has `href="/#"` and does **not** call `handleGetAccessLogic`.

---

## 9. Risks and Pitfalls

1. **Slug Mismatch (`rccp` vs `cpbot`)** — [Risk (d)]:
   - **Status**: *RESOLVED: Confirmed as 'cpbot' by CP Bot developer on 23 Oct 2026.*
   - The marketing site, `/tools`, `/tools/rccp`, and `/cart` operate with slug `'rccp'`.
   - The database has `'rccp'` ($9/mo, available) and `'cpbot'` ($9/mo, hidden).
   - In Part B, `public.resolve_access_slug('rccp')` and `create-checkout-session` dynamically resolve the entitlement access slug from `public.trial_offers.access_slug` (confirmed as `'cpbot'`). The dashboard and CP Bot app call `check_product_subscription` with `p_product_slug = 'cpbot'`.

2. **Unique Index Collisions on Paid Conversion After Trial & Reactivation Prevention** — [Risk (b)]:
   - **Status**: Fixed in code and deployed 2026-10-24; not yet verified end to end with Stripe test mode
   - `public.subscriptions` has `subscriptions_user_product_no_store_unique UNIQUE (user_id, product_slug) WHERE (store_id IS NULL)`.
   - Fixed in migration 032: only `checkout.session.completed` performs an `UPSERT` on `(user_id, product_slug) WHERE store_id IS NULL`. Existing trial rows are converted in place (`is_trial = false`), and `public.trial_claims.converted_at` is stamped.
   - For `customer.subscription.updated` on single-seat products, the RPC strictly updates `current_period_end` on existing rows matching `WHERE stripe_subscription_id = p_stripe_subscription_id AND status = 'active'`. It **never** inserts, upserts, or reactivates rows; if an update arrives after a cancellation or deletion, it updates 0 rows and returns success, closing the reactivation hole.

3. **Webhook HTTP 500 on `customer.subscription.updated`** — [Risk (a)]:
   - **Status**: Fixed in code and deployed 2026-10-24; not yet verified end to end with Stripe test mode
   - Fixed in Part B: `create-checkout-session` embeds `user_id` and `tool_slug` in `subscription_data.metadata`, `stripe-webhook/index.ts` extracts metadata across all events, and migration 032's `process_stripe_webhook_event` resolves missing parameters from existing subscription rows matching `stripe_subscription_id`. If unresolved, it gracefully skips without inserting NULLs and returns HTTP 200.

4. **`stripe_subscription_id` Unique Index Collisions**:
   - `subscriptions_stripe_subscription_id_key` enforces global uniqueness on `stripe_subscription_id`.
   - Single-seat subscriptions update existing rows. Multi-store Order Bot retains its existing slot management.

5. **Minute-by-Minute Expiration Leaving Blocking Rows** — [Risk (b) related]:
   - **Status**: Fixed in code and deployed 2026-10-24; not yet verified end to end with Stripe test mode
   - Because migration 032 uses `ON CONFLICT (user_id, product_slug) WHERE store_id IS NULL DO UPDATE` on `checkout.session.completed`, an expired row no longer blocks a returning subscriber; the row is updated to `status = 'active'` with new billing period dates.

6. **Admin Grant Upsert vs Stripe Webhook Raw Insert**:
   - Migration 032 introduces a Manual Grant Safety check: if an active `manually_granted = true` row exists, the webhook skips modification and returns `skipped: manual grant present`, preserving manual grants.

7. **Foreign Key Cascade on User Deletion**:
   - Deleting a user in `auth.users` cascades to delete their `subscriptions` rows (`subscriptions_user_id_fkey ON DELETE CASCADE`), but historical records in `subscription_history` retain `user_id` without foreign key cascade.

8. **Incompatibility of Per-User Discounts with Stripe Lookup Keys & Multi-Slot Double-Charge Guard** — [Risk (c)]:
   - **Status**: Fixed in code and deployed 2026-10-24; not yet verified end to end with Stripe test mode
   - Fixed in Part B: `create-checkout-session` resolves server-side catalog prices from `public.tools.price_monthly` and active user discounts from `public.user_price_overrides`, constructing ad-hoc Stripe line items via `price_data`.
   - Double-charge guard rejects active paid subscribers with HTTP 409 (`already_subscribed`), but explicitly skips `orderbot` because Order Bot is a multi-slot product where additional store slots are purchased through the checkout flow. Active trials for any tool do not trigger the 409 guard, allowing paid upgrades.

9. **Access Gating & Caching on External CP Bot App / Extension** (Confirmed 23 Oct 2026):
   - **Web Dashboard**: The CP Bot web dashboard (`/cp-bot` pages) IS gated by `check_product_subscription(p_product_slug = 'cpbot')` in strict mode (fail closed: if the RPC errors, everyone is locked out). Because the RPC checks `current_period_end`, it locks on the next page load after expiry.
   - **Chrome Extension**: The extension is NOT gated today. The gate ships in extension `v1.0.5.3`, pending Chrome Web Store review. **DO NOT open the public trial until it is live.** Once live, the extension caches a real answer for 5 minutes (a fresh check on popup open).
   - **Single Overload Invariant**: Never create a second overload of `check_product_subscription`: doing so breaks PostgREST and locks out every paying customer.
   - **Return Converter**: Gated only by sign-in (no subscription check).
   - **Testing Environment**: There is no staging environment: all testing is against production, so always use a dedicated test account.
   - **Developer Notification**: The CP Bot developer asked to be told (a) before Stripe/webhook changes go live, and (b) when trials go live.

10. **Loss of Checkout Intent on Auth**:
    - `handleGetAccessLogic` redirects unauthenticated users to `/auth`.
    - `/auth` does not accept a redirect URL and dumps users onto `/` upon completion, losing their checkout funnel.

---

## 10. Disagreements Between Sources

| Area / Component | Secondary Source (`full_database_schema.sql` / `cpbot.md`) | Migration Files (`supabase/migrations/`) | Live Database Snapshot (`live_db_snapshot.txt`) |
|---|---|---|---|
| **Tool Catalog Seed** | `full_database_schema.sql:720-727` seeds 5 tools: `cpbot` ($9, available), `listflow` ($19, available), `orderbot` ($7, available), `invoicegen` ($5, available), `returnlabels` ($0, available, free). No `rccp` row. | `016_tools_table.sql` seeded the original 5 tools. | `tools_rows` contains 6 tools: `rccp` ($9, available), `cpbot` ($9, hidden), `returnlabels` ($0, hidden), `orderbot` ($7, available), `listflow` ($59, coming_soon), `invoicegen` ($5, coming_soon). |
| **Subscription Table** | `cpbot.md:321-343` and `full_database_schema.sql:668-702` define `cp_bot_licenses` as the license table with 5 columns. | `015_cp_bot_licenses.sql` created `cp_bot_licenses`. `027` & `030` created `subscriptions`. | `subscriptions` is the active table with 20 columns and store/stripe support. `cp_bot_licenses` is unused. |
| **CP Bot Tables** | `cpbot.md` defines various tables. | `001-015` migrations. | Confirmed 23 Oct 2026: `cp_bot_licenses` is unused. `cp_bot_config` and `cp_bot_settings` are IN USE and must never be dropped or renamed. Other tables CP Bot uses: `cp_bot_activity_log`, `cp_bot_fulfillments`, `cp_bot_gift_templates`, `cp_bot_insight_cards`, `cp_bot_cloud_clipboard`, `label_history`. |
| **Admin Authorization** | `full_database_schema.sql:1218` defines `user_roles` table with `app_role` enum. `Auth.tsx:233-248` still queries `user_roles`. | `017_admin_fields.sql` added `is_admin` boolean to `profiles`. | Live database checks `profiles.is_admin` in `admin_execute_action` and `get_active_subscription_count`. |
| **`check_product_subscription` Signature** | `full_database_schema.sql:1452` defines 2-arg signature `(p_product_slug, p_store_id)`. | `023` added store argument; `029` reverted it back to 1 argument. | Live snapshot has 1 argument: `check_product_subscription(p_product_slug text)`. Mandatory invariant: never create a second overload (locks out all customers). |
| **`get_active_subscription_count` Period Check** | N/A | `025` counted `status = 'active'` without checking `current_period_end`. | Live snapshot checks `AND (current_period_end IS NULL OR current_period_end > now())`. |
| **Frontend RPC Call Signature** | N/A | N/A | `ToolDetail.tsx:57` calls `get_active_subscription_count` with 1 argument (`p_product_slug`), whereas live function requires `(p_user_id uuid, p_product_slug text)`. |

---

## 11. Open Questions

1. **Canonical Slug Decision (RESOLVED)**: Confirmed as `'cpbot'`. The dashboard calls `check_product_subscription` with the single argument `p_product_slug = 'cpbot'`. Part B's `resolve_access_slug` and `trial_offers.access_slug` decouple the marketing catalog slug `'rccp'` from the internal access slug `'cpbot'`.
2. **Trial Row Representation (RESOLVED in Migration 031 & 034)**: Trial rows exist directly in `public.subscriptions` with `status = 'active'`, `is_trial = true`, and `current_period_end` set to trial end + 6h grace.
3. **Handling Post-Trial Paid Checkout (RESOLVED in Migration 032 & 034)**: `process_stripe_webhook_event` performs an atomic `UPSERT` on `(user_id, product_slug) WHERE store_id IS NULL`, converting trial rows in place (`is_trial = false`, `grant_reason = 'stripe_checkout'`) and stamping `trial_claims.converted_at = now()`.
4. **Discount Mechanism (RESOLVED in Part B)**: Dynamic `price_data` calculated server-side from `tools.price_monthly - discount`.
5. **Auth Redirection**: Should `/auth` be updated to accept `?redirect=/cart` so users returning from sign-up land directly in checkout?

---

## 12. Card-Required Free Trial Architecture (Migration 034 & Edge Function v1.8.0)

> [!IMPORTANT]
> **DEPLOYMENT STATUS**: Migration `034_card_trial_identity.sql` and the updated Edge Function `stripe-webhook` are committed in code but are **NOT APPLIED to the Supabase database and NOT DEPLOYED to Edge Functions**. Production trials remain disabled (`trial_offers.enabled = false`).

### 12.1 Card-Required Stripe Trial Model
- The free trial now requires a valid payment card collected via Stripe Checkout (`mode = 'subscription'`, `metadata.trial = 'true'`).
- The subscription starts in `status = 'trialing'` with trial duration = `trial_offers.trial_days` (default 30 days).
- Stripe automatically bills the card on file at the end of the 30-day period unless the user cancels beforehand.

### 12.2 Identity Verification & Anti-Abuse Gating
- Database tables `public.trial_identities` and `public.trial_denials` (RLS enabled, zero policies, service_role execution only) enforce:
  1. **1 trial per normalised email**: Canonicalized via `normalize_email`.
  2. **1 trial per card fingerprint**: Extracted from `default_payment_method.card.fingerprint`.
  3. **1 trial per phone number**: HMAC-SHA256 hash of E.164 phone string using `TRIAL_IDENTITY_PEPPER`.
- **Known Boundaries**: Stops repeat usage of the same card or phone; does not stop distinct physical or disposable virtual cards, or secondary phone numbers. Customer phone is unverified (no SMS OTP).

### 12.3 Legacy Path Decommissioning
- `claim_free_trial(text)` unconditionally returns `{ "ok": false, "reason": "checkout_required" }`. No no-card trial can ever be created.

### 12.4 +6-Hour Grace Window & pg_cron Conversion Race Protection
- `process_stripe_webhook_event` provisions trialing checkouts with `current_period_end = p_current_period_end + interval '6 hours'`. This prevents the 1-minute `pg_cron` job `expire-past-due-subscriptions` from expiring access during the ~1-hour invoicing window after trial expiration.
- On `customer.subscription.updated` with status `'active'`, trial rows are converted in place (`is_trial = false`, `grant_reason = 'stripe_checkout'`, `converted_at` stamped).
- Rows with `status = 'expired'` (from cron) or `'past_due'` are safely reactivated when Stripe reports `active`, but rows with `status = 'canceled'` are **never** reactivated.
- Stripe status `'past_due'` or `'unpaid'` revokes access immediately.

