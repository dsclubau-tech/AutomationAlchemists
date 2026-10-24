# Automation Alchemists Project State

## Overview
Automation Alchemists is a full-stack SaaS hub (React/Vite + Supabase) that centralizes authentication, billing, and access gating for external SaaS tools (Return Converter, CP Bot, ListFlow, Order Bot, Invoice Generator), as well as serving as a marketing site for various digital services.

## What's Built
- **Marketing Site**: Static landing pages, services pages, tools overview. The services page now excludes the Virtual Assistance section, which has been moved to its own dedicated `/virtual-assistant` route.
- **Contact Page**: Redesigned contact details card with functional links (mailto, WhatsApp SVG links, Google Maps). Removed business hours entirely since operations are online. JSON-LD and display text are aligned.
- **Auth System**: Integrated Supabase Auth with singleton `useAuth` hook and visibility-change state restoration.
- **Stripe Billing Integration**: Webhooks for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` wired to a `public.subscriptions` and `public.stripe_webhook_events` (idempotency) table via atomic RPCs. Edge Function `create-checkout-session` accepts `{ product_slug, quantity }` and creates a Stripe Checkout session for one item.
- **Entitlement Gating**: Active subscription counting via `get_active_subscription_count` for authenticated users.
- **User Dashboard**: Dark-mode app dashboard mapping purchased/active tools vs available tools dynamically from `public.tools` and `public.subscriptions`.
- **Admin Dashboard**: Internal admin UI (`/admin/tools`) to edit `public.tools` status and pricing live.
- **Public /tools page**: Dynamically pulls pricing and status from `public.tools`. Loading uses static fallback defaults; errors show a toast but preserve the fallback data (never blanks the page). Hidden tools are filtered at the query level. In release v1.4.4, card copy for "Return Converter x CopyPaste Bot" (description and 4 bullets) was corrected to accurately describe each tool's exact function without implying order completion, label generation from nothing, or cross-device sync.
- **CP Bot External Architecture Confirmation (Part E - Confirmed 23 Oct 2026)**:
  - Confirmed unlock slug is `'cpbot'` consumed via `check_product_subscription(p_product_slug = 'cpbot')`.
  - CORRECTION: CP Bot web dashboard (`/cp-bot` pages) IS gated by `check_product_subscription` in strict fail-closed mode (if RPC errors, everyone is locked out).
  - Chrome extension is NOT gated today. Gate ships in extension `v1.0.5.3` (pending Chrome Web Store review). Public trial must not open until it is live.
  - Expiration & caching: RPC checks `current_period_end` (dashboard locks on next page load after expiry); extension caches real answer for 5 minutes (fresh check on popup open).
  - Single RPC overload invariant: Never create a second overload of `check_product_subscription` (would lock out every paying customer).
  - Tables: `cp_bot_licenses` is unused. `cp_bot_config` and `cp_bot_settings` are IN USE and must never be dropped or renamed. Other active CP Bot tables: `cp_bot_activity_log`, `cp_bot_fulfillments`, `cp_bot_gift_templates`, `cp_bot_insight_cards`, `cp_bot_cloud_clipboard`, `label_history`.
  - Return Converter is gated only by sign-in.
  - Testing: No staging environment; all testing is conducted against production with a dedicated test account.
  - Notifications: Developer requested notice (a) before Stripe/webhook changes go live, and (b) when trials go live.
- **Cart/Checkout page** (`/cart`): Auth-gated page. "Get access" buttons on /tools add the tool slug to localStorage and navigate to /cart. Cart fetches live pricing from `public.tools` (only `status='available'` tools). Each cart item has its own individual "Checkout" button which calls `create-checkout-session` Edge Function. "You might also like" sidebar suggests other available tools not in the cart. Handles `?checkout=success` (redirects to dashboard) and `?checkout=cancel` (shows toast). Controlled by `VITE_CHECKOUT_ENABLED` feature flag.
- **Return Converter x CopyPaste Bot Tool Page** (`/tools/rccp`): Dedicated product page built to custom specifications with scroll-reveal animations (`RevealText`, `RevealBlock`), dynamic pricing fetched from `public.tools` with fallback of 9, and access gating via `handleGetAccessLogic`. Other tool detail pages remain routed to `ToolDetail.tsx`.
- **Chunk-load error recovery**: Global handler in `index.html` auto-reloads once on dynamic import MIME-type errors.
- **Caching headers**: `vercel.json` configured with `no-cache` for `index.html`, long-cache for hashed assets.

## In Progress
- Free trial & billing enhancements Part B: Code and SQL written, review fixes applied, NOT applied/deployed.
  - Migration 032 (`032_webhook_trial_conversion.sql`), `032_rollback.sql`, and `032_verify.sql` authored. Fixed single-seat reactivation hole: only `checkout.session.completed` performs INSERT/UPSERT; `customer.subscription.updated` strictly updates `current_period_end` on active rows.
  - Edge function `stripe-webhook` verified for resilient metadata extraction and skipped outcome handling.
  - Edge function `create-checkout-session` updated with server-side price resolution, user discount overrides, double-charge guard (409) with Order Bot multi-slot exemption, minimum price guard (400), and access slug decoupling. Verified single declaration in `CHECKOUT_ENABLED` guard.
  - Documentation updated in `docs/FREE_TRIAL_AND_DISCOUNTS.md` (Section 9) and `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`. `PRD.md` and `QA_CHECKLIST.md` updated with checks for out-of-order delivery and Order Bot slot expansion.

## Not Started
- Free trial Part C (Public Trial Landing & Claim UI) — hold public launch until extension v1.0.5.3 is live in Chrome Web Store.
- Free trial Part D (Admin Trial & Discount Management UI).
- Multi-item single-checkout (Edge Function only supports one item per session currently).
- Stripe Customer Portal integration for subscription management.

## Turning on Checkout
- To enable checkout globally (bypassing the admin-only guard), set the `CHECKOUT_ENABLED` secret to `"true"` in Supabase. No other code changes are needed.

## Known Issues
- `npm run build` prerender step fails locally due to missing Puppeteer Chrome binary (not a code issue; build/vite step succeeds).
- Puppeteer Chrome version mismatch on local dev machine.

## Tech Stack
- React, Vite, Tailwind CSS, TypeScript, Framer Motion
- Supabase (PostgreSQL, Edge Functions via Deno, Auth)
- Stripe

*Last Updated: 2026-10-24 — Release v1.4.4: Tools page card copy corrected; CP Bot developer written answers incorporated (Part E confirmed).*

