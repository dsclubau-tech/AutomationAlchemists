# Automation Alchemists Project State

## Overview
Automation Alchemists is a full-stack SaaS hub (React/Vite + Tailwind CSS + Supabase) that centralizes authentication, billing, and access gating for external SaaS tools (Return Converter, CP Bot, ListFlow, Order Bot, Invoice Generator), as well as serving as a marketing site for various digital services.

## What's Built
- **Marketing Site**: Static landing pages, services pages, tools overview. The services page excludes the Virtual Assistance section, which has its own dedicated `/virtual-assistant` route.
- **Contact Page**: Redesigned contact details card with functional links (mailto, WhatsApp SVG links, Google Maps). JSON-LD and display text are aligned.
- **Auth System**: Integrated Supabase Auth with singleton `useAuth` hook and visibility-change state restoration. Return-path navigation via `?next=` sanitized by `sanitizeNext`.
- **Stripe Billing Integration**: Webhooks for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` wired to `public.subscriptions` and `public.stripe_webhook_events` (idempotency) table via atomic RPCs. Edge Function `create-checkout-session` accepts `{ product_slug, quantity }` and creates a Stripe Checkout session.
- **Entitlement Gating**: Active subscription counting via `get_active_subscription_count` for authenticated users.
- **Tools Catalog Visibility (v1.7.0)**:
  - Strict visible tool filtering via single exported constant `VISIBLE_TOOL_SLUGS = ['rccp', 'listflow'] as const` in `src/data/tools.ts`.
  - Applied across `/tools`, desktop & mobile navbar Tools dropdowns, footer, home page featured tool marquee, cart upsells, `scripts/generate-sitemap.js`, and `scripts/prerender.js`.
  - Non-visible tools (`orderbot`, `invoicegen`) keep active route/detail files and direct URLs, but are unlinked from navigation, excluded from sitemaps/prerenders, and emit `<meta name="robots" content="noindex, nofollow" />`.
- **Tools Overview Page (`/tools`, v1.7.0)**:
  - Exactly two equal-height cards: `rccp` first, `listflow` second.
  - RCCP logo rendered at >= 56px (`w-14 h-14 min-w-[56px] min-h-[56px]`) with no background tint tile.
  - Reused landing page background treatment (`min-h-screen bg-mint-50 text-teal-900 time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white flex flex-col justify-between`).
  - Decorative card corner shapes removed.
  - Single yellow CTA on RCCP card:
    - When trial offer enabled (`useTrialPublic('rccp')`): "Start free trial now" linking to `/dashboard#claim-trial`, followed by dynamic pricing text: `"{trial_days} days free, then A${price}/month. Card required. Cancel anytime."`.
    - When trial offer disabled/error: "Learn more" linking to `/tools/rccp` with no trial wording.
  - ListFlow card: Single disabled "Coming soon" button; secondary "Learn more" link removed.
- **User Dashboard (`/dashboard`, v1.7.0)**:
  - Reused landing page background treatment (`min-h-screen bg-teal-900 text-white time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white flex flex-col`).
  - Card grid fills container dynamically (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch`, `min-w-0`).
  - Card footer buttons allow wrapping (`flex flex-wrap items-center gap-2`), preventing button clipping across viewports.
  - Outlined button label visibility bug resolved with `text-mint-50` at rest (11.4:1 contrast ratio) and `hover:bg-yellow-accent hover:text-teal-900` (8.1:1 contrast ratio).
  - Sections: "Your tools", "Available", "Coming soon". Order Bot rendered conditionally based on active subscriptions or stores; Invoice Generator hidden always.
- **Navbar & Navigation Dropdowns (v1.7.0)**:
  - Tools dropdown (desktop): Exactly two items (`rccp` and `ListFlow`), single line, no description text, no icon background tile.
  - Tools drawer (mobile): Exactly two items (`rccp` and `ListFlow`), single line, no description text, no icon below `md`.
  - Profile dropdown (desktop & mobile): Clearly visible hover/focus/active states with light highlight (`data-[highlighted]:bg-mint-50 data-[highlighted]:text-teal-900`), >= 4.5:1 contrast, plus visible focus rings (`focus-visible:ring-2 focus-visible:ring-teal-600`).
  - Sign out item: Retains red accent with visible red hover highlight (`data-[highlighted]:bg-red-500/20 data-[highlighted]:text-red-300`).
- **Admin Dashboard & Controls (v1.6.0)**:
  - Migration 033 applied in production.
  - `/admin/free-trials` and `/admin/price-overrides` operational for administrators.
- **Card-Required Free Trial Architecture & Webhook Deployment (v1.8.1)**:
  - **Status: Migration 034 APPLIED to production Supabase (`tdevgrwmafwrsmeymjzd`). Webhook function `stripe-webhook` DEPLOYED (version 6). Free trials remain DISABLED (`trial_offers.enabled = false`).**
  - Database tables: `public.trial_identities` (card fingerprint and HMAC phone hash tracking) and `public.trial_denials` with RLS on, 0 policies, zero privileges for anon, authenticated, public.
  - Legacy no-card path closed: `public.claim_free_trial(text)` unconditionally returns `{ ok: false, reason: 'checkout_required' }`.
  - Anti-abuse gating: enforces 1 trial per normalized email, 1 per card fingerprint, 1 per phone number HMAC hash.
  - Service_role RPCs: `trial_eligibility_for`, `finalize_card_trial`, `mirror_cancel_at_period_end`.
  - Stored Procedure `process_stripe_webhook_event` (13 arguments exact match, single overload):
    - Provisions trialing checkouts with `current_period_end = p_current_period_end + interval '6 hours'` (+6h grace preventing pg_cron expiry race during Stripe's 1h invoice window).
    - Links `trial_claims.subscription_id` to newly upserted subscription row.
    - Status mapping: ignores `incomplete` and `incomplete_expired` (`'ignored incomplete'`); maps `paused` to `past_due` (revokes access immediately).
    - Single-seat conversion guard: ONLY converts trial in place (`is_trial = false`, `grant_reason = 'stripe_checkout'`, `converted_at` stamped) when raw Stripe status `p_subscription_status = 'active'`.
    - Trialing update safety: when `p_subscription_status = 'trialing'`, `is_trial`, `grant_reason`, `converted_at`, and `current_period_end` (+6h grace end) are strictly preserved.
    - Canceled row protection: rows with `status = 'canceled'` are NEVER reactivated.
  - Edge Function `stripe-webhook/index.ts` (Deployed v6):
    - Card fingerprint resolution with 3-stage fallback chain: `subscription.default_payment_method` -> customer `invoice_settings.default_payment_method` -> `stripe.paymentMethods.list({ customer, type: 'card', limit: 1 })`. Returns 500 only if all fail.
    - HMAC-SHA256 of customer phone using `TRIAL_IDENTITY_PEPPER`.
    - Zero sensitive logging: never logs card fingerprints, phone numbers, or the pepper.
    - Calls `finalize_card_trial`; cancels subscription immediately on denial; on approval calls `process_stripe_webhook_event`.
    - Mirrors `cancel_at_period_end` on subscription updates.
  - Verification & Backups:
    - `docs/sql/034_pre_apply_backup.sql`: Full definitions of replaced functions extracted prior to applying 034.
    - `docs/sql/034_verify.sql`: Verified 100% in production (tables, RLS, 0 policies, 0 public grants, single overloads).
    - `docs/sql/034_behaviour_verify.sql`: Verified 100% in production (all 16 lifecycle cases passed, baseline row leak check passed, 100% rolled back cleanly).
    - BEFORE & AFTER row counts match identically across all tables.

## In Progress
- Owner adding `TRIAL_IDENTITY_PEPPER` secret to Supabase Edge Functions.
- Chrome extension v1.0.5.3 review and release verification prior to enabling public free trials.

## Not Started
- Multi-item single-checkout (Edge Function supports one item per session).
- Stripe Customer Portal integration for subscription self-management.

## Turning on Checkout / Free Trials
- **Checkout globally**: To enable checkout globally (bypassing the admin-only guard), set the `CHECKOUT_ENABLED` secret to `"true"` in Supabase.
- **Free trial**: The free trial remains switched OFF (`trial_offers.enabled = false`). It can be toggled on via `/admin/free-trials` once the Chrome extension v1.0.5.3 is confirmed live.

## Known Issues
- `npm run build` prerender step fails locally due to missing Puppeteer Chrome binary (not a code issue; `npx vite build` succeeds).

## Tech Stack
- React 18, Vite, Tailwind CSS, TypeScript, Framer Motion
- Supabase (PostgreSQL, Edge Functions via Deno, Auth)
- Stripe

*Last Updated: 2026-10-26 — Release v1.8.1: Trial conversion safety fix, Migration 034 applied to production Supabase, stripe-webhook edge function deployed (v6), verification verified 16/16 cases pass, trial remains OFF.*
