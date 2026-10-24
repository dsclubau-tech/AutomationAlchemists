# Free Trial and User Price Overrides Architecture

This design document and operational manual specifies the technical architecture for free trials (no credit card required) and admin-managed per-user price overrides across Automation Alchemists.

---

## 1. Goal and Business Rules

1. **Cardless Free Trial**: Customers can claim a time-limited trial of the Return Converter x CopyPaste Bot suite without entering credit card details or creating a Stripe subscription.
2. **One Trial Per Person**: Enforced strictly via normalized email address (`normalize_email`) and account ID. Deleting an account does not permit a repeat trial claim.
3. **Configurable Knobs**: Trial duration (`trial_days`, default 30, bounded 1–90) and maximum slot capacity (`slot_cap`, default 500) are stored in the database and manageable via admin actions.
4. **Natural Lifecycle Expiration**: Trial subscriptions leverage the existing `pg_cron` job (`expire-past-due-subscriptions`), which transitions expired rows from `active` to `expired` every minute once `current_period_end <= now()`.
5. **Truthful Scarcity**: Slot availability reports mathematically genuine usage:
   $$\text{slots\_taken} = \text{slots\_reserved} + \text{COUNT}(\text{trial\_claims})$$
   $$\text{slots\_left} = \max(\text{slot\_cap} - \text{slots\_taken}, 0)$$
   Invented scarcity or fake counters are strictly prohibited.

---

## 2. Review Findings & Architectural Fixes (Part A Review)

During peer review of the initial Part A implementation (commit `fc065e7`), four subtle database-level issues were identified and corrected in place:

1. **Row Variable `IS NOT NULL` Bug in PL/pgSQL**:
   - In PostgreSQL PL/pgSQL, evaluating `v_claim IS NOT NULL` on a composite record variable evaluates to `true` **only if all fields** of the row are non-null. Because `v_claim` contains columns like `converted_at` and `revoked_at` which are `NULL` on normal active claims, `v_claim IS NOT NULL` evaluated to `false`. This caused `get_trial_status` to report an active claim as non-existent!
   - **Fix**: Immediately after executing `SELECT ... INTO`, capture the query state using `v_claim_found := FOUND` and `v_sub_found := FOUND`. All downstream branch checks use these boolean flags exclusively.

2. **SQL `CHECK` Constraint NULL Hole on `user_price_overrides`**:
   - In SQL boolean logic, `NULL > 0` evaluates to `NULL` (unknown), which passes table `CHECK` constraints unless nullability is constrained. A record with `kind = 'fixed_price'` and a `NULL` `amount_cents` would have passed the check.
   - **Fix**: Rewrote the constraint with explicit `IS NOT NULL` checks:
     - `fixed_price` requires `amount_cents IS NOT NULL AND amount_cents > 0 AND percent_off IS NULL`.
     - `percent_off` requires `percent_off IS NOT NULL AND percent_off > 0 AND percent_off <= 100 AND amount_cents IS NULL`.
     - Added an additional constraint `CHECK (ends_at IS NULL OR ends_at > starts_at)`.

3. **Admin-Note Exposure & Policy Elimination**:
   - Direct `SELECT` RLS policies granted to `authenticated` users on `trial_claims` and `user_price_overrides` would have exposed internal administrative rationale (the `note` column on overrides and `revoked_reason` on claims) directly to client-side queries.
   - **Fix**: Removed all policies. All four tables have RLS enabled with **ZERO policies**, and all table privileges are revoked from `anon` and `authenticated`. Client access is mediated exclusively through audited `SECURITY DEFINER` functions that selectively project safe fields.

4. **Lock & Statement Timeouts**:
   - Running schema migrations or rollbacks on live production tables shared with other applications (e.g. ListFlow) risks acquiring blocking locks if transactions take long or wait on concurrent locks.
   - **Fix**: Added `SET LOCAL lock_timeout = '5s';` and `SET LOCAL statement_timeout = '60s';` as the very first statements inside the transaction.

---

## 3. Database Schema (Part A Migration 031)

### 3.1 Alteration to `public.subscriptions`
- **`is_trial`** (`boolean NOT NULL DEFAULT false`): Distinguishes promotional trial access from paid Stripe subscriptions and manual admin grants.
- No existing indexes, triggers, or constraints on `subscriptions` are modified.

### 3.2 `public.trial_offers`
Defines available trial promotions per tool:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `tool_slug` | `text` | PRIMARY KEY | Marketing/catalog slug (`'rccp'`) |
| `access_slug` | `text` | NOT NULL | Entitlement slug checked by access gates (`'cpbot'`) |
| `enabled` | `boolean` | NOT NULL DEFAULT false | Kill switch for public claiming |
| `trial_days` | `int` | NOT NULL DEFAULT 30 CHECK (1–90) | Length of trial period in days |
| `slot_cap` | `int` | NOT NULL DEFAULT 500 CHECK (>= 0) | Total promotional slots allocated |
| `slots_reserved` | `int` | NOT NULL DEFAULT 0 CHECK (>= 0) | Slots set aside for pre-allocated users |
| `require_confirmed_email`| `boolean` | NOT NULL DEFAULT false | Whether email verification is mandatory |
| `updated_at` | `timestamptz`| NOT NULL DEFAULT now() | Modification timestamp |
| `updated_by` | `uuid` | REFERENCES auth.users(id) | Admin who last updated the offer |

- **Seed**: `('rccp', 'cpbot', false, 30, 500, 0, false)`

### 3.3 `public.blocked_email_domains`
Maintains a curated list of temporary/disposable email domains:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `domain` | `text` | PRIMARY KEY CHECK (domain = lower(domain)) | Domain name (e.g., `mailinator.com`) |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Timestamp added |

- **Seed**: 15 well-known disposable email domains (`mailinator.com`, `guerrillamail.com`, `10minutemail.com`, `temp-mail.org`, etc.).

### 3.4 `public.trial_claims`
Append-only ledger of historical trial claims:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY DEFAULT gen_random_uuid() | Unique claim record ID |
| `tool_slug` | `text` | NOT NULL REFERENCES trial_offers(tool_slug) | Target tool |
| `user_id` | `uuid` | REFERENCES auth.users(id) ON DELETE SET NULL | Claimant account ID |
| `email_normalized`| `text` | NOT NULL | Canonicalized claimant email |
| `claimed_at` | `timestamptz`| NOT NULL DEFAULT now() | Timestamp of claim |
| `trial_ends_at` | `timestamptz`| NOT NULL | Expiration timestamp |
| `subscription_id`| `uuid` | REFERENCES subscriptions(id) ON DELETE SET NULL| Associated access row |
| `converted_at` | `timestamptz`| NULL | Timestamp of paid Stripe conversion |
| `revoked_at` | `timestamptz`| NULL | Timestamp of manual admin revocation |
| `revoked_reason` | `text` | NULL | Administrative note on revocation |

- **Uniqueness**:
  - `CONSTRAINT trial_claims_tool_slug_email_normalized_key UNIQUE (tool_slug, email_normalized)`
  - `CREATE UNIQUE INDEX trial_claims_tool_user_idx ON trial_claims (tool_slug, user_id) WHERE (user_id IS NOT NULL)`
- **Data Retention & Privacy Note**:
  - `email_normalized` is personal data retained after account deletion intentionally (`ON DELETE SET NULL` on `user_id`) to ensure deleted accounts cannot abuse the one-trial-per-email policy. This retention policy will be formally referenced in the updated user-facing Privacy Policy.

### 3.5 `public.user_price_overrides`
Stores administrator-assigned discounts for individual users:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY DEFAULT gen_random_uuid() | Record ID |
| `user_id` | `uuid` | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | Target user |
| `tool_slug` | `text` | NOT NULL | Target tool |
| `kind` | `text` | CHECK in (`'fixed_price'`, `'percent_off'`) | Discount type |
| `amount_cents` | `int` | NULL | Price in integer cents (AUD) |
| `percent_off` | `numeric(5,2)` | NULL | Percentage discount (0 < x <= 100) |
| `currency` | `text` | NOT NULL DEFAULT 'aud' | Currency |
| `starts_at` | `timestamptz`| NOT NULL DEFAULT now() | Effective start |
| `ends_at` | `timestamptz`| NULL | Expiration date (optional) |
| `note` | `text` | NULL | Administrative rationale (hidden from user) |
| `created_by` | `uuid` | REFERENCES auth.users(id) ON DELETE SET NULL | Authorizing admin |
| `created_at` | `timestamptz`| NOT NULL DEFAULT now() | Creation timestamp |
| `revoked_at` | `timestamptz`| NULL | Revocation timestamp |

- **Constraints**:
  - `fixed_price` requires `amount_cents IS NOT NULL AND amount_cents > 0 AND percent_off IS NULL`
  - `percent_off` requires `percent_off IS NOT NULL AND percent_off > 0 AND percent_off <= 100 AND amount_cents IS NULL`
  - `ends_at IS NULL OR ends_at > starts_at`
- **Index**: Partial unique index on `(user_id, tool_slug) WHERE (revoked_at IS NULL)`.

---

## 4. Stored Functions and Logic

### 4.1 `public.normalize_email(p_email text) RETURNS text`
- **Security**: Immutable helper with `SET search_path = pg_catalog, pg_temp`.
- **Behavior**:
  - Strips leading/trailing whitespace and converts to lowercase.
  - Splits at the final `@` into local part and domain.
  - Maps `googlemail.com` to `gmail.com`.
  - Removes any `+tag` suffix from the local part across **all** domains.
  - Removes periods (`.`) from the local part **only** for `gmail.com`.
  - Returns `NULL` for invalid, empty, or `@`-less inputs.

### 4.2 `public.get_trial_public(p_tool_slug text) RETURNS jsonb`
- **Execution**: Granted to `anon` and `authenticated`. `SECURITY DEFINER` with `SET search_path = public, pg_temp`.
- **Output**:
  ```json
  {
    "enabled": true,
    "trial_days": 30,
    "slot_cap": 500,
    "slots_taken": 59,
    "slots_left": 441
  }
  ```
- **Privacy**: Exposes aggregate counts and public offer flags only; never leaks emails or user IDs.

### 4.3 `public.get_trial_status(p_tool_slug text) RETURNS jsonb`
- **Execution**: Granted to `authenticated` only. `SECURITY DEFINER` with `SET search_path = public, pg_temp`.
- **Aligned Reason Determination Order**:
  1. Unauthenticated (`not_signed_in`)
  2. Unconfirmed email when offer requires it (`email_unconfirmed`)
  3. Blocked domain (`email_not_allowed`)
  4. Already claimed by this account or normalized email (`already_claimed`)
  5. Existing subscription row for `access_slug` (`already_has_access` if currently active, `not_eligible` if past/canceled)
  6. Offer disabled (`disabled`)
  7. Sold out (`sold_out`)
  8. Eligible (`ok`)
- **Claimant Invariance**: An existing claimant receives an accurate `already_claimed` status even if the offer is subsequently disabled or sold out.

### 4.4 `public.claim_free_trial(p_tool_slug text) RETURNS jsonb`
- **Execution**: Granted to `authenticated` only. `SECURITY DEFINER` with `SET search_path = public, pg_temp`. Operates strictly under `auth.uid()`.
- **Concurrency & Aligned Evaluation**:
  - Locks the target `trial_offers` row via `FOR UPDATE`.
  - Performs check sequence in identical order to `get_trial_status`:
    1. Check signed in (`not_signed_in`)
    2. Check email valid and domain not blocked (`email_not_allowed`)
    3. Check email confirmation if required (`email_unconfirmed`)
    4. Check already claimed by user ID or normalized email (`already_claimed`)
    5. Check existing subscription row for `access_slug` (`already_has_access` or `not_eligible`)
    6. Check offer enabled (`disabled`)
    7. Check slots left > 0 (`sold_out`)
- **Safe Interval Creation & Provisioning**:
  - Calculates `v_ends_at := now() + make_interval(days => v_offer.trial_days);`
  - Inserts row into `public.subscriptions`:
    - `product_slug = v_offer.access_slug` (`'cpbot'`)
    - `status = 'active'`
    - `current_period_start = now()`
    - `current_period_end = v_ends_at`
    - `grant_reason = 'free_trial'`
    - `is_trial = true`
  - Inserts row into `public.trial_claims`.
  - Handles concurrent `unique_violation` gracefully by returning `{ "ok": false, "reason": "already_claimed" }`.

---

## 5. Security Model & Privilege Matrix

1. **Zero Policies on Base Tables**:
   - `trial_offers`, `trial_claims`, `user_price_overrides`, and `blocked_email_domains` all have RLS enabled with **ZERO policies**.
   - `REVOKE ALL` is applied on all four tables for `anon` and `authenticated`.
   - Direct `SELECT`, `INSERT`, `UPDATE`, or `DELETE` queries from client connections are completely rejected.
   - Sensitive administrative fields (`user_price_overrides.note`, `trial_claims.revoked_reason`) are permanently shielded from regular users.
2. **Access Strictly Via Audited RPCs**:
   - `get_trial_public`: granted to `anon` and `authenticated`.
   - `get_trial_status`, `claim_free_trial`, `normalize_email`: granted to `authenticated` only.
   - `service_role` retains default bypass for background jobs and administrative edge functions.

---

## 6. Email Verification & Abuse Realities

1. **Email Verification Dependency**:
   - The `require_confirmed_email` flag checks `auth.users.email_confirmed_at`.
   - **Crucial Requirement**: This protection is only functional when Supabase's **"Confirm email"** feature is enabled in Auth Settings and a custom transactional email provider (e.g. Resend) is configured.
   - Until verified email delivery is enabled, `email_confirmed_at` cannot be strictly relied upon, making the **`slot_cap` the absolute hard financial ceiling** limiting promotion exposure.
2. **Disposable Domains**:
   - The 15 seeded domains in `blocked_email_domains` act as a **speed bump**, not an impenetrable wall. Additional domains can be added as necessary.

---

## 7. Operational Runbook: Applying Part A by Hand

Migrations are never run automatically on this shared production database. Follow this exact operational order:

### Step 1: Pre-Flight Platform Health Check
1. Visit [status.supabase.com](https://status.supabase.com) to verify all core database services and API gateways are operating normally.

### Step 2: Execute Migration 031
1. Open the Supabase Project Dashboard → **SQL Editor**.
2. Open `supabase/migrations/031_free_trial_and_discounts.sql`.
3. Paste the contents into the editor and click **Run**.
4. Confirm query completes with `Success. No rows returned`.

### Step 3: Run Verification Script 1 (Read-Only Schema Check)
1. In the SQL Editor, copy and run **Script 1** from `docs/sql/031_free_trial_verify.sql`.
2. Inspect the single JSON output `script_1_verification_result`:
   - `objects_exist`: `subscriptions_is_trial_column_exists = true`, `subscriptions_with_is_trial_true_count = 0`, all 4 tables exist.
   - `row_level_security`: all 4 tables report `true`.
   - `privileges`: `authenticated` has zero table privileges; `anon` has execute only on `get_trial_public`; `authenticated` has execute on all functions; `listflow_app` has none.
   - `function_definitions`: `prosecdef = true` with fixed `search_path` on definer functions.
   - `rccp_offer_row`: `enabled = false`, `access_slug = 'cpbot'`, `slot_cap = 500`.
   - `blocked_domain_count`: `15`.
   - `normalize_email_tests`: all 8 test cases report `"passed": true`.
   - `existing_subscriptions_integrity`: all 6 indexes and `trg_subscription_history` trigger confirmed intact.

### Step 4: Run Verification Script 2 (Atomic Claim Test Harness)
1. In the SQL Editor, copy and run **Script 2** from `docs/sql/031_free_trial_verify.sql`.
2. Note that Script 2 tests user `50ef4d35-c7aa-47fe-bbb0-68c74afd6a3c` and **intentionally ends with `RAISE EXCEPTION`**.
3. Inspect the error output:
   ```
   ERROR: VERIFY_RESULT (this error is intentional; everything was rolled back): { ... }
   ```
4. Verify that each step reports `"passed": true`:
   - `step1_public_before`: slots_taken = 59, slots_left = 441.
   - `step2_status_before`: eligible = true, reason = 'ok'.
   - `step3_claim_first`: ok = true.
   - `step4_claim_second_idempotent`: ok = false, reason = 'already_claimed'.
   - `step5_status_after_claim`: already_claimed = true, ends_at is non-null, reason = 'already_claimed'.
   - `step6_authenticated_direct_select_refused`: passed = true.
   - `step7_anon_privileges`: public function allowed, claim and status functions refused.
   - `step8_owner_verified_records`: subscriptions row created with `is_trial = true`, trial claims created, slots taken incremented to 60.
5. Because the script aborted via `RAISE EXCEPTION`, all changes were immediately rolled back and the offer remains safely disabled.

### Step 5: Rollback Procedure (Undo Only)
If you ever need to completely remove Part A:
1. Open `docs/sql/031_free_trial_rollback.sql`.
2. Paste into the SQL Editor and click **Run**.
3. It drops all 4 functions and 4 tables (`CASCADE`) safely within a 5-second lock timeout.

---

## 8. Manual Testing via SQL (Before Admin Panel)

Until the Part D admin dashboard is built, you can manually enable and disable the trial offer directly in the SQL Editor:

### Enable 1-Day Trial for Testing:
```sql
UPDATE public.trial_offers 
SET enabled = true, 
    trial_days = 1 
WHERE tool_slug = 'rccp';
```

### Turn Trial Off:
```sql
UPDATE public.trial_offers 
SET enabled = false 
WHERE tool_slug = 'rccp';
```

### 1-Day Test Runbook
1. Set the trial offer to 1 day and 1 test slot:
   ```sql
   UPDATE public.trial_offers
   SET enabled = true,
       trial_days = 1,
       slot_cap = 1,
       slots_reserved = 0
   WHERE tool_slug = 'rccp';
   ```
2. Claim on the Dashboard (`/dashboard#claim-trial`) with the test account (`fahimmuntasirsiam@gmail.com`).
3. Turn the trial offer back off:
   ```sql
   UPDATE public.trial_offers
   SET enabled = false
   WHERE tool_slug = 'rccp';
   ```
4. Confirm the CP Bot card on the Dashboard is unlocked.
5. About 24 hours later, it locks again on the next page load.

*On launch, restore enabled/trial_days/slot_cap/slots_reserved to the real values.*

---

## 9. Part B: Checkout and Webhook Architecture

Part B bridges promotional free trials, dynamic per-user discounts, and paid Stripe billing into a unified, conflict-free pipeline.

### 9.1 Trial-to-Paid Conversion & Event Separation Rule
- **Checkout Session Completed (`checkout.session.completed`)**:
  - Only `checkout.session.completed` may INSERT or UPSERT a single-seat subscription row.
  - When a user holding an active trial subscription (`is_trial = true`, `grant_reason = 'free_trial'`) completes Stripe checkout, `public.process_stripe_webhook_event` performs an `UPSERT` on `(user_id, product_slug) WHERE store_id IS NULL`.
  - The **SAME row** in `public.subscriptions` is updated:
    - `status = 'active'`
    - `is_trial = false`
    - `grant_reason = 'stripe_checkout'`
    - `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `price_per_month`, and billing periods are updated.
  - Simultaneously, the matching row in `public.trial_claims` is stamped with `converted_at = now()`.
  - The user **never ends up with two subscription rows**, and the unique index `subscriptions_user_product_no_store_unique` is never violated.
- **Subscription Updated (`customer.subscription.updated`)**:
  - `customer.subscription.updated` **NEVER** inserts, upserts, or reactivates single-seat rows.
  - For single-seat products, it strictly updates existing active rows only:
    ```sql
    UPDATE public.subscriptions
    SET current_period_end = p_current_period_end,
        updated_at = now()
    WHERE stripe_subscription_id = p_stripe_subscription_id
      AND status = 'active';
    ```
  - It does **not** modify `cancel_at_period_end`, `is_trial`, `grant_reason`, or `status`.
  - If no matching active row exists (for example, if a late or out-of-order `customer.subscription.updated` event arrives after `customer.subscription.deleted`), the update matches 0 rows and returns success (`processed successfully`), preventing cancelled or expired subscriptions from ever being resurrected.

### 9.2 Server-Side Price Resolution Order
Clients are never trusted for pricing. When `create-checkout-session` generates a checkout URL:
1. **Per-User Override (`public.user_price_overrides`)**: Checks for an active override where `revoked_at IS NULL AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now())`:
   - `kind = 'fixed_price'`: `amount_cents` is charged directly.
   - `kind = 'percent_off'`: Discount applied to catalog price: `round(catalog_cents * (1 - percent_off / 100))`.
2. **Catalog Admin Price (`public.tools.price_monthly`)**: If no active user override exists, uses the monthly price configured by administrators in the `tools` table.
3. **Stripe Price Fallback**: If the tool is missing a database price, falls back to the static Stripe Price retrieved via the product lookup key.
- Line items are constructed dynamically via Stripe `price_data` reusing the existing Stripe Product ID.

### 9.3 Manual-Grant Safety Rule
- If an existing subscription row has `manually_granted = true` and `status = 'active'` (with `current_period_end IS NULL OR current_period_end > now()`), the webhook **will NOT overwrite it**.
- The RPC records `skipped: manual grant present` in the return payload and returns success (`HTTP 200` to Stripe), safeguarding administrative grants from accidental overwrites by test or duplicate checkouts.

### 9.4 Guard Rail Error Codes (400 and 409)
- **HTTP 409 (`already_subscribed`)**: If the user already has an active, non-trial (`is_trial = false`) subscription for the resolved access slug (`cpbot`), `create-checkout-session` rejects the call immediately.
  - **Order Bot Exemption**: The 409 guard skips `orderbot` (`product_slug !== 'orderbot'`) because Order Bot is a multi-slot product where extra stores are purchased through the same checkout flow.
  - Note: an active trial (`is_trial = true`) does **not** block checkout for any tool, allowing frictionless upgrade.
- **HTTP 400 (`price_too_low`)**: If a discount override produces a unit amount under Stripe's minimum threshold (50 cents AUD / $0.50), checkout halts without contacting Stripe.

### 9.5 Deploy Order
Deployments must strictly follow this order (manual execution only):
1. **Database Migration**: Apply `supabase/migrations/032_webhook_trial_conversion.sql` by hand in the Supabase SQL Editor and run `docs/sql/032_verify.sql` to verify single overload and permissions. *(APPLIED in production on 2026-10-24).*
2. **Deploy `create-checkout-session`**: Deploy the checkout Edge Function. *(EXECUTED: deployed v4 on 2026-10-24 09:50 UTC from home PC).*
3. **Deploy `stripe-webhook`**: Deploy the webhook Edge Function (must be deployed with `--no-verify-jwt` so Stripe can post without Supabase auth headers). *(EXECUTED: deployed v5 with `--no-verify-jwt` on 2026-10-24 09:50 UTC from home PC).*
4. **Pre-flight Check**: Do not deploy while [status.supabase.com](https://status.supabase.com) reports an active incident affecting Edge Functions or Postgres.

*Execution Note (2026-10-24)*: The deploy order was executed on 2026-10-24. The first attempt returned HTTP 403 because the Supabase CLI on the home PC was logged in to a different account (checked with `npx supabase projects list`). After running `npx supabase logout` and logging in with the account that owns the project, both functions deployed successfully.
*Troubleshooting*: If a deploy returns 403, run `npx supabase projects list`; if Automation Alchemists is missing, the CLI is logged in to the wrong account: `npx supabase logout`, then `npx supabase login` with the owning account.

---

## 10. Part E: CP Bot External Access Gating & Architecture Confirmation (Confirmed 23 Oct 2026)

Written answers from the CP Bot developer (Raf) on 23 Oct 2026 confirmed the external access architecture and corrected earlier assumptions:

1. **Entitlement Slug Confirmed**:
   - The CP Bot unlock slug is **CONFIRMED as 'cpbot'**.
   - The dashboard calls `check_product_subscription` with the single argument `p_product_slug = 'cpbot'`.

2. **CORRECTION on Paid Gating**:
   - Earlier notes stated CP Bot had no paid gating. **Wrong.**
   - The CP Bot web dashboard (`/cp-bot` pages) **IS gated by `check_product_subscription`**, operating in **strict mode (fail closed)**: if the RPC errors, everyone is locked out.

3. **Chrome Extension Gating Status & Trial Precondition**:
   - The Chrome extension is **NOT gated today**.
   - The gate ships in extension **v1.0.5.3**, currently pending Chrome Web Store review.
   - **CRITICAL**: **DO NOT open the public trial until it is live.**

4. **Expiration & Caching Behavior**:
   - The `check_product_subscription` RPC itself evaluates `current_period_end`, so the web dashboard locks on the next page load after expiry.
   - The extension caches a real answer for 5 minutes (a fresh check on popup open).

5. **Single RPC Signature Invariant**:
   - **Never create a second overload of `check_product_subscription`**: creating an overload would break PostgREST RPC resolution and lock out every paying customer.

6. **Database Tables In Use vs Unused**:
   - `cp_bot_licenses`: **Unused** (obsolete).
   - `cp_bot_config` and `cp_bot_settings`: **IN USE and must never be dropped or renamed**.
   - Other tables CP Bot uses: `cp_bot_activity_log`, `cp_bot_fulfillments`, `cp_bot_gift_templates`, `cp_bot_insight_cards`, `cp_bot_cloud_clipboard`, and `label_history`.

7. **Return Converter Gating & Production Testing**:
   - Return Converter is gated **only by sign-in** (no paid subscription required).
   - There is no staging environment: all testing is against production, so always use a dedicated test account.

8. **Developer Notification Requirements**:
   - The CP Bot developer asked to be told:
     - (a) Before the Stripe/webhook changes go live.
     - (b) When trials go live.

---

## 11. Next Steps

- **Database Migration 033**: Apply `supabase/migrations/033_admin_trial_controls.sql` by hand in the Supabase SQL Editor and run `docs/sql/033_verify.sql` to verify single overloads, security definer flags, and permissions. (Migration not yet applied in production).
- **Public Launch Precondition**: Free trial offer remains OFF (`trial_offers.enabled = false`). DO NOT enable publicly until CP Bot Chrome extension v1.0.5.3 is approved and live on the Chrome Web Store.
- **Stripe Test Run**: End-to-end verification and Stripe test-mode run planned for 2026-10-25 on office PC.

---

## 12. Admin Controls (Part D - Release v1.6.0)

Migration `033_admin_trial_controls.sql` provides 12 secure administrative RPCs and two new management panels (`/admin/free-trials` and `/admin/price-overrides`) enabling non-technical operators to administer promotional trials and customer pricing without direct database access.

### 12.1 Security & Invariant Rules
- **Caller Authorization**: Every function verifies that `auth.uid()` corresponds to an active administrator record in `public.profiles WHERE is_admin = true`. Any non-admin caller immediately raises an exception with SQLSTATE `'42501'` (`not_admin`).
- **Security Definer & Fixed Search Path**: All functions run with `LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp` to operate securely over zero-policy tables (`trial_offers`, `trial_claims`, `user_price_overrides`, `blocked_email_domains`).
- **Privilege Separation**: Table and function privileges are revoked from `PUBLIC` and `anon`. Execution is granted exclusively to `authenticated` (gated internally by the admin profile check).
- **Audit Logging**: All mutating actions automatically append an immutable audit record to `public.admin_audit_log` capturing `admin_user_id`, `admin_email`, `action`, `target_user_id`, `target_email`, and structured JSON `details`.

### 12.2 Administrative RPC Reference

| Function Signature | Who May Call | Changes Made & Validation Rules |
| :--- | :--- | :--- |
| `admin_trial_get_offer(p_tool_slug text)` | Admin only | Returns the offer configuration row plus computed `slots_taken` (`slots_reserved` + claim count) and `slots_left`. |
| `admin_trial_update_offer(p_tool_slug, p_enabled, p_trial_days, p_slot_cap, p_slots_reserved, p_require_confirmed_email)` | Admin only | Validates `trial_days` (1..90), `slot_cap` (>= 0), and `slots_reserved` (>= 0). Refuses updates if `slot_cap < slots_reserved + current_claims` (`cap_below_taken`). Updates `public.trial_offers` and logs audit entry. |
| `admin_trial_list_claims(p_tool_slug, p_search, p_limit, p_offset)` | Admin only | Returns paginated claim records (max 100/call) joined with `auth.users` and `subscriptions`. Computes real-time status (`active`, `expired`, `converted`, `revoked`). Supports escaped ILIKE search on email. |
| `admin_trial_extend(p_claim_id, p_days)` | Admin only | Validates `p_days` (1..90). Only operates on non-converted, non-revoked claims linked to active trial subscriptions (`is_trial = true`). Extends `current_period_end` from `max(now(), current_end) + p_days` and reactivates subscription. Logs audit entry. |
| `admin_trial_revoke(p_claim_id)` | Admin only | Only operates on non-converted claims. Marks claim `revoked_at = now()` with reason. Updates trial subscription to `status = 'canceled'` with `current_period_end = now()`. Logs audit entry. |
| `admin_trial_reset_claim(p_claim_id)` | Admin only | **Testing only.** Refuses converted claims (`error: 'converted'`). Deletes the trial subscription row and the claim record so the normalized email and user account can test claiming again. Logs audit entry. |
| `admin_blocked_domains_list()` | Admin only | Returns sorted list of all blocked email domains. |
| `admin_blocked_domain_add(p_domain)` | Admin only | Validates domain format (hostname pattern, <= 253 chars, trimmed, lowercased). Inserts idempotently (`ON CONFLICT DO NOTHING`). Logs audit entry. |
| `admin_blocked_domain_remove(p_domain)` | Admin only | Deletes domain from `public.blocked_email_domains`. Logs audit entry. |
| `admin_price_overrides_list(p_tool_slug)` | Admin only | Returns list of overrides joined with user emails. Calculates `is_active` based on start/end dates and revocation status. |
| `admin_price_override_create(p_user_email, p_tool_slug, p_kind, p_amount_cents, p_percent_off, p_ends_at, p_note)` | Admin only | Resolves `p_user_email` in `auth.users` (`user_not_found` if missing). Validates kind (`fixed_price` with amount >= 50 cents AUD, or `percent_off` with 0 < pct <= 100). Enforces single active override constraint (`override_exists`). Inserts override and logs audit entry. |
| `admin_price_override_revoke(p_override_id)` | Admin only | Marks active override `revoked_at = now()`. Logs audit entry. |

### 12.3 1-Day Trial Test Runbook (Using the Admin Panel)
When validating free trial lifecycle and billing end-to-end:
1. **Sign in as Admin**: Navigate to `/admin/free-trials`.
2. **Configure 1-Day Trial**:
   - Set Trial Days to `1`.
   - Set Slot Cap to `500` and Reserved Slots to `0`.
   - Uncheck "Require Confirmed Email" (for quick test account signup).
   - Toggle "Offer Status" to **Enabled** and click "Save Offer Settings".
   - Confirm the warning dialog: *"Visitors will see the free-trial button on the Return Converter x CopyPaste Bot page. Do not enable publicly until the CP Bot Chrome extension v1.0.5.3 is live."*
3. **Claim Trial on Test User**:
   - Sign in with dedicated test account (`50ef4d35-c7aa-47fe-bbb0-68c74afd6a3c` / `fahimmuntasirsiam@gmail.com`).
   - Navigate to `/dashboard#claim-trial`.
   - Click "Claim free trial". Confirm CP Bot unlocks immediately and active banner appears.
4. **Inspect in Admin Panel**:
   - Return to `/admin/free-trials`.
   - Confirm claims table shows the test user with status **Active** and ends in 24 hours.
   - Test "Extend": click "Extend", enter `1` day, confirm trial ends date moves forward 24 hours.
5. **Simulate Expiry or Convert to Paid**:
   - Either wait for 24h expiration, or proceed to Stripe test checkout for `rccp`.
   - After checkout completes, refresh `/admin/free-trials`.
   - Status badge now shows **Converted**.
   - Hover over "Revoke" and "Reset" buttons: verify both are disabled with tooltip *"Converted subscriptions cannot be revoked/reset"*.
6. **Testing Clean-up (Reset Claim)**:
   - For an un-converted test claim: click "Reset claim (testing only)".
   - Modal requires typing the user's email exactly to prevent accidents.
   - Confirm reset removes both the claim row and trial subscription row, allowing test reuse.
7. **Restore Production State**:
   - In `/admin/free-trials`, toggle Offer Status to **Disabled** and save (one-click disable).
   - Verify `/tools/rccp` returns to standard non-promotional display.



