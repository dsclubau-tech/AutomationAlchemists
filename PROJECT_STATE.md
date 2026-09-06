# Automation Alchemists Project State

## Overview
Automation Alchemists is a full-stack SaaS hub (React/Vite + Supabase) that centralizes authentication, billing, and access gating for external SaaS tools (Return Converter, CP Bot, ListFlow, Order Bot, Invoice Generator). 

## What's Built
- **Marketing Site**: Static landing pages, services pages, tools overview.
- **Auth System**: Integrated Supabase Auth with singleton `useAuth` hook and visibility-change state restoration.
- **Stripe Billing Integration**: Webhooks for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` wired to a `public.subscriptions` and `public.stripe_webhook_events` (idempotency) table via atomic RPCs.
- **Entitlement Gating**: Active subscription counting via `get_active_subscription_count` for authenticated users.
- **User Dashboard**: Dark-mode app dashboard mapping purchased/active tools vs available tools dynamically from `public.tools` and `public.subscriptions`.
- **Admin Dashboard**: Internal admin UI (`/admin/tools`) to edit `public.tools` status and pricing live.

## In Progress
- Wiring the public `/tools` page to pull dynamic pricing and status from `public.tools`.

## Not Started
- E-commerce cart/checkout flow for actual payment.

## Known Issues
- N/A

## Tech Stack
- React, Vite, Tailwind CSS, TypeScript, Framer Motion
- Supabase (PostgreSQL, Edge Functions via Deno, Auth)
- Stripe

*Last Updated: 2026-09-06 - Initializing project state snapshot.*
