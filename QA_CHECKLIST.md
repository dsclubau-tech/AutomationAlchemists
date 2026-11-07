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

---

## 27. Email Logo Asset and Webhook Refund Fix (Release v1.9.4)

### 27a. Static Verification & Asset Checks
- [x] **Check 27a.1: TypeScript Compilation**:
  - `npx tsc --noEmit -p .`
  - **Expected Result**: Exits 0 with zero diagnostic errors across all files. (Passed).
- [x] **Check 27a.2: stripe-webhook Syntax & Bundling**:
  - `npx esbuild supabase/functions/stripe-webhook/index.ts --bundle --platform=neutral --external:https:* --external:npm:* --external:node:* --outfile=scratch_webhook.js`
  - **Expected Result**: Exits 0, produces valid bundle; scratch file deleted. (Passed: 21.4kb bundle).
- [x] **Check 27a.3: Pure Compatibility Unit Tests (12/12 Passed)**:
  - `node scripts/test-stripe-compat.mjs`
  - **Expected Result**: Exits 0, all 12 test assertions pass, including:
    - Test 9: `getChargeInvoiceId` with string invoice.
    - Test 10: `getChargeInvoiceId` with expanded object invoice.
    - Test 11: `getChargeInvoiceId` with null invoice.
    - Test 12: `getChargeInvoiceId` with missing invoice / undefined / null charge. (Passed: 12/12 tests).
- [x] **Check 27a.4: Email Logo Asset Specifications**:
  - Inspect `public/email-logo.png` properties via Python Pillow script.
  - **Expected Result**: Dimensions are exactly 400x400; byte size is <= 100 KB (30.56 KB); PNG header signature is valid `89504e470d0a1a0a`; 4 corner pixels at (0,0), (399,0), (0,399), (399,399) are all pure black `(0, 0, 0)`; image mode is RGB without transparency. (Passed).

### 27b. Runtime & Live Verification
- [ ] **Check 27b.1: Hosted Email Logo URL Loads as an Image**:
  - **Action**: After Vercel deploys `main`, open `https://www.automationalchemists.com/email-logo.png` directly in a browser or test with HTTP GET.
  - **Expected Result**:
    - HTTP 200 OK with `Content-Type: image/png`.
    - Returns the 400x400 Automation Alchemists logo on black background.
    - Does NOT return the SPA `index.html` fallback or 404 page.
    - Cache headers match `public, max-age=31536000, immutable`.
- [ ] **Check 27b.2: Stripe Test-Mode Refund Updates Access Under Clover Payload**:
  - **Precondition**:
    - Webhook deployed (`stripe-webhook`).
    - Test account has an active paid subscription for `rccp` (`cpbot`), created via Stripe Checkout.
    - Webhook endpoint is configured with API version `2026-02-25.clover`.
  - **Action**:
    - In Stripe Dashboard (Test Mode) → Payments, find the charge for the test subscription.
    - Click **"Refund"** to refund the charge in full.
  - **Expected Result**:
    - Stripe fires `charge.refunded` with clover payload shape (no `invoice` property on `event.data.object`).
    - Webhook extracts `event.data.object.id`, re-retrieves charge via `stripe.charges.retrieve(chargeId)` under pinned SDK API version.
    - `getChargeInvoiceId` extracts the invoice ID from the retrieved charge.
    - Webhook retrieves invoice and resolves subscription ID via `getInvoiceSubscriptionId`.
    - Webhook calls `process_stripe_webhook_event` with `p_quantity = 0`.
    - User's subscription in `public.subscriptions` is updated with `quantity = 0`, revoking active tool access.
    - Webhook returns HTTP 200.

---

## 28. Invoice Generator Landing Page, Tools Card & Dashboard Button Accessibility (Release v1.10.0)

### 28a. Static Verification & Asset Checks
- [x] **Check 28a.1: TypeScript Compilation**:
  - `npx tsc --noEmit -p .`
  - **Expected Result**: Exits 0 with zero diagnostic errors across all files. (Passed).
- [x] **Check 28a.2: Dashboard Section Unit Test Suite**:
  - `node scripts/test-dashboard-sections.mjs`
  - **Expected Result**: Exits 0, all 6 test assertions pass (including Invoice Generator hidden assertion). (Passed: 6/6 tests).
- [x] **Check 28a.3: Invoice Generator Logo Asset Specifications**:
  - Inspect `public/invoice-generator-logo.png` properties.
  - **Expected Result**: Dimensions are 425x512 (<= 512px on longest side); file size is 34.35 KB; PNG format with full alpha channel; 100% of border pixels transparent with no visible halo. (Passed).

### 28b. Runtime & User-Facing Verification
- [ ] **Check 28b.1: /tools Directory 3-Card Layout**:
  - Open `http://localhost:8080/tools` (or live production URL).
  - **Expected Result**:
    - Displays 3 cards side by side in equal height on desktop/tablet.
    - Card 1: Return Converter x CopyPaste Bot (`rccp`).
    - Card 2: ListFlow (`listflow`, Coming soon).
    - Card 3: Invoice Generator (`INVOICING` tag, `Free` badge, "Free to get started" price, and "Learn more" button linking to `/tools/invoice-generator`).
- [ ] **Check 28b.2: /tools/invoice-generator Product Page**:
  - Open `http://localhost:8080/tools/invoice-generator`.
  - **Expected Result**:
    - Breadcrumb: Tools > Invoice Generator.
    - Hero card shows product logo, parent brand line ("by Automation Alchemists"), headline ("Simple invoices for marketplace sellers."), supporting text, audience line, availability line.
    - "Start free" button links to `https://invoice-generator-mu-pearl.vercel.app/signup` in a new tab (`target="_blank" rel="noopener noreferrer"`).
    - Separate account note visible next to the button.
    - 4 feature cards, 3 workflow steps, "What's included for free" allowance (no prices or plan names), and 6 interactive FAQ accordions.
    - Privacy Policy and contact email links work properly.
    - No placeholder screenshots appear (screenshots section is omitted until items are added).
- [ ] **Check 28b.3: Mobile Responsiveness at 390px**:
  - Resize browser viewport to 390px width.
  - **Expected Result**: Clean layout with 0 horizontal overflow or clipped buttons.
- [ ] **Check 28b.4: Navigation Menu Integration**:
  - Desktop: Hover "Tools" in navbar. Confirm dropdown shows `rccp`, `ListFlow`, and `Invoice Generator` with its logo.
  - Mobile: Open hamburger menu. Confirm "Our Tools" list includes `Invoice Generator`.
- [ ] **Check 28b.5: /dashboard Button Label Visibility & Isolation**:
  - Sign in and navigate to `/dashboard`.
  - **Expected Result**:
    - The ListFlow card shows a disabled, muted "Coming soon" button with dark teal text on light mint background (`bg-teal-600/10 text-teal-900/60`).
    - The CP Bot card's "Open Return Converter" button has clearly visible dark teal text (not a solid dark block).
    - Manage subscription and secondary buttons are clearly visible with high contrast.
    - Invoice Generator does NOT appear anywhere on `/dashboard`.

---

## 29. Launch Readiness: Pricing, GST Tax Rate, Terms Consent, and Billing States (Release v1.11.0)

### 29a. Static Verification & Pure Helper Test Suite
- [x] **Check 29a.1: Launch Readiness Test Suite (4/4 Suites Passed)**:
  - `node scripts/test-launch-readiness.mjs`
  - **Expected Result**: Exits 0, all 4 test suites pass:
    - Suite A: Checkout params helper (fails closed on missing GST rate ID, attaches `default_tax_rates`, includes required terms consent with markdown URLs, and contains zero `automatic_tax`).
    - Suite B: `getBillingView` state machine covering `none`, `expired`, `trialing`, `trialing_canceled`, `active`, `active_canceled`, and `past_due` (with suppressed Subscribe actions).
    - Suite C: Pricing config values (9.99/4.99 AUD, valid formatting without NaN/undefined, exact trial copy).
    - Suite D: Source code grep audit confirming zero leftover hard-coded "A$9" / "9/month" strings in `src/`. (Passed: 0 errors).
- [x] **Check 29a.2: Dashboard Section Regression Unit Tests (6/6 Passed)**:
  - `node scripts/test-dashboard-sections.mjs`
  - **Expected Result**: Exits 0, all 6 test assertions pass. (Passed).
- [x] **Check 29a.3: Stripe Compatibility Unit Tests (12/12 Passed)**:
  - `node scripts/test-stripe-compat.mjs`
  - **Expected Result**: Exits 0, all 12 test assertions pass. (Passed).
- [x] **Check 29a.4: Production Build Compilation**:
  - `npx vite build`
  - **Expected Result**: Exits 0, bundles cleanly without syntax or import errors. (Passed: built in 7.66s).

### 29b. Runtime & User-Facing Verification (Local Dev Server / Staging)
- [x] **Check 29b.1: /tools Directory RCCP Card Price & Trial Terms**:
  - Open `http://localhost:8080/tools`.
  - **Expected Result**:
    - RCCP card renders crossed-out standard price was A$9.99 (`<s><span class="sr-only">was A$9.99</span>A$9.99</s>`).
    - Renders launch price `A$4.99/month` with a `"Launch price"` badge and `"incl. GST"`.
    - Next to the trial button, renders exact trial copy: *"Free for 30 days, then A$4.99/month (launch price, normally A$9.99), incl. GST, charged automatically until you cancel. By starting your trial you agree to the Terms of Service and Privacy Policy."*
    - Terms and Privacy links open in a new tab (`target="_blank" rel="noopener noreferrer"`).
- [x] **Check 29b.2: /tools/rccp Product Page Hero & Pricing Section**:
  - Open `http://localhost:8080/tools/rccp`.
  - **Expected Result**:
    - Product title is CP Bot (Copy Paste Bot).
    - Pricing section renders crossed-out A$9.99, launch price A$4.99/month, "Launch price" label, and "incl. GST".
    - Trial line is rendered with active Terms and Privacy links.
- [x] **Check 29b.3: Customer Dashboard Billing States (/dashboard)**:
  - For active trial: shows *"Free trial active - ends on <date>"* with *"Manage billing"*.
  - For cancelled trial (`cancel_at_period_end`): shows *"Trial cancelled - access until <date>; no charge"*.
  - For active paid subscription: shows *"Subscription active - renews on <date>"* with *"Manage billing"*.
  - For cancelled paid subscription: shows *"Cancelled - access until <date>"*.
  - For `past_due`: displays top alert banner *"Payment failed - CP Bot is paused. Update your payment method to restore access."* with button *"Update payment method"*. All Subscribe and Start trial buttons are hidden.
- [ ] **Check 29b.4: Post-Deploy Edge Function GST Secret Check**:
  - Deploy `create-checkout-session` without setting `STRIPE_GST_TAX_RATE_ID`.
  - Trigger checkout call as admin.
  - **Expected Result**: Fails closed with HTTP 500 `"GST tax rate not configured"`.
  - Set `STRIPE_GST_TAX_RATE_ID=<live_rate_id>`.
  - Trigger checkout call as admin.
  - **Expected Result**: Checkout session created with `default_tax_rates = [<live_rate_id>]` and Terms consent.
---

## 30. Billing Details Collection at Checkout (Release v1.12.0)

### 30a. Static Verification & Pure Helper Test Suite
- [x] **Check 30a.1: Launch Readiness Test Suite Extended Assertions (Suite A)**:
  - `node scripts/test-launch-readiness.mjs`
  - **Expected Result**: Exits 0, all tests pass including:
    - Test A5: `billing_address_collection` is `'required'` and `phone_number_collection` is enabled on all checkout sessions.
    - Test A6: `name_collection` correctly builds optional business name and required individual name (`{ individual: { enabled: true, optional: false }, business: { enabled: true, optional: true } }`) when configured.
    - Test A7: `customer_update` (`{ name: 'auto', address: 'auto' }`) is attached only when a `customer` ID is provided, and is strictly omitted when using `customer_email`.
- [x] **Check 30a.2: TypeScript Diagnostic Error Baseline**:
  - `npx tsc --noEmit -p tsconfig.app.json`
  - **Expected Result**: Exact match with known 101 pre-existing diagnostic errors (0 new errors introduced).
- [x] **Check 30a.3: Production Build Compilation**:
  - `npx vite build`
  - **Expected Result**: Exits 0, production bundle builds cleanly.

### 30b. Live Checkout & Invoice Verification (To be executed by Fahim and Raf on live/test Stripe)
- [ ] **Check 30b.1: Mandatory Billing Address on Checkout Form**:
  - **Action**: Start a trial or subscription checkout for CP Bot.
  - **Expected Result**:
    - Stripe Checkout displays full billing address inputs: Street Address, City, State/Province, Postal Code, and Country.
    - Attempting to complete checkout with empty address fields is blocked by form validation.
    - Phone number and email fields are present and collected.
- [ ] **Check 30b.2: Individual & Optional Business Name Fields (Post-SDK Upgrade Check)**:
  - **Action**: When `name_collection` is activated with a compatible Stripe API version, open Checkout.
  - **Expected Result**:
    - Individual full name is required.
    - Business / company name is present as an optional field.
- [ ] **Check 30b.3: Complete Address on Resulting Tax Invoice**:
  - **Action**: Complete checkout with valid card and billing address (e.g. 123 George St, Sydney NSW 2000, Australia).
  - **Expected Result**:
    - In Stripe Dashboard (or downloaded invoice PDF), view invoice under "Bill to".
    - Full street address, city, state, postal code, country, customer name, phone number, and email are rendered under "Bill to".
- [ ] **Check 30b.4: Optional Company Name Rendering on Invoice**:
  - **Test Case 1 (Filled)**: Customer fills in "Acme Trading Pty Ltd". The company name appears under "Bill to" on the invoice.
  - **Test Case 2 (Omitted)**: Customer leaves company name blank. No blank line, placeholder, or undefined field appears on the invoice.

---

## 31. Live Free-Trial Spots Banner Verification (Release v1.13.0)

### 31a. Static Verification & Pure Helper Test Suite
- [x] **Check 31a.1: Trial Banner Pure Helper Test Suite**:
  - `node scripts/test-trial-banner.mjs`
  - **Expected Result**: Exits 0, all 6 tests pass:
    - Test 1: Loading state returns `state="loading"` and `shouldRender=true`.
    - Test 2: Error, disabled offer, or missing data safely hides banner (`shouldRender=false`).
    - Test 3: Normal available state formats numbers, progress percentage, and non-urgent copy.
    - Test 4: Low threshold boundary (<= 10% of cap) activates urgency styling with singular/plural grammar.
    - Test 5: Sold-out state truthfully presents launch price availability with `get_access` CTA.
    - Test 6: Dynamic arbitrary cap calculates percentage and headline without hardcoded limits.
- [x] **Check 31a.2: TypeScript Baseline Parity**:
  - `npx tsc --noEmit -p tsconfig.app.json`
  - **Expected Result**: Exact match with known 101 pre-existing diagnostic errors (0 new errors introduced).
- [x] **Check 31a.3: Production Build & Prerender Snapshot Invariant**:
  - `npm run build`
  - **Expected Result**: Exits 0. `dist/tools/rccp/index.html` contains the structural skeleton (`animate-pulse`) and ZERO baked-in stale numbers ("100 of 100", "free-trial spots left").

### 31b. Live Behavior & State Scenarios
- [ ] **Check 31b.1: Anonymous Visitor Display**:
  - Open an Incognito window (unauthenticated) and navigate to `https://www.automationalchemists.com/tools/rccp`.
  - **Expected Result**: Banner renders prominently near the top of the hero section displaying live capacity from `get_trial_public('rccp')` (e.g. "100 of 100 free-trial spots left") with animated progress bar and "Start your free trial" button.
- [ ] **Check 31b.2: Live Polling & Tab Refocus**:
  - Keep the RCCP landing page open in Tab 1. In Tab 2, claim a trial spot.
  - Switch back to Tab 1.
  - **Expected Result**: On tab refocus (or within 30 seconds of visibility), banner refetches and smoothly counts down remaining spots from the previous count to the updated count.
- [ ] **Check 31b.3: Reduced-Motion Accessibility**:
  - Enable "Reduce Motion" in OS settings (Windows: Settings -> Accessibility -> Visual effects -> Animation effects OFF).
  - Refresh or trigger a spots update on `/tools/rccp`.
  - **Expected Result**: Number updates immediately without motion transition; progress bar width adjusts instantly without CSS transition.
- [ ] **Check 31b.4: Mobile Responsiveness (360px Viewport)**:
  - In DevTools, set viewport to 360x740.
  - Inspect the top of `/tools/rccp`.
  - **Expected Result**: Banner is completely above the fold, headline wraps naturally without horizontal scrolling, progress bar renders full width, CTA button spans full width cleanly, and legal terms line is legible.
- [ ] **Check 31b.5: Low Capacity Urgency State (<= 10% of Cap)**:
  - Simulate or set `slots_left` to <= 10 (for cap 100).
  - **Expected Result**:
    - Banner displays amber subtle ring and border.
    - Badge displays "ALMOST GONE" with AlertCircle icon.
    - Headline displays "Only N free-trial spots left" (or "Only 1 free-trial spot left" when 1 remains).
    - Progress bar displays warm amber gradient.
    - CTA button says "Claim your spot now".
- [ ] **Check 31b.6: Sold-Out State (0 Spots Left)**:
  - Simulate or set `slots_left = 0`.
  - **Expected Result**:
    - Badge displays "FREE TRIAL FULL".
    - Headline displays "All free-trial spots have been claimed".
    - Subtext truthfully explains promotional spots are full and CP Bot is available at the launch price.
    - Progress bar width is 0%.
    - CTA button displays "Get CP Bot now" and routes to normal checkout.
- [ ] **Check 31b.7: Offer Disabled / Network Error Fail-Silent**:
  - Set `trial_offers.enabled = false` or block network RPC calls to `get_trial_public`.
  - **Expected Result**: Banner hides completely (`return null`), causing zero layout breakage, zero visible error banners, and zero invalid numbers.
- [ ] **Check 31b.8: Landing Page Spots Counter Exclusivity**:
  - Navigate to `/tools/rccp` (both desktop and 360px mobile viewports).
  - Inspect the lower hero card action area below the "Get your 30-day free trial now" button.
  - **Expected Result**:
    - The small redundant spots text is completely gone from below the button.
    - The button itself is fully functional and preserved.
    - The pricing line ("Return Converter: Free / CP Bot: A$4.99/month...") and `TrialTermsLine` (Terms of Service / Privacy Policy links) remain intact.
    - ONLY the top promotional banner displays the free-trial spots number on this page.
- [ ] **Check 31b.9: Dashboard Trial Card Spots Text Preserved**:
  - Navigate to `/dashboard` with an eligible account when the offer is enabled.
  - Inspect the CP Bot trial card.
  - **Expected Result**: The dashboard trial card continues to display its own "{slotsLeft} of {slotCap} free-trial spots left" line as normal.


---

## 32. Consistent Trial End Date & Trial Gating by Card and Email Only (Release v1.14.0)

### 32a. Static Verification & Pure Helper Test Suite
- [x] **Check 32a.1: Launch Readiness Test Suite Extended Assertions (Suite B & E)**:
  - `node scripts/test-launch-readiness.mjs`
  - **Expected Result**: Exits 0, all test suites pass:
    - Test B8: Trial ending 18:30 Sydney time (buffer crosses midnight into 4 Dec) correctly displays 3 December 2026 in Australia/Sydney time.
    - Test B9: Trial ending 05:00 Sydney time (buffer does not cross midnight) correctly displays 3 December 2026.
    - Test B10: Trial ending around daylight-saving transitions (April AEDT->AEST and October AEST->AEDT) correctly adjusts 6-hour buffer across boundaries.
    - Test B11: Shared buffer constants (`TRIAL_GRACE_BUFFER_HOURS = 6`, `TRIAL_GRACE_BUFFER_MS = 21,600,000`) verified; paid subscriptions (`is_trial = false`) remain strictly unadjusted.
    - Test E1: Phone denial messages (`phone_already_used`, `phone_missing`) safely removed and fall back to generic copy; card (`card_already_used`, `card_missing`) and email (`already_claimed`, `email_not_allowed`) denial messages preserved.
- [x] **Check 32a.2: Dashboard Section Regression Unit Tests**:
  - `node scripts/test-dashboard-sections.mjs`
  - **Expected Result**: Exits 0, all 6 test assertions pass with standardized date formatting (`Free trial ends 26 November 2026`).
- [x] **Check 32a.3: Trial Banner & Stripe Compat Test Suites**:
  - `node scripts/test-trial-banner.mjs && node scripts/test-stripe-compat.mjs`
  - **Expected Result**: Exits 0, all 6 trial banner tests and 12 Stripe compatibility assertions pass with 0 errors.
- [x] **Check 32a.4: TypeScript Baseline Parity**:
  - `npx tsc --noEmit -p tsconfig.app.json`
  - **Expected Result**: Exact match with known 101 pre-existing diagnostic errors (0 new errors introduced).
- [x] **Check 32a.5: Production Build & Prerender Verification**:
  - `powershell -Command "`$env:PUPPETEER_EXECUTABLE_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; npm run build"`
  - **Expected Result**: Exits 0, builds production assets cleanly in ~5s, and completes headless browser prerendering across all 20 static routes.

### 32b. Runtime & User-Facing Verification (Stripe, Dashboard, and Anti-Abuse Gating)
- [ ] **Check 32b.1: Trial Started at 19:00 Sydney Shows Same End Date in Both Places Matching Stripe**:
  - **Action**: A customer starts a 30-day free trial checkout at 19:00 Sydney time on 3 November.
  - **Stripe State**: Stripe sets `trial_end` to 3 December 19:00 Sydney time.
  - **Database State**: `process_stripe_webhook_event` stores `current_period_end` with +6h grace (4 December 01:00 Sydney time) in `public.subscriptions`, while `trial_claims.trial_ends_at` holds 3 December 19:00 Sydney time.
  - **User Navigation**: Customer navigates to `/dashboard`.
  - **Expected Result**:
    - Dashboard trial banner displays: `Free trial: 30 days left (ends 3 December 2026)` or `Your free trial is active until 3 December 2026`.
    - CP Bot tool card displays: `Free trial active - ends on 3 December 2026`.
    - BOTH places display the exact same calendar day (`3 December 2026`), exactly matching Stripe.
- [ ] **Check 32b.2: Second Account with Same Phone Number But New Email and New Card Gets a Trial**:
  - **Action**:
    - Account 1 completes trial checkout using email `customer1@example.com`, card `4242...4242`, and phone `+61 400 000 000`. Trial activates.
    - Account 2 signs up with new email `customer2@example.com`, enters phone `+61 400 000 000` at Stripe Checkout, and provides a DIFFERENT payment card `4000...0002`.
  - **Expected Result**:
    - Account 2's trial checkout completes and is approved (`ok: true`).
    - Phone number does NOT block, lock, or cause denial.
    - Account 2 receives active CP Bot trial access.
- [ ] **Check 32b.3: Duplicate Card Fingerprint Refused**:
  - **Action**: Account 3 signs up with unique email `customer3@example.com` and unique phone `+61 411 111 111`, but enters card `4242...4242` (already used by Account 1).
  - **Expected Result**:
    - Trial is denied with reason `card_already_used`.
    - Webhook cancels the Stripe subscription immediately via `stripe.subscriptions.cancel` so Account 3 is never billed at day 30.
    - Dashboard displays clear denial message: `"This card has already been used for a free trial. You can subscribe at A$4.99/month instead."`.
- [ ] **Check 32b.4: Duplicate Normalized Email Refused**:
  - **Action**: Customer attempts to sign up for a second trial using email variation `customer.1+alias@example.com` (normalizes to `customer1@example.com`).
  - **Expected Result**:
    - System detects existing normalized claim and blocks checkout with reason `already_claimed`.
    - Dashboard displays clear denial message: `"This account or email has already used the free trial."`.

---

## 33. Cart Page Crash Fix, RCCP Tool Page Crash Fix & Identifier Sweep (Release v1.14.1 Hotfix)

### 33a. Static Verification & Automated Regression Suites
- [x] **Check 33a.1: Identifier Sweep & Cart Mount Test Suite**:
  - `node scripts/test-identifier-sweep.mjs`
  - **Expected Result**: Exits 0, all 4 checks pass:
    - Check 1.1: Every file using `PageLoader` imports it correctly across all 149 source files in `src/`.
    - Check 1.2: Every file using `ShieldAlert` imports it correctly (`src/pages/Account.tsx`).
    - Check 2.1: Zero TS2304/TS2552 ("Cannot find name") errors in the codebase.
    - Check 3.1 & 3.2: `PageLoader` renders cleanly and `<Cart />` page mounts without throwing `ReferenceError: PageLoader is not defined` in logged-out and logged-in SSR test harness.
- [x] **Check 33a.2: RCCP Tool Page 9-State Regression Test Suite**:
  - `node scripts/test-rccp-crash.mjs`
  - **Expected Result**: Exits 0, all 9 states (logged out, logged in with no trial, active trial, active paid subscription, trial cancelled, trial denied, sold out, offer disabled, fetch error) and edge case null/empty date regressions pass cleanly with 0 crashes.
- [x] **Check 33a.3: Launch Readiness Integrated Suite D2 Execution**:
  - `node scripts/test-launch-readiness.mjs`
  - **Expected Result**: Exits 0, all suites A, B, C, D (including D2 sweep), and E pass with 0 errors.
- [x] **Check 33a.4: TypeScript Diagnostics Count**:
  - `npx tsc --noEmit -p tsconfig.app.json`
  - **Expected Result**: Total diagnostic errors reduced from baseline 101 to 98 (zero new errors introduced).
- [x] **Check 33a.5: Production Build and Headless Prerendering**:
  - `powershell -Command "`$env:PUPPETEER_EXECUTABLE_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; npm run build"`
  - **Expected Result**: Exits 0, bundles assets in ~5s, and prerenders all 20 static routes including `/tools/rccp`.

### 33b. Runtime & User-Facing Verification Steps
- [ ] **Check 33b.1: Trial-Refused Customer Clicks Subscribe and Cart Page Loads Cleanly**:
  - **Precondition**: Customer account experienced a post-checkout trial refusal (`reason = 'card_already_used'`).
  - **Action**: From `/dashboard`, customer views the denial banner and clicks the `"Subscribe"` button.
  - **Expected Result**:
    - Browser navigates directly to `https://www.automationalchemists.com/cart?add=rccp`.
    - Page does NOT crash with "Something went wrong — An unexpected error occurred".
    - Cart renders CP Bot with A$4.99/mo launch price, subtotal, and checkout action.
- [ ] **Check 33b.2: Cart Page Loads in Logged-Out State**:
  - **Action**: In an incognito window or logged-out browser session, navigate to `https://www.automationalchemists.com/cart`.
  - **Expected Result**:
    - Page renders the clean `<PageLoader pageName="Authenticating..." />` without throwing `ReferenceError: PageLoader is not defined`.
    - Redirects to `/auth?next=/cart` or displays auth prompt cleanly.
- [ ] **Check 33b.3: /tools/rccp Loads for Logged-Out Visitors**:
  - **Action**: Navigate to `https://www.automationalchemists.com/tools/rccp` while logged out.
  - **Expected Result**:
    - Hero section loads cleanly showing the `TrialSpotsBanner` (`"X of 100 free-trial spots left"`).
    - Hero card displays `"Get your 30-day free trial now"` button and launch pricing. Zero crash screens.
- [ ] **Check 33b.4: /tools/rccp Loads for Logged-In User Without a Free Trial**:
  - **Action**: Sign in to an account with no trial claim and navigate to `https://www.automationalchemists.com/tools/rccp`.
  - **Expected Result**:
    - Hero section loads cleanly with `TrialSpotsBanner`.
    - Trial action button is interactive and does not throw.
- [ ] **Check 33b.5: /tools/rccp Loads for Logged-In User With an Active Free Trial**:
  - **Action**: Sign in to an account with an active free trial (`statusTrial.has_access = true`, `claim.ends_at` in the future) and navigate to `https://www.automationalchemists.com/tools/rccp`.
  - **Expected Result**:
    - Page loads cleanly WITHOUT crashing into `ErrorBoundary`.
    - Hero action button displays active trial badge: `"Trial active (30 days left)"` (or appropriate days/hours left string) with `"Dashboard →"` link.
- [ ] **Check 33b.6: Account Deletion Modal Displays Alert Icon**:
  - **Action**: Navigate to `/account`, scroll to Danger Zone, and click `"Delete Account"`.
  - **Expected Result**:
    - Modal opens smoothly with `<ShieldAlert />` icon rendered in red next to `"Are you sure?"`.
    - No console `ReferenceError: ShieldAlert is not defined`.

---

## 34. Denied-Trial Choices, Sign-Up Flow, and Dashboard Open Tools Link (Release v1.15.0)

### 34a. Static Verification & Automated Regression Suites
- [x] **Check 34a.1: Launch Readiness Test Suite with Suite F (5/5 Assertions Passed)**:
  - `node scripts/test-launch-readiness.mjs`
  - **Expected Result**: Exits 0, Suite F passes:
    - Test F1: `isCardDenialCapExceeded` accurately flags 3 or more card denials as capped.
    - Test F2: `getDeniedTrialChoice('card_already_used', 1)` produces dual choices: `"Use another card"` and `"Subscribe at A$4.99/month"`.
    - Test F3: `getDeniedTrialChoice('card_already_used', 3)` suppresses card retry, flags `isCapped = true`, and sets description to `"The free trial is no longer available for this account."`.
    - Test F4: `getDeniedTrialChoice('already_claimed', 0)` produces exclusively `"Subscribe at A$4.99/month"` (no card retry).
    - Test F5: `getSignUpSuccessState` switches to Sign in tab, pre-fills email, strictly clears password, and returns `"Account created. Check your email to confirm your account, then sign in."`. (Passed: all suites A-F).
- [x] **Check 34a.2: TypeScript Compilation & Diagnostics Count**:
  - `powershell -Command "(npx tsc --noEmit -p tsconfig.app.json 2>&1 | Select-String ': error TS').Count"`
  - **Expected Result**: Exactly 98 diagnostic errors (zero new errors introduced, zero TS2304/TS2552 missing identifier errors). (Passed: 98).
- [x] **Check 34a.3: Full Test Suite Execution**:
  - Run `scripts/test-identifier-sweep.mjs`, `scripts/test-rccp-crash.mjs`, `scripts/test-trial-banner.mjs`, `scripts/test-dashboard-sections.mjs`, `scripts/test-stripe-compat.mjs`.
  - **Expected Result**: All suites pass with zero errors. (Passed).
- [x] **Check 34a.4: Production Build Verification**:
  - `npx vite build`
  - **Expected Result**: Exits 0, client bundle builds cleanly in < 6 seconds. (Passed: 4.90s).

### 34b. Runtime & User-Facing Verification Steps
- [ ] **Check 34b.1: Card-Denied Customer Under Cap Sees Dual Recovery Options**:
  - **Precondition**: Customer account experienced a post-checkout trial refusal with `reason = 'card_already_used'` and total card denials count < 3.
  - **Action**: Navigate to `https://www.automationalchemists.com/dashboard`.
  - **Expected Result**:
    - Dashboard trial alert displays:
      - Title: *"Free trial unavailable on this card"*
      - Description: *"This card has already been used for a free trial. You can try a different payment card, or subscribe now."*
      - Two action buttons: *"Use another card"* (yellow primary) and *"Subscribe at A$4.99/month"* (white/outline).
    - CP Bot tool card does NOT show *"Start free trial now"*. Shows matching *"Use another card"* and *"Subscribe at A$4.99/month"* buttons (or *"Open Return Converter"*).
- [ ] **Check 34b.2: Card-Denied Customer at Cap Sees Single Subscribe Action**:
  - **Precondition**: Customer account has 3 or more rows in `public.trial_denials` with `reason = 'card_already_used'`.
  - **Action**: Navigate to `https://www.automationalchemists.com/dashboard`.
  - **Expected Result**:
    - Dashboard trial alert displays:
      - Description: *"The free trial is no longer available for this account."*
      - *"Use another card"* button is completely hidden.
      - Single action button: *"Subscribe at A$4.99/month"*.
    - CP Bot tool card shows only *"Subscribe at A$4.99/month"* and *"Open Return Converter"*.
- [ ] **Check 34b.3: Email-Denied Customer Sees Only Subscribe Action**:
  - **Precondition**: Customer account experienced a trial refusal with `reason = 'already_claimed'`.
  - **Action**: Navigate to `https://www.automationalchemists.com/dashboard`.
  - **Expected Result**:
    - Dashboard trial alert displays:
      - Title: *"Free trial already claimed"*
      - Description: *"This account or email has already used the free trial. You can subscribe at A$4.99/month to continue using CP Bot."*
      - Only the *"Subscribe at A$4.99/month"* action button is displayed (*"Use another card"* is omitted).
- [ ] **Check 34b.4: Sign-Up Flow Transitions to Sign In Tab with Pre-Filled Email**:
  - **Action**:
    - Navigate to `https://www.automationalchemists.com/auth?mode=signup`.
    - Fill out Full Name, Country, Email (`newuser@example.com`), Password, and accept Terms of Service.
    - Click *"Create Account"*.
  - **Expected Result**:
    - Active tab automatically transitions to *"Sign in"*.
    - Email field contains `newuser@example.com`.
    - Password field is completely blank.
    - Persistent banner appears above the form: *"Account created. Check your email to confirm your account, then sign in."*.
    - User is NOT signed in automatically.
- [ ] **Check 34b.5: Dashboard "Open Tools" Button Opens Tools Selector**:
  - **Action**: Sign in and navigate to `https://www.automationalchemists.com/dashboard`. Click the *"Open Tools"* button in the dashboard header.
  - **Expected Result**:
    - Opens `https://rccp.automationalchemists.com/choose` in a new tab (`target="_blank" rel="noopener noreferrer"`).
- [ ] **Check 34b.6: Dashboard "Open Return Converter" Button Opens Root**:
  - **Action**: Click the *"Open Return Converter"* button on the Return Converter x CopyPaste Bot card.
  - **Expected Result**:
    - Opens `https://rccp.automationalchemists.com` in a new tab.

---

## 35. Non-Trial Subscribe Checkout & Button Contrast (Release v1.15.1)

### 35a. Static Verification & Automated Regression Suites
- [x] **Check 35a.1: Launch Readiness Test Suite with Suite G (4/4 Assertions Passed)**:
  - `node scripts/test-launch-readiness.mjs`
  - **Expected Result**: Exits 0, Suite G passes:
    - Test G1: Subscribe path (`skipTrial: true`) builds non-trial paid checkout with immediate payment today (A$4.99 unit amount, GST tax rate, no trial period, no trial settings).
    - Test G2: Use-another-card path (`skipTrial: false`) preserves 30-day trial parameters.
    - Test G3: Capped user ($\ge 3$ card denials) falls back to non-trial parameters.
    - Test G4: Security rule verified: skip-trial flag can only remove a trial, never grant one. (Passed: Suites A through G).
- [x] **Check 35a.2: TypeScript Compilation & Diagnostics Count**:
  - `powershell -Command "(npx tsc --noEmit -p tsconfig.app.json 2>&1 | Select-String ': error TS').Count"`
  - **Expected Result**: Exactly 98 diagnostic errors (zero new errors introduced, zero TS2304/TS2552 missing identifier errors). (Passed: 98).
- [x] **Check 35a.3: Full Test Suite Execution**:
  - Run `scripts/test-identifier-sweep.mjs`, `scripts/test-rccp-crash.mjs`, `scripts/test-trial-banner.mjs`, `scripts/test-dashboard-sections.mjs`, `scripts/test-stripe-compat.mjs`.
  - **Expected Result**: All suites pass with zero errors. (Passed).
- [x] **Check 35a.4: Production Build Verification**:
  - `npx vite build`
  - **Expected Result**: Exits 0, client bundle builds cleanly in < 15 seconds. (Passed: 13.05s).

### 35b. Runtime & User-Facing Verification Steps
- [ ] **Check 35b.1: Denied Customer Subscribing at A$4.99 Opens Paid Stripe Checkout**:
  - **Precondition**: Customer account experienced a trial refusal (`reason = 'card_already_used'`).
  - **Action**:
    - Navigate to `https://www.automationalchemists.com/dashboard`.
    - Click the yellow *"Subscribe at A$4.99/month"* button (either in the top banner or on the CP Bot tool card).
    - Land on `/cart` and click *"Checkout"*.
  - **Expected Result**:
    - Redirects to Stripe Checkout.
    - Total due today displays **A$4.99** (inclusive of A$0.45 GST).
    - Checkout does NOT say "30 days free".
    - Checkout button says **"Subscribe"** or **"Pay"**, NOT "Start trial".
- [ ] **Check 35b.2: Denied Customer Retrying Card Opens Trial Stripe Checkout**:
  - **Precondition**: Customer account experienced a trial refusal (`reason = 'card_already_used'`) with card denial count < 3.
  - **Action**: Click *"Use another card"* on the dashboard banner.
  - **Expected Result**:
    - Redirects directly to Stripe Checkout.
    - Total due today displays **A$0.00**.
    - Mentions 30 days free trial.
    - Checkout button says **"Start trial"**.
- [ ] **Check 35b.3: "Use Another Card" Button on Dashboard Alert Has Readable Text**:
  - **Action**: Navigate to `https://www.automationalchemists.com/dashboard` in a trial-denied state.
  - **Expected Result**:
    - "Use another card" button displays with a crisp white/transparent background, dark teal text (`text-teal-900`), and a teal border (`border-teal-600`).
    - The button is NOT a dark teal block. Text is 100% visible and meets WCAG AA contrast.
    - On hover, the button transitions to teal background with white text.
- [ ] **Check 35b.4: "Use Another Card" Button on CP Bot Tool Card Has Readable Text**:
  - **Action**: Inspect the CP Bot & Return Converter card in the same denied state.
  - **Expected Result**:
    - "Use another card" button has a transparent background, teal border, and dark teal text matching the adjacent "Open Return Converter" button.


---

## 36. Suppress Denied-Trial Banner for Active Subscribers & Eliminate Browser trial_denials Queries (Release v1.15.2)

### 36a. Static Verification & Automated Regression Suites
- [x] **Check 36a.1: Launch Readiness Test Suite with Suite H (7/7 Assertions Passed)**:
  - `node scripts/test-launch-readiness.mjs`
  - **Expected Result**: Exits 0, Suite H passes:
    - Test H1: State A (denied + no active access) renders top red banner.
    - Test H2: State B (active paid subscription with old trial denial) strictly suppresses red banner.
    - Test H3: State C (active trial subscription with old trial denial) strictly suppresses red banner.
    - Test H4: State D (checkout return: `isConfirming = true`) suppresses red banner during webhook processing.
    - Test H5: `hasActiveCpBotAccess` helper correctly recognizes active `cpbot`/`rccp` subscriptions and rejects inactive/expired/canceled periods.
    - Test H6: Static AST/grep audit confirms zero direct browser queries to `trial_denials` across `src/`.
    - Test H7: Default fallback behavior safely fails open/closed without throwing. (Passed: Suites A through H).
- [x] **Check 36a.2: Dashboard Section Regression Unit Tests (7/7 Assertions Passed)**:
  - `node scripts/test-dashboard-sections.mjs`
  - **Expected Result**: Exits 0, all 7 tests pass including Test 7 covering `hasActiveCpBotAccess` and `shouldShowDeniedTrialBanner`. (Passed).
- [x] **Check 36a.3: TypeScript Compilation & Diagnostics Count**:
  - `powershell -Command "(npx tsc --noEmit -p tsconfig.app.json 2>&1 | Select-String ': error TS').Count"`
  - **Expected Result**: Exactly 98 diagnostic errors (zero new errors introduced, zero TS2304/TS2552 missing identifier errors). (Passed: 98).
- [x] **Check 36a.4: Full Test Suite Execution**:
  - Run `scripts/test-identifier-sweep.mjs`, `scripts/test-rccp-crash.mjs`, `scripts/test-trial-banner.mjs`, `scripts/test-dashboard-sections.mjs`, `scripts/test-stripe-compat.mjs`.
  - **Expected Result**: All suites pass with zero errors. (Passed).
- [x] **Check 36a.5: Production Build Verification**:
  - `npx vite build`
  - **Expected Result**: Exits 0, client bundle builds cleanly in < 15 seconds. (Passed: 14.80s).

### 36b. Runtime & User-Facing Verification Steps
- [x] **Check 36b.1: State A (Denied + No Active Access)**:
  - **Condition**: User has `denied_reason = 'card_already_used'` and NO active CP Bot subscription.
  - **Expected Result**: Top red denied alert banner renders with dual recovery buttons ("Use another card" and "Subscribe at A$4.99/month"). The CP Bot tool card renders in locked state with matching recovery buttons. (Verified via Puppeteer screenshot test).
- [x] **Check 36b.2: State B (Active Paid Subscription with Old Trial Denial)**:
  - **Condition**: User has an active paid subscription (`status = 'active'`, `is_trial = false`), but an old denial exists in `public.trial_denials`.
  - **Expected Result**: Top red denied banner does NOT render. CP Bot tool card shows "Subscription active - renews on <date>" and "Manage billing". Zero "Use another card" or "Subscribe" buttons appear. (Verified via Puppeteer screenshot test).
- [ ] **Check 36b.3: State C (Active Trial Subscription with Old Trial Denial)**:
  - **Condition**: User has active trial access (`status = 'trialing'` or `is_trial = true`), but an old denial exists.
  - **Expected Result**: Top red denied banner does NOT render. CP Bot tool card shows standard active trial state with expiration date and "Manage billing".
- [ ] **Check 36b.4: State D (Checkout Return: `/dashboard?checkout=success`)**:
  - **Condition**: User lands on `/dashboard?checkout=success` after completing paid checkout.
  - **Expected Result**: Confirming banner renders ("Setting up your account..."). There is ZERO flash of the red denied banner while waiting for webhook fulfillment.
- [x] **Check 36b.5: State E (Browser Console & Network Tab)**:
  - **Action**: Load `/dashboard` across any state.
  - **Expected Result**: Browser console has ZERO 403 Forbidden errors; Network tab shows ZERO requests to `public.trial_denials`. (Verified via browser network request interception test: 0 requests).
- [ ] **Check 36b.6: State F (Subscription Canceled / Refunded Later)**:
  - **Condition**: A previously active paid or trial subscription expires or is canceled/refunded so that `hasActiveCpBotAccess` evaluates to `false`.
  - **Expected Result**: When active access ceases, the denied banner and recovery actions return.

---

## 37. Locked State for Ended Subscriptions & Eligibility-Gated Card Retry (Release v1.15.3)

### 37a. Automated Pre-Release Checks
- [x] **Check 37a.1: Launch Readiness Test Suite with Suite I & Test B12 (38/38 Assertions Passed)**:
  - `node scripts/test-launch-readiness.mjs`
  - **Expected Result**: Exits 0, all suites pass:
    - Test B12: Verifies all 7 subscription lifecycle states (a)-(g) in `billingView.ts`:
      - Case (a): Cancel at period end, paid (`status: 'active'`, `cancel_at_period_end: true`) -> `active_canceled` with banner "Cancelled - access until <date>".
      - Case (b): Cancel at period end, during trial (`status: 'trialing'`, `cancel_at_period_end: true`) -> `trialing_canceled` with banner "Trial cancelled - access until <date>; no charge".
      - Case (c): Immediate cancel (`status: 'canceled'`, future period end) -> `expired` (Locked) with NO access-until text (`banner: null`).
      - Case (d): Refund (`status: 'canceled'`, future period end, refunded payment) -> `expired` (Locked) with `banner: null`.
      - Case (e): Subscription deleted at period end (`status: 'canceled'`, past period end) -> `expired` (Locked) with `banner: null`.
      - Case (f): Past due after failed payment (`status: 'past_due'`) -> `past_due` alert banner.
      - Case (g): Active, not cancelling (`status: 'active'`, `cancel_at_period_end: false`) -> `active` with renewal banner.
    - Suite I (Tests I1–I5): Verifies eligibility-gated card retry in `getDeniedTrialChoice`:
      - Test I1: `card_already_used` + `isEligible: false` -> Single button ("Subscribe at A$4.99/month"), `canRetryCard: false`, calm copy.
      - Test I2: `card_already_used` + `isEligible: true` + count < 3 -> Dual buttons ("Use another card" & "Subscribe at A$4.99/month").
      - Test I3: `card_already_used` + `isEligible: undefined` (loading) -> Single button, `canRetryCard: false`.
      - Test I4: `card_already_used` + `isEligible: true` + count >= 3 -> Single button (capped copy).
      - Test I5: `already_claimed` + `isEligible: false` -> Single button (email already used copy).
- [x] **Check 37a.2: Dashboard Section Regression Unit Tests (7/7 Passed)**:
  - `node scripts/test-dashboard-sections.mjs`
  - **Expected Result**: Exits 0, all 7 tests pass. (Passed).
- [x] **Check 37a.3: Full Test Suite Execution**:
  - `node scripts/test-identifier-sweep.mjs` (4/4 suites pass, 0 missing identifiers)
  - `node scripts/test-stripe-compat.mjs` (12/12 tests pass)
  - `node scripts/test-trial-banner.mjs` (6/6 tests pass)
  - **Expected Result**: All suites pass with 0 errors. (Passed).
- [x] **Check 37a.4: TypeScript Compilation & Diagnostics Count**:
  - `powershell -Command "(npx tsc --noEmit -p tsconfig.app.json 2>&1 | Select-String ': error TS').Count"`
  - **Expected Result**: Exactly 98 diagnostic errors (0 new errors, 0 TS2304 / TS2552 errors). (Passed: 98).
- [x] **Check 37a.5: Production Build Verification**:
  - `npx vite build`
  - **Expected Result**: Exits 0, client bundle builds cleanly in < 15 seconds. (Passed: 8.98s).

### 37b. Runtime & User-Facing Verification Steps (10 Captured Screenshots)
- [x] **Check 37b.1: State 1 (Canceled + Future End Date -> Locked State)**:
  - **Condition**: User has subscription `status = 'canceled'`, `current_period_end = 2026-12-05` (future date), `cancel_at_period_end = false`.
  - **Expected Result**: Dashboard tool card shows Locked badge (`"CP Bot — Locked"`), text `"Your subscription has ended"`, and single primary button `"Subscribe"`. Does NOT show `"Cancelling - access until 5 December 2026"` or `"Open Tools"`.
  - **Screenshots**: `dashboard-v1153-state1-canceled-locked-desktop.png`, `dashboard-v1153-state1-canceled-locked-mobile.png`.
- [x] **Check 37b.2: State 2 (Active + `cancel_at_period_end: true` -> Cancelling with Access Until Date)**:
  - **Condition**: User has subscription `status = 'active'`, `cancel_at_period_end = true`, `current_period_end = 2026-12-05`.
  - **Expected Result**: Dashboard tool card shows Cancelling badge (`"CP Bot — Cancelling"`), text `"Cancelled - access until 5 December 2026"`, and `"Open Tools"` button.
  - **Screenshots**: `dashboard-v1153-state2-cancelling-access-until-desktop.png`, `dashboard-v1153-state2-cancelling-access-until-mobile.png`.
- [x] **Check 37b.3: State 3 (Denied + Eligible + Denial Count 2 -> Both Recovery Buttons)**:
  - **Condition**: User has trial denial `card_already_used`, server confirms `isEligible = true`, and `card_denial_count = 2` (< 3).
  - **Expected Result**: Dashboard top alert and tool card render dual buttons: `"Use another card"` and `"Subscribe at A$4.99/month"`.
  - **Screenshots**: `dashboard-v1153-state3-denied-eligible-count2-desktop.png`, `dashboard-v1153-state3-denied-eligible-count2-mobile.png`.
- [x] **Check 37b.4: State 4 (Denied + Ineligible -> Single Button: "Subscribe at A$4.99/month")**:
  - **Condition**: User has trial denial record, but server reports `isEligible = false` (e.g. refunded or existing subscription).
  - **Expected Result**: "Use another card" button is completely absent. Dashboard shows calm title *"A free trial isn't available for this account."* and subtitle *"You can subscribe at A$4.99/month."* with single button `"Subscribe at A$4.99/month"`.
  - **Screenshots**: `dashboard-v1153-state4-denied-ineligible-subscribe-only-desktop.png`, `dashboard-v1153-state4-denied-ineligible-subscribe-only-mobile.png`.
- [x] **Check 37b.5: State 5 (Denied + Capped Denial Count 3 -> Single Button: "Subscribe at A$4.99/month")**:
  - **Condition**: User has trial denial `card_already_used`, `isEligible = true`, but `card_denial_count = 3` (reached cap).
  - **Expected Result**: "Use another card" button is absent. Dashboard displays cap copy *"The free trial is no longer available for this account."* with single button `"Subscribe at A$4.99/month"`.
  - **Screenshots**: `dashboard-v1153-state5-denied-capped-count3-desktop.png`, `dashboard-v1153-state5-denied-capped-count3-mobile.png`.
