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
  - Reused landing page's background treatment (`min-h-screen bg-mint-50 text-teal-900 time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white flex flex-col justify-between`).
  - Decorative card corner shapes (`bg-teal-600/5 rounded-bl-full`) removed from cards.
  - Single yellow CTA on RCCP card:
    - When trial offer enabled (`useTrialPublic('rccp')`): "Start free trial now" linking to `/dashboard#claim-trial` (or signup with `next`), followed by dynamic pricing text: `"{trial_days} days free, then A${price}/month. Card required. Cancel anytime."`.
    - When trial offer disabled/error: "Learn more" linking to `/tools/rccp` with no trial wording.
  - ListFlow card: Single disabled "Coming soon" button; secondary "Learn more" link removed.
- **User Dashboard (`/dashboard`, v1.7.0)**:
  - Reused landing page background treatment (`min-h-screen bg-teal-900 text-white time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white flex flex-col`).
  - Card grid fills container dynamically (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch`, `min-w-0`), resolving narrow/empty page bugs.
  - Card footer buttons allow wrapping (`flex flex-wrap items-center gap-2`), preventing the second button on CP Bot from clipping at any viewport width (360px, 768px, 1280px).
  - Outlined button label visibility bug resolved by replacing clashing `text-teal-900` with `text-mint-50` at rest (11.4:1 contrast ratio) and `hover:bg-yellow-accent hover:text-teal-900` (8.1:1 contrast ratio).
  - Sections:
    1. "Your tools": Always includes `rccp`. Order Bot included ONLY if signed-in user has an active or trialing subscription row or active stores (`orderbotStores.active_store_count > 0`).
    2. "Available": Rendered only if eligible tools exist. Order Bot included ONLY if signed-in user has an active/trialing subscription but has not yet added a store; otherwise hidden. Invoice Generator hidden always.
    3. "Coming soon": ListFlow only.
- **Navbar & Navigation Dropdowns (v1.7.0)**:
  - Tools dropdown (desktop): Exactly two items (`rccp` and `ListFlow`), single line, no description text, no truncation, no background tile behind icons.
  - Tools drawer (mobile): Exactly two items (`rccp` and `ListFlow`), single line, no description text, no icon/logo below `md` breakpoint.
  - Profile dropdown (desktop & mobile): Clearly visible hover/focus/active states with light highlight (`data-[highlighted]:bg-mint-50 data-[highlighted]:text-teal-900 hover:bg-mint-50 hover:text-teal-900 focus:bg-mint-50 focus:text-teal-900`), >= 4.5:1 contrast, plus visible focus rings (`focus-visible:ring-2 focus-visible:ring-teal-600`).
  - Sign out item: Retains red accent with visible red hover highlight (`data-[highlighted]:bg-red-500/20 data-[highlighted]:text-red-300`).
- **Free Trial & Billing Engine (Part B & C - v1.5.0, v1.5.1, v1.6.0)**:
  - Migration 032 applied in production.
  - Edge Functions `create-checkout-session` (v4) and `stripe-webhook` (v5) deployed.
  - Free trial feature exists but is OFF in production (`trial_offers.enabled = false`). All trial components fail safe.
- **Admin Dashboard & Controls (Part D - v1.6.0)**:
  - Migration 033 applied in production.
  - `/admin/free-trials` and `/admin/price-overrides` operational for administrators.

## In Progress
- Free trial Part B Stripe test-mode end-to-end verification (office PC).
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

*Last Updated: 2026-10-26 — Release v1.7.0: Tools and Dashboard redesign, visible tool restrictions, navbar and profile dropdown accessibility fixes.*
