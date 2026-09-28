# Automation Alchemists Project State

## Overview
Automation Alchemists is a full-stack SaaS hub (React/Vite + Supabase) that centralizes authentication, billing, and access gating for external SaaS tools (Return Converter, CP Bot, ListFlow, Order Bot, Invoice Generator), as well as serving as a marketing site for various digital services.

## What's Built
- **Marketing Site**: Static landing pages, services pages, tools overview. The services page now excludes the Virtual Assistance section, which has been moved to its own dedicated `/virtual-assistance` route.
- **Contact Page**: Redesigned contact details card with functional links (mailto, WhatsApp SVG links, Google Maps). Removed business hours entirely since operations are online. JSON-LD and display text are aligned.
- **Auth System**: Integrated Supabase Auth with singleton `useAuth` hook and visibility-change state restoration.
- **Stripe Billing Integration**: Webhooks for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` wired to a `public.subscriptions` and `public.stripe_webhook_events` (idempotency) table via atomic RPCs. Edge Function `create-checkout-session` accepts `{ product_slug, quantity }` and creates a Stripe Checkout session for one item.
- **Entitlement Gating**: Active subscription counting via `get_active_subscription_count` for authenticated users.
- **User Dashboard**: Dark-mode app dashboard mapping purchased/active tools vs available tools dynamically from `public.tools` and `public.subscriptions`.
- **Admin Dashboard**: Internal admin UI (`/admin/tools`) to edit `public.tools` status and pricing live.
- **Public /tools page**: Dynamically pulls pricing and status from `public.tools`. Loading uses static fallback defaults; errors show a toast but preserve the fallback data (never blanks the page). Hidden tools are filtered at the query level.
- **Cart/Checkout page** (`/cart`): Auth-gated page. "Get access" buttons on /tools add the tool slug to localStorage and navigate to /cart. Cart fetches live pricing from `public.tools` (only `status='available'` tools). Each cart item has its own individual "Checkout" button which calls `create-checkout-session` Edge Function. "You might also like" sidebar suggests other available tools not in the cart. Handles `?checkout=success` (redirects to dashboard) and `?checkout=cancel` (shows toast). Controlled by `VITE_CHECKOUT_ENABLED` feature flag.
- **Chunk-load error recovery**: Global handler in `index.html` auto-reloads once on dynamic import MIME-type errors.
- **Caching headers**: `vercel.json` configured with `no-cache` for `index.html`, long-cache for hashed assets.

## In Progress
- None. (Merged to main as v1.2.0, checkout hidden by flag and server guard).

## Not Started
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

*Last Updated: 2026-09-28 — Cleaned up stale Virtual Assistance references, aligned Dashboard tool cards with checkout feature flag logic, and updated local pricing fallbacks.*
