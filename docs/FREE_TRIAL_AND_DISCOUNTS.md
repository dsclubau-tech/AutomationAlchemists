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

---

## 9. Next Steps (Parts B–E)

- **Part B (Webhook & Conversion Reconciliation)**: Update `process_stripe_webhook_event` to convert trial rows to paid rows upon checkout completion.
- **Part C (Public Trial Landing & Claim UI)**: Build the claim modal and button on `/tools/rccp` consuming `get_trial_public`, `get_trial_status`, and `claim_free_trial`.
- **Part D (Admin Trial & Discount Management)**: Build admin panels for managing trial offer toggles, viewing claims, issuing user price overrides, and manual trial resets.
- **Part E (CP Bot Access Gate Confirmation)**: Final verification with the external Next.js CP Bot app to confirm the entitlement check consumes `'cpbot'`.
