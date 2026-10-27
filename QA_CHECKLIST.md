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

- DONE 2026-10-24 (home PC); skip to: Stripe Dashboard test mode > Send test event customer.subscription.updated and expect HTTP 200, then the checks.

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

---

## Part D: Admin Controls & Price Overrides Verification (Release v1.6.0)
*(Note: Migration 033 is committed but NOT applied yet in production; execute these manual checks after manual SQL application)*

### 15. Security & Admin Authorization Guards
- **Check 15a: Non-Admin User Blocked from Admin Pages**:
  - Sign in as a regular non-admin user (or sign out).
  - Navigate directly to `/admin/free-trials` and `/admin/price-overrides`.
  - **Expected Result**: AdminLayout guard redirects immediately to `/` (for signed-in non-admins) or `/auth` (for signed-out visitors). The page content is never rendered.
- **Check 15b: Non-Admin Direct RPC Rejection**:
  - Covered automatically by `docs/sql/033_behaviour_verify.sql`.
  - In browser devtools or test client, execute direct call to any `admin_` RPC (e.g. `supabase.rpc('admin_trial_get_offer', { p_tool_slug: 'rccp' })`) with a non-admin session.
  - **Expected Result**: RPC call fails immediately with PostgreSQL error code `'42501'` and message `'not_admin'`.

### 16. Free Trial Offer Controls & Confirmation Dialog
- **Check 16a: Enable Offer Confirmation Warning**:
  - Sign in as an administrator and navigate to `/admin/free-trials`.
  - Toggle "Offer Status" from Disabled to Enabled (or edit days/cap while enabled) and click "Save Offer Settings".
  - **Expected Result**: Confirmation dialog appears showing:
    - Current configuration details (trial days, slot cap, reserved slots, email confirmation requirement).
    - Warning text: *"Visitors will see the free-trial button on the Return Converter x CopyPaste Bot page. Do not enable publicly until the CP Bot Chrome extension v1.0.5.3 is live."*
    - The offer remains disabled until "Confirm & Enable Trial" is clicked.
- **Check 16b: Single-Click Disable**:
  - In `/admin/free-trials`, toggle "Offer Status" to Disabled.
  - **Expected Result**: Disables immediately without requiring the warning dialog; notification confirms offer is disabled.
- **Check 16c: Slot Cap Validation**:
  - Attempt to save a slot cap lower than `slots_reserved + existing_claims`.
  - **Expected Result**: Saving is blocked with error message indicating minimum cap requirement.

### 17. Claims Table Actions & Conversion Protection
- **Check 17a: Search & Pagination**:
  - In `/admin/free-trials`, type a search term in the search box.
  - **Expected Result**: Claims table filters by matching email addresses in real-time. Pagination navigates across claim pages.
- **Check 17b: Extend Claim**:
  - For an active trial claim, click "Extend". Enter `7` days and submit.
  - **Expected Result**: Trial expiration date moves forward by 7 days; audit log records extension.
- **Check 17c: Converted Subscription Cannot Be Revoked or Reset**:
  - Locate a claim with status badge **Converted** (e.g. following paid Stripe checkout).
  - Inspect the "Revoke" and "Reset" action buttons for that row.
  - **Expected Result**:
    - Both "Revoke" and "Reset" buttons are disabled with reduced opacity.
    - Hovering reveals a tooltip: *"Converted subscriptions cannot be revoked/reset from trial controls."*
    - Direct backend invocation of `admin_trial_revoke` or `admin_trial_reset_claim` returns error code `'converted'`.
- **Check 17d: Testing Reset Requires Email Confirmation**:
  - For an active or expired non-converted claim, click "Reset".
  - Modal appears warning that this permanently removes the claim and trial subscription for testing.
  - Attempt to click "Confirm Reset" without typing the email or typing a typo.
  - **Expected Result**: The button is disabled until the exact email address is typed into the input field. Confirming deletes the claim and subscription row so the user can test claiming again.

### 18. Blocked Email Domains
- **Check 18a: Add & Validate Blocked Domain**:
  - In `/admin/free-trials`, enter `disposable-test-mail.com` and click "Add Domain".
  - **Expected Result**: Domain is added to the list. Duplicate submissions succeed idempotently without crashing. Invalid domain formats (e.g. missing dot or invalid characters) are rejected.
- **Check 18b: Remove Blocked Domain**:
  - Click the trash icon next to a blocked domain.
  - **Expected Result**: Unblock modal appears; confirming removes the domain from the list.
- **Check 18c: Protected Domains Cannot Be Blocked**:
  - Attempt to add `gmail.com`, `outlook.com`, `hotmail.com`, `icloud.com`, or `yahoo.com`.
  - **Expected Result**: Submission is refused with error code `'protected_domain'` and message *"Cannot block protected mainstream domain: <domain>"*. Mainstream users cannot be accidentally locked out.
- **Check 18d: Audit Logging Only on Actual Insert/Delete**:
  - Call `admin_blocked_domain_add` twice for the same domain.
  - **Expected Result**: Only one audit log row is recorded in `public.admin_audit_log`. Repeated remove calls also write only one audit log row.

### 19. Price Overrides & Checkout Price Alignment
- **Check 19a: Live Price Preview**:
  - Navigate to `/admin/price-overrides`.
  - Select tool `'rccp'` (catalog price A$9.00).
  - Select "Fixed Price" and enter `5.00`.
  - **Expected Result**: Live preview displays: *"Normal A$9.00 → This user A$5.00"*.
  - Change discount type to "Percentage Off" and enter `20`.
  - **Expected Result**: Live preview displays: *"Normal A$9.00 → This user A$7.20"*.
- **Check 19b: Policy Notes & Contextual Links**:
  - Confirm the page displays the clear policy note: *"Applies to NEW checkouts only; existing subscriptions are not changed."*
  - Confirm the hint text links directly to `/admin/tools`: *"To change the standard price for everyone, edit it in the Tools catalog."*
- **Check 19c: Override Creation & Duplicate Enforcement**:
  - Enter a valid user email and submit a price override.
  - **Expected Result**: Override appears in the table with status **Active**. Attempting to submit a second active override for the same user and tool returns error `'override_exists'` (no raw database exception).
- **Check 19d: Revoke Override**:
  - Click "Revoke" on an active override row and confirm in the modal.
  - **Expected Result**: Status updates to **Revoked** and the row's Revoke button disappears.
- **Check 19e: Checkout Price Matches Override**:
  - With an active override of A$5.00 for the test account, initiate checkout for `'rccp'`.
  - **Expected Result**: Stripe checkout line item charges exactly A$5.00 AUD (500 cents).
- **Check 19f: Override Creation After Expired Override Succeeds**:
  - Precondition: An expired, un-revoked price override exists for a user and tool.
  - Action: Create a new active price override for that same user and tool.
  - **Expected Result**: Creation succeeds; the expired row has `revoked_at` set to `ends_at`; exactly one un-revoked override remains in `public.user_price_overrides`.
- **Check 19g: Unregistered Tool Slug Refused**:
  - Attempt to create an override with a non-existent tool slug.
  - **Expected Result**: Refused with error `'tool_not_found'`.

---

## 20. Tools & Dashboard Redesign and Navbar Accessibility (v1.7.0)

### 20a. Visible Tools Listing & Exclusions
- [x] **Check 20a.1: Tools Page Only Shows rccp and ListFlow**:
  - Navigate to `/tools`.
  - **Expected Result**: Exactly two cards are rendered: `rccp` first, `ListFlow` second. Order Bot and Invoice Generator do not appear anywhere on the page.
- [x] **Check 20a.2: Desktop Navbar Tools Dropdown**:
  - On viewport width >= 768px, hover or click the "Tools" navigation item.
  - **Expected Result**: Dropdown opens showing exactly two items: `rccp` and `ListFlow`. Each is on a single line with no description text and no truncation. Logo/icon displays with NO background tile or box behind it.
- [x] **Check 20a.3: Mobile Navbar Tools Drawer**:
  - On viewport width <= 640px, open the mobile menu drawer.
  - **Expected Result**: Under "Our Tools", exactly two text links appear (`rccp` and `ListFlow`) on single lines without icons or logos.
- [x] **Check 20a.4: Home Page Marquee Tools**:
  - Navigate to `/`.
  - **Expected Result**: Featured Tools & Solutions marquee section renders only `rccp` and `ListFlow`.
- [x] **Check 20a.5: Cart Upsell Suggestions**:
  - Add an item to cart or visit `/cart`.
  - **Expected Result**: "You might also like" recommendations show only tools in `VISIBLE_TOOL_SLUGS`.
- [x] **Check 20a.6: Direct Page Preservation & Noindex**:
  - Navigate directly to `/tools/orderbot` and `/tools/invoicegen`.
  - **Expected Result**: Direct pages render normally (no 404), but document `<head>` contains `<meta name="robots" content="noindex, nofollow" />`.
- [x] **Check 20a.7: Sitemap and Prerender Exclusion**:
  - Inspect `scripts/generate-sitemap.js` and `scripts/prerender.js`.
  - **Expected Result**: Routes mapped from `VISIBLE_TOOL_SLUGS`. `/tools/orderbot` and `/tools/invoicegen` are completely excluded.

### 20b. Tools Page Styling & Actions (/tools)
- [x] **Check 20b.1: Equal Height Cards**:
  - View `/tools` at desktop width (1280px).
  - **Expected Result**: Both cards have identical height via `items-stretch` and `h-full`.
- [x] **Check 20b.2: RCCP Logo Size & Surface**:
  - Inspect RCCP logo element.
  - **Expected Result**: Dimensions are >= 56px (`w-14 h-14 min-w-[56px] min-h-[56px]`) with no surrounding tinted container box.
- [x] **Check 20b.3: Background Treatment & Corner Decoration Removal**:
  - Inspect page background and cards.
  - **Expected Result**: Page uses `bg-mint-50 time-fold-ripple` matching Home. Decorative card corner shape (`bg-teal-600/5 rounded-bl-full`) is completely removed.
- [x] **Check 20b.4: RCCP Single Yellow CTA (Trial Disabled)**:
  - While trial offer is disabled (production default), observe RCCP card CTA.
  - **Expected Result**: Card contains exactly ONE button (yellow "Learn more" linking to `/tools/rccp`). "Use Free Tool" and "Get CP Bot" buttons are removed; no trial wording is present.
- [x] **Check 20b.5: ListFlow Disabled CTA**:
  - Inspect ListFlow card.
  - **Expected Result**: Exactly one disabled "Coming soon" button. Secondary "Learn more" link is removed.

### 20c. User Dashboard Layout & Bug Fixes (/dashboard)
- [ ] **Check 20c.1: Full Container Grid Width**:
  - Sign in to dashboard on deployment.
  - **Expected Result**: Card grid fills container width (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch`). Single cards do not leave empty narrow columns.
- [ ] **Check 20c.2: No Button Clipping Across Viewports**:
  - Inspect CP Bot and other cards at 360px, 768px, and 1280px screen widths.
  - **Expected Result**: Button rows wrap cleanly via `flex-wrap`; no button or badge is clipped by the card boundary.
- [ ] **Check 20c.3: Button Label Visibility & Contrast**:
  - Inspect outlined buttons (e.g. "+ Add another store", "Open Return Converter", "Buy now").
  - **Expected Result**: Button text is rendered in `text-mint-50` with >= 11:1 contrast at rest and `hover:text-teal-900 hover:bg-yellow-accent` on hover (>= 8:1 contrast). No empty or invisible labels.
- [ ] **Check 20c.4: Section Organization & Visibility Rules**:
  - **Expected Result**:
    - "Your tools": Contains `rccp`. Contains `orderbot` only if user has active/trialing subscription or stores.
    - "Available": Visible only if eligible tools exist. Shows `orderbot` only if user has subscription but 0 stores. Never shows Invoice Generator.
    - "Coming soon": Contains `ListFlow` only.

### 20d. Navbar Profile Dropdown Accessibility
- [x] **Check 20d.1: Desktop Profile Dropdown Hover & Focus**:
  - On desktop, open user profile menu and hover/focus through items (Dashboard, Notifications, Account settings, Billing).
  - **Expected Result**: Each item displays a distinct light highlight (`bg-mint-50 text-teal-900`) with text contrast > 11:1, and a visible focus ring (`ring-2 ring-teal-600`).
- [x] **Check 20d.2: Sign Out Item Hover**:
  - Hover or focus on Sign out item.
  - **Expected Result**: Displays distinct red background highlight (`bg-red-500/20 text-red-300`) with visible focus ring.
- [x] **Check 20d.3: Mobile Profile Dropdown Alignment**:
  - On mobile header, open user profile dropdown and verify hover/focus highlight, contrast, and focus ring match desktop.

---

## 21. Card-Required Free Trial Architecture (Release v1.8.0 - Migration 034 & Edge Function)

> [!NOTE]
> **SUPERSEDED IN v1.8.1**: Section 21 test plan reflected the initial v1.8.0 proposal. Superseded and executed in Section 22 below.

### 21a. Database Schema, Privileges & Single Overload Guarantees
- [x] **Check 21a.1: Tables Structure & Zero-Grant Lockdown**: Verified via `034_verify.sql` (`trial_identities` and `trial_denials` RLS enabled, 0 policies, zero privileges).
- [x] **Check 21a.2: Strict Single Overload Invariants**: Verified via `034_verify.sql` (`process_stripe_webhook_event` and `check_product_subscription` each have exactly 1 overload).
- [x] **Check 21a.3: Service Role Only Execution on New RPCs**: Verified via `034_verify.sql` (`trial_eligibility_for`, `finalize_card_trial`, `mirror_cancel_at_period_end` service_role only).

### 21b. Anti-Abuse Identity Constraints & Lifecycle Testing
- [x] **Check 21b.1: Non-Destructive Behavior Verification**: Executed via extended `034_behaviour_verify.sql` (16 cases passed).
- [x] **Check 21b.2: Edge Function Syntax & Typecheck**: Passed with `esbuild` and `tsc`.

---

## 22. Trial Conversion Safety, Status Mapping & Production Deployment (Release v1.8.1)

> [!IMPORTANT]
> **DEPLOYMENT STATUS**: Migration `034_card_trial_identity.sql` is **APPLIED to the Supabase database** (`tdevgrwmafwrsmeymjzd`) and Edge Function `stripe-webhook` is **DEPLOYED** (version 6). Public free trials remain disabled (`trial_offers.enabled = false`).

### 22a. Database Verification & Overloads (Executed & Passed)
- [x] **Check 22a.1: Run 034_verify.sql**:
  - Ran against production database `tdevgrwmafwrsmeymjzd`.
  - **Result**: Tables verified, all security flags confirmed, single overloads confirmed (1 for `check_product_subscription`, 1 for `process_stripe_webhook_event`).
- [x] **Check 22a.2: Run 034_behaviour_verify.sql (16 Cases)**:
  - Ran against production database `tdevgrwmafwrsmeymjzd`.
  - **Result**: All 16 cases and `row_count_check` passed (`passed: true` across all cases, 100% clean rollback).
    - Case 1: `claim_free_trial` rejected with `checkout_required`.
    - Case 2: User A passed eligibility.
    - Case 3: Trial subscription provisioned with +6h grace and claim linked.
    - Case 4: Idempotent replay detected and skipped.
    - Case 5: Duplicate card fingerprint blocked and logged to `trial_denials`.
    - Case 6: Duplicate phone hash blocked and logged to `trial_denials`.
    - Case 7: Same user retry is idempotent and returns existing `claim_id`.
    - Case 8: Trial converted in place (`is_trial=false`, `converted_at` stamped).
    - Case 9: Expired row safely reactivated; canceled row remained canceled.
    - Case 10: Blocked email domain rejected.
    - Case 11: Unconfirmed email rejected.
    - Case 12: `admin_trial_extend` refused revoked claim upfront.
    - Case 13: Manual grant safety and Order Bot provisioning preserved.
    - Case 14: `customer.subscription.updated` with status `'trialing'` leaves `is_trial` true, `converted_at` NULL, `grant_reason` `'stripe_trial'`, and `current_period_end` unchanged; subsequent `'active'` update converts it in place and stamps `converted_at`.
    - Case 15: `customer.subscription.updated` with status `'incomplete_expired'` returns `ignored incomplete` and leaves paid subscription unchanged.
    - Case 16: `customer.subscription.updated` with status `'paused'` maps to `'past_due'` and revokes access in `check_product_subscription`.
    - Row count check: baseline counts preserved identically.
- [x] **Check 22a.3: Baseline Row Count Integrity**:
  - BEFORE counts: subscriptions=11, trial_claims=0, trial_offers=1, stripe_webhook_events=1, rccp_enabled=false.
  - AFTER counts: subscriptions=11, trial_claims=0, trial_offers=1, stripe_webhook_events=1, rccp_enabled=false. Exact match.

### 22b. Edge Function Deployment & Fallbacks (Executed & Passed)
- [x] **Check 22b.1: Card Fingerprint Fallback Sequence**:
  - Added `resolveCardFingerprint` helper checking `subscription.default_payment_method` -> customer's `invoice_settings.default_payment_method` -> `stripe.paymentMethods.list({ customer, type: 'card', limit: 1 })`.
  - Zero sensitive data logged.
- [x] **Check 22b.2: Edge Function Deploy**:
  - Deployed `stripe-webhook` via `npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref tdevgrwmafwrsmeymjzd`.
  - Confirmed active version 6 in `npx supabase functions list`.

---

## 23. Trial Checkout, Billing Portal & Trial Button Integration (Release v1.9.0)

### 23a. Edge Function Syntax & Bundling
- [x] **Check 23a.1: create-checkout-session Syntax Validation**:
  - `npx esbuild supabase/functions/create-checkout-session/index.ts --bundle --platform=neutral --external:https:* --external:npm:* --external:node:* --outfile=scratch_bundle.js`
  - **Expected Result**: Exits 0, produces valid bundle with no syntax or type errors. (Passed: 9.3kb bundle).
- [x] **Check 23a.2: create-portal-session Syntax Validation**:
  - `npx esbuild supabase/functions/create-portal-session/index.ts --bundle --platform=neutral --external:https:* --external:npm:* --external:node:* --outfile=scratch_bundle.js`
  - **Expected Result**: Exits 0, produces valid bundle with no syntax or type errors. (Passed: 3.2kb bundle).

### 23b. Frontend Static Verification
- [x] **Check 23b.1: TypeScript Compilation**:
  - `npx tsc --noEmit -p .`
  - **Expected Result**: Exits 0 with zero diagnostic errors across all components and pages. (Passed).
- [x] **Check 23b.2: Elimination of Legacy claim_free_trial**:
  - Grep for `claim_free_trial` and `claimFreeTrial` across `src/`.
  - **Expected Result**: Zero results in frontend source files. (Passed).

### 23c. Trial Checkout Logic & Server Guards
- [ ] **Check 23c.1: create-checkout-session Trial Parameters**:
  - **Precondition**: Caller has admin profile in test environment or `CHECKOUT_ENABLED` true; `rccp` trial offer is eligible.
  - **Action**: Call `create-checkout-session` for `product_slug = 'rccp'`.
  - **Expected Result**:
    - Stripe Checkout Session created in `mode = 'subscription'`.
    - `subscription_data.trial_period_days` set to `trial_days`.
    - `subscription_data.trial_settings.end_behavior.missing_payment_method = 'cancel'`.
    - `payment_method_collection = 'always'`.
    - `phone_number_collection.enabled = true`.
    - Metadata `trial = 'true'` set on both session and `subscription_data`.
    - `custom_text.submit.message`: `"{N} days free, then A${price}/month starting {date}. Cancel anytime before then."` with computed server-side date.
    - Return payload: `{ url: session.url, trial: true }`.
- [ ] **Check 23c.2: Ineligible Caller Paid Fallback**:
  - **Precondition**: Caller is not eligible for trial (e.g. already claimed or offer disabled).
  - **Action**: Call `create-checkout-session` for `product_slug = 'rccp'`.
  - **Expected Result**: Session created without trial parameters, response returns `{ url: session.url, trial: false, reason: <reason> }`.
- [ ] **Check 23c.3: 409 Double-Charge Guard on Trialing Subscriptions**:
  - **Precondition**: Caller has an existing subscription with `status = 'trialing'` or `status = 'active'` for `cpbot`.
  - **Action**: Call `create-checkout-session` for `product_slug = 'rccp'`.
  - **Expected Result**: Immediately rejected with HTTP 409 `{ error: 'You already have an active subscription for this tool.', code: 'already_subscribed' }`. Order Bot exempt.

### 23d. Billing Portal Function
- [ ] **Check 23d.1: create-portal-session Success**:
  - **Precondition**: Authenticated user has at least one subscription row with non-null `stripe_customer_id`.
  - **Action**: POST to `/functions/v1/create-portal-session` with valid user JWT.
  - **Expected Result**: Returns HTTP 200 `{ url: portalSession.url }` with return_url set to `/dashboard`.
- [ ] **Check 23d.2: create-portal-session 404 on No Customer**:
  - **Precondition**: Authenticated user has no subscriptions with `stripe_customer_id`.
  - **Action**: POST to `/functions/v1/create-portal-session` with valid user JWT.
  - **Expected Result**: Returns HTTP 404 `{ error: 'No Stripe customer found for this account.', code: 'no_customer' }`.

### 23e. Frontend Trial & Dashboard Integration
- [ ] **Check 23e.1: Unified startTrialCheckout Behavior**:
  - **Signed out**: Clicking "Start free trial now" redirects to `/auth?mode=signup&next=<encoded safe return path>`.
  - **Signed in**: Clicking "Start free trial now" calls `create-checkout-session` and redirects to Stripe Checkout.
- [ ] **Check 23e.2: Dashboard Polling on /dashboard?checkout=success**:
  - Navigating to `/dashboard?checkout=success` displays *"Setting up your trial..."* with spinner.
  - Polls `get_trial_status` every 2s for up to 40s.
  - On `has_access = true`: displays *"Your free trial is active until {date}"* and "Open CP Bot" button.
  - On `denied_reason`: displays mapped error message and "Subscribe" button.
  - On 40s timeout: displays *"This is taking longer than usual. Refresh in a minute or contact us."*.
- [ ] **Check 23e.3: Dashboard 4 RCCP Card States**:
  - State 1 (Not eligible or no trial): shows "Subscribe" button.
  - State 2 (Trial active): shows trial end date and "Manage subscription" button.
  - State 3 (Paid active): shows renews date and "Manage subscription" button.
  - State 4 (Locked and eligible): shows "Start free trial now" button.
- [ ] **Check 23e.4: Pricing Transparency Caption**:
  - Under/next to every trial button (Tools page, RCCP tool page, Dashboard card): displays `"{trial_days} days free, then A${price}/month. Card required. Cancel anytime."` with real DB price and trial days (no hardcoding).
- [ ] **Check 23e.5: Billing Page Upgrade**:
  - `/billing` displays "Customer Billing Portal" with "Manage subscription" button wired to `redirectToBillingPortal(toast)`.
- [ ] **Check 23e.6: Fail-Safe Rule When Offer Disabled**:
  - When `trial_offers.enabled = false` in database:
    - `/tools`: Shows "Learn more" button linking to `/tools/rccp` (no trial text).
    - `/tools/rccp`: Shows "Get access" button (no trial text).
    - `/dashboard`: No trial promotional banner rendered.
    - RCCP card on Dashboard shows "Subscribe" button.
    - Entire UI matches v1.7.0 identically.

---

## 24. Trial Hardening: Single-Seat Enforcement & Duplicate Subscription Guard (Release v1.9.1)

### 24a. Static Verification & Syntax Parsing
- [x] **Check 24a.1: TypeScript Compilation**:
  - `npx tsc --noEmit -p .`
  - **Expected Result**: Exits 0 with zero diagnostic errors across all components, pages, and library modules. (Passed).
- [x] **Check 24a.2: create-checkout-session Syntax Validation**:
  - `npx esbuild supabase/functions/create-checkout-session/index.ts --bundle --platform=neutral --external:https:* --external:npm:* --external:node:* --outfile=scratch_checkout.js`
  - **Expected Result**: Exits 0, produces valid bundle with no syntax errors. (Passed: 9.7kb bundle).
- [x] **Check 24a.3: stripe-webhook Syntax Validation**:
  - `npx esbuild supabase/functions/stripe-webhook/index.ts --bundle --platform=neutral --external:https:* --external:npm:* --external:node:* --outfile=scratch_webhook.js`
  - **Expected Result**: Exits 0, produces valid bundle with no syntax errors. (Passed: 14.7kb bundle).

### 24b. Checkout & Webhook Runtime Verification (Stripe Test Mode)
- [ ] **Check 24b.1: Single-Seat Server-Side Quantity Enforcement**:
  - **Precondition**: Caller passes `{ product_slug: "rccp", quantity: 5 }` to `create-checkout-session`.
  - **Action**: Edge function processes the request.
  - **Expected Result**: Created Stripe Checkout session line item strictly enforces `quantity: 1`. Client-provided quantity `5` is completely ignored server-side.
  - **Edge Case**: For `product_slug: "orderbot"`, client quantity is preserved (e.g. `quantity: 3` results in line item quantity 3). If `orderbot` quantity is `< 1` or missing, returns HTTP 400.
- [ ] **Check 24b.2: Duplicate-Subscription Guard on Parallel Trial Checkouts**:
  - **Precondition**: User has an active or trialing subscription row in `public.subscriptions` for `cpbot` (`store_id IS NULL`, status not `'canceled'`) with a given `stripe_subscription_id`.
  - **Action**: A new trial checkout event (`checkout.session.completed` with `metadata.trial = 'true'`) arrives with a different `stripe_subscription_id` (e.g. from parallel browser tabs).
  - **Expected Result**:
    - Webhook detects the existing non-canceled row with a DIFFERENT `stripe_subscription_id`.
    - Immediately cancels the NEW Stripe subscription via `stripe.subscriptions.cancel(p_stripe_subscription_id)` (no charge).
    - Database row in `public.subscriptions` is NOT touched.
    - Webhook returns HTTP 200 with `{ received: true, duplicate_subscription: true }`.
    - If cancellation fails, returns HTTP 500 so Stripe retries.
    - **Behaviour Note**: Two parallel trial checkouts by one user end with exactly one active Stripe subscription (the second is cancelled).
- [ ] **Check 24b.3: Duplicate-Subscription Guard on Retry of Same Event**:
  - **Precondition**: User has a subscription row in `public.subscriptions` with `stripe_subscription_id = 'sub_123'`.
  - **Action**: Stripe retries delivering `checkout.session.completed` with `subscription = 'sub_123'`.
  - **Expected Result**:
    - Because `stripe_subscription_id` is the SAME, duplicate guard is not triggered.
    - Webhook proceeds normally as an idempotent retry.
- [ ] **Check 24b.4: Office PC Test Run Using "End Trial" Action**:
  - In Stripe test mode on office PC, trial-end conversion is verified using Stripe Dashboard Subscriptions → **"End trial"** action on the subscription instead of a test clock (Checkout cannot attach to a test clock).
  - Triggers `customer.subscription.updated` with status `'active'`, successfully converting the subscription row and stamping `converted_at`.

---

## 25. Webhook Stripe Endpoint API Version Independence (Release v1.9.2)

### 25a. Static Verification & Unit Test Harness
- [x] **Check 25a.1: TypeScript Compilation**:
  - `npx tsc --noEmit -p .`
  - **Expected Result**: Exits 0 with zero diagnostic errors across all files. (Passed).
- [x] **Check 25a.2: stripe-webhook Syntax & Bundling**:
  - `npx esbuild supabase/functions/stripe-webhook/index.ts --bundle --platform=neutral --external:https:* --external:npm:* --external:node:* --outfile=scratch_webhook.js`
  - **Expected Result**: Exits 0, produces valid bundle resolving `_shared/stripeCompat.ts`. (Passed: 20.3kb bundle).
- [x] **Check 25a.3: Pure Compatibility Unit Tests**:
  - `node scripts/test-stripe-compat.mjs`
  - **Expected Result**: Exits 0, all 8 test assertions pass for legacy top-level dates, clover items-based dates, invalid date protection, legacy invoice subscriptions, clover parent subscription details, and missing shapes. (Passed: 8/8 tests).

### 25b. Webhook Runtime Verification (Stripe Test Mode)
- [ ] **Check 25b.1: Stripe Dashboard "End Trial" Conversion**:
  - **Precondition**: Test account has an active trial subscription for `cpbot`.
  - **Action**: In Stripe Dashboard (Test Mode) → Subscriptions, click into the test subscription and select **"End trial"** (choose to invoice immediately).
  - **Expected Result**:
    - Stripe fires `customer.subscription.updated` with `status = 'active'`.
    - Webhook re-fetches the subscription by ID using SDK pinned version, extracts `{ start, end }` via `getPeriod(sub)`.
    - `process_stripe_webhook_event` converts the row in place: `is_trial` becomes `false`, `grant_reason` becomes `'stripe_checkout'`, and `trial_claims.converted_at` is stamped.
    - `/dashboard` displays paid active state: *"CP Bot renews {date}"*.
- [ ] **Check 25b.2: Customer Billing Portal Cancellation During Trial**:
  - **Precondition**: Test account has an active trial subscription.
  - **Action**: User opens Customer Billing Portal (`create-portal-session`) and cancels subscription.
  - **Expected Result**:
    - Stripe sets `cancel_at_period_end = true` and fires `customer.subscription.updated` with status `'trialing'`.
    - Webhook re-fetches subscription, mirrors `cancel_at_period_end = true` via `mirror_cancel_at_period_end`.
    - Database row preserves `is_trial = true`, `grant_reason = 'stripe_trial'`, and true trial expiration date. No premature conversion occurs.
- [ ] **Check 25b.3: Clover Endpoint API Version Compatibility**:
  - **Precondition**: Webhook endpoint is configured with API version `2026-02-25.clover`.
  - **Action**: Deliver `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, and `charge.refunded` events.
  - **Expected Result**:
    - Period dates are resolved without `RangeError` via `getPeriod`.
    - Invoice subscription IDs are resolved from `invoice.parent.subscription_details.subscription` via `getInvoiceSubscriptionId`.
    - Non-subscription invoices return HTTP 200 `{ received: true, skipped: 'no_subscription' }`.
    - Webhook returns HTTP 200 for all valid events.

---

## 26. Dashboard Light Theme, Card Deduplication, and Manual Grant Polish (Release v1.9.3)

### 26a. Static Verification & Pure Helper Test Suite
- [x] **Check 26a.1: TypeScript Compilation**:
  - `npx tsc --noEmit -p .`
  - **Expected Result**: Exits 0 with zero diagnostic errors across all files. (Passed).
- [x] **Check 26a.2: Vite Production Build**:
  - `npx vite build`
  - **Expected Result**: Exits 0, produces valid bundle with no sitemap changes. (Passed).
- [x] **Check 26a.3: Dashboard Sections Pure Test Suite**:
  - `node scripts/test-dashboard-sections.mjs`
  - **Expected Result**: Exits 0, all 6 test assertions pass:
    1. Owner with manual rccp grant and active listflow row: both in Your tools, Coming soon empty, no manage buttons.
    2. Paid Stripe user for rccp: Your tools with manage button and renews date.
    3. New user with no rows: rccp in Your tools as locked/free card, listflow only in Coming soon.
    4. Active trial row: Your tools with trial end text and manage button.
    5. Expired row: excluded from Your tools, present in Coming soon.
    6. Order Bot exception and Invoice Generator hidden. (Passed: 6/6 tests).

### 26b. Owner Visual Verification Checklist (Live Vercel Deployment)
- [ ] **Check 26b.1: Dashboard Page Theme Matches /tools**:
  - Sign in to `https://www.automationalchemists.com/dashboard`.
  - Confirm page background is light mint (`bg-mint-50 #EBF4F4`) with time-fold ripple, matching `https://www.automationalchemists.com/tools`.
  - Confirm page heading *"Your dashboard"* is dark teal (`text-teal-900 #0A363D`) and subtitle is clear (`text-teal-900/80`).
  - Confirm all cards have a clean white surface (`bg-white rounded-2xl border border-teal-600/20 shadow-sm`), no dark background patches or noisy blocks.
- [ ] **Check 26b.2: No Duplicate Tool Cards for Owner**:
  - With manual CP Bot grant and active ListFlow row:
  - Both **Return Converter x CopyPaste Bot** and **ListFlow** appear under *"Your tools"*.
  - *"Coming soon"* section does NOT display ListFlow (it is empty or hidden).
- [ ] **Check 26b.3: Manual Grant Manage Button & Date Text**:
  - On the **Return Converter x CopyPaste Bot** card (manual grant):
    - Confirm NO *"Manage subscription"* button is shown.
    - Confirm text displays *"CP Bot access until {date}"* (or *"CP Bot access: no end date"*) rather than *"renews {date}"*.
  - On the **ListFlow** card (manual grant):
    - Confirm NO *"Manage subscription"* button is shown.
    - Confirm text displays *"Access until {date}"* rather than *"renews {date}"*.
- [ ] **Check 26b.4: Paid Stripe Subscriber Verification**:
  - For a paying customer with an active Stripe subscription:
    - Card shows *"Manage subscription"* button with teal outline (`border-teal-600 text-teal-900`).
    - Clicking *"Manage subscription"* invokes `create-portal-session` and launches the Stripe Billing Customer Portal.
    - Renewal date shows *"Renews {date}"*.








