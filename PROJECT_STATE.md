# Automation Alchemists Project State

## Overview
Automation Alchemists is a full-stack SaaS hub (React/Vite + Tailwind CSS + Supabase) that centralizes authentication, billing, and access gating for external SaaS tools (Return Converter, CP Bot, ListFlow, Order Bot, Invoice Generator), as well as serving as a marketing site for various digital services.

## What's Built
- **Marketing Site**: Static landing pages, services pages, tools overview. The services page excludes the Virtual Assistance section, which has its own dedicated `/virtual-assistant` route.
- **Contact Page**: Redesigned contact details card with functional links (mailto, WhatsApp SVG links, Google Maps). JSON-LD and display text are aligned.
- **Auth System**: Integrated Supabase Auth with singleton `useAuth` hook and visibility-change state restoration. Return-path navigation via `?next=` sanitized by `sanitizeNext`.
- **Email Branding Asset (`/email-logo.png`, v1.9.4)**:
  - Hosted static asset: `https://www.automationalchemists.com/email-logo.png`.
  - Static file at `public/email-logo.png` (copied to `dist/email-logo.png` on build, served directly before SPA catch-all rewrites).
  - 400x400 PNG, logo centered with 12% padding (48px padding, 304x304 inner area), flattened on pure black `#000000` (RGB mode), optimized under 100 KB (30.56 KB), corner pixels `(0, 0, 0)`.
- **Entitlement Gating**: Active subscription counting via `get_active_subscription_count` for authenticated users.
- **Tools Catalog Visibility (v1.7.0)**:
  - Strict visible tool filtering via single exported constant `VISIBLE_TOOL_SLUGS = ['rccp', 'listflow'] as const` in `src/data/tools.ts`.
  - Applied across `/tools`, desktop & mobile navbar Tools dropdowns, footer, home page featured tool marquee, cart upsells, `scripts/generate-sitemap.js`, and `scripts/prerender.js`.
  - Non-visible tools (`orderbot`, `invoicegen`) keep active route/detail files and direct URLs, but are unlinked from navigation, excluded from sitemaps/prerenders, and emit `<meta name="robots" content="noindex, nofollow" />`.
- **Tools Overview Page (`/tools`, v1.7.0 & v1.9.0 - Reference Style)**:
  - Exactly two equal-height cards: `rccp` first, `listflow` second.
  - RCCP logo rendered at >= 56px (`w-14 h-14 min-w-[56px] min-h-[56px]`) with no background tint tile.
  - Page background treatment: `min-h-screen bg-mint-50 text-teal-900 time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white flex flex-col justify-between`.
  - Cards: `bg-white rounded-2xl border border-teal-600/20 shadow-sm p-6 sm:p-8 flex flex-col justify-between`.
  - Single yellow CTA on RCCP card (`bg-[#FFD200] hover:bg-[#e6bd00] text-teal-900 font-bold px-6 py-3 rounded-lg shadow-sm`); secondary buttons are teal-outlined (`border border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white`).
- **User Dashboard (`/dashboard`, v1.9.3 Light Theme & Deduplication)**:
  - Restyled page wrapper to match `/tools`: `min-h-screen bg-mint-50 text-teal-900 time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white flex flex-col justify-between`.
  - Restyled every card and UI surface to high-contrast white card treatment: `bg-white rounded-2xl border border-teal-600/20 shadow-sm`.
  - Status badges aligned to light theme:
    - Active: `bg-emerald-50 text-emerald-800 border-emerald-300`.
    - Coming soon: `bg-teal-50 text-teal-800 border-teal-600/30`.
    - Trialing / Setup: `bg-amber-50 text-amber-900 border-amber-300`.
    - Locked: `bg-slate-100 text-slate-700 border-slate-300`.
  - Single section placement rule via `categorizeDashboardTools` in `src/lib/dashboardSections.ts`:
    - A tool appears in exactly ONE section: "Your tools", "Available", or "Coming soon".
    - Active access (paid, trial, or manual grant) places a tool exclusively in "Your tools"; it is omitted from "Coming soon" and "Available".
    - Solved ListFlow duplicate card bug where an owned ListFlow subscription caused cards to appear in both "Your tools" and "Coming soon".
    - `rccp` and `cpbot` resolved to unified access slug `cpbot`.
    - Order Bot exception preserved: visible in "Your tools" only with active stores; visible in "Available" if active subscription with 0 stores; hidden if not owned.
    - Invoice Generator hidden from all sections.
  - Manual grant enhancements:
    - `manually_granted, stripe_subscription_id, stripe_customer_id` selected on existing `subscriptions` query.
    - "Manage subscription" button rendered strictly when `canManageSubscription` is true (`manually_granted !== true` and Stripe customer or subscription ID is present). Manual grants never render a manage button.
    - Subtitle renewal text handled via `getSubscriptionDateText`: displays "Access until {date}" (or "Access: no end date") for manual grants instead of "renews {date}". Paid subscriptions keep "Renews {date}".
  - Store management cards, "Add eBay Store" dialog, `SkeletonCard`, and `DashboardTrialCard` (all 8 states) updated to light mode surfaces with WCAG AA compliant text contrast.
- **Pure Sectioning Logic & Offline Test Suite (`v1.9.3`)**:
  - `src/lib/dashboardSections.ts`: pure helpers `isSubscriptionActive`, `hasActiveToolAccess`, `categorizeDashboardTools`, `canManageSubscription`, `getSubscriptionDateText`.
  - `scripts/test-dashboard-sections.mjs`: offline unit test runner bundling with esbuild; 6 test cases asserting owner manual grant + ListFlow deduplication, paid Stripe user controls, new user catalog states, trial text, expired rows, and Order Bot / Invoice Gen rules.
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
- **Trial Checkout & Billing Portal Edge Functions (v1.9.0 - Code written, not deployed)**:
  - `create-checkout-session` (`supabase/functions/create-checkout-session/index.ts`):
    - Gated server-side by `CHECKOUT_ENABLED !== 'true'` (only `profiles.is_admin` permitted in production).
    - Single-seat quantity enforcement (v1.9.1): forced to 1 for non-orderbot tools.
  - `create-portal-session` (`supabase/functions/create-portal-session/index.ts`):
    - Creates Stripe billing portal session with `return_url = `${origin}/dashboard``.
- **Trial Hardening, Webhook API Version Independence & Refund Handling (v1.9.1, v1.9.2, v1.9.4 - Code written, not deployed)**:
  - `stripe-webhook`:
    - Duplicate-subscription guard on trial checkouts (`checkout.session.completed` with `metadata.trial = 'true'`).
    - Decoupled from Stripe endpoint API version changes (`supabase/functions/_shared/stripeCompat.ts`), re-fetching full subscription by ID under pinned SDK API version. Safe period extractor `getPeriod` and invoice resolver `getInvoiceSubscriptionId`.
    - Refund handling fix (v1.9.4): `charge.refunded` re-retrieves charge via `stripe.charges.retrieve(chargeId)` to support modern `2026-02-25.clover` payload where `invoice` is omitted from the Charge payload. Resolves invoice ID via `getChargeInvoiceId` and revokes access by invoking `process_stripe_webhook_event` with `p_quantity = 0`.
    - Pure compatibility test suite (`scripts/test-stripe-compat.mjs`) verifying 12 assertions across legacy and clover shapes.

## Current Production Deployment Status
- **Vercel Frontend**: Automatic deployment on push to `main` (now serves `public/email-logo.png` directly).
- **Checkout globally**: Hidden in production (`VITE_CHECKOUT_ENABLED !== 'true'`, Supabase secret `CHECKOUT_ENABLED` unset; only `profiles.is_admin` may call checkout).
- **Free trial**: Switched OFF (`trial_offers.enabled = false`).
- **Edge Functions**:
  - `stripe-webhook`: Deployed (v6, `--no-verify-jwt`). v1.9.1 duplicate guard, v1.9.2 Stripe API version independence, and v1.9.4 refund fix changes **NOT deployed**.
  - `create-checkout-session`: Code updated for v1.9.0 & v1.9.1, **NOT deployed**.
  - `create-portal-session`: Code created for v1.9.0, **NOT deployed**.
- **Database**: Migration 034 applied and verified. No database migrations executed in v1.9.0 through v1.9.4.

## In Progress
- Owner adding `TRIAL_IDENTITY_PEPPER` secret to Supabase Edge Functions.
- Owner setting up Stripe Customer Billing Portal features and verifying webhook signing secret.
- Chrome extension v1.0.5.3 Chrome Web Store review.

## Not Started
- Deploying `create-checkout-session`, `create-portal-session`, and updated `stripe-webhook` to Supabase.
- Office PC Stripe test-mode verification run (trial checkout, duplicate card rejection, portal cancellation, subscription "End trial" conversion, parallel checkout duplicate cancellation, charge refund access revocation under clover payload).
- Multi-item single-checkout.

## Known Issues
- `npm run build` prerender step fails locally due to missing Puppeteer Chrome binary (not a code issue; `npx vite build` succeeds).

## Tech Stack
- React 18, Vite, Tailwind CSS, TypeScript, Framer Motion
- Supabase (PostgreSQL, Edge Functions via Deno, Auth)
- Stripe (Checkout, Customer Billing Portal, Webhooks)

*Last Updated: 2026-10-27 — Release v1.9.4: Email Logo Asset and Webhook Refund Fix.*
