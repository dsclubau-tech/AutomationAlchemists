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

## 2. Database Schema (Part A Migration 031)

### 2.1 Alteration to `public.subscriptions`
- **`is_trial`** (`boolean NOT NULL DEFAULT false`): Distinguishes promotional trial access from paid Stripe subscriptions and manual admin grants.
- No existing indexes, triggers, or constraints on `subscriptions` are modified.

### 2.2 `public.trial_offers`
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

### 2.3 `public.blocked_email_domains`
Maintains a curated list of temporary/disposable email domains:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `domain` | `text` | PRIMARY KEY CHECK (domain = lower(domain)) | Domain name (e.g., `mailinator.com`) |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | Timestamp added |

- **Seed**: 15 well-known disposable email domains (`mailinator.com`, `guerrillamail.com`, `10minutemail.com`, `temp-mail.org`, etc.).

### 2.4 `public.trial_claims`
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
- **Safety**: `ON DELETE SET NULL` on `user_id` ensures that if a user deletes their account, the claim row remains intact, preventing re-claiming with the same email.

### 2.5 `public.user_price_overrides`
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
| `note` | `text` | NULL | Administrative rationale |
| `created_by` | `uuid` | REFERENCES auth.users(id) ON DELETE SET NULL | Authorizing admin |
| `created_at` | `timestamptz`| NOT NULL DEFAULT now() | Creation timestamp |
| `revoked_at` | `timestamptz`| NULL | Revocation timestamp |

- **Constraint**: `fixed_price` requires `amount_cents > 0` and `percent_off IS NULL`; `percent_off` requires `0 < percent_off <= 100` and `amount_cents IS NULL`.
- **Index**: Partial unique index on `(user_id, tool_slug) WHERE (revoked_at IS NULL)`.

---

## 3. Stored Functions and Logic

### 3.1 `public.normalize_email(p_email text) RETURNS text`
- **Behavior**:
  - Strips leading/trailing whitespace and converts to lowercase.
  - Splits at the final `@` into local part and domain.
  - Maps `googlemail.com` to `gmail.com`.
  - Removes any `+tag` suffix from the local part across **all** domains.
  - Removes periods (`.`) from the local part **only** for `gmail.com`.
  - Returns `NULL` for invalid/empty inputs.

### 3.2 `public.get_trial_public(p_tool_slug text) RETURNS jsonb`
- **Execution**: Granted to `anon` and `authenticated`.
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
- **Privacy**: Exposes aggregate counts and configuration only; never leaks personal emails or user IDs.

### 3.3 `public.get_trial_status(p_tool_slug text) RETURNS jsonb`
- **Execution**: Granted to `authenticated` only.
- **Output**: Includes public fields plus claimant state:
  ```json
  {
    "enabled": true,
    "trial_days": 30,
    "slot_cap": 500,
    "slots_taken": 59,
    "slots_left": 441,
    "already_claimed": false,
    "has_access": false,
    "claim": null,
    "eligible": true,
    "reason": "ok"
  }
  ```
- **Reason Enum**:
  - `'ok'`: User is fully eligible to claim.
  - `'disabled'`: Promotion is turned off.
  - `'sold_out'`: All slots have been exhausted.
  - `'already_claimed'`: User or normalized email has already claimed a trial.
  - `'already_has_access'`: User already has an active, non-expired subscription.
  - `'not_eligible'`: User has a past subscription record.
  - `'email_unconfirmed'`: Offer requires confirmed email, but claimant's email is unverified.
  - `'email_not_allowed'`: Domain belongs to disposable email blocklist.
  - `'not_signed_in'`: Caller is unauthenticated.

### 3.4 `public.claim_free_trial(p_tool_slug text) RETURNS jsonb`
- **Execution**: Granted to `authenticated` only. Operates strictly under `auth.uid()`.
- **Atomic Concurrency Control**:
  - Locks the target row in `trial_offers` via `FOR UPDATE`.
  - Sequentially verifies: authentication → email format → disposable domain blocklist → email confirmation (if required) → offer enabled status → slot availability → prior claims → existing subscriptions.
- **Provisioning**:
  - Computes `v_ends_at := now() + (trial_days || ' days')::interval`.
  - Inserts row into `public.subscriptions`:
    - `product_slug = access_slug` (`'cpbot'`)
    - `status = 'active'`
    - `current_period_start = now()`
    - `current_period_end = v_ends_at`
    - `grant_reason = 'free_trial'`
    - `is_trial = true`
  - Inserts row into `public.trial_claims`.
  - Catches `unique_violation` and returns `{ "ok": false, "reason": "already_claimed" }`.
- **Response**: `{ "ok": true, "ends_at": "...", "days": 30 }`.

---

## 4. Security Model & Privilege Matrix

1. **Table Level Privileges**:
   - `REVOKE ALL` executed on `trial_offers`, `trial_claims`, `user_price_overrides`, and `blocked_email_domains` from both `anon` and `authenticated`.
   - `GRANT SELECT` to `authenticated` on `trial_claims` (guarded by RLS) and `user_price_overrides` (guarded by RLS).
   - No direct `INSERT`, `UPDATE`, or `DELETE` grants exist for clients; state transitions occur via `SECURITY DEFINER` functions or the service role.
2. **Row Level Security (RLS)**:
   - `trial_claims`: `SELECT USING (user_id = auth.uid())`.
   - `user_price_overrides`: `SELECT USING (user_id = auth.uid() AND revoked_at IS NULL)`.
   - `trial_offers` & `blocked_email_domains`: RLS enabled with no policies (client queries return zero rows; read access is mediated solely through RPCs).
3. **Execution Privileges**:
   - `get_trial_public`: Callable by `anon` and `authenticated`.
   - `get_trial_status`, `claim_free_trial`, `normalize_email`: Restricted to `authenticated`.

---

## 5. Abuse Controls & Limitations

1. **Email Verification Realities**:
   - Without mandatory email confirmation (`require_confirmed_email = false`), an address cannot be cryptographically proven to belong to the claimant.
   - Therefore, the **`slot_cap` is the hard financial ceiling** limiting exposure.
   - The disposable domain blocklist (`blocked_email_domains`) is a **speed bump**, not an insurmountable wall.
2. **Production Launch Plan**:
   - Configure a verified transactional email sender (e.g. Resend / SendGrid).
   - Set `require_confirmed_email = true` on the `trial_offers` row before opening public marketing.
3. **Reserved Slots Policy**:
   - `slots_reserved` is reserved strictly for pre-promised customer slots or manual allocations. It must never be used to fabricate artificial scarcity.
4. **Alias Handling in Developer Testing**:
   - Because `normalize_email` collapses `+alias` tags (e.g., `user+test1@gmail.com` resolves to `user@gmail.com`), testing the claim flow repeatedly with the same base email will trigger `already_claimed`.
   - Resetting test accounts requires manual cleanup or using the admin reset action in Part D.

---

## 6. The Slug Relationship: `rccp` vs `cpbot`

- **Tool Catalog Slug (`rccp`)**: The marketing and public checkout slug representing the "Return Converter x CopyPaste Bot" bundle.
- **Access Entitlement Slug (`cpbot`)**: The slug historically checked by `Dashboard.tsx` (`subscriptions.some(s => s.product_slug === 'cpbot')`) and targeted for gating inside the Next.js CP Bot app.
- **Decoupled Architecture**: By storing `access_slug = 'cpbot'` in `trial_offers` alongside `tool_slug = 'rccp'`, `claim_free_trial` provisions the subscription with `product_slug = 'cpbot'`. If the CP Bot developer later standardizes on `'rccp'`, only the `access_slug` column in `trial_offers` needs updating.

---

## 7. Runbook: Applying Part A by Hand

### Step 1: Execute Migration
1. Open the Supabase Project Dashboard → **SQL Editor**.
2. Open `supabase/migrations/031_free_trial_and_discounts.sql`.
3. Paste the contents and click **Run**.
4. Confirm query execution completes with `Success. No rows returned`.

### Step 2: Execute Verification
1. In SQL Editor, open `docs/sql/031_free_trial_verify.sql`.
2. Inspect the read-only output in Parts 1–4:
   - Check that `is_trial` column is listed.
   - Check that RLS is `true` for all 4 tables.
   - Check that `anon` can only execute `get_trial_public`.
   - Verify that all email normalization test cases report `test_passed = true`.
   - Verify that `is_domain_blocked = true` for `mailinator.com`.
3. To execute the Part 5 lifecycle test:
   - Replace `<TEST_USER_UUID>` with a valid test user ID from `auth.users`.
   - Run Part 5 and verify that claim 1 succeeds, claim 2 returns `already_claimed`, slot math increments, and the transaction safely rolls back.

### Step 3: Rollback Procedure (If Needed)
If you need to revert Part A:
1. Open `docs/sql/031_free_trial_rollback.sql`.
2. Paste into the SQL Editor and click **Run**.
3. Confirm all new tables and routines are dropped.

---

## 8. Decisions Log

- **Decision 1 (Single Subscriptions Table)**: Instead of creating a separate parallel entitlements table for trials, trial access rows are created in `public.subscriptions` with `is_trial = true` and `grant_reason = 'free_trial'`. This preserves compatibility with `expire-past-due-subscriptions` and existing dashboard queries without duplicating access models.
- **Decision 2 (Immutable Email Normalization)**: Email normalization handles lowercase, trim, domain mapping (`googlemail.com` → `gmail.com`), dot removal for Gmail, and `+tag` removal across all providers.
- **Decision 3 (Separate Claims vs Offers)**: `trial_offers` houses marketing knobs; `trial_claims` records individual claims. This decouples administrative capacity management from claim history.

---

## 9. Open Items for Parts B–E

1. **Part B (Webhook & Conversion Reconciliation)**: Update `process_stripe_webhook_event` to convert trial rows to paid rows upon checkout completion instead of throwing constraint errors.
2. **Part C (Public Trial Landing & Claim UI)**: Build the claim modal and button on `/tools/rccp` consuming `get_trial_public`, `get_trial_status`, and `claim_free_trial`.
3. **Part D (Admin Trial & Discount Management)**: Build admin panels for managing trial offer toggles, viewing claims, issuing user price overrides, and manual trial resets.
4. **Part E (CP Bot Access Gate Confirmation)**: Final verification with the external Next.js CP Bot app to confirm the entitlement check consumes `'cpbot'`.
