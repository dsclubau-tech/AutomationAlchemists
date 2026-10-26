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

### 3. Part B: Checkout Integration & Webhook Conversion (Migration 032 Applied; Edge Functions Deployed 2026-10-24)
- *Deployment Status*: Migration 032 applied on 2026-10-24. Edge functions `create-checkout-session` (v4) and `stripe-webhook` (v5, `--no-verify-jwt`) deployed to project `tdevgrwmafwrsmeymjzd` on 2026-10-24 (~09:50 UTC) from home PC (earlier 403 resolved by switching to owning Supabase account). End-to-end verification and Stripe test-mode run planned for 2026-10-25 on office PC.
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

---

### 7. Part D: Admin Controls for Free Trials and Price Overrides (Release v1.6.0)
- **Status**: Migration `033_admin_trial_controls.sql` is committed but **NOT applied yet** in production.
- **Database Administrative Functions (Migration 033)**:
  - 12 atomic `SECURITY DEFINER` RPCs with `search_path = public, pg_temp` protecting zero-grant tables.
  - Mandatory admin authorization on every call via `auth.uid()` lookup in `public.profiles WHERE is_admin = true` (raising `not_admin` / 42501).
  - Mutating actions log to `public.admin_audit_log` only when rows are actually modified (e.g. on real domain insert/delete).
  - Protected mainstream email domain guard: attempts to block major providers (`gmail.com`, `outlook.com`, `hotmail.com`, `yahoo.com`, `icloud.com`, `proton.me`, etc.) return error `'protected_domain'`.
  - Override guards: verifies tool exists in `public.tools` (`tool_not_found`), enforces note length <= 500 chars (`note_too_long`).
  - Automatic expired override cleanup: un-revoked expired rows are marked revoked (`revoked_at = ends_at`) before creating a new override so the partial unique index is cleanly reused. INSERT is protected by a `unique_violation` exception handler returning `override_exists`.
  - Protection of converted customer subscriptions: converted claims cannot be revoked or reset.
- **Admin Free Trials Management Page (`/admin/free-trials`)**:
  - Offer configuration card: trial days (1..90), total slot cap, reserved slots ("Counted as already taken. Real claims add to this"), require confirmed email toggle, and live capacity statistics (`slots_taken` / `slots_left`).
  - Public activation confirmation modal with prominent warning text: *"Visitors will see the free-trial button on the Return Converter x CopyPaste Bot page. Do not enable publicly until the CP Bot Chrome extension v1.0.5.3 is live."*
  - Instant one-click disable toggle.
  - Claims table: ILIKE email search, pagination (20/page), status badges (`active`, `expired`, `converted`, `revoked`).
  - Claim row actions: Extend trial (+N days), Revoke claim (cancels subscription immediately), and "Reset claim (testing only)" modal requiring exact email confirmation typing. Tooltips disable Revoke and Reset on converted claims.
  - Blocked email domains card: real-time list, domain addition with hostname format validation and protected provider refusal, and domain unblocking modal.
- **Admin Price Overrides Management Page (`/admin/price-overrides`)**:
  - Direct discount granting form: customer email (verified against `auth.users`), tool selector, kind (`fixed_price` or `percent_off`), discount amount/percentage, optional expiration date, and internal note.
  - Live checkout preview: "Normal A$X -> This user A$Y".
  - Clear inline policy note: *"Applies to NEW checkouts only; existing subscriptions are not changed."*
  - Contextual link to `/admin/tools`: *"To change the standard price for everyone, edit it in the Tools catalog."*
  - Active and past overrides table with revocation modal.
- **Admin Navigation Integration**:
  - Integrated into `AdminLayout` sidebar under `/admin/free-trials` and `/admin/price-overrides`.
  - Gated by standard `profiles.is_admin` verification.
  - Non-crashing calm notice banner if Migration 033 has not yet been applied to the database.

---

### 8. Tools & Dashboard Redesign, Visible Tools Filtering, and Navbar Dropdown Accessibility (Release v1.7.0)
- **Visible Tool Restriction**:
  - Centralized single constant `VISIBLE_TOOL_SLUGS = ['rccp', 'listflow'] as const` exported from `src/data/tools.ts`.
  - Tools page, desktop & mobile navbar Tools dropdown, home page marquee, cart upsells, `scripts/generate-sitemap.js`, and `scripts/prerender.js` strictly show only tools in `VISIBLE_TOOL_SLUGS`.
  - Unlisted tools (`orderbot`, `invoicegen`) have routes and direct pages preserved, but carry `noindex` (`<meta name="robots" content="noindex, nofollow" />`) and are completely unlinked from navigation, footer, search, and sitemaps.
- **Tools Page Redesign (`/tools`)**:
  - Exactly two cards: `rccp` (Return Converter x CopyPaste Bot) first, `listflow` (ListFlow) second, in equal-height stretch grid.
  - RCCP logo rendered at >= 56px (`w-14 h-14 min-w-[56px] min-h-[56px]`) directly on card surface without tinted background tile.
  - Page adopts landing page background treatment (`time-fold-ripple overflow-x-hidden selection:bg-teal-600 selection:text-white`).
  - Decorative corner shapes (`bg-teal-600/5 rounded-bl-full`) removed from cards.
  - Single yellow CTA button on RCCP card:
    - If trial offer is enabled: "Start free trial now" pointing to `/dashboard#claim-trial` (or signup with `next`), followed by dynamic pricing text `"{trial_days} days free, then A${price}/month. Card required. Cancel anytime."`.
    - If trial offer is disabled or fails: "Learn more" button linking to `/tools/rccp` with no trial wording.
  - ListFlow card: Single disabled "Coming soon" button only.
- **User Dashboard Redesign & Bug Fixes (`/dashboard`)**:
  - Background treatment unified with landing page using `time-fold-ripple`.
  - Grid bug resolved: Card grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch min-w-0`, ensuring cards fill container.
  - Clipping bug resolved: Button container and card footer allow wrapping (`flex-wrap`), preventing button clipping on narrow/tablet screens and inside 3-column cards at 1280px.
  - Outlined button label visibility bug resolved: Replaced clashing `text-teal-900` with `text-mint-50` at rest (11.4:1 contrast ratio) and `hover:bg-yellow-accent hover:text-teal-900` (8.1:1 contrast ratio).
  - Visibility exception:
    - Section 1 ("Your tools"): Shows `rccp`. Shows `orderbot` ONLY if the user has an active or trialing subscription row or active stores (`orderbotStores.active_store_count > 0`).
    - Section 2 ("Available"): Shows `orderbot` ONLY if user has an active/trialing subscription but 0 stores. Otherwise hidden. Invoice Generator hidden always.
    - Section 3 ("Coming soon"): Shows ListFlow only.
- **Navbar & Profile Dropdown Accessibility**:
  - Tools dropdown: Exactly two items (`rccp` and `ListFlow`), single line, no description text, no icon/logo on mobile, no background tile behind logo on desktop.
  - Profile dropdown: Light highlight on hover/focus/active (`data-[highlighted]:bg-mint-50 data-[highlighted]:text-teal-900`), visible focus ring (`focus-visible:ring-2 focus-visible:ring-teal-600`), contrast >= 4.5:1. Red hover highlight on Sign out. Identical styling applied across desktop and mobile menus.

---

### 9. Card-Required Free Trial Architecture (Release v1.8.0 - Migration 034 & Edge Function)

> [!NOTE]
> **SUPERSEDED IN v1.8.1**: The v1.8.0 specification allowed `customer.subscription.updated` to convert trial rows for any status update. Superseded by v1.8.1 requirements below.

- **Architecture Shift (Owner Decision)**:
  - Card-required Stripe subscription trial: a customer initiates a Stripe Checkout session with `mode = 'subscription'` and metadata `trial = 'true'`.
  - The subscription starts in `status = 'trialing'` for the duration configured in `trial_offers.trial_days` (default 30 days).
  - Stripe automatically charges the card at trial end unless cancelled before the period concludes.
- **Anti-Abuse Identity Constraints**:
  - Zero-privilege tables `public.trial_identities` (RLS on, 0 policies, 0 public/anon/authenticated grants) and `public.trial_denials` enforce:
    - 1 trial per normalised email (`trial_claims.email_normalized`).
    - 1 trial per card fingerprint (`trial_identities` where `kind = 'card'`).
    - 1 trial per phone number HMAC-SHA256 (`trial_identities` where `kind = 'phone'` hashed using secret `TRIAL_IDENTITY_PEPPER`).
  - **Explicit Boundaries & Limits**:
    - Stops repeat usage of the same card fingerprint or telephone number.
    - Does NOT prevent virtual single-use cards (e.g. Revolut virtual cards, Privacy.com) or alternate phone numbers.
    - Phone number is collected from Stripe Checkout details and is unverified (no SMS OTP).
- **Closure of Legacy Cardless Path**:
  - Stored procedure `public.claim_free_trial(text)` unconditionally returns `{ "ok": false, "reason": "checkout_required" }`. No no-card trial can ever be created.
- **Safe Expiration & pg_cron Conversion Race Protection**:
  - `process_stripe_webhook_event` writes `current_period_end = p_current_period_end + interval '6 hours'`, `is_trial = true`, and `grant_reason = 'stripe_trial'`, while preserving true expiration in `trial_claims.trial_ends_at`.
  - The +6h grace window prevents the 1-minute `pg_cron` job `expire-past-due-subscriptions` from prematurely expiring access during the ~1h invoicing window after trial expiration.
  - Rows with `status = 'expired'` (from cron) or `'past_due'` are safely reactivated when Stripe reports `active`, but rows with `status = 'canceled'` are **never** reactivated.
  - Stripe status `'past_due'` or `'unpaid'` immediately revokes access in `check_product_subscription`.
- **RPC Enhancements & Security**:
  - New service_role-only RPCs (`SECURITY DEFINER`, `search_path = public, pg_temp`):
    - `trial_eligibility_for(p_user_id uuid, p_tool_slug text)`
    - `finalize_card_trial(p_user_id uuid, p_tool_slug text, p_email text, p_card_fingerprint text, p_phone_hash text, p_trial_end timestamptz)`
    - `mirror_cancel_at_period_end(p_stripe_subscription_id text, p_flag boolean)`
  - `get_trial_status(text)` extended with `denied_reason` (latest denial within 2 days).
  - `admin_trial_extend(uuid, integer)` refuses revoked claims upfront with `{ok: false, error: 'revoked', message: 'Cannot extend a revoked claim'}` before modifying rows.
  - Strict single overload invariant preserved for `process_stripe_webhook_event` (13 arguments) and `check_product_subscription` (1 argument).

---

### 10. Trial Safety Fixes, Payment Method Fallbacks & Production Deployment (Release v1.8.1)

> [!IMPORTANT]
> **DEPLOYMENT STATUS**: Migration `034_card_trial_identity.sql` is **APPLIED to the Supabase database** (`tdevgrwmafwrsmeymjzd`) and Edge Function `stripe-webhook` is **DEPLOYED** (version 6). Public free trials remain disabled (`trial_offers.enabled = false`).

- **Trial Conversion Guard on customer.subscription.updated**:
  - Only raw Stripe status `'active'` (`p_subscription_status = 'active'`) converts trial rows in place (`is_trial = false`, `grant_reason = 'stripe_checkout'`, `current_period_end = p_current_period_end`, and stamps `trial_claims.converted_at = now()`).
  - When raw Stripe status is `'trialing'` (`p_subscription_status = 'trialing'`), `process_stripe_webhook_event` does NOT modify `is_trial`, `grant_reason`, `converted_at`, or `current_period_end`. The initial +6h grace period end is strictly preserved. Cancelling in the Stripe customer billing portal during a trial simply updates `cancel_at_period_end` via `mirror_cancel_at_period_end` without causing premature paid conversion.
- **Stripe Subscription Status Mapping Matrix**:
  | Event Type | Stripe Status (`p_subscription_status`) | Action / Mapped Status | Database Impact |
  | :--- | :--- | :--- | :--- |
  | `checkout.session.completed` | `active` / `trialing` | `v_new_status := 'active'` | Upsert subscription row (`is_trial=true` if trialing, `is_trial=false` if active) |
  | `checkout.session.completed` | Other / Incomplete | Ignored (`'ignored incomplete checkout'`) | No row created |
  | `customer.subscription.updated` | `incomplete` / `incomplete_expired` | Ignored (`'ignored incomplete'`) | No row touched (idempotency event recorded) |
  | `customer.subscription.updated` | `past_due` / `unpaid` / `paused` | `v_new_status := 'past_due'` | Subscriptions set to `'past_due'` (access revoked) |
  | `customer.subscription.updated` | `canceled` | `v_new_status := 'canceled'` | Subscriptions set to `'canceled'` (access revoked, never reactivated) |
  | `customer.subscription.updated` | `trialing` | `v_new_status := 'active'` | Subscriptions kept `'active'`, trial flags & +6h grace end preserved |
  | `customer.subscription.updated` | `active` | `v_new_status := 'active'` | Trial converted in place (`is_trial=false`, `converted_at` stamped); paid renewed |
  | `customer.subscription.deleted` | Any | `v_new_status := 'canceled'` | Subscriptions set to `'canceled'` |
  | `invoice.payment_failed` | Any | `v_new_status := 'past_due'` | Subscriptions set to `'past_due'` |
  | `charge.refunded` | Any | `v_new_status := 'canceled'` | Subscriptions set to `'canceled'` |
---

### 11. Trial Checkout Session, Billing Portal & Trial Button Integration (Release v1.9.0)

- **create-checkout-session Edge Function (`supabase/functions/create-checkout-session/index.ts`)**:
  - Gated server-side by `CHECKOUT_ENABLED !== 'true'` (only `profiles.is_admin` allowed in production until global switch).
  - Inspects trial eligibility for `'rccp'` via service-role RPC `trial_eligibility_for(p_user_id, 'rccp')`.
  - Eligible trials:
    - Mode: `'subscription'`.
    - `subscription_data.trial_period_days`: set to offer `trial_days`.
    - `subscription_data.trial_settings.end_behavior.missing_payment_method`: `'cancel'`.
    - `payment_method_collection`: `'always'`.
    - `phone_number_collection.enabled`: `true`.
    - `metadata.trial`: `'true'` set on both session and `subscription_data`.
    - `custom_text.submit.message`: `"{N} days free, then A${price}/month starting {date}. Cancel anytime before then."` with date and price computed server-side.
    - Return payload: `{ url: session.url, trial: true }`.
  - Non-eligible callers:
    - Standard paid checkout created without trial parameters.
    - Return payload: `{ url: session.url, trial: false, reason: eligibility.reason }`.
  - 409 Double-charge guard: updated to block both `'active'` and `'trialing'` rows for single-seat tools. Order Bot exempt.
  - Redirect URLs: `success_url = `${origin}/dashboard?checkout=success``, `cancel_url = `${origin}/tools/rccp``.
- **create-portal-session Edge Function (`supabase/functions/create-portal-session/index.ts`)**:
  - Validates caller JWT from `Authorization` header.
  - Not gated by `CHECKOUT_ENABLED`.
  - Queries `public.subscriptions` for user's most recent row with non-null `stripe_customer_id`.
  - If missing: returns HTTP 404 `{ error: 'No Stripe customer found for this account.', code: 'no_customer' }`.
  - If present: creates Stripe billing portal session with `return_url = `${origin}/dashboard`` and returns `{ url: portalSession.url }`.
- **Frontend Trial & Checkout Integration**:
  - Single checkout initiator `startTrialCheckout()` in `src/lib/checkout.ts`:
    - Signed out: redirects to `/auth?mode=signup&next=<sanitized path>`.
    - Signed in: invokes `create-checkout-session` and redirects to Stripe Checkout.
  - Single portal initiator `redirectToBillingPortal()` in `src/lib/checkout.ts`: invokes `create-portal-session` and redirects to Stripe Customer Portal.
  - Legacy `claim_free_trial` removed from frontend entirely.
  - Client-safe error messages in `getClaimErrorMessage` for `checkout_required`, `card_already_used`, `phone_already_used`, `phone_missing`, `card_missing`, `no_slots`.
  - `/dashboard?checkout=success` polling: polls `get_trial_status` every 2s for up to 40s. Shows *"Setting up your trial..."* while polling, *"Your free trial is active until {date}"* on success, error message and *"Subscribe"* button on denial, or timeout notice if 40s elapsed.
  - 4 RCCP card states on Dashboard:
    1. Not eligible or no trial: *"Subscribe"* button.
    2. Trial active: trial end date and *"Manage subscription"* button.
    3. Paid active: renews date and *"Manage subscription"* button.
    4. Locked and eligible: *"Start free trial now"* button.
  - Pricing transparency caption: `"{trial_days} days free, then A${price}/month. Card required. Cancel anytime."` next to every trial button.
  - Fail-safe rule: when trial offer is disabled, UI identically matches v1.7.0.
  - Billing page (`src/pages/Billing.tsx`): upgraded from "Coming Soon" placeholder to an active portal launch card with *"Manage subscription"* button.




