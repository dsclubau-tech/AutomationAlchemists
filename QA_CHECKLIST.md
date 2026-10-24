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
- *(Covered by docs/sql/032_behaviour_verify.sql)*
- **Action**: Simulate a `customer.subscription.updated` event arriving prior to `checkout.session.completed` (or with missing customer details).
- **Expected Result**:
  - The webhook retrieves `user_id` and `tool_slug` from `subscription.metadata`.
  - If user/product could not be resolved from subscription or database, the RPC returns `{ "success": true, "message": "skipped: unresolved user/product" }`.
  - Edge function returns HTTP 200 (stopping Stripe retry loops).
  - No invalid row with NULL columns is inserted into `public.subscriptions`.

### 7. Manual Administrative Grant Is Never Overwritten
- *(Covered by docs/sql/032_behaviour_verify.sql)*
- **Precondition**: User has a subscription row with `manually_granted = true`, `status = 'active'`, and `current_period_end` in the future.
- **Action**: Trigger a Stripe checkout webhook for that user and tool.
- **Expected Result**:
  - RPC detects active manual grant, skips modification, and returns `{ "success": true, "message": "skipped: manual grant present" }`.
  - The manual grant row remains completely untouched.
  - Edge function responds with HTTP 200.

### 8. Out-of-Order customer.subscription.updated Delivered After customer.subscription.deleted Does NOT Reactivate
- *(Covered by docs/sql/032_behaviour_verify.sql)*
- **Precondition**: User has a cancelled subscription in `public.subscriptions` (`status = 'canceled'`) with a given `stripe_subscription_id` (e.g. following a `customer.subscription.deleted` webhook event).
- **Action**: Simulate or deliver a late `customer.subscription.updated` webhook event for that same `stripe_subscription_id` with `status: "active"`.
- **Expected Result**:
  - The single-seat branch in `process_stripe_webhook_event` executes `UPDATE public.subscriptions ... WHERE stripe_subscription_id = p_stripe_subscription_id AND status = 'active'`.
  - Because existing status is `'canceled'`, 0 rows are updated.
  - No row is inserted, upserted, or reactivated; status remains `'canceled'`.
  - RPC returns `{ "success": true, "message": "processed successfully" }` and webhook returns HTTP 200.

### 9. Existing Order Bot Subscriber Can Purchase Additional Store Slots Without 409
- **Precondition**: User already has an active subscription for Order Bot (`product_slug = 'orderbot'`, `status = 'active'`).
- **Action**: Client calls `create-checkout-session` with `{ product_slug: "orderbot", quantity: 1 }` (or greater) to purchase an additional store slot.
- **Expected Result**:
  - Endpoint skips the 409 `already_subscribed` double-charge guard specifically for `orderbot`.
  - Checkout session creation proceeds normally and returns a valid Stripe checkout URL (`HTTP 200`).

---

### Part B Stripe test-mode run (office PC, 2026-10-25)
- **Prereqs**: Stripe Dashboard in TEST mode; webhook endpoint `https://tdevgrwmafwrsmeymjzd.supabase.co/functions/v1/stripe-webhook` listens to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `charge.refunded`.
- **Getting to checkout**: temporarily make the test account admin (`update public.profiles set is_admin = true where id = '50ef4d35-c7aa-47fe-bbb0-68c74afd6a3c';`); create `.env.local` with `VITE_CHECKOUT_ENABLED=true` (never commit it); `npm run dev`; sign in as the test account; click Get access on the rccp page; when finished set `is_admin` back to false.
- **Checks that need no payment (do first)**: amount on Stripe's page is A$9.00; with a fixed_price override of 500 cents it is A$5.00; with percent_off 20 it is A$7.20 (revoke each override after); change public.tools price_monthly for 'rccp' to 12, the next checkout shows A$12.00, change it back to 9.
- **After the 1-day trial has expired**: pay with card 4242 4242 4242 4242, any future expiry and CVC, then run the verification query:
  ```sql
  select s.id, s.product_slug, s.status, s.is_trial, s.grant_reason, s.stripe_subscription_id is not null as has_stripe, s.current_period_end, c.converted_at
  from public.subscriptions s
  left join public.trial_claims c on c.subscription_id = s.id
  where s.user_id = '50ef4d35-c7aa-47fe-bbb0-68c74afd6a3c'
  order by s.created_at;
  ```
  Expect ONE row: `cpbot`, `active`, `is_trial false`, `stripe_checkout`, `has_stripe true`, `converted_at filled`. Stripe's event deliveries show 200. Click Get access again: expect the 'already subscribed' 409. Then cancel the test subscription in Stripe test mode.
- *(Checks 6, 7, 8 marked as covered by docs/sql/032_behaviour_verify.sql).*

---

---

## Part C: Free Trial Claims, Auth Return Flow & Hero States (v1.5.0)

### 11. Baseline Invariant: Offer OFF Produces Zero Visible Changes
- **Precondition**: `trial_offers.enabled = false` in production database (current reality).
- **Action**:
  1. Navigate to `/tools/rccp` as signed-out visitor and signed-in user.
  2. Navigate to `/dashboard` as signed-in user without active CP Bot subscription.
- **Expected Result**:
  - `/tools/rccp` hero shows standard "Get access" yellow button and "Use Return Converter free" secondary button. No trial button or spots remaining line appears.
  - `/dashboard` renders no trial claim card or banner.
  - No errors are thrown in the console.

### 12. RCCP Hero Dynamic States (Offer Enabled in Test/Dev)
- **State A (Signed-out visitor, slots available)**:
  - Hero primary button reads "Get your 30-day free trial now" with "{slots_left} of {slot_cap} free-trial spots left" beneath.
  - Clicking button navigates to `/auth?mode=signup&next=/dashboard%23claim-trial`.
  - Auth page opens with "Create account" tab preselected.
- **State B (Signed-in user without trial, slots available)**:
  - Hero primary button reads "Get your 30-day free trial now" with spots line.
  - Clicking button navigates directly to `/dashboard#claim-trial`.
- **State C (Signed-in user with active trial)**:
  - Hero replaces trial CTA with status pill: "Your free trial is active" and "{X} days left" (or "{H} hours left").
  - "Open dashboard" link navigates to `/dashboard`.
- **State D (Signed-in user with ended trial)**:
  - Hero displays "Get CP Bot" as yellow primary button (no trial button).

### 13. Authentication Return Navigation & URL Sanitization
- **Default Navigation Invariant (No Next Parameter)**:
  - Sign in with no `?next=` lands exactly where it did before v1.5.0: a normal user lands on `/`, and an admin lands on `/admin`.
- **Return to Claim Card After Sign-up**:
  - Sign up with `?next=/dashboard%23claim-trial` returns to the dashboard claim card after account creation (and after email confirmation when confirmation is on).
- **Open-Redirect Protection**:
  - Navigate to `/auth?next=https://evil.com`. Complete sign-in. Verify user is redirected to `/` (evil domain rejected).
  - Navigate to `/auth?next=//evil.com`. Complete sign-in. Verify user is redirected to `/` (protocol-relative path rejected).
  - Navigate to `/auth?next=/\evil.com`. Complete sign-in. Verify user is redirected to `/`.
  - Navigate to `/auth?next=/dashboard#claim-trial`. Complete sign-in. Verify user is redirected to `/dashboard#claim-trial`.
- **Email Sign-up Confirmation**:
  - Sign up with `?next=/dashboard#claim-trial`. Inspect `supabase.auth.signUp` options to confirm `emailRedirectTo` contains `${origin}/dashboard#claim-trial`.
- **Get Access Signed-Out Preservation**:
  - On `/tools/rccp`, click "Get access" while signed out. Verify browser navigates to `/auth?next=%2Ftools%2Frccp`.

### 14. Dashboard Claim Card & Banners (`#claim-trial`)
- **Direct Hash Link**:
  - Navigate to `/dashboard#claim-trial`.
  - Verify page scrolls smoothly to the trial card and momentarily highlights it.
- **Claim Action**:
  - Click "Claim free trial".
  - Verify button shows loading spinner and double-clicks are ignored.
  - On claim success, subscription data refetches without page reload; CP Bot card unlocks; green banner confirms active status until expiration date.
- **Active Trial Banner**:
  - Renders slim banner with remaining days or hours (when < 48 hours) and "Subscribe to keep CP Bot" button.
- **Ended Trial Banner**:
  - For expired/ended trial, renders "Your free trial has ended" with "Subscribe to keep CP Bot" button.
- **Rejection & Error Handling**:
  - Blocked disposable email domain -> "Please use a personal email address to start the free trial."
  - Already claimed -> "This account or email has already used the free trial."
  - Sold out -> "All free-trial spots have been claimed."
  - Confirmation required -> "Please confirm your email first, then try again."
  - Network failure -> "Something went wrong. Please try again."

---

## Part D: Tools Page Card Layout & Copy Verification (v1.4.4)

### 10. Return Converter x CopyPaste Bot Card Copy and Desktop Alignment
- **Precondition**: Application deployed or running with latest `/tools` code.
- **Action**: Navigate to `/tools` on a desktop viewport (>= 1024px width).
- **Expected Result**:
  - On `/tools`, the card shows the new text:
    - Description: *"Paste eBay buyer addresses straight into Amazon checkout, and turn Amazon return codes into clean eBay return labels."*
    - Bullet 1: **One-click copy** - eBay buyer address into Amazon checkout
    - Bullet 2: **Instant labels** - Amazon return codes into eBay return labels
    - Bullet 3: **History tracking** - Fulfilment and return label history
    - Bullet 4: **Cloud clipboard** - Copy in one browser, paste in another
  - Each bullet renders on one line at desktop width.
  - The card is no taller than the ListFlow card beside it.


