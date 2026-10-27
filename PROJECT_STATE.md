# Automation Alchemists Project State

## Overview
Automation Alchemists is a full-stack SaaS hub (React/Vite + Tailwind CSS + Supabase) that centralizes authentication, billing, and access gating for external SaaS tools (Return Converter, CP Bot, ListFlow, Order Bot, Invoice Generator), as well as serving as a marketing site for various digital services.

## What's Built
- **Marketing Site**: Static landing pages, services pages, tools overview. The services page excludes the Virtual Assistance section, which has its own dedicated `/virtual-assistant` route.
- **Contact Page**: Redesigned contact details card with functional links (mailto, WhatsApp SVG links, Google Maps). JSON-LD and display text are aligned.
- **Auth System**: Integrated Supabase Auth with singleton `useAuth` hook and visibility-change state restoration. Return-path navigation via `?next=` sanitized by `sanitizeNext`.
- **Entitlement Gating**: Active subscription counting via `get_active_subscription_count` for authenticated users.
- **Tools Catalog Visibility (v1.7.0)**:
  - Strict visible tool filtering via single exported constant `VISIBLE_TOOL_SLUGS = ['rccp', 'listflow'] as const` in `src/data/tools.ts`.
  - Applied across `/tools`, desktop & mobile navbar Tools dropdowns, footer, home page featured tool marquee, cart upsells, `scripts/generate-sitemap.js`, and `scripts/prerender.js`.
  - Non-visible tools (`orderbot`, `invoicegen`) keep active route/detail files and direct URLs, but are unlinked from navigation, excluded from sitemaps/prerenders, and emit `<meta name="robots" content="noindex, nofollow" />`.
- **Tools Overview Page (`/tools`, v1.7.0 & v1.9.0)**:
  - Exactly two equal-height cards: `rccp` first, `listflow` second.
  - RCCP logo rendered at >= 56px (`w-14 h-14 min-w-[56px] min-h-[56px]`) with no background tint tile.
  - Reused landing page background treatment (`min-h-screen bg-mint-50 text-teal-900 time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white flex flex-col justify-between`).
  - Single yellow CTA on RCCP card:
    - When trial offer enabled (`useTrialPublic('rccp')`): "Start free trial now" calling `startTrialCheckout({ returnPath: '/tools', user, toast })`, followed by dynamic pricing text: `"{trial_days} days free, then A${price}/month. Card required. Cancel anytime."`.
    - When trial offer disabled/error: "Learn more" linking to `/tools/rccp` with no trial wording.
  - ListFlow card: Single disabled "Coming soon" button; secondary "Learn more" link removed.
- **User Dashboard (`/dashboard`, v1.7.0 & v1.9.0)**:
  - Reused landing page background treatment (`min-h-screen bg-teal-900 text-white time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white flex flex-col`).
  - Card grid fills container dynamically (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch`, `min-w-0`).
  - Card footer buttons allow wrapping (`flex flex-wrap items-center gap-2`), preventing button clipping across viewports.
  - Outlined button label visibility bug resolved with `text-mint-50` at rest (11.4:1 contrast ratio) and `hover:bg-yellow-accent hover:text-teal-900` (8.1:1 contrast ratio).
  - Sections: "Your tools", "Available", "Coming soon". Order Bot rendered conditionally based on active subscriptions or stores; Invoice Generator hidden always.
  - RCCP card 4 states:
    1. Not eligible or no trial: "Subscribe" button.
    2. Trial active: trial end date displayed with "Manage subscription" button (opens Stripe billing portal).
    3. Paid active: renews date displayed with "Manage subscription" button.
    4. Locked and eligible: "Start free trial now" button with pricing text.
  - Checkout confirmation polling: when redirected to `/dashboard?checkout=success`, polls `get_trial_status` every 2s up to 40s, providing real-time setup progress, trial activation banner, or denial guidance.
- **Billing Page (`/billing`, v1.9.0)**:
  - Upgraded from static "Coming Soon" placeholder to an active Customer Billing Portal card.
  - "Manage subscription" button calls `create-portal-session` to launch the self-service Stripe Customer Portal.
  - Displays user-friendly error toast if no Stripe customer record exists yet.
- **Admin Dashboard & Controls (v1.6.0)**:
  - Migration 033 applied in production.
  - `/admin/free-trials` and `/admin/price-overrides` operational for administrators.
- **Card-Required Free Trial Architecture & Webhook Deployment (v1.8.1)**:
  - Migration 034 applied to production Supabase (`tdevgrwmafwrsmeymjzd`).
  - Webhook function `stripe-webhook` deployed (version 6, `--no-verify-jwt`).
  - Anti-abuse identity tables: `public.trial_identities` (card fingerprint & HMAC phone hash) and `public.trial_denials`.
  - Service_role RPCs: `trial_eligibility_for`, `finalize_card_trial`, `mirror_cancel_at_period_end`.
  - Stored Procedure `process_stripe_webhook_event` (13 arguments exact match, single overload): +6h grace on trial provisioning, trial conversion guard (only raw `status = 'active'` converts trial rows), trialing updates preserve trial flags and grace end.
  - Canceled row protection: rows with `status = 'canceled'` are NEVER reactivated.
- **Trial Checkout & Billing Portal Edge Functions (v1.9.0 - Code written, not deployed)**:
  - `create-checkout-session` (`supabase/functions/create-checkout-session/index.ts`):
    - Gated server-side by `CHECKOUT_ENABLED !== 'true'` (only `profiles.is_admin` permitted in production).
    - Calls `trial_eligibility_for(user.id, 'rccp')`.
    - If eligible: creates Stripe Checkout session in mode `'subscription'` with `subscription_data.trial_period_days = trial_days`, `subscription_data.trial_settings.end_behavior.missing_payment_method = 'cancel'`, `payment_method_collection = 'always'`, `phone_number_collection.enabled = true`, `metadata.trial = 'true'` (on session and `subscription_data`), and server-computed submit message `"{N} days free, then A${price}/month starting {date}. Cancel anytime before then."`.
    - If ineligible: creates standard paid checkout session, returns `{ url, trial: false, reason }`.
    - 409 double-charge guard: blocks checkouts if user has active OR trialing subscription for the tool (Order Bot exempt).
    - Success URL set to `/dashboard?checkout=success`, cancel URL set to `/tools/rccp`.
  - `create-portal-session` (`supabase/functions/create-portal-session/index.ts`):
    - Requires valid user JWT. Not gated by `CHECKOUT_ENABLED`.
    - Queries `public.subscriptions` for caller's most recent row with non-null `stripe_customer_id`.
    - Returns HTTP 404 `{ error: 'No Stripe customer found for this account.', code: 'no_customer' }` if missing.
    - Creates Stripe billing portal session with `return_url = `${origin}/dashboard`` and returns `{ url }`.
- **Frontend Trial Architecture & Checkout Unification (v1.9.0)**:
  - `src/lib/checkout.ts`:
    - `startTrialCheckout()`: single checkout initiator used by all trial buttons (Tools page RCCP card, RCCP tool page hero, Dashboard card). Redirects signed-out visitors to `/auth?mode=signup&next=<sanitized return path>`; invokes `create-checkout-session` and redirects signed-in users to Stripe Checkout.
    - `redirectToBillingPortal()`: single portal initiator used by Dashboard and Billing page to launch Stripe Customer Portal.
  - `src/lib/trial.ts`:
    - Completely removed legacy `claim_free_trial` calls and types.
    - Updated `getClaimErrorMessage` with client-safe failure messages for `checkout_required`, `card_already_used`, `phone_already_used`, `phone_missing`, `card_missing`, `no_slots`. Never leaks third-party identity info.
  - Fail-safe rule: when trial offer is disabled (`trial_offers.enabled = false`), all pages render standard non-trial UI identically matching v1.7.0.
- **Trial Hardening & Safety Guards (v1.9.1 - Code written, not deployed)**:
  - `create-checkout-session`:
    - Server-side single-seat quantity enforcement: for `product_slug = 'rccp'` (and any product except `'orderbot'`), quantity is strictly forced to 1 server-side, ignoring client value. Order Bot preserves client quantity.
  - `stripe-webhook`:
    - Duplicate-subscription guard on trial checkouts (`checkout.session.completed` with `metadata.trial = 'true'`).
    - Resolves access slug (`cpbot`) and looks up existing subscription row for the user with `store_id IS NULL`.
    - If a row exists with a different `stripe_subscription_id` and status is not `'canceled'`, cancels the new Stripe subscription (`stripe.subscriptions.cancel`) with no charge, leaves database untouched, and returns HTTP 200 `{ received: true, duplicate_subscription: true }`. Returns HTTP 500 if cancelling fails.
    - If `stripe_subscription_id` is identical, continues as normal (retry of the same event).
    - Behaviour guarantee: two parallel trial checkouts by one user end with exactly one active Stripe subscription (the second is cancelled).
  - Runbook correction:
    - Updated `docs/FREE_TRIAL_AND_DISCOUNTS.md` Test Run 4 to use Stripe Dashboard Subscriptions → "End trial" action instead of a test clock (Checkout cannot attach to a test clock).

## Current Production Deployment Status
- **Checkout globally**: Hidden in production (`VITE_CHECKOUT_ENABLED !== 'true'`, Supabase secret `CHECKOUT_ENABLED` unset; only `profiles.is_admin` may call checkout).
- **Free trial**: Switched OFF (`trial_offers.enabled = false`).
- **Edge Functions**:
  - `stripe-webhook`: Deployed (v6, `--no-verify-jwt`). v1.9.1 duplicate guard changes **NOT deployed**.
  - `create-checkout-session`: Code updated for v1.9.0 & v1.9.1, **NOT deployed**.
  - `create-portal-session`: Code created for v1.9.0, **NOT deployed**.
- **Database**: Migration 034 applied and verified. No database migrations executed in v1.9.0 or v1.9.1.

## In Progress
- Owner adding `TRIAL_IDENTITY_PEPPER` secret to Supabase Edge Functions.
- Owner setting up Stripe Customer Billing Portal features and verifying webhook signing secret.
- Chrome extension v1.0.5.3 Chrome Web Store review.

## Not Started
- Deploying `create-checkout-session`, `create-portal-session`, and updated `stripe-webhook` to Supabase.
- Office PC Stripe test-mode verification run (trial checkout, duplicate card rejection, portal cancellation, subscription "End trial" conversion, parallel checkout duplicate cancellation).
- Multi-item single-checkout.

## Known Issues
- `npm run build` prerender step fails locally due to missing Puppeteer Chrome binary (not a code issue; `npx vite build` succeeds).

## Tech Stack
- React 18, Vite, Tailwind CSS, TypeScript, Framer Motion
- Supabase (PostgreSQL, Edge Functions via Deno, Auth)
- Stripe (Checkout, Customer Billing Portal, Webhooks)

*Last Updated: 2026-10-27 — Release v1.9.1: Trial Hardening: Single-Seat Quantity Enforcement, Duplicate Subscription Guard, and Test Run Runbook Correction (code complete, not deployed).*
