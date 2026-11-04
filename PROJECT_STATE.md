# Automation Alchemists Project State

## Overview
Automation Alchemists is a full-stack SaaS hub (React/Vite + Tailwind CSS + Supabase) that centralizes authentication, billing, and access gating for external SaaS tools (Return Converter, CP Bot, ListFlow, Order Bot, Invoice Generator), as well as serving as a marketing site for various digital services.

## Database & Multi-App Architecture Rules
- **Naming convention**: Every app that shares the database gets a short table prefix (`cp_bot_` for CP Bot, `ig_` for Invoice Generator, e.g. `ig_profile`) so tables with identical columns stay distinguishable per app.
- **Future Migration Note (Invoice Generator)**:
  - Raf's current Invoice Generator tables:
    - Public tables: `invoices`, `templates`, `profiles`, `linked_emails`, `message_templates`, `gmail_templates`.
    - Private plan/credit tables: `invoice_plan_config`, `invoice_plan_admins`, `invoice_plan_accounts`, `invoice_email_periods`, `invoice_email_sends`.
  - **WARNING**: `profiles` (and possibly `invoices`, `templates`) already exist or may collide in the shared Supabase project, so the `ig_` prefix is mandatory at migration. Migration must preserve account ownership, authentication-ID mappings, invoice creation dates, Gmail credentials, and credit history.
  - **No tables created now**: Zero database schema or data modifications in v1.13.0. Migration 035 prepared in v1.14.0 for manual execution.

## What's Built
- **Marketing Site**: Static landing pages, services pages, tools overview. The services page excludes the Virtual Assistance section, which has its own dedicated `/virtual-assistant` route.
- **Non-Trial Subscribe Checkout & UI Contrast Enhancements (`src/pages/Cart.tsx`, `src/components/DashboardTrialCard.tsx`, `src/pages/Dashboard.tsx`, `supabase/functions/create-checkout-session/params.ts`, v1.15.1)**:
  - Fixed issue where clicking "Subscribe at A$4.99/month" after a declined trial opened another 30-day free trial checkout instead of a paid subscription.
  - Cart checkout (`src/pages/Cart.tsx`) sends explicit `skip_trial: true` signal in `create-checkout-session` payload.
  - Pure helper `determineTrialEligibility` in `params.ts` honors `skip_trial: true`, stripping trial period days, trial settings, and trial submission copy to collect payment today (A$4.99 incl. GST).
  - Security guarantee: client-supplied `skipTrial` flag can only remove a trial, never grant one.
  - "Use another card" button (`startTrialCheckout`) continues to initiate normal trial checkouts.
  - Fixed invisible text on "Use another card" buttons across `/dashboard` by applying `bg-transparent`, restoring WCAG AA compliant contrast (14.8:1 default, 6.5:1 hover) on white surfaces.
- **Denied-Trial Choices & Retry Cap (`src/lib/trial.ts`, `src/components/DashboardTrialCard.tsx`, `src/pages/Dashboard.tsx`, v1.15.0)**:
  - Guided recovery options for declined free trials:
    - Card already used (`card_already_used`): Displays dual action buttons — "Use another card" (initiating a fresh checkout session via standard `startTrialCheckout`) and "Subscribe at A$4.99/month" (initiating immediate paid subscription via `handleGetAccessLogic('rccp')`).
    - Account/email already used (`already_claimed`): Displays exclusively the "Subscribe at A$4.99/month" action button.
  - Three-strike retry cap: Maximum 3 card denials per account per tool evaluated from `public.trial_denials`. When reached (`cardDenialCount >= 3`), "Use another card" is suppressed, displaying plain text *"The free trial is no longer available for this account."* alongside the Subscribe button.
  - Server-side cap enforcement: Pure helper `isCardDenialCapExceeded` in `supabase/functions/create-checkout-session/params.ts`; when cap is exceeded, `create-checkout-session` forces `isEligibleTrial = false` with `trialEligibilityReason = 'card_denials_capped'` (Edge Function updated, awaiting owner deployment).
  - Dashboard CP Bot tool card parity: Suppresses "Start free trial now" when denied, presenting the exact dual or single recovery choices matching the top alert.
  - All copy centralized in `src/lib/trial.ts` (`TRIAL_DENIAL_TEXTS`, `getDeniedTrialChoice`, `getSubscribeButtonText`) with zero hardcoded prices or labels in JSX.
- **Sign-Up Flow Guidance & Persistent Notice (`src/lib/authFlow.ts`, `src/pages/Auth.tsx`, v1.15.0)**:
  - Streamlined post-signup onboarding: Upon successful submission of the Create Account form, automatically switches active tab to "Sign in".
  - Pre-fills customer email address into the Sign in input field while strictly clearing password fields.
  - Displays persistent confirmation alert above the sign-in form: *"Account created. Check your email to confirm your account, then sign in."*.
  - Preserves mandatory Supabase email verification with `emailRedirectTo: `${origin}/dashboard`` without premature automatic sign-in.
  - State machine logic extracted into pure helper `getSignUpSuccessState` in `src/lib/authFlow.ts` with comprehensive unit tests.
- **Dashboard "Open Tools" Link Direct Routing (`src/pages/Dashboard.tsx`, v1.15.0)**:
  - Updated primary "Open Tools" header action buttons on `/dashboard` to link directly to `https://rccp.automationalchemists.com/choose` via exported constant `RCCP_CHOOSE_URL`.
  - Tool-specific "Open Return Converter" actions continue pointing directly to `https://rccp.automationalchemists.com`.
- **Cart Page Crash Resolution & Global Identifier Sweep (`src/pages/Cart.tsx`, `src/pages/Account.tsx`, v1.14.1)**:
  - Fixed launch-blocking `ReferenceError: PageLoader is not defined` crash on `/cart` when trial-refused customers clicked "Subscribe" from the dashboard or when unauthenticated users visited the cart. Imported shared `PageLoader` from `src/components/PageLoader.tsx`.
  - Comprehensive source code sweep fixed missing `ShieldAlert` icon import in `src/pages/Account.tsx` account deletion confirmation modal.
  - Eliminated all TS2304 and TS2552 missing identifier errors across the codebase, reducing total TypeScript diagnostic errors from baseline 101 to 98 (zero new errors introduced).
- **RCCP Tool Page Active Trial Crash Fix (`src/pages/tools/RccpToolPage.tsx`, v1.14.1)**:
  - Fixed React 18 child object rendering crash when logged-in accounts with an active free trial visit `/tools/rccp`. Extracted `.text` string property from `formatTrialTimeLeft(endsAt)` return value.
  - Added safe `isNaN` guard in `src/lib/trial.ts` preventing NaN calculations on malformed timestamps.
  - Enhanced `src/components/ErrorBoundary.tsx` `componentDidCatch` to log caught error objects and component stacks with `console.error`.
- **Identifier Sweep & Cart Render Test Suite (`scripts/test-identifier-sweep.mjs`, v1.14.1)**:
  - Static AST audit of all 149 source files ensuring every usage of `PageLoader` and `ShieldAlert` is strictly imported, plus SSR mount testing of `/cart` across authenticating and authenticated states.
  - Integrated into Suite D2 of `scripts/test-launch-readiness.mjs`.
- **Consistent Free Trial End Date Calculation (`src/lib/billingView.ts`, v1.14.0)**:
  - Standardized customer-facing trial expiration date calculation by subtracting the 6-hour database grace buffer (`TRIAL_GRACE_BUFFER_HOURS = 6`, `TRIAL_GRACE_BUFFER_MS = 21,600,000`) added by `process_stripe_webhook_event` (`034_card_trial_identity.sql:789`).
  - Pure helper `getEffectiveTrialEnd(currentPeriodEnd, isTrial)` resolves the exact unbuffered Stripe `trial_end` for all trialing subscriptions, while leaving paid renewals unadjusted.
  - Pinned single date format `formatBillingDate(dateVal)` using `en-AU` locale and `Australia/Sydney` timezone (`{ day: 'numeric', month: 'long', year: 'numeric' }`, e.g. `"3 December 2026"`).
  - Synchronized across the dashboard trial banner (`DashboardTrialCard.tsx`), tool cards (`Dashboard.tsx` / `getBillingView`), `formatTrialTimeLeft` (`src/lib/trial.ts`), and `getSubscriptionDateText` (`src/lib/dashboardSections.ts`), guaranteeing both surfaces display the exact same calendar day matching Stripe Checkout.
- **Trial Anti-Abuse Gating: Card Fingerprint and Normalized Email Only (v1.14.0)**:
  - Policy change: Free trials are gated strictly by normalized email (`trial_claims.email_normalized`) and card fingerprint (`trial_identities` kind `'card'`) only.
  - Phone numbers no longer block, deny, or lock customer access. Duplicate phone numbers across accounts are permitted as long as the card fingerprint and normalized email are unique.
  - Stripe Checkout retains phone number collection (`phone_number_collection = { enabled: true }`) across all sessions to populate invoice contact records.
  - Authored pending migration `supabase/migrations/035_trial_identity_card_email_only.sql`: redefines `public.finalize_card_trial` to omit phone checks and stop writing `kind = 'phone'` rows, with `p_phone_hash DEFAULT NULL` for seamless backward compatibility.
  - Preserved existing `kind = 'phone'` records in `trial_identities` without deletion.
  - Updated `supabase/functions/stripe-webhook/index.ts` to remove hard requirement for `TRIAL_IDENTITY_PEPPER` and safely fallback to `'phone_not_tracked'` when pepper is unconfigured.
  - Removed `phone_already_used` and `phone_missing` denial copy from `getClaimErrorMessage` in `src/lib/trial.ts`.
- **Live Free-Trial Spots Banner on RCCP Tool Page (`src/components/TrialSpotsBanner.tsx`, v1.13.0)**:
  - Prominent, beautiful banner near the top of `/tools/rccp` (in the hero section, above the fold on desktop and mobile) displaying live promotional capacity (e.g. *"100 of 100 free-trial spots left"*).
  - Single database source of truth: queries `get_trial_public('rccp')` / `get_trial_status('rccp')`, where `v_slots_left := GREATEST(slot_cap - (slots_reserved + claims), 0)`. Cap is dynamic (owner changed cap from 5 to 100 via SQL); zero hardcoded limits.
  - Anonymous visitor support: `get_trial_public` is `SECURITY DEFINER` granted to `anon` and `authenticated`, working seamlessly without login or database migrations.
  - Live synchronization: refetches every 30 seconds while the tab is visible and immediately on tab focus/visibility restoration.
  - Smooth animation: Framer Motion animated numerical decrement countdown, `aria-live="polite"`, and respect for `prefers-reduced-motion`.
  - Accessible progress bar: shrinks smoothly as spots are claimed, showing remaining capacity with full ARIA progressbar attributes.
  - Pure state machine helper (`src/lib/trialBanner.ts`): evaluates `loading` (skeleton), `available` (normal), `low` (<= 10% of cap, "Almost gone" badge, amber styling, singular/plural grammar), `sold_out` (0 spots left, truthful launch price copy, "Get CP Bot now"), and `hidden` (fails silent on disabled offer or network error).
  - Unified CTA: reuses standard `startTrialCheckout` and `handleGetAccessLogic` flows, accompanied by `<TrialTermsLine trialDays={trialDays} />` with zero hand-typed prices.
  - Single landing page spots counter: removed the duplicate small spots line below the hero card trial button on `/tools/rccp` so only the new prominent banner shows the spots number on the landing page (dashboard trial card keeps its own text).
  - Prerender safety: defers dynamic numbers until client mount; prerendered HTML contains structural skeleton with zero stale counts.
- **Central Pricing Configuration (`src/config/pricing.tsx` & `.ts`, v1.11.0)**:
  - Pinned single source of truth: `standardPrice = 9.99`, `launchPrice = 4.99`, `currency = 'AUD'`, `gstInclusive = true`, `launchEndsOn = null` (no fake deadline or countdown timer).
  - Pure formatter `formatPrice` and reusable `<LaunchPriceDisplay />` rendering crossed-out standard price (`<s><span className="sr-only">was A$9.99</span>A$9.99</s>`), launch price `A$4.99/month`, `"Launch price"` badge, and `"incl. GST"`.
  - Reusable `<TrialTermsLine />` rendering exact trial terms next to every trial CTA button across `/tools`, `/tools/rccp`, and `/dashboard`:
    `"Free for 30 days, then A$4.99/month (launch price, normally A$9.99), incl. GST, charged automatically until you cancel. By starting your trial you agree to the Terms of Service and Privacy Policy."`
    Dynamic trial days (resolved from `trial_offers`, defaulting to 30) and config prices; links open in a new tab (`target="_blank" rel="noopener noreferrer"`).
- **Product Naming & Product Separation (v1.11.0)**:
  - Paid product strictly designated as "CP Bot" (Copy Paste Bot).
  - Return Converter clearly documented and messaged as 100% free; removed any copy stating Return Converter is included in the paid subscription.
- **Customer Dashboard Billing States (`src/lib/billingView.ts`, v1.11.0 & v1.14.0)**:
  - Pure helper `getBillingView(subscription, now)` extracting billing state evaluation:
    - `none / expired`: Subscribe / Start trial CTA.
    - `trialing (active)`: "Free trial active - ends on <date>" with "Manage billing" action.
    - `trialing_canceled (active, cancel_at_period_end)`: "Trial cancelled - access until <date>; no charge" with "Manage billing".
    - `active (paid)`: "Subscription active - renews on <date>" with "Manage billing".
    - `active_canceled (paid, cancel_at_period_end)`: "Cancelled - access until <date>" with "Manage billing".
    - `past_due`: High-priority alert banner "Payment failed - CP Bot is paused. Update your payment method to restore access." with "Update payment method" button opening Stripe Billing Portal. Suppresses trial card and Subscribe actions.
  - Date formatting: en-AU locale, `Australia/Sydney` timezone.
- **Signup Landing Redirect (v1.11.0)**:
  - Supabase `signUp` calls configured with `emailRedirectTo: `${window.location.origin}/dashboard`` ensuring email confirmation lands users on `/dashboard`.
- **Checkout Session GST, Terms & Billing Details (`create-checkout-session`, v1.11.0 & v1.12.0)**:
  - Extracted pure helper `buildCheckoutSessionParams` in `supabase/functions/create-checkout-session/params.ts`.
  - Mandatory full billing address collection: `billing_address_collection = 'required'` on all sessions (v1.12.0).
  - Phone number collection: `phone_number_collection = { enabled: true }` enabled on all sessions (v1.12.0).
  - Customer profile synchronization: `customer_update = { name: 'auto', address: 'auto' }` attached exclusively when `customerId` is passed; safely omitted when session uses `customer_email` (v1.12.0).
  - Business / Company name collection: Helper support added for `name_collection` (`{ individual: { enabled: true, optional: false }, business: { enabled: true, optional: true } }`). Emission in live session creation paused pending Stripe SDK upgrade from `stripe@14.22.0` (API `2023-10-16`) to API `2025-09-30.clover`+ (v1.12.0).
  - GST tax rate integration: `subscription_data.default_tax_rates = [Deno.env.get('STRIPE_GST_TAX_RATE_ID')]`.
  - Fail-closed security: missing/empty `STRIPE_GST_TAX_RATE_ID` returns HTTP 500 (`"GST tax rate not configured"`) and halts session creation.
  - Runtime assertion guarantees NO `automatic_tax` is passed.
  - Terms consent collection: `consent_collection.terms_of_service = 'required'` and `custom_text.terms_of_service_acceptance.message = 'I agree to the [Terms of Service](https://rccp.automationalchemists.com/terms-of-service) and [Privacy Policy](https://rccp.automationalchemists.com/privacy).'`.
- **Contact Page**: Redesigned contact details card with functional links (mailto, WhatsApp SVG links, Google Maps). JSON-LD and display text are aligned.
- **Auth System**: Integrated Supabase Auth with singleton `useAuth` hook and visibility-change state restoration. Return-path navigation via `?next=` sanitized by `sanitizeNext`.
- **Email Branding Asset (`/email-logo.png`, v1.9.4)**:
  - Hosted static asset: `https://www.automationalchemists.com/email-logo.png`.
  - Static file at `public/email-logo.png` (copied to `dist/email-logo.png` on build, served directly before SPA catch-all rewrites).
  - 400x400 PNG, logo centered with 12% padding (48px padding, 304x304 inner area), flattened on pure black `#000000` (RGB mode), optimized under 100 KB (30.56 KB), corner pixels `(0, 0, 0)`.
- **Invoice Generator Product Page & Branding Asset (`/tools/invoice-generator`, v1.10.0)**:
  - Dedicated landing page at `/tools/invoice-generator` (`src/pages/tools/InvoiceGeneratorToolPage.tsx` and `src/data/invoiceGeneratorPage.ts`) mirroring `/tools/rccp` structure, design tokens, and spacing.
  - Pinned config URLs in `src/data/invoiceGeneratorPage.ts`.
- **Tools Overview Page (`/tools`, 3-Card Grid)**:
  - Card 1: Return Converter x CopyPaste Bot (`rccp`).
  - Card 2: ListFlow (`listflow`, Coming soon).
  - Card 3: Invoice Generator (`INVOICING` tag, `Free` badge, "Free to get started", "Learn more" button).
- **Dashboard Isolation Guarantee**:
  - Invoice Generator is completely absent from `/dashboard`. It operates under separate auth and is excluded by `categorizeDashboardTools` without touching the database tools table.
- **Entitlement Gating**: Active subscription counting via `get_active_subscription_count` for authenticated users.
- **Tools Catalog Visibility (v1.7.0)**:
  - Strict visible tool filtering via exported constant `VISIBLE_TOOL_SLUGS = ['rccp', 'listflow'] as const` in `src/data/tools.ts`.
  - Non-visible tools (`orderbot`, `invoicegen`) keep active route/detail files and direct URLs, but are unlinked from navigation, excluded from sitemaps/prerenders, and emit `<meta name="robots" content="noindex, nofollow" />`.
- **Billing Page (`/billing`, v1.9.0)**:
  - Self-service Customer Billing Portal card with "Manage subscription" button launching `create-portal-session`.
- **Admin Dashboard & Controls (v1.6.0)**:
  - Migration 033 applied in production.
  - `/admin/free-trials` and `/admin/price-overrides` operational for administrators.
- **Card-Required Free Trial Architecture & Webhook Deployment (v1.8.1)**:
  - Migration 034 applied to production Supabase (`tdevgrwmafwrsmeymjzd`).
  - Webhook function `stripe-webhook` deployed (v6, `--no-verify-jwt`).
  - Anti-abuse identity tables: `public.trial_identities` (card fingerprint & HMAC phone hash) and `public.trial_denials`.
  - Stored Procedure `process_stripe_webhook_event` (13 arguments exact match, single overload).
- **Trial Checkout & Billing Portal Edge Functions (v1.9.0, v1.9.1, v1.11.0, v1.12.0 - Code written, not deployed)**:
  - `create-checkout-session` (`supabase/functions/create-checkout-session/index.ts`):
    - Gated server-side by `CHECKOUT_ENABLED !== 'true'` (only `profiles.is_admin` permitted in production).
    - Single-seat quantity enforcement: forced to 1 for non-orderbot tools.
    - Selects Stripe price by lookup key `"rccp"`.
    - Dynamic inline `price_data` for active per-user admin overrides (`user_price_overrides`).
    - Configured with `subscription_data.default_tax_rates`, terms consent requirement, required full billing address, and phone collection.
  - `create-portal-session` (`supabase/functions/create-portal-session/index.ts`):
    - Creates Stripe billing portal session with `return_url = `${origin}/dashboard``.
- **Trial Hardening, Webhook API Version Independence & Refund Handling (v1.9.1, v1.9.2, v1.9.4, v1.14.0 - Code written, not deployed)**:
  - `stripe-webhook`:
    - Duplicate-subscription guard on trial checkouts (`checkout.session.completed` with `metadata.trial = 'true'`).
    - Decoupled from Stripe endpoint API version changes (`supabase/functions/_shared/stripeCompat.ts`), re-fetching full subscription by ID under pinned SDK API version. Safe period extractor `getPeriod` and invoice resolver `getInvoiceSubscriptionId`.
    - Refund handling fix (v1.9.4): `charge.refunded` re-retrieves charge via `stripe.charges.retrieve(chargeId)` to support modern `2026-02-25.clover` payload where `invoice` is omitted from the Charge payload. Resolves invoice ID via `getChargeInvoiceId` and revokes access by invoking `process_stripe_webhook_event` with `p_quantity = 0`.
    - Phone decoupling (v1.14.0): Removed fatal requirement on `TRIAL_IDENTITY_PEPPER`; safely passes fallback identifier to maintain compatibility with 034 RPC until 035 is applied.
    - Post-checkout denial cancellation verified: Immediately calls `stripe.subscriptions.cancel(p_stripe_subscription_id)` on trial denial.
    - Pure compatibility test suite (`scripts/test-stripe-compat.mjs`) verifying 12 assertions across legacy and clover shapes.
- **Launch Readiness & Trial Banner Test Suites (`scripts/test-launch-readiness.mjs`, `scripts/test-trial-banner.mjs`)**:
  - Pure offline assertions covering: checkout params helper (tax rate, fail-closed, terms consent, billing address required, phone collection, name collection helper, customer_update constraints, no automatic_tax), `getBillingView` state machine (all 7 scenarios plus evening/morning/DST buffer adjustments), pricing formatting, phone denial removal, zero leftover `$9` string audit in `src/`, and complete trial banner state/urgency/sold-out evaluation.

## Current Production Deployment Status
- **Vercel Frontend**: Automatic deployment on push to `main`.
- **Checkout globally**: Hidden in production (`VITE_CHECKOUT_ENABLED !== 'true'`, Supabase secret `CHECKOUT_ENABLED` unset; only `profiles.is_admin` may call checkout).
- **Free trial**: Switched OFF (`trial_offers.enabled = false`).
- **Edge Functions**:
  - `stripe-webhook`: Deployed (v6, `--no-verify-jwt`). v1.9.1 duplicate guard, v1.9.2 Stripe API version independence, v1.9.4 refund fix, and v1.14.0 phone decoupling changes **NOT deployed**.
  - `create-checkout-session`: Code updated for v1.9.0, v1.9.1, v1.11.0, v1.12.0, v1.15.0, and v1.15.1 (skip-trial non-trial checkout signal), **NOT deployed**.
  - `create-portal-session`: Code created for v1.9.0, **NOT deployed**.
- **Database**:
  - Migration 034 applied and verified.
  - Migration 035 (`035_trial_identity_card_email_only.sql`) authored and pending manual execution by owner.

## In Progress
- Local verification and testing of release v1.15.1 complete.
- Owner applying migration `035_trial_identity_card_email_only.sql` in Supabase SQL editor.
- Review of Stripe SDK upgrade options for first-class `name_collection` (`2025-09-30.clover`+).
- Owner setting `STRIPE_GST_TAX_RATE_ID` secret in Supabase Edge Functions.
- Owner deploying `create-checkout-session` (`npx supabase functions deploy create-checkout-session --project-ref tdevgrwmafwrsmeymjzd`).
- Owner updating `public.tools.price_monthly = 4.99` in Supabase SQL editor for `slug = 'rccp'`.

## Not Started
- Deploying `create-portal-session` and updated `stripe-webhook` to Supabase.
- Office PC Stripe live verification run under admin switch (including invoice "Bill to" verification).
- Enabling public checkout (`CHECKOUT_ENABLED = true`, `VITE_CHECKOUT_ENABLED = true`).
- Multi-item single-checkout.
- Future Invoice Generator database migration under `ig_` table prefix.

## Known Issues
- None. Prerender local build verified working using system Chrome (`PUPPETEER_EXECUTABLE_PATH`).

## Tech Stack
- React 18, Vite, Tailwind CSS, TypeScript, Framer Motion
- Supabase (PostgreSQL, Edge Functions via Deno, Auth)
- Stripe (Checkout, Customer Billing Portal, Webhooks)

*Last Updated: 2026-11-04 — Release v1.15.1: Fix Subscribe path opening trial checkout; fix invisible "Use another card" button.*
