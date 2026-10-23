# QA Verification Checklist

## Part A: Database Schema & Core Functions (Applied)
- [x] Run `031_free_trial_verify.sql` Script 1 in Supabase SQL Editor:
  - Verify all 4 tables exist with `relrowsecurity = true`.
  - Verify permissions: `authenticated` has zero table privileges; `anon` has EXECUTE on `get_trial_public` only.
  - Verify all 8 email normalization unit tests pass.
- [x] Run `031_free_trial_verify.sql` Script 2 in Supabase SQL Editor:
  - Verify simulated claim lifecycle executes and outputs `VERIFY_RESULT` JSON in the exception message.
  - Verify all 8 test assertions pass (`"passed": true`).
  - Verify intentional exception cleanly rolled back all test mutations.

---

## Part B: Manual Verification (Stripe TEST Mode, Run Only After Deploy)

### 1. Trial User Converts to Paid Subscription
- **Precondition**: Authenticated test user has an active trial row in `public.subscriptions` (`is_trial = true`, `status = 'active'`, `product_slug = 'cpbot'`) and a matching row in `public.trial_claims`.
- **Action**: User navigates to checkout for tool `'rccp'`, enters Stripe test card (`4242...`), and completes checkout.
- **Expected Result**:
  - The webhook processes `checkout.session.completed` without HTTP 500.
  - The SAME row in `public.subscriptions` is updated: `is_trial` becomes `false`, `grant_reason` becomes `'stripe_checkout'`, `status` remains `'active'`, and `stripe_subscription_id` is populated.
  - No second subscription row is created for `(user_id, 'cpbot')`.
  - The matching row in `public.trial_claims` has `converted_at` set to a non-null timestamp (`now()`).

### 2. User with Old Expired Subscription Subscribes Again
- **Precondition**: Test user has an existing expired subscription row (`status = 'expired'`, `is_trial = false`, `product_slug = 'cpbot'`).
- **Action**: User initiates checkout for tool `'rccp'` and completes payment.
- **Expected Result**:
  - Webhook returns HTTP 200.
  - The existing row is upserted: `status` becomes `'active'`, `current_period_start` and `current_period_end` are updated to current billing period, `cancel_at_period_end` is `false`.
  - No unique key violation or HTTP 500 error occurs.

### 3. Price Overrides Produce Correct Checkout Amounts
- **Test 3a (Fixed-Price Override)**:
  - **Setup**: In `public.user_price_overrides`, insert an active row for test user + tool `'rccp'`: `kind = 'fixed_price'`, `amount_cents = 500` ($5.00 AUD), `starts_at = now() - interval '1 hour'`, `ends_at = NULL`.
  - **Action**: Call `create-checkout-session` for `'rccp'`.
  - **Expected Result**: Stripe Checkout session URL is generated; inspecting session line item shows unit amount is exactly $5.00 AUD (500 cents).
- **Test 3b (Percent-Off Override)**:
  - **Setup**: Insert override with `kind = 'percent_off'`, `percent_off = 20.00` (20% off tool catalog price of $9.00).
  - **Action**: Call `create-checkout-session` for `'rccp'`.
  - **Expected Result**: Computed unit amount is $7.20 AUD (720 cents), reflecting 20% discount off $9.00 catalog price.

### 4. Admin Price Change Affects Only Next Checkout
- **Action**:
  1. In `public.tools`, update `price_monthly` for `'rccp'` from `9.00` to `12.00`.
  2. Initiate a new checkout session for a user without an override.
- **Expected Result**:
  - The new session line item charges $12.00 AUD (1200 cents).
  - Existing Stripe subscriptions created prior to the update continue billing at their original rate without alteration.

### 5. Double-Charge Guard Rejects Active Subscribers with 409
- **Precondition**: User has an active, paid (`is_trial = false`, `status = 'active'`) subscription for `'cpbot'`.
- **Action**: Client calls `create-checkout-session` with `{ product_slug: "rccp", quantity: 1 }`.
- **Expected Result**:
  - Endpoint immediately halts without calling Stripe API.
  - Returns HTTP 409 with response `{ "error": "You already have an active subscription for this tool.", "code": "already_subscribed" }`.

### 6. Out-of-Order Webhook Delivery Handled Gracefully
- **Action**: Simulate a `customer.subscription.updated` event arriving prior to `checkout.session.completed` (or with missing customer details).
- **Expected Result**:
  - The webhook retrieves `user_id` and `tool_slug` from `subscription.metadata`.
  - If user/product could not be resolved from subscription or database, the RPC returns `{ "success": true, "message": "skipped: unresolved user/product" }`.
  - Edge function returns HTTP 200 (stopping Stripe retry loops).
  - No invalid row with NULL columns is inserted into `public.subscriptions`.

### 7. Manual Administrative Grant Is Never Overwritten
- **Precondition**: User has a subscription row with `manually_granted = true`, `status = 'active'`, and `current_period_end` in the future.
- **Action**: Trigger a Stripe checkout webhook for that user and tool.
- **Expected Result**:
  - RPC detects active manual grant, skips modification, and returns `{ "success": true, "message": "skipped: manual grant present" }`.
  - The manual grant row remains completely untouched.
  - Edge function responds with HTTP 200.
