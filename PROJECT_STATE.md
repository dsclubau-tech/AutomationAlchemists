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
  - **No tables created now**: Zero database schema or data modifications in v1.10.0.

## What's Built
- **Marketing Site**: Static landing pages, services pages, tools overview. The services page excludes the Virtual Assistance section, which has its own dedicated `/virtual-assistant` route.
- **Contact Page**: Redesigned contact details card with functional links (mailto, WhatsApp SVG links, Google Maps). JSON-LD and display text are aligned.
- **Auth System**: Integrated Supabase Auth with singleton `useAuth` hook and visibility-change state restoration. Return-path navigation via `?next=` sanitized by `sanitizeNext`.
- **Email Branding Asset (`/email-logo.png`, v1.9.4)**:
  - Hosted static asset: `https://www.automationalchemists.com/email-logo.png`.
  - Static file at `public/email-logo.png` (copied to `dist/email-logo.png` on build, served directly before SPA catch-all rewrites).
  - 400x400 PNG, logo centered with 12% padding (48px padding, 304x304 inner area), flattened on pure black `#000000` (RGB mode), optimized under 100 KB (30.56 KB), corner pixels `(0, 0, 0)`.
- **Invoice Generator Product Page & Branding Asset (`/tools/invoice-generator`, v1.10.0)**:
  - Dedicated landing page at `/tools/invoice-generator` (`src/pages/tools/InvoiceGeneratorToolPage.tsx` and `src/data/invoiceGeneratorPage.ts`) mirroring `/tools/rccp` structure, design tokens, and spacing.
  - Tokens: `teal-900` `#0A363D`, `teal-800` `#104B54`, `teal-600` `#207680`, `mint-50` `#EBF4F4`, `yellow` `#FFD200` (`bg-yellow-accent`) for the primary CTA only.
  - Dedicated branding asset at `public/invoice-generator-logo.png`: 425x512 px, 34.35 KB, clean alpha transparency with zero haloing.
  - Config URLs pinned in `src/data/invoiceGeneratorPage.ts`:
    - `APP_SIGNUP_URL = 'https://invoice-generator-mu-pearl.vercel.app/signup'`
    - `APP_PRIVACY_URL = 'https://invoice-generator-mu-pearl.vercel.app/privacy'`
  - Exact copy used: headline "Simple invoices for marketplace sellers.", audience line built with eBay, Amazon and Walmart sellers in mind, availability for Australia (US, Canada, UK coming soon), 4 feature cards, 3 workflow steps, "What's included for free" allowance, and 6-item interactive FAQ.
  - Pending screenshots section conditionally rendered only when the config array is populated.
- **Tools Overview Page (`/tools`, v1.10.0 - 3-Card Grid)**:
  - Expanded grid to 3 equal-height cards on desktop/tablet: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch`.
  - Card 1: Return Converter x CopyPaste Bot (`rccp`).
  - Card 2: ListFlow (`listflow`, Coming soon).
  - Card 3: Invoice Generator (category tag "INVOICING", "Free" tag, "Free to get started", description, and "Learn more" button linking to `/tools/invoice-generator`).
  - SchemaMarkup and SEOHead descriptions updated to include Invoice Generator.
- **Navigation Integration (v1.10.0)**:
  - Desktop navbar "Our Tools" dropdown: added Invoice Generator with product logo icon.
  - Mobile drawer "Our Tools" list: added Invoice Generator link.
  - Prerender (`scripts/prerender.js`) and Sitemap (`scripts/generate-sitemap.js`) route lists updated.
- **Dashboard Button Contrast Fixes (`/dashboard`, v1.10.0)**:
  - Fixed dark-on-dark invisible text bug on outline buttons caused by shadcn `Button` injecting `bg-background` (`#0A363D`) underneath dark teal text (`text-teal-900`).
  - Explicitly applied `bg-transparent` across all dashboard outline buttons ("Open Return Converter", "Manage subscription", "Buy now", "+ Add another store", "Add your first store"), restoring immediate label contrast (11.4:1 contrast on white cards).
  - Restyled ListFlow button under "Coming soon" to a disabled, muted button matching `/tools` (`bg-teal-600/10 text-teal-900/60 font-semibold cursor-not-allowed border border-teal-600/20`), clearly labelled "Coming soon".
  - Preserved yellow primary CTA style and kept all dashboard gating/fetching logic untouched.
  - Verified pure offline assertions pass via `scripts/test-dashboard-sections.mjs` (6/6 tests passing).
- **Dashboard Isolation Guarantee (v1.10.0)**:
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
- **Vercel Frontend**: Automatic deployment on push to `main`.
- **Checkout globally**: Hidden in production (`VITE_CHECKOUT_ENABLED !== 'true'`, Supabase secret `CHECKOUT_ENABLED` unset; only `profiles.is_admin` may call checkout).
- **Free trial**: Switched OFF (`trial_offers.enabled = false`).
- **Edge Functions**:
  - `stripe-webhook`: Deployed (v6, `--no-verify-jwt`). v1.9.1 duplicate guard, v1.9.2 Stripe API version independence, and v1.9.4 refund fix changes **NOT deployed**.
  - `create-checkout-session`: Code updated for v1.9.0 & v1.9.1, **NOT deployed**.
  - `create-portal-session`: Code created for v1.9.0, **NOT deployed**.
- **Database**: Migration 034 applied and verified. Zero database migrations executed in v1.10.0.

## In Progress
- Local verification of release v1.10.0 before remote push.
- Owner adding `TRIAL_IDENTITY_PEPPER` secret to Supabase Edge Functions.
- Owner setting up Stripe Customer Billing Portal features and verifying webhook signing secret.
- Chrome extension v1.0.5.3 Chrome Web Store review.

## Not Started
- Deploying `create-checkout-session`, `create-portal-session`, and updated `stripe-webhook` to Supabase.
- Office PC Stripe test-mode verification run (trial checkout, duplicate card rejection, portal cancellation, subscription "End trial" conversion, parallel checkout duplicate cancellation, charge refund access revocation under clover payload).
- Multi-item single-checkout.
- Future Invoice Generator database migration under `ig_` table prefix.

## Known Issues
- `npm run build` prerender step fails locally due to missing Puppeteer Chrome binary (not a code issue; `npx vite build` succeeds).

## Tech Stack
- React 18, Vite, Tailwind CSS, TypeScript, Framer Motion
- Supabase (PostgreSQL, Edge Functions via Deno, Auth)
- Stripe (Checkout, Customer Billing Portal, Webhooks)

*Last Updated: 2026-10-31 — Release v1.10.0: Invoice Generator landing page, tools card, and dashboard button fix.*
