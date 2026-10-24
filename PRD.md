# Product Requirements Document (PRD)

## Project: Automation Alchemists - Free Trial and Billing Enhancements

### 1. Overview
Automation Alchemists provides subscription-based and free tools to e-commerce and automation businesses (including Return Converter x CopyPaste Bot, Order Bot, ListFlow, and Invoice Generator). This initiative establishes a seamless, cardless free trial system and an admin-controllable pricing/discount engine without disrupting existing Stripe webhooks, manual access grants, or multi-tenant database constraints.

---

### 2. Part A: Database Foundation (Applied in Live DB)
- **Promotion Knobs**: Configurable trial length (`trial_days`, default 30, bounded 1–90) and slot capacity (`slot_cap`, default 500) stored in `public.trial_offers`.
- **Cardless Claiming**: Authenticated users claim directly via `public.claim_free_trial(tool_slug)`. A subscription row is inserted into `public.subscriptions` with `is_trial = true`, `status = 'active'`, and linked to `public.trial_claims`.
- **Abuse Prevention**:
  - Email normalization (`public.normalize_email`) strips tags and periods (Gmail) and canonicalizes domains (`googlemail.com` -> `gmail.com`).
  - Disposable email domain blocklist in `public.blocked_email_domains`.
  - Retention of normalized emails on account deletion (`ON DELETE SET NULL`) prevents duplicate trial abuse.
- **Security**: Base tables have RLS enabled with zero policies; client access is mediated exclusively via audited `SECURITY DEFINER` RPCs.

---

### 3. Part B: Checkout Integration & Webhook Conversion (Migration 032 Applied; Edge Functions Fixed in Code, Not Yet Deployed)
- *Deployment Status*: Migration 032 applied on 2026-10-24. Edge functions `create-checkout-session` and `stripe-webhook` are NOT deployed (deploy failed with HTTP 403 on home PC due to project permissions; live functions remain pre-Part-B versions). Both functions will be deployed from the office PC before the Stripe test run on 2026-10-25.
- **Automatic Trial-to-Paid Conversion & Event Separation**:
  - Only `checkout.session.completed` may INSERT or UPSERT a single-seat subscription row. When a trial user subscribes via Stripe, `public.process_stripe_webhook_event` converts the existing trial row in `public.subscriptions` (`is_trial` set to `false`, `grant_reason` set to `'stripe_checkout'`) instead of inserting a duplicate row or crashing against `subscriptions_user_product_no_store_unique`.
  - Marks the matching record in `public.trial_claims` with `converted_at = now()`.
  - `customer.subscription.updated` for single-seat products strictly updates `current_period_end` on existing rows matching `WHERE stripe_subscription_id = p_stripe_subscription_id AND status = 'active'`. It never inserts, upserts, or reactivates cancelled/expired subscriptions.
- **Resilient Webhook Ingestion**:
  - Out-of-order `customer.subscription.updated` events extract user ID, email, and tool slug from `subscription.metadata`.
  - If required fields are missing, the RPC resolves them from the existing `subscriptions` row matching `stripe_subscription_id`. If still unresolved, skips insertion and returns HTTP 200 to prevent infinite Stripe retries.
- **Dynamic Server-Side Pricing**:
  - `create-checkout-session` ignores client-submitted prices and reads live catalog prices from `public.tools.price_monthly`.
  - Inspects `public.user_price_overrides` for active discounts (`fixed_price` or `percent_off`).
  - Constructs ad-hoc Stripe line items via `price_data` reusing the existing Stripe Product ID.
  - Rejects discounts yielding unit amounts below Stripe's 50-cent minimum with HTTP 400 (`price_too_low`).
- **Double-Charge Protection**:
  - Rejects checkout requests with HTTP 409 (`already_subscribed`) if the user already holds an active, non-trial subscription for the target tool.
  - Exempts Order Bot (`orderbot`) from the 409 guard to allow multi-store slot expansion.
  - Active trial subscriptions do NOT trigger this guard, permitting upgrade to paid access.
- **Manual Grant Safety**:
  - Webhooks never overwrite an active administrative grant (`manually_granted = true` and `status = 'active'`).
- **Access Slug Decoupling**:
  - `public.resolve_access_slug(p_tool_slug)` maps marketing catalog slugs (e.g. `'rccp'`) to internal entitlement access slugs (e.g. `'cpbot'`).

---

### 4. Part E: CP Bot External Access Gating & Architecture (Confirmed 23 Oct 2026)
- **Confirmed Unlock Slug**: The CP Bot unlock slug is confirmed as `'cpbot'`. The web dashboard calls `check_product_subscription` with the single argument `p_product_slug = 'cpbot'`.
- **Web Dashboard Gating**: The CP Bot web dashboard (`/cp-bot` pages) is gated by `check_product_subscription` in strict mode (fail closed: if the RPC errors, everyone is locked out).
- **Chrome Extension Gating Status**: The Chrome extension is not gated today. Gating ships in extension `v1.0.5.3` (pending Chrome Web Store review). Public free trials must not open until extension `v1.0.5.3` is live in production.
- **Expiration & Caching**: The RPC checks `current_period_end`, locking the dashboard on the next page load after expiry. The extension caches the entitlement response for 5 minutes (fresh check on popup open).
- **Single RPC Signature Invariant**: Never create a second overload of `check_product_subscription`; an overload will break PostgREST resolution and lock out all paying customers.
- **Database Tables**:
  - `cp_bot_licenses` is unused.
  - `cp_bot_config` and `cp_bot_settings` are in active use and must never be dropped or renamed.
  - Other active CP Bot tables: `cp_bot_activity_log`, `cp_bot_fulfillments`, `cp_bot_gift_templates`, `cp_bot_insight_cards`, `cp_bot_cloud_clipboard`, and `label_history`.
- **Return Converter**: Gated only by sign-in.
- **Testing**: No staging environment; all testing is conducted against production using a dedicated test account.
- **Developer Notification**: Notify CP Bot developer (a) before Stripe/webhook changes go live, and (b) when trials go live.

---

### 5. Tools Catalog Presentation & Card Copy Alignment (Release v1.4.4)
- **Accurate Product Framing**: Corrected the description paragraph and four bullet items on the Return Converter x CopyPaste Bot card (`/tools`) to accurately describe what each tool does without implying CP Bot completes orders, that Return Converter generates labels from nothing, or that the cloud clipboard syncs across devices.
- **Card Balance**: Bullet copy is calibrated to keep the card at or below the height of the adjacent ListFlow card at desktop width with single-line bullets.

---

### 6. Part C: Free Trial Client Claim Flow & Authentication Return Path (v1.5.0)
- **Typed RPC Client Layer (`src/lib/trial.ts`)**:
  - Typed wrappers for `get_trial_public`, `get_trial_status`, and `claim_free_trial`.
  - Custom React hooks `useTrialPublic` and `useTrialStatus` fetching on mount (skipped client-side during SSR / prerender when `window.__PRERENDER__` is present).
  - Pure URL sanitizer `sanitizeNext(raw)` ensuring open-redirect protection.
  - Fail-safe design: any network or RPC error maps cleanly to `{ ok: false, reason: 'network' }` and never throws into UI components.
- **RCCP Tool Page Hero Dynamic Trial State (`src/pages/tools/RccpToolPage.tsx`, `src/data/rccpPage.ts`)**:
  - Gated by `trial_offers.enabled` and `slots_left > 0`.
  - Signed-out or signed-in without trial: primary button displays "Get your {N}-day free trial now" with "{slots_left} of {slot_cap} free-trial spots left" sub-caption. Click directs signed-out users to `/auth?mode=signup&next=/dashboard%23claim-trial` and signed-in users to `/dashboard#claim-trial`.
  - Signed-in with active trial: displays "Your free trial is active" status pill with formatted remaining time and "Open dashboard →" link.
  - Signed-in with ended trial: displays primary "Get CP Bot" access button without trial promotion.
  - Fail-safe invariant: when the offer is disabled, slots are 0, or on network failure, the page renders identically to existing default copy and layout without layout shift.
- **Authentication Return Navigation (`src/pages/Auth.tsx`, `src/lib/checkout.ts`)**:
  - Preserves user destination via `?next=<path>` sanitized by `sanitizeNext`. Invalid protocols, protocol-relative paths (`//evil.com`), backslashes (`/\evil`), long paths (>200 chars), or control characters fall back safely to `'/'`.
  - Sign in with no `?next=` lands exactly where it did before v1.5.0, for a normal user (`/`) and an admin (`/admin`).
  - Sign up with `?next=/dashboard%23claim-trial` returns to the dashboard claim card after account creation (and after email confirmation when confirmation is on).
  - Passes sanitized path to `emailRedirectTo` for email confirmation flows.
  - Signed-out users clicking "Get access" in `checkout.ts` preserve current location via `?next=${encodeURIComponent(currentPath)}`.
- **Dashboard Trial Management Card (`src/pages/Dashboard.tsx`, `src/components/DashboardTrialCard.tsx`)**:
  - Located near top with `id="claim-trial"`, supporting hash auto-scroll and subtle highlight.
  - State 1: Eligible, unclaimed: "Start your {N}-day free trial of CP Bot", slots remaining line, and "Claim free trial" button with loading spinner & double-click guard.
  - State 2: Successful claim: triggers subscription data refetch in place without page reload; displays green confirmation banner.
  - State 3: Active trial: slim banner displaying remaining days/hours (switching to hours under 48h) and "Subscribe to keep CP Bot" CTA.
  - State 4: Ended trial: banner indicating trial conclusion with "Subscribe to keep CP Bot" CTA.
  - State 5: Ineligible / disabled: renders nothing. If offer is enabled but sold out, displays quiet notice.
  - Friendly error messages for claim rejections mapping backend rejection codes without leaking internal blocklists.

