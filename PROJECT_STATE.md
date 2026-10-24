# Automation Alchemists Project State

## Overview
Automation Alchemists is a full-stack SaaS hub (React/Vite + Supabase) that centralizes authentication, billing, and access gating for external SaaS tools (Return Converter, CP Bot, ListFlow, Order Bot, Invoice Generator), as well as serving as a marketing site for various digital services.

## What's Built
- **Marketing Site**: Static landing pages, services pages, tools overview. The services page now excludes the Virtual Assistance section, which has been moved to its own dedicated `/virtual-assistant` route.
- **Contact Page**: Redesigned contact details card with functional links (mailto, WhatsApp SVG links, Google Maps). Removed business hours entirely since operations are online. JSON-LD and display text are aligned.
- **Auth System**: Integrated Supabase Auth with singleton `useAuth` hook and visibility-change state restoration.
- **Stripe Billing Integration**: Webhooks for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` wired to a `public.subscriptions` and `public.stripe_webhook_events` (idempotency) table via atomic RPCs. Edge Function `create-checkout-session` accepts `{ product_slug, quantity }` and creates a Stripe Checkout session for one item.
- **Entitlement Gating**: Active subscription counting via `get_active_subscription_count` for authenticated users.
- **User Dashboard**: Dark-mode app dashboard mapping purchased/active tools vs available tools dynamically from `public.tools` and `public.subscriptions`. In release v1.5.0, a "CP Bot free trial" card (`#claim-trial`) and status banners were integrated to handle free trial claiming, active trial countdowns, and trial expiration states seamlessly.
- **Admin Dashboard**: Internal admin UI (`/admin/tools`) to edit `public.tools` status and pricing live.
- **Public /tools page**: Dynamically pulls pricing and status from `public.tools`. Loading uses static fallback defaults; errors show a toast but preserve the fallback data (never blanks the page). Hidden tools are filtered at the query level. In release v1.4.4 and v1.5.0, card copy and tools data (`src/data/tools.ts`) for "Return Converter x CopyPaste Bot" (description and 4 bullets) were fully aligned with developer facts to accurately describe each tool's exact function.
- **CP Bot Free Trial Claim Flow & Hero State (Part C - Release v1.5.0)**:
  - Backend RPCs (`get_trial_public`, `get_trial_status`, `claim_free_trial`) wrapped in typed, fail-safe layer in `src/lib/trial.ts`.
  - Dynamic RCCP Tool Page Hero (`/tools/rccp`) updates CTA to "Get your {N}-day free trial now" and spots remaining count when offer is active, switching to "Your free trial is active" status pill or ended trial state, and failing safe to original layout when offer is disabled.
  - Dashboard Claim Card (`src/components/DashboardTrialCard.tsx`) supports `#claim-trial` hash targeting with smooth scroll and subtle highlight, in-place subscription refetch upon claim, and responsive active/ended banners.
  - Return path navigation on `/auth`: preserves `?next=<path>` with strict sanitization via `sanitizeNext` against open redirects (`//evil.com`, `https://evil.com`), handles `?mode=signup`, and sets `emailRedirectTo`.
  - All client free-trial components fail safe and remain completely invisible while `trial_offers.enabled = false` in production.
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
- **Free Trial & Billing Enhancements Part B (Migration 032 Applied; Edge Functions NOT Deployed)**:
  - Migration 032 (`032_webhook_trial_conversion.sql`) APPLIED to production database by hand on 2026-10-24. Single-seat trial conversion, `resolve_access_slug`, and manual grant protection are active; `check_product_subscription` verified with exactly 1 overload.
  - Edge functions `create-checkout-session` and `stripe-webhook` are NOT deployed: deploy on 2026-10-24 failed with HTTP 403 ("account does not have the necessary privileges") because Supabase CLI login on home PC lacks permission on project `tdevgrwmafwrsmeymjzd`. Live functions remain pre-Part-B versions. Both functions will be deployed from the office PC before the Stripe test run on 2026-10-25.
  - Non-destructive test harness authored at `docs/sql/032_behaviour_verify.sql` with `docs/sql/032_behaviour_verify_README.md`.
  - Free trial offer remains OFF (`trial_offers.enabled = false`).
  - CP Bot Chrome extension gate v1.0.5.3 remains pending review at the CP Bot developer.
- **Cart/Checkout page** (`/cart`): Auth-gated page. "Get access" buttons on /tools add the tool slug to localStorage and navigate to /cart. Cart fetches live pricing from `public.tools` (only `status='available'` tools). Each cart item has its own individual "Checkout" button which calls `create-checkout-session` Edge Function. "You might also like" sidebar suggests other available tools not in the cart. Handles `?checkout=success` (redirects to dashboard) and `?checkout=cancel` (shows toast). Controlled by `VITE_CHECKOUT_ENABLED` feature flag.
- **Return Converter x CopyPaste Bot Tool Page** (`/tools/rccp`): Dedicated product page built to custom specifications with scroll-reveal animations (`RevealText`, `RevealBlock`), dynamic pricing fetched from `public.tools` with fallback of 9, and access gating via `handleGetAccessLogic`. Other tool detail pages remain routed to `ToolDetail.tsx`.
- **Chunk-load error recovery**: Global handler in `index.html` auto-reloads once on dynamic import MIME-type errors.
- **Caching headers**: `vercel.json` configured with `no-cache` for `index.html`, long-cache for hashed assets.

## In Progress
- Free trial Part B verification and testing (Stripe test-mode run scheduled for 2026-10-25).

## Not Started
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

*Last Updated: 2026-10-24 — Release v1.5.1: Auth path check, tools copy and price fixes, behaviour verify script, test plan.*

