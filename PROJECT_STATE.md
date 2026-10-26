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
- **Admin Dashboard & Controls (Part D - v1.6.0)**:
  - Migration 033 applied in production.
  - `/admin/free-trials` and `/admin/price-overrides` operational for administrators.
- **Card-Required Free Trial Architecture (Release v1.8.0 - Migration 034 & Edge Function)**:
  - **Status: NOT applied to database and NOT deployed to Edge Functions yet.** Free trials remain disabled (`trial_offers.enabled = false`).
  - New database tables: `public.trial_identities` (card fingerprint and HMAC phone hash tracking) and `public.trial_denials` (RLS on, 0 policies, zero grants to public/anon/authenticated).
  - Legacy no-card path closed: `public.claim_free_trial(text)` unconditionally returns `{ ok: false, reason: 'checkout_required' }`.
  - Anti-abuse gating: enforces 1 trial per normalized email, 1 per card fingerprint, 1 per phone number HMAC hash.
  - New service_role RPCs: `trial_eligibility_for`, `finalize_card_trial`, `mirror_cancel_at_period_end`.
  - Replaced `process_stripe_webhook_event` (exact 13-argument signature, single overload preserved):
    - Provisions trialing checkouts with `current_period_end = p_current_period_end + interval '6 hours'` (+6h grace preventing pg_cron expiry race during Stripe's 1h invoice window).
    - Links `trial_claims.subscription_id` to the newly upserted subscription row.
    - Converted in place on `customer.subscription.updated` active (`is_trial = false`, `grant_reason = 'stripe_checkout'`, `trial_claims.converted_at = now()`).
    - Revokes access immediately on Stripe `past_due` or `unpaid`.
    - Safe reactivation of `expired` (cron) or `past_due` rows upon receiving Stripe `active`.
    - Strict guard ensuring `canceled` rows are NEVER reactivated.
  - Edge Function `stripe-webhook/index.ts`:
    - Expands `default_payment_method` on `metadata.trial === 'true'` checkouts.
    - Computes HMAC-SHA256 of E.164 phone using `TRIAL_IDENTITY_PEPPER`.
    - Calls `finalize_card_trial`; cancels subscription immediately on denial; on success calls `process_stripe_webhook_event` with status `trialing`.
    - Mirrors `cancel_at_period_end` on subscription updates.
    - Handles `customer.subscription.trial_will_end` as 200 no-op.
  - Test Harness:
    - `docs/sql/034_verify.sql`: Structure, RLS, single overload, and privilege inspection.
    - `docs/sql/034_rollback.sql`: Clean transaction rolling back 034 changes and restoring 031/032/033.
    - `docs/sql/034_behaviour_verify.sql`: 13 isolated test cases executed in a single transaction DO block rolled back via `RAISE EXCEPTION`.

## In Progress
- Manual application and verification of Migration 034 in the Supabase SQL Editor.
- Deployment and testing of `stripe-webhook` edge function with `TRIAL_IDENTITY_PEPPER` secret.
- CP Bot Chrome extension v1.0.5.3 review and release verification prior to enabling public free trials.

## Not Started
- Multi-item single-checkout (Edge Function supports one item per session).
- Stripe Customer Portal integration for subscription self-management.

## Turning on Checkout
- To enable checkout globally (bypassing the admin-only guard), set the `CHECKOUT_ENABLED` secret to `"true"` in Supabase. No other code changes are needed.

## Known Issues
- `npm run build` prerender step fails locally due to missing Puppeteer Chrome binary (not a code issue; `npx vite build` succeeds).

## Tech Stack
- React 18, Vite, Tailwind CSS, TypeScript, Framer Motion
- Supabase (PostgreSQL, Edge Functions via Deno, Auth)
- Stripe

*Last Updated: 2026-10-26 — Release v1.8.0: Card-required free trial database architecture (migration 034) and webhook update (prepared, pending manual application and edge function deployment).*
