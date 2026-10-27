# Build Log

## 2026-10-27 (v1.9.4 Email Logo Asset and Webhook Refund Fix - Webhook Not Deployed)
- Requested:
  - Job A: Email Logo Asset for Supabase auth emails (https://www.automationalchemists.com/email-logo.png).
    - A1: List public/, check if public/logo.png exists, tracked/ignored status.
    - A2: Generate public/email-logo.png from public/logo.png (400x400 PNG, logo scaled with ~12% padding on all sides, flattened RGB on #000000 pure black, optimized, <= 100 KB) using Python Pillow.
    - A3: Verification: print dimensions, byte size, PNG signature check, corner pixel colors (all (0,0,0)), check vercel.json routing for static files.
  - Job B: Webhook Refund Fix for API version 2026-02-25.clover compatibility.
    - B1: In charge.refunded branch of supabase/functions/stripe-webhook/index.ts, take only charge ID from event.data.object, re-fetch charge with stripe.charges.retrieve(chargeId) under SDK pinned version, read customer and invoice via helper. Return HTTP 500 on retrieve error. Preserve subsequent flow.
    - B2: Add pure helper getChargeInvoiceId(charge) in supabase/functions/_shared/stripeCompat.ts (string, object with id, or null) and 4 assertions in scripts/test-stripe-compat.mjs (string, expanded object, null, missing). Run and show output.
    - B3: Verification: `npx tsc --noEmit -p .` exit 0, esbuild syntax parse of stripe-webhook/index.ts to scratch file, delete scratch file. Show diff.
- Built:
  - `public/email-logo.png`: 400x400 PNG, 31,289 bytes (~30.56 KB), flattened RGB on #000000, 48px padding (12%), corner pixels (0,0,0), valid PNG signature `89504e470d0a1a0a`.
  - `supabase/functions/_shared/stripeCompat.ts`:
    - Exported `getChargeInvoiceId(charge)` resolving invoice string ID from either string or expanded `{ id }` object; returns `null` if missing, null, or invalid.
  - `supabase/functions/stripe-webhook/index.ts`:
    - Imported `getChargeInvoiceId` from `../_shared/stripeCompat.ts`.
    - `charge.refunded` branch updated to extract charge ID only, re-retrieve charge via SDK (`stripe.charges.retrieve(chargeId)`), extract customer and invoice ID via `getChargeInvoiceId(charge)`, and return HTTP 500 on retrieve failure for Stripe retry.
  - `scripts/test-stripe-compat.mjs`:
    - Added tests 9 through 12 asserting `getChargeInvoiceId` against string, expanded object, null, and missing/empty charge inputs. All 12 tests passed.
  - `PRD.md`: Added Section 15 documenting Email Logo Asset and Webhook Refund Fix under modern Stripe API versions.
  - `QA_CHECKLIST.md`: Added Section 27 with static verification, unit tests, and live test run checks.
  - `CHANGELOG.md`: Added v1.9.4 client-facing release notes.
- Verification:
  - `python` verification script confirmed dimensions (400, 400), size (30.56 KB), PNG signature, and 4 corner pixels all (0,0,0).
  - `node scripts/test-stripe-compat.mjs` passed 12/12 assertions.
  - `npx tsc --noEmit -p .` exited with code 0.
  - `npx esbuild supabase/functions/stripe-webhook/index.ts ...` produced valid 21.4kb bundle; scratch file deleted.
  - `npx vite build` succeeded in 5.37s with dist/email-logo.png confirmed.
- What was NOT run:
  - No edge functions were deployed (`stripe-webhook` deploy command was NOT executed).
  - No database migrations or SQL scripts executed.
  - No live Stripe calls made.
  - No browser rendering of the email logo URL.

## 2026-10-27 (v1.9.3 Dashboard Light Style, Card Deduplication, and Manual Grant Fixes)
- Requested:
  - Task 1: Match Dashboard page and element style to `/tools` reference (light mint-50 background, time-fold-ripple background effect, light card surfaces with border-teal-600/20, high contrast >= 4.5:1 text, yellow primary CTA buttons, teal-outlined secondary buttons, restyled loaders, skeleton cards, store management cards, add store dialog, and trial card states).
  - Task 2: Enforce that each tool card appears in exactly ONE dashboard section. Tools with active access appear only under "Your tools" and are excluded from "Available" and "Coming soon". Dedupe `rccp` and `cpbot` access slugs. Preserve Order Bot multi-store exception and keep Invoice Generator hidden.
  - Task 3: Show "Manage subscription" ONLY when the subscription row has a Stripe link (`stripe_customer_id` or `stripe_subscription_id`) AND `manually_granted` is not true. Select needed fields without adding new queries. For manual grants show "Access until {date}" (or "Access: no end date") instead of "renews {date}".
  - Verification: `npx tsc --noEmit -p .` exit 0, `npx vite build` exit 0 (never stage public/sitemap.xml), unit test harness `scripts/test-dashboard-sections.mjs` asserting all 6 specified scenarios. List owner visual checks.
- Built:
  - `src/lib/dashboardSections.ts`:
    - Pure helper module extracting dashboard categorization and display logic.
    - `isSubscriptionActive`: checks active or trialing status within valid period.
    - `hasActiveToolAccess`: resolves access slugs (maps `rccp` to `cpbot`) and checks active subscription.
    - `categorizeDashboardTools`: partitions catalog tools into `activeTools`, `availableTools`, and `comingSoonTools` ensuring mutual exclusivity, deduplicating `rccp`/`cpbot`, enforcing Order Bot store logic, and hiding Invoice Generator.
    - `canManageSubscription`: enforces that manage subscription buttons only render when a Stripe subscription/customer ID exists and `manually_granted` is not true.
    - `getSubscriptionDateText`: formats human-readable renewal/expiration labels for manual grants ("Access until {date}" / "Access: no end date"), paid subscriptions ("Renews {date}"), and trial subscriptions ("Trial ends {date}").
  - `scripts/test-dashboard-sections.mjs`:
    - Unit test runner bundling `src/lib/dashboardSections.ts` with esbuild for Node assertion.
    - Verified all 6 required scenarios:
      1. Owner with manual rccp grant and active listflow row: both in Your tools, Coming soon empty, no manage buttons.
      2. Paid Stripe user for rccp: Your tools with manage button and renewal date.
      3. New user with no rows: rccp in Available, listflow in Coming soon.
      4. Active trial row: Your tools with trial end text.
      5. Expired row: not in Your tools (in Available).
      6. Order Bot with active sub and 0 stores in Available; Invoice Generator hidden from all sections.
  - `src/components/DashboardTrialCard.tsx`:
    - Restyled all 8 state views (ready, starting, polling, active, expired, error, etc.) from dark teal to light theme (`bg-white rounded-2xl border border-teal-600/20 shadow-sm`, `text-teal-900`, `text-teal-800`, `bg-mint-50/80`).
  - `src/pages/Dashboard.tsx`:
    - Added `manually_granted`, `stripe_subscription_id`, and `stripe_customer_id` to existing `.select(...)` query on `subscriptions`.
    - Integrated `categorizeDashboardTools`, replacing scattered deduplication checks.
    - Restyled page wrapper to `min-h-screen bg-mint-50 text-teal-900 time-fold-ripple selection:bg-teal-600 selection:text-white`.
    - Restyled dashboard headings, section labels, `SkeletonCard`, `ToolCard`, OrderBot store cards, and the "Add eBay Store" dialog.
    - Conditioned all "Manage subscription" buttons on `canManageSubscription`.
    - Replaced hardcoded "renews" strings with `getSubscriptionDateText`.
  - `PRD.md`: Added Section 14 documenting Dashboard light theme styling, card deduplication, and manual grant display rules.
  - `QA_CHECKLIST.md`: Added Section 26 documenting unit tests and the owner's visual verification checklist.
  - `CHANGELOG.md`: Added v1.9.3 client-facing release notes.
- Verification:
  - `node scripts/test-dashboard-sections.mjs` executed: 6/6 tests passed with 0 errors.
  - `npx tsc --noEmit -p .` executed: exit 0, zero diagnostic errors.
  - `npx vite build` executed: exit 0, production bundle built in 20.61s. `public/sitemap.xml` was NOT touched.
- What was NOT run:
  - No edge functions deployed.
  - No database migrations or SQL executed.
  - No live Stripe calls made.
  - Live dashboard visual verification in browser was not performed directly because owner login credentials are not held locally. Owner visual check instructions provided.

## 2026-10-27 (v1.9.2 Webhook Independent of Stripe API Version - Not Deployed)
- Requested:
  - Task 1: FIRST audit and report: for every event type handled (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, customer.subscription.trial_will_end, invoice.payment_failed, charge.refunded), quote the exact lines that read data from event.data.object versus data fetched with the SDK, and say which fields would be undefined under the clover payload shape (Stripe API 2026-02-25.clover).
  - Task 2: Make the function independent of the endpoint API version:
    a) For customer.subscription.* events use ONLY event.data.object.id from the payload and re-fetch the subscription with stripe.subscriptions.retrieve(id) (SDK pinned version) before reading status, metadata, items, period or trial_end. If the retrieve fails return HTTP 500 so Stripe retries.
    b) Add one small helper getPeriod(sub) returning {start, end} ISO strings from top-level current_period_start/current_period_end when they are numbers, otherwise from sub.items.data[0].current_period_start/current_period_end. If neither exists, log a clear error WITHOUT sensitive data and return HTTP 500; never call toISOString on an invalid date. Use this helper everywhere periods are read (including the checkout.session.completed branch).
    c) For invoice.payment_failed and charge.refunded resolve the subscription id with a helper getInvoiceSubscriptionId(invoice) = invoice.subscription (string or object id) ?? invoice.parent?.subscription_details?.subscription; for charge.refunded retrieve the invoice (charge.invoice string or object) and then use the helper; then re-fetch the subscription by id as in (a). If no subscription id can be found return HTTP 200 with {received:true, skipped:'no_subscription'} (not a retry loop).
    d) Keep ALL existing behaviours unchanged: signature verification, the trial path (card fingerprint, phone hash, finalize_card_trial, duplicate-subscription guard, trial_will_end no-op), mirror_cancel_at_period_end, idempotency, status mapping and 200/500 semantics.
  - Task 3: Put the two helpers in a small pure module (supabase/functions/_shared/stripeCompat.ts) and write scripts/test-stripe-compat.mjs that bundles it with esbuild and runs assertions in Node on sample objects in BOTH shapes (old top-level period fields, clover items-based period fields, invoice.subscription and invoice.parent.subscription_details.subscription, missing everything). Run it and show the output. No network, no Stripe.
  - Task 4: Docs: note in docs/FREE_TRIAL_AND_DISCOUNTS.md, PRD.md and QA_CHECKLIST.md that the webhook works with any Stripe endpoint API version and add the QA checks: "End trial" in the Stripe dashboard converts the row; cancelling in the portal during the trial keeps it a trial and sets cancel_at_period_end.
  - Verification: `npx tsc --noEmit -p .` exit 0; esbuild syntax parse of the function with the output shown; helper test output; diffs. Say plainly what was NOT run. List deploy command in report: npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref tdevgrwmafwrsmeymjzd.
- Built:
  - `supabase/functions/_shared/stripeCompat.ts`:
    - Exported `getPeriod(sub)`: safely extracts `current_period_start` and `current_period_end` from either top-level numeric timestamps or `sub.items?.data?.[0]` item-level timestamps, converts to valid ISO strings, and throws error without sensitive data if missing.
    - Exported `getInvoiceSubscriptionId(invoice)`: safely resolves subscription ID string from `invoice.subscription` (string or object with `.id`) or `invoice.parent?.subscription_details?.subscription` (string or object with `.id`).
  - `supabase/functions/stripe-webhook/index.ts`:
    - Imported `getPeriod` and `getInvoiceSubscriptionId` from `../_shared/stripeCompat.ts`.
    - `customer.subscription.*` handler: reads ONLY `event.data.object.id`, re-retrieves full subscription object via `stripe.subscriptions.retrieve(subId)` under pinned SDK API version. On retrieval error, logs sanitized error and returns HTTP 500 for Stripe retry. Reads `status`, `metadata`, `trial_end`, and `cancel_at_period_end` from fetched subscription.
    - Uses `getPeriod(sub)` everywhere subscription periods are extracted (`checkout.session.completed` and `customer.subscription.*`), never calling `.toISOString()` on undefined.
    - `invoice.payment_failed`: resolves subscription ID with `getInvoiceSubscriptionId(invoice)`. If missing, returns HTTP 200 `{ received: true, skipped: 'no_subscription' }`. Otherwise re-retrieves subscription via SDK and extracts periods safely.
    - `charge.refunded`: retrieves associated invoice if `charge.invoice` exists, resolves subscription ID via `getInvoiceSubscriptionId`, or skips with 200 if no subscription found. Re-retrieves subscription via SDK and processes idempotently.
    - Retained all existing trial, identity, cancellation mirroring, duplicate subscription, and status mapping logic.
  - `scripts/test-stripe-compat.mjs`:
    - Test runner using esbuild to bundle `stripeCompat.ts` for Node execution.
    - Tested 8 distinct scenarios: legacy top-level timestamps, clover items timestamps, missing period throws without leaking, invoice string subscription, invoice object subscription, clover invoice parent subscription details string and object, and missing invoice subscription.
  - `docs/FREE_TRIAL_AND_DISCOUNTS.md`:
    - Added Section 13.8 documenting Stripe Endpoint API Version Independence (`2026-02-25.clover` vs legacy) and QA guarantees.
  - `PRD.md`:
    - Added Section 13 specifying Stripe Endpoint API Version Independence requirements and payload mapping details.
  - `QA_CHECKLIST.md`:
    - Added Section 25 specifying verification checks for Stripe Endpoint API Version Independence, including "End trial" dashboard conversion and portal trial cancellation tests.
- Files touched:
  - `supabase/functions/_shared/stripeCompat.ts` (created)
  - `scripts/test-stripe-compat.mjs` (created)
  - `supabase/functions/stripe-webhook/index.ts`
  - `docs/FREE_TRIAL_AND_DISCOUNTS.md`
  - `PRD.md`
  - `QA_CHECKLIST.md`
  - `CHANGELOG.md`
  - `PROJECT_STATE.md`
  - `BUILD_LOG.md`
- What was NOT run:
  - No edge functions were deployed (`stripe-webhook` deploy command was NOT executed).
  - No database migrations or SQL scripts were executed.
  - No Stripe live or test API calls were made (purely local tests with esbuild and Node).
  - Free trial offers remain disabled in production (`trial_offers.enabled = false`).
  - Checkout remains gated by `CHECKOUT_ENABLED !== 'true'` (admin only).

## 2026-10-27 (v1.9.1 Trial Hardening: Single-Seat Enforcement & Duplicate Subscription Guard - Not Deployed)
- Requested:
  - Task 1: `create-checkout-session`: for product_slug 'rccp' (and any single-seat product, i.e. everything except 'orderbot') force quantity = 1 server-side, ignoring the client value. Orderbot keeps the client quantity.
  - Task 2: `stripe-webhook`, trial checkout path (`checkout.session.completed` with `metadata.trial = 'true'`), duplicate-subscription guard: BEFORE calling `finalize_card_trial` or `process_stripe_webhook_event`, look up the user's existing `subscriptions` row for the resolved access slug (`cpbot`) using service role (`store_id IS NULL`). If a row exists with a DIFFERENT `stripe_subscription_id` and its status is not `'canceled'`, this is a duplicate checkout: cancel the NEW Stripe subscription with `stripe.subscriptions.cancel` (no charge), do NOT touch the database row, return HTTP 200 with `{received: true, duplicate_subscription: true}`. If cancelling fails return HTTP 500 so Stripe retries. If `stripe_subscription_id` is the SAME, continue as today (retry of the same event).
  - Task 3: Add behaviour note in `docs/FREE_TRIAL_AND_DISCOUNTS.md` and `QA_CHECKLIST.md`: two parallel trial checkouts by one user end with exactly one active Stripe subscription (the second is cancelled).
  - Task 4: Correct `docs/FREE_TRIAL_AND_DISCOUNTS.md`: the Stripe test run must use the Stripe dashboard "End trial" action on the subscription, not a test clock (Checkout cannot attach to a test clock).
  - Verification: `npx tsc --noEmit -p .` exit 0 and an esbuild syntax parse of both functions with output shown, plus diffs. State what was NOT run. List deploy commands in report; do not run them.
- Built:
  - `supabase/functions/create-checkout-session/index.ts`:
    - Updated parameter parsing and validation: `effectiveQuantity` is strictly forced to 1 for non-orderbot products (`product_slug !== 'orderbot'`), ignoring any client-provided value.
    - Preserved `body.quantity` for `orderbot`, requiring `quantity >= 1`.
    - Applied `effectiveQuantity` across Stripe line item construction.
  - `supabase/functions/stripe-webhook/index.ts`:
    - Added duplicate-subscription guard inside `checkout.session.completed` when `isTrialMode` is true.
    - Resolves entitlement access slug via `trial_offers.access_slug` (mapping `'rccp'` -> `'cpbot'`).
    - Queries `public.subscriptions` for user's existing row where `store_id IS NULL`.
    - If existing row has a DIFFERENT `stripe_subscription_id` and `status !== 'canceled'`, cancels the incoming subscription immediately via `stripe.subscriptions.cancel(p_stripe_subscription_id)`, leaves database untouched, and returns HTTP 200 `{ received: true, duplicate_subscription: true }`. Returns HTTP 500 if cancellation fails.
    - If `stripe_subscription_id` is identical, proceeds normally as an idempotent retry.
  - `docs/FREE_TRIAL_AND_DISCOUNTS.md`:
    - Added Section 13.6 documenting single-seat server-side quantity enforcement.
    - Added Section 13.7 documenting duplicate-subscription guard and parallel checkout behaviour.
    - Corrected Test Run 4 in Section 14.3 to use the Stripe dashboard Subscriptions → "End trial" action on the subscription, explaining why test clocks cannot be used with Stripe Checkout.
    - Added Test Run 5 documenting end-to-end verification of parallel trial checkouts.
  - `QA_CHECKLIST.md`:
    - Added Section 24 with static checks (TypeScript and esbuild bundles) and runtime test scenarios for single-seat enforcement, duplicate subscription guard, event retry idempotency, and the corrected "End trial" test run.
  - `PRD.md`:
    - Added Section 12 detailing v1.9.1 trial hardening specifications and edge cases.
  - `CHANGELOG.md`:
    - Added user-facing release notes for v1.9.1.
- Files touched:
  - `supabase/functions/create-checkout-session/index.ts`
  - `supabase/functions/stripe-webhook/index.ts`
  - `docs/FREE_TRIAL_AND_DISCOUNTS.md`
  - `QA_CHECKLIST.md`
  - `PRD.md`
  - `CHANGELOG.md`
  - `PROJECT_STATE.md`
  - `BUILD_LOG.md`
- What was NOT run:
  - No edge functions were deployed (`create-checkout-session` and `stripe-webhook` deploy commands were NOT executed).
  - No SQL migrations or database modifications were executed.
  - No Stripe live or test API calls were made.
  - Free trial offers remain disabled (`trial_offers.enabled = false`).
  - Checkout remains gated by `CHECKOUT_ENABLED !== 'true'` (admin only).

## 2026-10-26 (v1.9.0 Trial Checkout, Billing Portal and Trial Buttons - Not Deployed)
- Requested:
  - Task 1: Update edge function `create-checkout-session`: call service-role RPC `trial_eligibility_for(user_id, 'rccp')`. If eligible: Stripe Checkout mode subscription with `subscription_data.trial_period_days = trial_days`, `subscription_data.trial_settings.end_behavior.missing_payment_method = 'cancel'`, `payment_method_collection = 'always'`, `phone_number_collection.enabled = true`, metadata `trial = 'true'` (on session and subscription_data) plus existing user_id/tool_slug/price_source, and `custom_text.submit.message` saying "{N} days free, then A${price}/month starting {date}. Cancel anytime before then." (computed server-side). If ineligible: standard paid checkout, returning `{url, trial: false, reason}`. Update 409 `already_subscribed` guard to block both active and trialing subscriptions (Order Bot exempt). `success_url = /dashboard?checkout=success`, `cancel_url = /tools/rccp`.
  - Task 2: New edge function `create-portal-session`: requires valid user JWT, finds user's most recent subscription with `stripe_customer_id`, creates Stripe billing portal session with `return_url = `${origin}/dashboard``, returns `{url}`. Returns 404 when user has no Stripe customer. Not gated by `CHECKOUT_ENABLED`.
  - Task 3: Frontend:
    - Unified `startTrialCheckout()` in `src/lib/checkout.ts` used by every trial button (Tools page RCCP card, RCCP tool page hero, Dashboard card). Signed out -> `/auth?mode=signup&next=<sanitized path>`. Signed in -> calls `create-checkout-session` -> redirects to Stripe.
    - Remove all frontend calls to legacy `claim_free_trial` RPC.
    - Add client-safe messages in `getClaimErrorMessage` for `checkout_required`, `card_already_used`, `phone_already_used`, `phone_missing`, `card_missing`, `no_slots`.
    - Dashboard after `/dashboard?checkout=success`: poll `get_trial_status` every 2s up to 40s. Handled states: "Setting up your trial...", "Your free trial is active until {date}", denial message with "Subscribe" button, and 40s timeout message.
    - Dashboard RCCP card 4 states: not eligible -> "Subscribe"; trial active -> end date and "Manage subscription"; paid -> "Manage subscription"; locked and eligible -> "Start free trial now". "Manage subscription" calls `create-portal-session` and redirects.
    - Update Billing page (`/billing`) with "Manage subscription" button and report finding.
    - Next to every trial button show: "{trial_days} days free, then A${price}/month. Card required. Cancel anytime." with real data.
    - Fail-safe rule: when trial offer is disabled, UI identically matches v1.7.0.
  - Verification: `npx tsc --noEmit -p .` exit 0; esbuild syntax parse of both edge functions; diffs shown; say plainly what was NOT run.
  - Document owner's Stripe setup, deploy commands, and office PC test-mode run in `docs/FREE_TRIAL_AND_DISCOUNTS.md`.
- Built:
  - `supabase/functions/create-checkout-session/index.ts`:
    - Integrated service-role RPC `trial_eligibility_for`.
    - Configured Stripe Checkout subscription mode with trial settings, missing payment method cancel behavior, mandatory card collection, phone number collection, and server-computed submit message.
    - Updated 409 double-charge guard to check `.in('status', ['active', 'trialing'])`.
    - Configured `success_url` to `/dashboard?checkout=success` and `cancel_url` to `/tools/rccp`.
    - Returned payload `{ url, trial: boolean, reason?: string }`.
  - `supabase/functions/create-portal-session/index.ts`:
    - Validates caller JWT via `supabase.auth.getUser`.
    - Queries `public.subscriptions` for caller's latest `stripe_customer_id`.
    - Returns HTTP 404 `{ error: 'No Stripe customer found for this account.', code: 'no_customer' }` if missing.
    - Creates Stripe Customer Billing Portal session with return_url `/dashboard` and returns `{ url }`.
  - `src/lib/checkout.ts`:
    - Implemented `startTrialCheckout({ returnPath, user, toast })` supporting signed-out redirect and signed-in checkout session invocation.
    - Implemented `redirectToBillingPortal(toast)` invoking `create-portal-session` and redirecting to Stripe portal.
    - Preserved `handleGetAccessLogic` for catalog purchases.
  - `src/lib/trial.ts`:
    - Added `denied_reason?: string | null` to `TrialStatusData`.
    - Updated `getClaimErrorMessage` with client-safe messages for checkout_required, card_already_used, phone_already_used, phone_missing, card_missing, no_slots.
    - Completely removed `claimFreeTrial` and `ClaimTrialResult`.
  - `src/components/DashboardTrialCard.tsx`:
    - Added `checkout=success` polling loop (every 2s for 40s) displaying setup spinner, trial activated date, denial guidance, or timeout notice.
    - Wired trial CTA to `startTrialCheckout`.
    - Wired active trial button to `redirectToBillingPortal`.
    - Added dynamic pricing terms text.
  - `src/pages/Dashboard.tsx`:
    - Integrated `useTrialStatus` and selected `is_trial` in subscriptions query.
    - Updated `getSubscriptionEndDate` to check active or trialing rows.
    - Implemented the 4 RCCP card states: not eligible (Subscribe), trial active (trial end date & Manage subscription), paid (renews date & Manage subscription), locked and eligible (Start free trial now).
  - `src/pages/tools/RccpToolPage.tsx`:
    - Wired trial button to `startTrialCheckout`.
    - Added pricing terms caption under trial CTA button.
  - `src/pages/Tools.tsx`:
    - Wired RCCP trial CTA to `startTrialCheckout`.
  - `src/pages/Billing.tsx`:
    - Upgraded placeholder into functional Customer Billing Portal launch card with "Manage subscription" button.
  - `docs/FREE_TRIAL_AND_DISCOUNTS.md`:
    - Added Section 14: owner Stripe-side setup list, edge function deploy commands, and 4-step office PC test-mode runbook.
  - Documentation and tracking updated: `PRD.md`, `QA_CHECKLIST.md`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.
- Files touched:
  - `supabase/functions/create-checkout-session/index.ts`
  - `supabase/functions/create-portal-session/index.ts`
  - `src/lib/checkout.ts`
  - `src/lib/trial.ts`
  - `src/components/DashboardTrialCard.tsx`
  - `src/pages/Dashboard.tsx`
  - `src/pages/tools/RccpToolPage.tsx`
  - `src/pages/Tools.tsx`
  - `src/pages/Billing.tsx`
  - `docs/FREE_TRIAL_AND_DISCOUNTS.md`
  - `PRD.md`
  - `QA_CHECKLIST.md`
  - `CHANGELOG.md`
  - `PROJECT_STATE.md`
  - `BUILD_LOG.md`
- What was NOT run:
  - No edge functions were deployed (`create-checkout-session`, `create-portal-session`, `stripe-webhook` deploy commands were NOT executed).
  - No SQL migrations or database statements were executed.
  - No Stripe live or test API calls were made.
  - Free trial offer remains switched OFF (`trial_offers.enabled = false`).
  - Checkout remains hidden in production (`VITE_CHECKOUT_ENABLED !== 'true'`, Supabase secret `CHECKOUT_ENABLED` unset).

## 2026-10-26 (v1.8.1 Trial Conversion Fix, Migration 034 Applied & Webhook Deployed)
- Requested:
  - Fix trial conversion bug in `process_stripe_webhook_event`: single-seat "convert in place" update must run ONLY when `p_subscription_status = 'active'`; when `p_subscription_status = 'trialing'`, do NOT modify `is_trial`, `grant_reason`, `converted_at`, or `current_period_end` (+6h grace end must be preserved). Keep 'canceled' rows untouchable.
  - Update status mapping in `customer.subscription.updated`: ignore `incomplete` and `incomplete_expired` (return `{success: true, message: 'ignored incomplete'}` after idempotency insert); treat `paused` as `past_due`.
  - Edge function `stripe-webhook`: fallback sequence for card fingerprint resolution (`subscription.default_payment_method` -> customer `invoice_settings.default_payment_method` -> `stripe.paymentMethods.list({ customer, type: 'card', limit: 1 })`). Never log fingerprints, phone numbers, or pepper. Return HTTP 500 only if all fallbacks fail.
  - Extend `docs/sql/034_behaviour_verify.sql` with cases 14 (trialing preserve & active convert), 15 (incomplete_expired no-op), and 16 (paused revokes access).
  - Save pre-apply function definitions via `pg_get_functiondef` to `docs/sql/034_pre_apply_backup.sql`.
  - Apply migration 034 to production Supabase (`tdevgrwmafwrsmeymjzd`), run `034_verify.sql` and `034_behaviour_verify.sql`, verify row count baseline matches before and after, confirm single overloads (13 args for `process_stripe_webhook_event`, 1 for `check_product_subscription`), deploy `stripe-webhook` edge function, and confirm function version. Free trials remain OFF (`trial_offers.enabled = false`).
- Built:
  - `supabase/migrations/034_card_trial_identity.sql`:
    - Updated section 2 status mapping: ignores `incomplete`/`incomplete_expired`, maps `paused` to `past_due`, maps `active`/`trialing` to `active`.
    - Updated section 6 single-seat processing: `p_subscription_status = 'active'` converts trial rows and stamps `converted_at`; `p_subscription_status = 'trialing'` preserves `is_trial`, `grant_reason`, `converted_at`, and `current_period_end`.
  - `supabase/functions/stripe-webhook/index.ts`:
    - Added `resolveCardFingerprint` implementing the 3-step fallback resolution chain.
    - Zero sensitive logging.
  - `docs/sql/034_behaviour_verify.sql`:
    - Added Case 14: trialing update preserves flags and +6h grace, subsequent active update converts in place.
    - Added Case 15: incomplete_expired is a no-op on existing paid row.
    - Added Case 16: paused maps to past_due and revokes access.
    - Updated Case 4 test fixture event ID to use stored variable `v_c3_event_id`.
    - Formatted summary report to guarantee complete output within Supabase API 1000-char error limits.
  - `docs/sql/034_pre_apply_backup.sql`:
    - Captured definitions of `claim_free_trial`, `get_trial_status`, `process_stripe_webhook_event`, `admin_trial_extend` from live production prior to applying migration 034.
  - Production Execution:
    - Recorded BEFORE counts: subscriptions=11, trial_claims=0, trial_offers=1, stripe_webhook_events=1, rccp_enabled=false.
    - Applied `034_card_trial_identity.sql` to production Supabase project `tdevgrwmafwrsmeymjzd` (exit code 0).
    - Executed `034_verify.sql`: all checks verified (tables RLS enabled, 0 policies, 0 permissions to anon/authenticated/public; single overloads guaranteed; service_role execution confirmed).
    - Executed `034_behaviour_verify.sql`: all 16 cases passed (`passed: true`), row count check passed (`passed: true`), full rollback completed cleanly.
    - Recorded AFTER counts: subscriptions=11, trial_claims=0, trial_offers=1, stripe_webhook_events=1, rccp_enabled=false (exact match with BEFORE).
    - Confirmed single overloads: `check_product_subscription` (1 overload), `process_stripe_webhook_event` (1 overload, exactly 13 arguments).
    - Deployed `stripe-webhook` edge function (`--no-verify-jwt`, project ref `tdevgrwmafwrsmeymjzd`): version 6 active.
- Files touched:
  - `supabase/migrations/034_card_trial_identity.sql`
  - `supabase/functions/stripe-webhook/index.ts`
  - `docs/sql/034_behaviour_verify.sql`
  - `docs/sql/034_pre_apply_backup.sql`
  - `docs/FREE_TRIAL_AND_DISCOUNTS.md`
  - `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`
  - `PRD.md`
  - `QA_CHECKLIST.md`
  - `CHANGELOG.md`
  - `BUILD_LOG.md`
  - `PROJECT_STATE.md`
- What was NOT run:
  - `create-checkout-session` was NOT deployed.
  - No Supabase secrets were created or modified (`TRIAL_IDENTITY_PEPPER` will be added by owner).
  - Free trial was NOT enabled (`trial_offers.enabled` remains `false`).
  - No Stripe API calls or test checkouts were executed.
  - Rollback script `034_rollback.sql` was NOT run (migration applied and verified cleanly).

## 2026-10-26 (v1.8.0 Card-Required Free Trial Architecture: Database Migration 034 & Webhook Update - Not Applied)
- Requested:
  - Migrate free trial design to require a payment card collected via Stripe Checkout.
  - Close the legacy cardless trial claiming path (`claim_free_trial` returns `checkout_required`).
  - Introduce anti-abuse identity gating: 1 trial per normalized email (`trial_claims.email_normalized`), 1 per card fingerprint (`trial_identities` kind 'card'), and 1 per phone number HMAC-SHA256 hash (`trial_identities` kind 'phone' hashed with secret `TRIAL_IDENTITY_PEPPER`).
  - Strict database invariants: never create a second overload of `check_product_subscription` or `process_stripe_webhook_event` (13 arguments exact match); never touch `cp_bot_*` tables; zero-grant lockdown on new tables.
  - Write migration `supabase/migrations/034_card_trial_identity.sql`.
  - Update edge function `supabase/functions/stripe-webhook/index.ts` to expand payment methods, hash phone numbers, finalize trials, mirror cancel flags, and handle trial conversions.
  - Author SQL verification scripts: `docs/sql/034_verify.sql`, `docs/sql/034_rollback.sql`, and `docs/sql/034_behaviour_verify.sql` (13 test cases in a rolled-back DO block).
  - Update docs: `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md`, `QA_CHECKLIST.md`.
- Built:
  - `supabase/migrations/034_card_trial_identity.sql`:
    - Tables: `public.trial_identities` and `public.trial_denials` with RLS on, 0 policies, zero grants to public/anon/authenticated.
    - RPCs with `SECURITY DEFINER`, `search_path = public, pg_temp`, `service_role` execution only: `_check_trial_eligibility`, `trial_eligibility_for`, `finalize_card_trial`, `mirror_cancel_at_period_end`.
    - `claim_free_trial(text)` replaced to unconditionally return `{ok: false, reason: 'checkout_required'}` with authenticated grant preserved.
    - `get_trial_status(text)` extended with `denied_reason` (latest denial within 2 days).
    - `process_stripe_webhook_event` replaced (13 arguments exact match, single overload): handles trialing checkout (+6h grace, `is_trial = true`, `grant_reason = 'stripe_trial'`, links `trial_claims.subscription_id`), conversion on active (`is_trial = false`, `grant_reason = 'stripe_checkout'`, stamps `converted_at`), immediate access revocation on `past_due`/`unpaid`, safe reactivation from `expired` (cron) or `past_due`, and strict guard ensuring `canceled` rows are NEVER reactivated.
    - `admin_trial_extend` updated to refuse revoked claims upfront before any row update.
  - `supabase/functions/stripe-webhook/index.ts`:
    - Handles `checkout.session.completed` for `metadata.trial === 'true'`: expands `default_payment_method`, checks `trialing`, extracts card fingerprint and customer phone, computes HMAC-SHA256 hash using `Deno.env.get('TRIAL_IDENTITY_PEPPER')`, returns 500 if pepper/fingerprint missing, calls `finalize_card_trial` via service role; on denial cancels subscription immediately and returns 200; on approval calls `process_stripe_webhook_event` with status `trialing` and trial_end period.
    - Handles `customer.subscription.updated`: calls `mirror_cancel_at_period_end` to synchronize cancel flag.
    - Handles `customer.subscription.trial_will_end`: returns 200 no-op.
  - `docs/sql/034_verify.sql`: Formatted JSON inspection of table RLS, 0 policies, zero privileges, single overloads, security definer flags, and service_role execution.
  - `docs/sql/034_rollback.sql`: Clean rollback transaction dropping new tables/functions and restoring 031/032/033 definitions.
  - `docs/sql/034_behaviour_verify.sql`: Single transaction DO block with 13 isolated test cases, owner fixture management, baseline row leak assertion, and intentional `RAISE EXCEPTION 'BEHAVIOUR_RESULT ...'` for 100% rollback.
  - Updated documentation across `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md`, `QA_CHECKLIST.md`.
- Deviations: None. No database migrations were executed, no edge functions deployed, no SQL run against production. Trials remain disabled (`trial_offers.enabled = false`).
- Files touched:
  - `supabase/migrations/034_card_trial_identity.sql`
  - `supabase/functions/stripe-webhook/index.ts`
  - `docs/sql/034_verify.sql`
  - `docs/sql/034_rollback.sql`
  - `docs/sql/034_behaviour_verify.sql`
  - `docs/FREE_TRIAL_AND_DISCOUNTS.md`
  - `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`
  - `PRD.md`
  - `QA_CHECKLIST.md`
  - `CHANGELOG.md`
  - `BUILD_LOG.md`
  - `PROJECT_STATE.md`
- Verification:
  - `npx esbuild supabase/functions/stripe-webhook/index.ts --bundle --platform=neutral --external:https:* --external:npm:* --external:node:* --outfile=scratch_bundle.js` passed with code 0 (11.2kb bundle, syntax validated).
  - `npx tsc --noEmit -p .` passed with code 0.
- What was NOT run:
  - Migration 034 SQL was NOT executed on Supabase.
  - `stripe-webhook` edge function was NOT deployed to Supabase.
  - Verification scripts `034_verify.sql`, `034_rollback.sql`, `034_behaviour_verify.sql` were NOT run against the live database.
  - No Stripe API calls or test checkouts were executed.

## 2026-10-26 (v1.7.0 Tools & Dashboard Redesign, Visible Tools Filtering, Navbar Accessibility)
- Requested:
  - Visible tools restricted strictly to `rccp` and `listflow` across the frontend via a single `VISIBLE_TOOL_SLUGS` constant (Tools page, navbar desktop/mobile dropdowns, home page marquee, cart upsells, sitemap, prerender, JSON-LD, search).
  - Unlisted tools (`orderbot`, `invoicegen`) retain direct URLs but are unlinked, excluded from sitemap/prerender, and receive `noindex`.
  - Dashboard exception: Order Bot shown only if user has active/trialing subscription or stores; Invoice Generator hidden always.
  - Tools page (/tools) redesign: exactly two equal-height cards (rccp first, ListFlow second), rccp logo >= 56px with no tinted box, background treatment matching Home (`time-fold-ripple`), card corner decorations removed, rccp has single yellow CTA (trial-aware when active, "Learn more" when off), ListFlow has disabled "Coming soon" button only.
  - Dashboard (/dashboard) bug fixes: root causes identified and fixed for narrow fixed-width cards, clipped CP Bot second button, and invisible Order Bot outline button text; grid fills container (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full items-stretch min-w-0`), button rows wrap (`flex-wrap`), all button labels achieve >= 4.5:1 contrast; sections named "Your tools", "Available", "Coming soon"; background updated to match Home.
  - Navbar dropdown fixes: Tools dropdown limited to exactly `rccp` and `ListFlow`, single line, no description, no logo box (no icon on mobile); profile dropdown given visible light highlight, >= 4.5:1 contrast, visible focus ring on hover/focus/active on desktop and mobile.
- Built:
  - `src/data/tools.ts`: Exported `VISIBLE_TOOL_SLUGS = ['rccp', 'listflow'] as const`.
  - `scripts/generate-sitemap.js` & `scripts/prerender.js`: Replaced hardcoded tool routes with mapping from `VISIBLE_TOOL_SLUGS`.
  - `src/pages/ToolDetail.tsx`: Added `noindex={!VISIBLE_TOOL_SLUGS.includes(tool.slug as any)}` to `SEOHead`.
  - `src/pages/Index.tsx`: Filtered marquee tools with `VISIBLE_TOOL_SLUGS`.
  - `src/pages/Cart.tsx`: Filtered upsell suggestions with `VISIBLE_TOOL_SLUGS`.
  - `src/pages/Tools.tsx`: Restructured to exactly 2 cards, enlarged rccp logo to 56px without background tile, applied `time-fold-ripple`, removed `rounded-bl-full` corner decoration, implemented single dynamic yellow CTA with trial hook pricing fallback, and set disabled "Coming soon" button on ListFlow.
  - `src/pages/Dashboard.tsx`: Applied `time-fold-ripple`, updated grid to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch`, fixed button clipping with `flex flex-wrap`, corrected button text colors to `text-mint-50 hover:text-teal-900 hover:bg-yellow-accent` ensuring 11.4:1 contrast, filtered tools with `VISIBLE_TOOL_SLUGS` and Order Bot active subscription exception, and renamed sections to "Your tools", "Available", and "Coming soon".
  - `src/components/Navigation.tsx`: Restricted desktop and mobile tools dropdown to `rccp` and `ListFlow` single line; gave profile dropdown items light highlight (`data-[highlighted]:bg-mint-50 data-[highlighted]:text-teal-900`) and focus ring (`focus-visible:ring-2 focus-visible:ring-teal-600`); styled sign out with red hover highlight across desktop and mobile.
- Deviations: None. No database rows, migrations, edge functions, or route files deleted. Free trial remains disabled in production.
- Files touched: `src/data/tools.ts`, `scripts/generate-sitemap.js`, `scripts/prerender.js`, `src/pages/ToolDetail.tsx`, `src/pages/Index.tsx`, `src/pages/Cart.tsx`, `src/pages/Tools.tsx`, `src/pages/Dashboard.tsx`, `src/components/Navigation.tsx`, `PROJECT_STATE.md`, `BUILD_LOG.md`, `PRD.md`, `QA_CHECKLIST.md`, `CHANGELOG.md`.
- Verification:
  - `npx tsc --noEmit -p .` passed with code 0.
  - `npx vite build` passed with code 0.
  - Browser subagent verified `/tools`, `/tools/rccp`, and navbar at 360px, 768px, and 1280px viewports without console errors.
  - `public/sitemap.xml` was not regenerated or modified.
- What was NOT run:
  - Authenticated dashboard rendering in local browser (Supabase session not mockable without test credentials; owner deployment check steps provided).
  - No SQL executed, no deploys, no Supabase or Stripe API calls made.

## 2026-10-24 (Unversioned - Migration 033 Applied, Verify Passed, Behaviour Script Fixture Setup as Owner)
- Migration 033 Status:
  - Migration 033 (`033_admin_trial_controls.sql`) was APPLIED in production on 2026-10-24.
  - Diagnostic verification `docs/sql/033_verify.sql` passed in production.
- Behaviour Verification Test Harness (`docs/sql/033_behaviour_verify.sql`):
  - Fixed test-setup issues where direct table operations (`subscriptions`, `trial_claims`, `user_price_overrides`, `admin_audit_log`, `blocked_email_domains`) ran under `authenticated` role and failed RLS / table permission checks.
  - Implemented owner-role pattern: `RESET ROLE` immediately before direct fixture setup, inspection, and teardown, then restored `SET LOCAL ROLE authenticated` with admin JWT claims (`sub = v_admin_id`) for all `admin_` RPC calls.
  - `admin_claim_lifecycle`: fully exercises `admin_trial_extend` (+14d moves `current_period_end` and `trial_ends_at`), `admin_trial_revoke` (sets `revoked_at` and cancels subscription), and `admin_trial_reset_claim` (deletes both claim and trial subscription rows); also verifies converted claims safely refuse extend, revoke, and reset.
  - `override_expired_cleanup` and `override_duplicate_returns_code`: fixture setup and teardown run as owner, validating auto-revocation and duplicate rejection (`override_exists`).
  - Added baseline snapshot at start and final check asserting zero row leakage across `subscriptions`, `trial_claims`, `user_price_overrides`, and `blocked_email_domains` (`no_leaked_rows` case).
  - Preserved single `DO $$` block ending in intentional `RAISE EXCEPTION` for guaranteed 100% rollback.
- What was NOT run: No SQL was executed, no edge functions deployed, no Supabase or Stripe API calls made, no dev server or curl executed.
- Files touched: `docs/sql/033_behaviour_verify.sql`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-24 (Unversioned - Migration 033 Review Fixes: Override Expiry, Tool & Domain Guards - Migration 033 Not Applied)
- Database Admin Controls Migration 033 Fixes (`supabase/migrations/033_admin_trial_controls.sql`):
  - Migration 033 is committed but NOT yet applied to production.
  - `admin_price_override_create`:
    - Auto-revocation of expired un-revoked overrides: added cleanup `UPDATE public.user_price_overrides SET revoked_at = ends_at WHERE user_id = v_user_id AND tool_slug = v_tool_slug AND revoked_at IS NULL AND ends_at IS NOT NULL AND ends_at <= now();` prior to pre-check.
    - Simplified active override pre-check to `revoked_at IS NULL` (as any expired rows have been revoked).
    - Wrapped `INSERT` in `BEGIN ... EXCEPTION WHEN unique_violation THEN RETURN jsonb_build_object('ok', false, 'error', 'override_exists', 'message', 'An active override already exists for this user and tool'); END;` to eliminate concurrency race error leaks.
    - Added `public.tools` existence validation, returning error `'tool_not_found'` if tool slug is not found.
    - Enforced 500-character note limit on `p_note`, returning error `'note_too_long'`.
  - `admin_blocked_domain_add`:
    - Added protection for mainstream email providers (`gmail.com`, `googlemail.com`, `outlook.com`, `hotmail.com`, `live.com`, `yahoo.com`, `icloud.com`, `me.com`, `proton.me`, `protonmail.com`, `aol.com`), returning error `'protected_domain'`.
    - Added conditional audit logging: only logs to `public.admin_audit_log` when a domain row is actually inserted (`GET DIAGNOSTICS v_inserted_count = ROW_COUNT > 0`).
  - `admin_blocked_domain_remove`:
    - Added conditional audit logging: only logs to `public.admin_audit_log` when a domain row is actually deleted (`GET DIAGNOSTICS v_deleted_count = ROW_COUNT > 0`).
- Test Harness Updates (`docs/sql/033_behaviour_verify.sql`):
  - Added isolated test cases: (1) expired un-revoked override auto-cleanup on new creation leaving exactly one un-revoked override, (2) duplicate active override returning `override_exists`, (3) fake tool slug returning `tool_not_found`, (4) `gmail.com` blocking returning `protected_domain`, (5) duplicate domain add writing only 1 audit log row.
- Documentation & Verification:
  - Updated `docs/FREE_TRIAL_AND_DISCOUNTS.md` (Section 12), `PRD.md` (Section 7), `QA_CHECKLIST.md` (Checks 18c, 18d, 19f, 19g), and `PROJECT_STATE.md`.
  - Stated clearly that migration 033 is NOT applied yet.
  - What was NOT run: No SQL was executed, no edge functions deployed, no Supabase or Stripe API calls made, no dev server or curl executed.
- Files touched: `supabase/migrations/033_admin_trial_controls.sql`, `docs/sql/033_behaviour_verify.sql`, `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `PRD.md`, `QA_CHECKLIST.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-24 (v1.6.0 Admin Controls for Free Trials and Price Overrides - Migration 033 Not Applied)
- Database Admin Controls Migration 033 (Task D1):
  - Authored `supabase/migrations/033_admin_trial_controls.sql` containing 12 `SECURITY DEFINER` administrative functions with `SET search_path = public, pg_temp`, verified admin check via `profiles.is_admin`, immutable audit logging to `public.admin_audit_log`, and zero table grants.
  - Implemented: `admin_trial_get_offer`, `admin_trial_update_offer`, `admin_trial_list_claims`, `admin_trial_extend`, `admin_trial_revoke`, `admin_trial_reset_claim` (test-only, refuses converted claims), `admin_blocked_domains_list`, `admin_blocked_domain_add`, `admin_blocked_domain_remove`, `admin_price_overrides_list`, `admin_price_override_create` (user lookup, discount validation, single active override check), and `admin_price_override_revoke`.
  - Authored rollback script `docs/sql/033_rollback.sql` dropping the 12 functions.
  - Authored verification script `docs/sql/033_verify.sql` returning single `jsonb_pretty` verifying single overload, `prosecdef = true`, `proconfig` search_path, and execution privileges (authenticated allowed, anon/PUBLIC forbidden).
  - Authored behavioral verification script `docs/sql/033_behaviour_verify.sql` testing non-admin rejection (`42501` / `not_admin`) and admin functionality (offer validations, claims list, extend -> revoke -> reset claim lifecycle, converted claim refusal, price override lifecycle, domain add/remove idempotency) with guaranteed rollback via intentional exception.
- Frontend Admin Layer & UI (Task D2):
  - Created typed RPC client layer in `src/lib/adminTrial.ts` with error detection for missing migrations.
  - Built Free Trials Admin Page (`src/pages/AdminFreeTrials.tsx`):
    - Offer card with trial days, slot cap, reserved slots ("Counted as already taken. Real claims add to this"), require confirmed email toggle, and live slots taken/left display.
    - Offer activation warning modal: *"Visitors will see the free-trial button on the Return Converter x CopyPaste Bot page. Do not enable publicly until the CP Bot Chrome extension v1.0.5.3 is live."*
    - Single-click disable toggle.
    - Claims table with email search, pagination, status badges (`active`, `expired`, `converted`, `revoked`), row actions (Extend, Revoke, and Reset Claim requiring typing user's email). Disabled Revoke/Reset on converted claims with tooltip.
    - Blocked email domains list with hostname validation add form and delete confirmation modal.
  - Built Price Overrides Admin Page (`src/pages/AdminPriceOverrides.tsx`):
    - Custom price creation form with tool select, kind (`fixed_price` or `percent_off`), amount/percentage, optional end date, note, and live price preview ("Normal A$X -> This user A$Y").
    - Clear inline policy note: *"Applies to NEW checkouts only; existing subscriptions are not changed."*
    - Contextual hint linking to `/admin/tools`: *"To change the standard price for everyone, edit it in the Tools catalog."*
    - Overrides table with status badges and revocation modal.
  - Added "Free Trials" and "Price Overrides" navigation links to `src/components/AdminLayout.tsx` and routes `/admin/free-trials` and `/admin/price-overrides` to `src/App.tsx`.
- Documentation & Quality Assurance (Task D3):
  - Updated `docs/FREE_TRIAL_AND_DISCOUNTS.md` with Section 12 (Admin Controls, function specifications, and 1-day test runbook).
  - Updated `PRD.md` with Section 7 (Admin Controls specifications).
  - Updated `QA_CHECKLIST.md` with manual test checks 15-19.
  - Updated `PROJECT_STATE.md` to v1.6.0.
  - Updated `CHANGELOG.md` with `[1.6.0]`.
- Verification:
  - Ran `npx tsc --noEmit -p .` (passed with code 0).
  - Migration 033 NOT applied to live database; no edge functions deployed; no Supabase or Stripe API calls made.
- Files touched: `supabase/migrations/033_admin_trial_controls.sql` (NEW), `docs/sql/033_rollback.sql` (NEW), `docs/sql/033_verify.sql` (NEW), `docs/sql/033_behaviour_verify.sql` (NEW), `src/lib/adminTrial.ts` (NEW), `src/pages/AdminFreeTrials.tsx` (NEW), `src/pages/AdminPriceOverrides.tsx` (NEW), `src/components/AdminLayout.tsx`, `src/App.tsx`, `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `PRD.md`, `QA_CHECKLIST.md`, `PROJECT_STATE.md`, `CHANGELOG.md`, `BUILD_LOG.md`.

## 2026-10-24 (v1.5.1 Auth Path Check, Tools Copy & Price Fixes, Behaviour Verify Script, Test Plan)
- Auth Regression Check (Task 1):
  - Audited `src/pages/Auth.tsx` navigation paths against commit `80d5f88` (v1.4.4): verified no-next navigation preserves exact original destinations (`/` for normal users, `/admin` for admins).
  - Restored `signUp` helper from `src/hooks/useAuth.tsx` by adding optional `redirectTo?: string` parameter to `signUp`, routing through `useAuth` rather than calling `supabase.auth.signUp` directly.
  - Confirmed `sanitizeNext` permits `?`, `#`, and URL-encoded query/hash strings for internal paths while rejecting protocol-relative URLs (`//evil.com`), external protocols (`https://evil.com`), backslashes (`/\evil`), control characters, and inputs >200 characters.
- Copy and Price Fixes (Task 2):
  - Corrected `rccp` `fullDescription` in `src/data/tools.ts` to exact approved wording.
  - Replaced dashboard label sentence in `howItWorks` with Return Converter web app instructions.
  - Updated `rccp` static catalog price in `src/data/tools.ts` from `AUD $19/month` to `AUD $9/month`, aligning with the live database. Audited all references in `src/`.
  - Updated `src/data/rccpPage.ts` history card to title `'History'` and unified orders + return labels description.
- Sitemap Verification (Task 3):
  - Audited `scripts/generate-sitemap.js` and `package.json`: confirmed sitemap is dynamically generated at the beginning of `npm run build` on Vercel deployments, overwriting `public/sitemap.xml` with canonical www URLs and fresh timestamps in the deployed bundle.
- Migration 032 Behaviour Verification Script (Task 4):
  - Authored `docs/sql/032_behaviour_verify.sql`: non-destructive test harness testing 8 cases against Migration 032 webhook handling and slug resolution in an isolated transaction that 100% rolls back via `RAISE EXCEPTION`.
  - Authored companion guide `docs/sql/032_behaviour_verify_README.md`.
- Documentation & Testing (Task 5 & 6):
  - Migration 032 noted as APPLIED in production by hand on 2026-10-24.
  - Added 1-day test runbook to `docs/FREE_TRIAL_AND_DISCOUNTS.md`.
  - Added Stripe test-mode plan for 2026-10-25 to `QA_CHECKLIST.md`.
  - Confirmed `.env.local` is git-ignored via `*.local` in `.gitignore`.
  - Deployed Edge Functions `create-checkout-session` (v4) and `stripe-webhook` (v5, `--no-verify-jwt`) to project `tdevgrwmafwrsmeymjzd` on 2026-10-24 (~09:50 UTC) from home PC. The earlier 403 was caused by the Supabase CLI being logged in to a different account; after logging in with the project-owning account, both deployed successfully.
  - Troubleshooting note: If a deploy returns 403, run `npx supabase projects list`; if Automation Alchemists is missing, the CLI is logged in to the wrong account: `npx supabase logout`, then `npx supabase login` with the owning account.
- Files touched: `src/hooks/useAuth.tsx`, `src/pages/Auth.tsx`, `src/data/tools.ts`, `src/data/rccpPage.ts`, `docs/sql/032_behaviour_verify.sql` (NEW), `docs/sql/032_behaviour_verify_README.md` (NEW), `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `QA_CHECKLIST.md`, `PRD.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`, `CHANGELOG.md`.

## 2026-10-24 (v1.5.0 Free Trial Claim Flow, Auth Return Path, Tools Copy Alignment)
- Implemented Task C1 (`src/lib/trial.ts`):
  - Typed wrappers for Supabase RPCs: `get_trial_public`, `get_trial_status`, and `claim_free_trial`.
  - Non-throwing error handling transforming failures into `{ ok: false, reason: 'network' }`.
  - Created hooks `useTrialPublic` and `useTrialStatus`, executing client-side only and skipped during prerendering (`window.__PRERENDER__`).
  - Added pure `sanitizeNext(raw)` enforcing open redirect protection (disallows `//`, `/\`, `://`, backslashes, control characters, max 200 chars).
  - Added `formatTrialTimeLeft` returning days or hours left (switching to hours under 48 hours).
  - Added `getClaimErrorMessage` mapping backend claim failure reasons to user-friendly messages without leaking internal domain blocklists.
- Implemented Task C2 (`src/pages/tools/RccpToolPage.tsx`, `src/data/rccpPage.ts`):
  - Wired dynamic trial button: "Get your {N}-day free trial now" with "{slots_left} of {slot_cap} free-trial spots left" when offer is enabled and slots remain.
  - Set signed-out click to `/auth?mode=signup&next=/dashboard%23claim-trial` and signed-in click to `/dashboard#claim-trial`.
  - Added active trial state: "Your free trial is active" status pill with formatted remaining time and "Open dashboard →" link.
  - Added ended trial state: primary "Get CP Bot" access button without trial promotion.
  - Guaranteed zero layout shift and fail-safe fallback to standard layout when offer is disabled or errors.
- Implemented Task C3 (`src/pages/Auth.tsx`, `src/lib/checkout.ts`):
  - Added `mode` and `next` query parameter handling to `Auth.tsx`.
  - Sanitized `next` using `sanitizeNext` and navigated there upon successful sign-in or immediate sign-up session.
  - Passed sanitized redirect URL to `supabase.auth.signUp` in `options.emailRedirectTo`.
  - Updated `handleGetAccessLogic` signed-out branch in `checkout.ts` to redirect to `/auth?next=${encodeURIComponent(currentPath)}`.
  - Verified `touchedPassword` in `Auth.tsx`: properly defined and functioning, no crash occurs.
- Implemented Task C4 (`src/components/DashboardTrialCard.tsx`, `src/pages/Dashboard.tsx`):
  - Created `DashboardTrialCard` with `id="claim-trial"`, supporting hash auto-scroll and subtle highlight.
  - Implemented 5 states: eligible unclaimed, claimed active, claimed ended, claim success confirmation, and silent/quiet sold out.
  - Triggered in-place refetch of dashboard subscription data upon claim without full page reload.
  - Styled with existing teal and mint design tokens, mobile-first responsive layout (16px side gutters, no horizontal scroll).
- Implemented Task 2 copy alignment (`src/data/tools.ts`):
  - Corrected description and four feature bullet descriptions for Return Converter x CopyPaste Bot (`rccp`).
  - Audited `src/data/rccpPage.ts` and `src/pages/tools/RccpToolPage.tsx` and compiled list of conflicting claims against CP Bot developer facts.
- Updated documentation:
  - `PRD.md`: added Part C specifications.
  - `QA_CHECKLIST.md`: added Part C manual test cases (checks 11-14).
  - `PROJECT_STATE.md`: updated to current v1.5.0 reality.
  - `CHANGELOG.md`: added [1.5.0] release notes.
- Tested:
  - Ran `npx tsc --noEmit -p .` (passed with code 0).
  - Verified no test runner in `package.json`.
- Files touched: `src/lib/trial.ts` (NEW), `src/components/DashboardTrialCard.tsx` (NEW), `src/pages/Dashboard.tsx`, `src/pages/Auth.tsx`, `src/lib/checkout.ts`, `src/pages/tools/RccpToolPage.tsx`, `src/data/rccpPage.ts`, `src/data/tools.ts`, `CHANGELOG.md`, `PRD.md`, `QA_CHECKLIST.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-24 (v1.4.4 Tools Card Copy Alignment & CP Bot Architecture Docs)
- Updated Return Converter x CopyPaste Bot card copy on `/tools` (`src/pages/Tools.tsx`):
  - Description replaced with: "Paste eBay buyer addresses straight into Amazon checkout, and turn Amazon return codes into clean eBay return labels."
  - Four bullets replaced with:
    - "One-click copy - eBay buyer address into Amazon checkout"
    - "Instant labels - Amazon return codes into eBay return labels"
    - "History tracking - Fulfilment and return label history"
    - "Cloud clipboard - Copy in one browser, paste in another"
  - Styling, tags, layout, and links preserved; audited for desktop height parity with adjacent ListFlow card.
- Audited repository for occurrences of old copy strings across all files without modifying out-of-scope files.
- Incorporated CP Bot developer written answers (23 Oct 2026) across `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md`, and `PROJECT_STATE.md`:
  - Confirmed CP Bot unlock slug is `'cpbot'`, called via single-argument `check_product_subscription(p_product_slug = 'cpbot')`.
  - Corrected gating status: CP Bot web dashboard (`/cp-bot` pages) is gated by `check_product_subscription` in strict fail-closed mode.
  - Documented Chrome extension gating status: not gated today; gate ships in extension v1.0.5.3 (pending Chrome Web Store review); public trials must not open until live.
  - Documented 5-minute extension caching and immediate web dashboard lockout on next page load via RPC `current_period_end` evaluation.
  - Documented single overload invariant for `check_product_subscription` (never create second overload).
  - Documented table status: `cp_bot_licenses` is unused; `cp_bot_config` and `cp_bot_settings` are in active use; other active tables: `cp_bot_activity_log`, `cp_bot_fulfillments`, `cp_bot_gift_templates`, `cp_bot_insight_cards`, `cp_bot_cloud_clipboard`, `label_history`.
  - Documented Return Converter sign-in gating and production testing with dedicated test accounts.
  - Documented developer notification requirements before Stripe/webhook deploy and trial launch.
- Added QA check 10 to `QA_CHECKLIST.md` for `/tools` card copy and single-line bullet layout.
- Version bumped to 1.4.4; updated `CHANGELOG.md`.
- Files touched: `src/pages/Tools.tsx`, `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md`, `QA_CHECKLIST.md`, `PROJECT_STATE.md`, `CHANGELOG.md`, `BUILD_LOG.md`.

## 2026-10-23 (Free Trial Part B: Review Fixes - Webhook Reactivation & Order Bot Guard)
- Fixed webhook reactivation hole in `supabase/migrations/032_webhook_trial_conversion.sql`:
  - Disentangled single-seat handling by event type.
  - Only `p_event_type = 'checkout.session.completed'` may perform INSERT or UPSERT on `(user_id, product_slug) WHERE store_id IS NULL`, preceded by the active manual grant check and trial conversion lookup.
  - `p_event_type = 'customer.subscription.updated'` on single-seat products strictly updates `current_period_end` (and `updated_at`) on existing active rows matching `stripe_subscription_id AND status = 'active'`. It does not touch `cancel_at_period_end`, `is_trial`, `grant_reason`, or `status`, preventing late update events after cancellation from reactivating cancelled rows.
- Updated `supabase/functions/create-checkout-session/index.ts`:
  - Confirmed exactly one declaration of profile lookup in `CHECKOUT_ENABLED` guard; verified no fragments across the entire file.
  - Exempted Order Bot (`product_slug !== 'orderbot'`) from the 409 `already_subscribed` guard, adding an explanatory comment that Order Bot is a multi-slot product where additional store slots are purchased through checkout.
- Verified live DB schema columns in `live_db_snapshot.txt` and migration 031: confirmed `subscriptions.updated_at` exists in snapshot (line 277).
- Performed static syntax parse on `create-checkout-session/index.ts` and `stripe-webhook/index.ts` using `esbuild` (both exited 0).
- Updated documentation in `docs/FREE_TRIAL_AND_DISCOUNTS.md` (Section 9), `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md`, and added manual test checks 8 & 9 to `QA_CHECKLIST.md`.
- No database migrations applied to live database; no Edge Functions deployed; unversioned local commit only.
- Files touched: `supabase/functions/create-checkout-session/index.ts`, `supabase/migrations/032_webhook_trial_conversion.sql`, `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md`, `QA_CHECKLIST.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-23 (Free Trial Part B: Webhook Conversion, Pricing & Access Decoupling)
- Authored migration `supabase/migrations/032_webhook_trial_conversion.sql`:
  - Implemented `public.resolve_access_slug(p_tool_slug text)` mapping tool catalog slugs to entitlement access slugs (restricted to `postgres` role).
  - Re-implemented `public.process_stripe_webhook_event` preserving exact 13-argument signature.
  - Added fallback resolution for missing `user_id`, `email`, and `product_slug` from existing subscriptions by `stripe_subscription_id`; skips gracefully with HTTP 200 on unresolved identity.
  - Implemented manual grant protection: active `manually_granted = true` subscriptions are never overwritten.
  - Implemented single-seat `UPSERT` on `(user_id, product_slug) WHERE store_id IS NULL`, converting trial rows in place (`is_trial = false`) and stamping `public.trial_claims.converted_at = now()`.
  - Preserved Order Bot multi-store quantity logic.
- Authored `docs/sql/032_rollback.sql` restoring original snapshot definition and dropping `resolve_access_slug`.
- Authored `docs/sql/032_verify.sql` returning single JSON validating function overload count (1), signatures, and grants.
- Updated `supabase/functions/stripe-webhook/index.ts` to extract user ID, email, and tool slug from session and subscription metadata across all events, returning 200 on skipped RPC outcomes.
- Updated `supabase/functions/create-checkout-session/index.ts`:
  - Server-side price resolution from `public.tools.price_monthly` and `public.user_price_overrides` using `price_data`.
  - Enforced minimum unit amount (50 cents AUD) with HTTP 400 (`price_too_low`).
  - Added double-charge guard checking active paid subscriptions for resolved access slug with HTTP 409 (`already_subscribed`), while allowing trial upgrades.
  - Attached metadata to both session and `subscription_data.metadata`.
- Updated documentation in `docs/FREE_TRIAL_AND_DISCOUNTS.md` and `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`. Created `PRD.md` and `QA_CHECKLIST.md`.
- No database migrations applied to live database; no Edge Functions deployed. Unversioned backend change.
- Files touched: `supabase/migrations/032_webhook_trial_conversion.sql` (NEW), `docs/sql/032_rollback.sql` (NEW), `docs/sql/032_verify.sql` (NEW), `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/create-checkout-session/index.ts`, `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md` (NEW), `QA_CHECKLIST.md` (NEW), `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-23 (Migration 031 Constraint Fix & Verify Script Column Correction)
- Resolved PostgreSQL duplicate constraint error (`ERROR 42710`) on `public.user_price_overrides`:
  - Removed duplicate inline check on `kind` column.
  - Named table check constraints uniquely: `user_price_overrides_kind_valid` for `CHECK (kind IN ('fixed_price', 'percent_off'))` and `user_price_overrides_values_present` for the amount/percentage requirement check.
  - Scanned all 4 migration tables (`trial_offers`, `blocked_email_domains`, `trial_claims`, `user_price_overrides`) and confirmed zero duplicate constraint names, auto-name collisions, or collisions with live objects.
- Fixed `docs/sql/031_free_trial_verify.sql` Script 1: replaced non-existent `pg_class.rowsecurity` with `pg_class.relrowsecurity`.
- No database migrations applied to live environment; no application runtime code or dependencies modified.
- Files touched: `supabase/migrations/031_free_trial_and_discounts.sql`, `docs/sql/031_free_trial_verify.sql`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-23 (Free Trial Part A Review Fixes - In Place)
- Revised Part A migration `supabase/migrations/031_free_trial_and_discounts.sql`:
  - Added transaction-level timeouts: `SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';`.
  - Fixed `user_price_overrides` CHECK constraint NULL hole with explicit `IS NOT NULL` checks on `amount_cents` and `percent_off`; added `CHECK (ends_at IS NULL OR ends_at > starts_at)`.
  - Fixed PL/pgSQL row-variable `IS NOT NULL` bug in `get_trial_status` by setting boolean flags from `FOUND` (`v_claim_found`, `v_sub_found`).
  - Aligned evaluation order across `get_trial_status` and `claim_free_trial`: unauthenticated -> unconfirmed email -> blocked domain -> [FOR UPDATE lock in claim] -> already claimed -> existing subscriptions -> disabled -> sold out -> ok. Existing claimants consistently receive `already_claimed`.
  - Hardened security: zero policies on all four tables, revoked all direct table privileges from `anon` and `authenticated` to hide administrative columns (`note`, `revoked_reason`).
  - Set immutable search path `SET search_path = pg_catalog, pg_temp` on `normalize_email`.
  - Switched interval generation to `make_interval(days => v_offer.trial_days)` in `claim_free_trial`.
  - Documented privacy retention rationale for `trial_claims.email_normalized` on account deletion.
- Rewrote `docs/sql/031_free_trial_rollback.sql` with `SET LOCAL lock_timeout = '5s'`, explicit function signatures, `DROP TABLE ... CASCADE` without brittle policy drops, and commented-out optional trial expiration warning.
- Rewrote `docs/sql/031_free_trial_verify.sql` into two distinct single-result scripts: Script 1 (read-only diagnostic returning single jsonb) and Script 2 (atomic DO block testing full claim lifecycle and permissions, ending with intentional `RAISE EXCEPTION` to roll back all changes).
- Updated `docs/FREE_TRIAL_AND_DISCOUNTS.md` with review findings, zero-policy security model, operational runbook steps, email verification requirements, and manual SQL commands for testing.
- No migrations applied to live production database; no application code or runtime packages modified.
- Files touched: `supabase/migrations/031_free_trial_and_discounts.sql`, `docs/sql/031_free_trial_rollback.sql`, `docs/sql/031_free_trial_verify.sql`, `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-23 (Free Trial & Discounts Database Layer - Part A)
- Authored migration `supabase/migrations/031_free_trial_and_discounts.sql` in a single idempotent transaction creating `subscriptions.is_trial`, `trial_offers`, `trial_claims`, `user_price_overrides`, and `blocked_email_domains` tables with strict RLS and privilege revocations.
- Implemented immutable `normalize_email` (dot/alias stripping, googlemail normalization) and atomic security-definer RPCs `get_trial_public`, `get_trial_status`, and `claim_free_trial` (with FOR UPDATE slot locking, confirmed-email checks, disposable domain blocking, and unique constraint handling).
- Authored rollback script `docs/sql/031_free_trial_rollback.sql`, verification script `docs/sql/031_free_trial_verify.sql` (including email unit tests and an atomic lifecycle test that rolls back), and architecture runbook `docs/FREE_TRIAL_AND_DISCOUNTS.md`.
- No migrations applied to live database; no application code or runtime packages modified.
- Files touched: `supabase/migrations/031_free_trial_and_discounts.sql` (NEW), `docs/sql/031_free_trial_rollback.sql` (NEW), `docs/sql/031_free_trial_verify.sql` (NEW), `docs/FREE_TRIAL_AND_DISCOUNTS.md` (NEW), `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-23 (Current State of Billing and Access Architecture Audit)
- Completed architectural audit of live database schema, subscription data models, product slug mappings, access RPCs, Stripe checkout and webhook pipelines, admin actions, and customer account touchpoints.
- Authored comprehensive report in `docs/CURRENT_STATE_BILLING_AND_ACCESS.md` detailing findings, slug divergence (`rccp` vs `cpbot`), root causes of webhook HTTP 500 errors, secondary source disagreements, and technical risks prior to implementing free trials or per-user discounts.
- No code, migrations, packages, or environment configurations modified.
- Files touched: `docs/CURRENT_STATE_BILLING_AND_ACCESS.md` (NEW), `BUILD_LOG.md`.

## 2026-10-22 (v1.4.3 RCCP Logo Without Tile & Changelog Correction)
- Removed mint tile wrapper around `/images/rccp-logo.png` on `/tools/rccp` (`RccpToolPage.tsx`). Rendered raw `<img>` element with explicit `width="949"` and `height="650"`, `className="w-[80px] lg:w-[110px] h-auto object-contain"`, no background, border, shadow, padding, rounded frame, filter, or mix-blend mode. Card background confirmed pure white (`bg-white`).
- Corrected `CHANGELOG.md` entry for v1.4.2 to remove the premature clause stating the logo appeared without a box in that release. Added v1.4.3 entry for the actual logo tile removal.
- Bumped version to 1.4.3.
- Files touched: `src/pages/tools/RccpToolPage.tsx`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-22 (v1.4.2 RCCP Hero Layout, Card Icon, Logo Inspection)
- Refactored hero pricing and buttons layout on `/tools/rccp` (`RccpToolPage.tsx`): price rows stacked into two clean lines with `min-w-[140px]` labels, `whitespace-nowrap`, and `shrink-0`. Buttons grouped in a flexible wrapping container (`gap-3`, `whitespace-nowrap`, `shrink-0`, matching 50px height via `border border-transparent` on primary CTA). Outer container wraps gracefully (`gap-x-8 gap-y-5`) so buttons wrap cleanly below prices at constrained viewports while sitting side by side on wide desktop.
- Removed Sparkles icon and its mint tile from the "For eBay AU sellers" card, removed unused `Sparkles` import from `lucide-react`, equalized card padding, and ensured equal column heights on desktop via `className="h-full"` on `RevealBlock`.
- Inspected `public/images/rccp-logo.png` via Node `fs` and `zlib`: 949x650 px, 8-bit RGBA (colour type 6), no tRNS chunk, top-left pixel `[253, 255, 254, 255]`. Under condition (c) (opaque non-pure-white background), retained the logo tile until a transparent asset is supplied.
- Bumped version to 1.4.2.
- Files touched: `src/pages/tools/RccpToolPage.tsx`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-22 (v1.4.1 Rename Virtual Assistance to Virtual Assistant)
- Renamed visible labels from "Virtual Assistance" to "Virtual Assistant" in desktop/mobile navigation (`Navigation.tsx`), footer (`Footer.tsx`), PageLoader, and SEO title/JSON-LD metadata (`VirtualAssistance.tsx`).
- Migrated route from `/virtual-assistance` to `/virtual-assistant` in `App.tsx`, `scripts/prerender.js`, and `scripts/generate-sitemap.js`.
- Configured 301 permanent redirects in `vercel.json` placed before SPA catch-all rewrites: `/virtual-assistance` -> `/virtual-assistant`, and repointed `/services/virtual-assistants` directly to `/virtual-assistant` (avoiding redirect chain).
- Verified canonical and og:url use `https://www.automationalchemists.com/virtual-assistant`.
- Bumped version to 1.4.1.
- Files touched: `src/components/Navigation.tsx`, `src/components/Footer.tsx`, `src/App.tsx`, `src/pages/VirtualAssistance.tsx`, `scripts/prerender.js`, `scripts/generate-sitemap.js`, `vercel.json`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-22 (SEO Canonical Host Alignment & RevealText Word Spacing)
- Updated all canonical URLs, SEOHead props, SchemaMarkup JSON-LD metadata, and sitemap/robots generator scripts to use the primary www host (`https://www.automationalchemists.com`).
- Fixed heading word spacing in `RevealText.tsx` by inserting real whitespace text nodes (`{" "}`) between adjacent word spans instead of relying solely on CSS margins (`mr-[0.25em]`), ensuring extracted page text from static HTML and screen scrapers preserves proper word separation.
- Files touched: `src/components/RevealText.tsx`, `src/components/SEO.tsx`, `src/pages/Index.tsx`, `src/pages/Tools.tsx`, `src/pages/tools/RccpToolPage.tsx`, `src/pages/VirtualAssistance.tsx`, `src/pages/WorkflowAutomation.tsx`, `src/pages/WebDevelopment.tsx`, `src/pages/VirtualAssistants.tsx`, `src/pages/VibeToApp.tsx`, `src/pages/ServiceDetail.tsx`, `src/pages/SaasDevelopment.tsx`, `src/pages/Automation.tsx`, `src/pages/AppDevelopment.tsx`, `scripts/generate-sitemap.js`, `scripts/generate-pages.js`, `scripts/generate.cjs`, `scripts/generate.py`, `public/robots.txt`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-22 (v1.4.0 Return Converter x CopyPaste Bot Page Rebuild)
- Rebuilt dedicated product page for `/tools/rccp` ("Return Converter x CopyPaste Bot") matching design specifications with brand tokens (teal-900/800/600, mint-50, white, yellow CTA accents).
- Created `src/data/rccpPage.ts` holding all copy word for word to decouple page components from text changes.
- Implemented `src/pages/tools/RccpToolPage.tsx` with responsive layout (desktop split, mobile stacked), fixed-size icon tile, price rows with dynamic DB fetching (fallback 9, no hardcoded 19), and "Get access" / "Use Return Converter free" CTAs.
- Integrated safe animations matching `/virtual-assistance` using `RevealText` and `RevealBlock`: hero sequence on load (<1.2s total), scroll reveals with masked word rise for H2s, staggered step badges (0.1s), and capped card stagger (0.08s, max 0.4s). Preserved reduced-motion and prerender safeguards (`data-prerendered`, `window.__PRERENDER__`).
- Updated `src/App.tsx` routing to explicitly route `/tools/rccp` to `RccpToolPage` while preserving `ToolDetail.tsx` for all other tool routes (`/tools/listflow`, `/tools/orderbot`, `/tools/invoicegen`).
- Added missing tool routes (`/tools/rccp`, `/tools/listflow`, `/tools/orderbot`, `/tools/invoicegen`) to `scripts/prerender.js` and `scripts/generate-sitemap.js`.
- Configured SEO tags via `SEOHead` with unique title, meta description, and canonical URL.
- Bumped version to 1.4.0.
Files touched: `src/data/rccpPage.ts`, `src/pages/tools/RccpToolPage.tsx`, `src/App.tsx`, `scripts/prerender.js`, `scripts/generate-sitemap.js`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-09-28 (v1.3.3 UI Polish & Footer Links)
- Fixed hero button hover state sticking on touch devices by wrapping hover styles in `[@media(hover:hover)]` and adding explicit active states. Applied to both buttons in Virtual Assistance hero and Pricing section.
- Redesigned ContactPage layout to ensure equal columns on desktop with cohesive unified padding. Reordered flex items so ExpandableContactForm appears above contact details on mobile.
- Enforced 16px text-base for all form inputs in ExpandableContactForm to prevent iOS zoom.
- Updated Footer to use original gold logo (removed `brightness-0 invert` filter).
- Replaced Twitter/LinkedIn/GitHub footer icons with Mail/Facebook/Instagram/WhatsApp configuration block using lucide-react and SVG.
- Streamlined footer links: removed dead/redirect routes, unified services, renamed Virtual Assistance, keeping only distinct pages.
- Bumped version to 1.3.3.
Files touched: `src/pages/VirtualAssistance.tsx`, `src/pages/ContactPage.tsx`, `src/components/ExpandableContactForm.tsx`, `src/components/Footer.tsx`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-09-28 (v1.3.2 Virtual Assistance Fixes)
- Fixed Virtual Assistance mobile layout where `items-center` on the grid flex wrapper caused video blocks with `aspect-video` to collapse to 0 height. Added `w-full` to both wrapper divs.
- Fixed an issue where the video's dark teal placeholder was too transparent (`bg-teal-900/5`), changing it to `bg-teal-900`.
- Applied iOS playback hardening by manually assigning `video.muted = true` before calling `video.play()` inside the IntersectionObserver.
- Fixed a text flash occurring on prerendered initial loads (where the static HTML was rendered, hidden by React/Framer Motion, and re-animated in) by implementing a React `useLayoutEffect` check against a `data-prerendered` attribute. 
- Integrated `window.__PRERENDER__` into `scripts/prerender.js` to ensure the HTML correctly ships in its fully-visible final state regardless of Puppeteer User-Agent obfuscation.
- Bumped version to 1.3.2.
Files touched: `scripts/prerender.js`, `src/components/StorySection.tsx`, `src/components/RevealText.tsx`, `src/components/RevealBlock.tsx`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-09-28 (v1.3.1 Virtual Assistance Animation & Polish)
- Fixed contrast on the "See How It Works" button (turns dark teal text to white on hover).
- Removed the final CTA block on `/virtual-assistance` and redesigned the pricing strip with a cleaner split layout (left text block, right outlined button linking to `/contact`).
- Created reusable Framer Motion components (`RevealText.tsx`, `RevealBlock.tsx`) to handle on-load (hero) and on-scroll (stories, pricing) sequences safely.
- Integrated a prerender safety hook (`useSafeAnimation`) that detects Puppeteer via the `HeadlessChrome` user agent, bypassing animations for prerender HTML snapshots while seamlessly gracefully degrading for `prefers-reduced-motion`.
- Bumped version to 1.3.1.
Files touched: `src/pages/VirtualAssistance.tsx`, `src/components/StorySection.tsx`, `src/components/RevealText.tsx`, `src/components/RevealBlock.tsx`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-09-28 (v1.3.0 Virtual Assistance Polish)
- Applied exact copy updates to `/virtual-assistance` stories, adding a bold `lead` prefix feature.
- Extracted video dimensions (854x480 landscape) and updated `StorySection.tsx` to use `aspect-video` filling the column instead of vertical vertical capping.
- Appended `#t=0.1` to video source URLs to force an initial frame in iOS Safari.
- Configured edge caching for `/videos/(.*)` in `vercel.json` (max-age=86400, stale-while-revalidate=604800).
- Bumped version to 1.3.0 and updated project state docs.
Files touched: `src/data/virtualAssistance.ts`, `src/components/StorySection.tsx`, `vercel.json`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-09-28 — Front-end Fixes
Requested: Three front-end fixes on the integrate-office-home branch. Remove Virtual Assistance section from Services page, update tools fallback prices, and wire up the Dashboard Buy Now buttons.
Built:
- Removed Virtual Assistance section from `src/pages/Services.tsx` and repointed all stale links (`/services/virtual-assistants`) to `/virtual-assistance` in `Footer.tsx`, `prerender.js`, `generate-sitemap.js`, and `App.tsx`.
- Updated `dbTools` fallback state in `Tools.tsx` to match live production prices (specifically updating `rccp` from 19 to 9).
- Extracted `handleGetAccessLogic` in `Tools.tsx` and wired it to `Dashboard.tsx` "Buy now" buttons to ensure checkout feature flag parity across the app.
- Added 301 permanent redirect from `/services/virtual-assistants` to `/virtual-assistance` in `vercel.json`.
- Deployed server-side guard to `create-checkout-session` Edge Function to reject non-admin users with 403 when `CHECKOUT_ENABLED` is not 'true'.
- Refactored `handleGetAccessLogic` to `src/lib/checkout.ts`.
- Merged to main as v1.2.0.

## 2026-09-28 (Virtual Assistance Media)
- Integrated 5 video stories into `/virtual-assistance` using alternating left/right layout on desktop and single-column on mobile.
- Refactored `StorySection.tsx` to support alternating full-width background bands (`teal-900` and `mint-50`) without floating divider gaps.
- Locked video aspect ratios to `9/16` and removed obsolete 'More details' links.
- Prepared `va-01.mp4` through `va-05.mp4` in `public/videos/va/`.
Files touched: `VirtualAssistance.tsx`, `StorySection.tsx`, `virtualAssistance.ts`.
Deviations: The orphaned `VirtualAssistants.tsx` component was left intact, but its route was removed.

## 2026-09-28
- **Requested:** Update Contact page cards: remove business hours, redesign contact details card with icons and functional links. Audit repo for other business hours.
- **Built:** 
  - Removed "Temporal Availability" card from `src/pages/ContactPage.tsx`. 
  - Redesigned "Get in touch" card with a mailto link, custom WhatsApp SVG links for both offices, and a Google Maps link for the Australia office.
  - Audited repo for business hours: confirmed no display text or JSON-LD contains business hours outside of admin settings.
- **Files touched:** 
  - `src/pages/ContactPage.tsx`
- **Deviations:** 
  - Bangladesh address was left as plain text since the room/floor specifics do not resolve sensibly on Google Maps.

## 2026-09-06 — Wire public /tools page to database
Requested: Update `/tools` page to pull dynamic pricing and status from the `public.tools` database table, replacing hardcoded JSX values, without changing the visual design.
Built: 
- Replaced hardcoded frontend pricing and status in `Tools.tsx` with a live Supabase query.
- Configured card rendering to safely ignore (return null for) any rows marked as 'hidden' in the database.
- Mapped CP Bot & Return Converter to the 'rccp' bundle slug.
- Created PROJECT_STATE.md, BUILD_LOG.md, and CHANGELOG.md to formalize project tracking.
Files touched: `src/pages/Tools.tsx`, `PROJECT_STATE.md`, `BUILD_LOG.md`, `CHANGELOG.md`.
Notes/deviations: None.

## 2026-09-06 — Cart/Checkout page and "Get access" fix
Requested: Build a new `/cart` page and fix the broken "Get access" flow that was redirecting logged-in users to the dead `/pricing` route (which bounced to homepage).
Built:
- Created `src/pages/Cart.tsx`: auth-gated cart page with per-item checkout buttons (Option C — each tool creates its own Stripe session via existing `create-checkout-session` Edge Function, no backend changes).
- Cart fetches live pricing from `public.tools` (only `status='available'` rows). Items not available are silently filtered out of the cart.
- "You might also like" sidebar shows other available tools not already in the cart, with "Add to Cart" buttons.
- Handles `?checkout=success` (clears cart, redirects to dashboard) and `?checkout=cancel` (shows toast, stays on cart).
- Updated `src/pages/Tools.tsx`: `handleGetAccess(slug)` now writes to localStorage cart and navigates to `/cart` instead of dead `/pricing`.
- Updated `src/App.tsx`: replaced `<Route path="/pricing" element={<Navigate to="/" replace />} />` with `<Route path="/cart" element={<Cart />} />` and added lazy import.
Files touched: `src/pages/Cart.tsx` (NEW), `src/pages/Tools.tsx`, `src/App.tsx`, `PROJECT_STATE.md`, `BUILD_LOG.md`.
Notes/deviations: Edge Function `create-checkout-session` only accepts a single `product_slug`, so multi-item cart uses individual checkout buttons per tool (Option C) rather than a unified checkout. This avoids modifying the webhook pipeline.
