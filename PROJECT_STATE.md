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
  - **No tables created now**: Zero database schema or data modifications in v1.12.0.

## What's Built
- **Marketing Site**: Static landing pages, services pages, tools overview. The services page excludes the Virtual Assistance section, which has its own dedicated `/virtual-assistant` route.
- **Central Pricing Configuration (`src/config/pricing.tsx` & `.ts`, v1.11.0)**:
  - Pinned single source of truth: `standardPrice = 9.99`, `launchPrice = 4.99`, `currency = 'AUD'`, `gstInclusive = true`, `launchEndsOn = null` (no fake deadline or countdown timer).
  - Pure formatter `formatPrice` and reusable `<LaunchPriceDisplay />` rendering crossed-out standard price (`<s><span className="sr-only">was A$9.99</span>A$9.99</s>`), launch price `A$4.99/month`, `"Launch price"` badge, and `"incl. GST"`.
  - Reusable `<TrialTermsLine />` rendering exact trial terms next to every trial CTA button across `/tools`, `/tools/rccp`, and `/dashboard`:
    `"Free for 30 days, then A$4.99/month (launch price, normally A$9.99), incl. GST, charged automatically until you cancel. By starting your trial you agree to the Terms of Service and Privacy Policy."`
    Dynamic trial days (resolved from `trial_offers`, defaulting to 30) and config prices; links open in a new tab (`target="_blank" rel="noopener noreferrer"`).
- **Product Naming & Product Separation (v1.11.0)**:
  - Paid product strictly designated as "CP Bot" (Copy Paste Bot).
  - Return Converter clearly documented and messaged as 100% free; removed any copy stating Return Converter is included in the paid subscription.
- **Customer Dashboard Billing States (`src/lib/billingView.ts`, v1.11.0)**:
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
- **Trial Hardening, Webhook API Version Independence & Refund Handling (v1.9.1, v1.9.2, v1.9.4 - Code written, not deployed)**:
  - `stripe-webhook`:
    - Duplicate-subscription guard on trial checkouts (`checkout.session.completed` with `metadata.trial = 'true'`).
    - Decoupled from Stripe endpoint API version changes (`supabase/functions/_shared/stripeCompat.ts`), re-fetching full subscription by ID under pinned SDK API version. Safe period extractor `getPeriod` and invoice resolver `getInvoiceSubscriptionId`.
    - Refund handling fix (v1.9.4): `charge.refunded` re-retrieves charge via `stripe.charges.retrieve(chargeId)` to support modern `2026-02-25.clover` payload where `invoice` is omitted from the Charge payload. Resolves invoice ID via `getChargeInvoiceId` and revokes access by invoking `process_stripe_webhook_event` with `p_quantity = 0`.
    - Pure compatibility test suite (`scripts/test-stripe-compat.mjs`) verifying 12 assertions across legacy and clover shapes.
- **Launch Readiness Test Suite (`scripts/test-launch-readiness.mjs`, v1.11.0, v1.12.0)**:
  - Pure offline assertions covering: checkout params helper (tax rate, fail-closed, terms consent, billing address required, phone collection, name collection helper, customer_update constraints, no automatic_tax), `getBillingView` state machine (all 7 scenarios), pricing formatting, and zero leftover `$9` string audit in `src/`.

## Current Production Deployment Status
- **Vercel Frontend**: Automatic deployment on push to `main`.
- **Checkout globally**: Hidden in production (`VITE_CHECKOUT_ENABLED !== 'true'`, Supabase secret `CHECKOUT_ENABLED` unset; only `profiles.is_admin` may call checkout).
- **Free trial**: Switched OFF (`trial_offers.enabled = false`).
- **Edge Functions**:
  - `stripe-webhook`: Deployed (v6, `--no-verify-jwt`). v1.9.1 duplicate guard, v1.9.2 Stripe API version independence, and v1.9.4 refund fix changes **NOT deployed**.
  - `create-checkout-session`: Code updated for v1.9.0, v1.9.1, v1.11.0, and v1.12.0 (GST tax rate, terms consent, billing address required, phone collection), **NOT deployed**.
  - `create-portal-session`: Code created for v1.9.0, **NOT deployed**.
- **Database**: Migration 034 applied and verified. Zero database migrations executed in v1.12.0.

## In Progress
- Local verification of release v1.12.0 before remote push.
- Review of Task B investigation findings regarding `public.tools.price_monthly = 9.00` in the database.
- Review of Stripe SDK upgrade options for first-class `name_collection` (`2025-09-30.clover`+).
- Owner setting `STRIPE_GST_TAX_RATE_ID` secret in Supabase Edge Functions.
- Owner deploying `create-checkout-session` (`npx supabase functions deploy create-checkout-session --project-ref tdevgrwmafwrsmeymjzd`).
- Owner pushing v1.12.0 commit to GitHub.

## Not Started
- Deploying `create-portal-session` and updated `stripe-webhook` to Supabase.
- Office PC Stripe live verification run under admin switch (including invoice "Bill to" verification).
- Enabling public checkout (`CHECKOUT_ENABLED = true`, `VITE_CHECKOUT_ENABLED = true`).
- Multi-item single-checkout.
- Future Invoice Generator database migration under `ig_` table prefix.

## Known Issues
- `npm run build` prerender step fails locally due to missing Puppeteer Chrome binary (not a code issue; `npx vite build` succeeds).

## Tech Stack
- React 18, Vite, Tailwind CSS, TypeScript, Framer Motion
- Supabase (PostgreSQL, Edge Functions via Deno, Auth)
- Stripe (Checkout, Customer Billing Portal, Webhooks)

*Last Updated: 2026-11-03 — Release v1.12.0: Collect billing details at Stripe Checkout.*
