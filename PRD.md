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

---

### 12. Trial Hardening: Single-Seat Enforcement & Duplicate Subscription Guard (Release v1.9.1)

- **Single-Seat Server-Side Quantity Enforcement (`create-checkout-session`)**:
  - For `product_slug = 'rccp'` (and any single-seat product, i.e. everything except `'orderbot'`), quantity is strictly forced to `1` server-side (`effectiveQuantity = 1`), completely ignoring any client-submitted value.
  - For `'orderbot'` (multi-store expansion), client-submitted quantity is preserved (`Number(body.quantity)`), with server-side validation enforcing `quantity >= 1`.
  - Edge cases:
    - Client passes `{ product_slug: 'rccp', quantity: 10 }`: line item created with `quantity: 1`.
    - Client passes `{ product_slug: 'orderbot', quantity: 0 }`: returns HTTP 400 (`Invalid parameters`).
- **Duplicate-Subscription Guard (`stripe-webhook`)**:
  - In the trial checkout path (`checkout.session.completed` with `metadata.trial = 'true'`), BEFORE calling `finalize_card_trial` or `process_stripe_webhook_event`, the function looks up the user's existing `public.subscriptions` row for the resolved access slug (`cpbot`) with `store_id IS NULL` using the service-role client.
  - **Duplicate Handling**: If an existing row is found with a DIFFERENT `stripe_subscription_id` and its status is not `'canceled'`:
    - This represents a duplicate checkout (e.g. from rapid double-clicks or parallel browser tabs).
    - The NEW Stripe subscription is immediately cancelled via `stripe.subscriptions.cancel(p_stripe_subscription_id)` (no charge).
    - The database row in `public.subscriptions` is NOT touched.
    - Webhook returns HTTP 200 with `{ received: true, duplicate_subscription: true }`.
    - If cancellation fails, returns HTTP 500 so Stripe will retry.
  - **Event Retries**: If `stripe_subscription_id` is the SAME, this is an idempotent retry of the same event; execution proceeds normally to `finalize_card_trial` and `process_stripe_webhook_event`.
  - **Behaviour Note**: Two parallel trial checkouts by one user end with exactly one active Stripe subscription (the second is cancelled).
- **Stripe Test Run Methodology**:
  - Corrected test run procedure: Stripe test runs verify trial-to-paid conversion using the Stripe dashboard **"End trial"** action on the subscription instead of a test clock (because Stripe Checkout cannot attach to a test clock).

---

### 13. Webhook Stripe Endpoint API Version Independence (Release v1.9.2)

- **API Version Independence**:
  - Webhook endpoint API versions (such as `2026-02-25.clover`) no longer cause `RangeError` crashes or missed subscription resolution.
  - Pinned SDK compatibility module: `supabase/functions/_shared/stripeCompat.ts`.
- **Safe Period Extraction (`getPeriod`)**:
  - Resolves `{ start, end }` ISO strings by prioritizing top-level `current_period_start`/`current_period_end` when numeric, and falling back to `sub.items.data[0].current_period_start`/`current_period_end` (clover shape).
  - Returns `null` on missing/invalid timestamps, triggering a graceful HTTP 500 error log without throwing `RangeError: Invalid time value`.
- **SDK Subscription Re-Retrieval**:
  - For `customer.subscription.*` events, only `event.data.object.id` is read from the webhook payload; the subscription is re-fetched via `stripe.subscriptions.retrieve(id)` to ensure all properties conform to the pinned SDK type model. Returns HTTP 500 if retrieval fails.
- **Invoice Subscription Resolution (`getInvoiceSubscriptionId`)**:
  - Resolves subscription IDs from `invoice.subscription` (legacy) or `invoice.parent.subscription_details.subscription` (clover).
  - Applied to `invoice.payment_failed` and `charge.refunded` (after retrieving the invoice).
  - When an invoice has no subscription ID (e.g. one-off non-subscription invoice), returns HTTP 200 `{ received: true, skipped: 'no_subscription' }` to stop retry loops.
- **QA Guarantees**:
  - **"End trial" in Stripe Dashboard**: Triggers `customer.subscription.updated` with status `'active'`; webhook re-fetches subscription, detects active status, converts subscription in place (`is_trial = false`, `grant_reason = 'stripe_checkout'`), and stamps `converted_at`.
  - **Cancelling in Portal During Trial**: Sets `cancel_at_period_end = true` in Stripe; webhook mirrors this flag via `mirror_cancel_at_period_end`, keeps `is_trial = true`, and preserves the trial end date and grace window.

---

### 14. Dashboard Light Theme, Card Deduplication, and Manual Grant Polish (Release v1.9.3)

- **Visual Design Alignment with /tools**:
  - Restyled `/dashboard` from legacy dark teal (`bg-teal-900`) to the landing-page treatment used by `/tools`: `min-h-screen bg-mint-50 text-teal-900 time-fold-ripple selection:bg-teal-600 selection:text-white`.
  - Cards updated to white surface with subtle borders and shadows: `bg-white rounded-2xl border border-teal-600/20 shadow-sm hover:shadow-lg transition-all duration-300`, removing dark background patches and noise overlays.
  - Typography: Heading *"Your dashboard"* (`text-teal-900 font-display`) and subtitle (`text-teal-900/80 font-display`) with >= 4.5:1 contrast on `bg-mint-50`.
  - Buttons: Primary buttons use `bg-yellow-accent text-teal-900 hover:bg-yellow-accent/90`; secondary action buttons use teal outline `border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-600`.
  - Badges: Restyled for light surface with WCAG AA compliance (Active in `bg-green-600/10 text-green-700`, Coming soon in `bg-teal-600/10 text-teal-700`, Not purchased in `bg-zinc-100 text-zinc-600`, Maintenance in `bg-amber-500/10 text-amber-800`).
  - Skeleton loaders, Order Bot store cards, and modal dialogs aligned to the clean white/mint palette.
- **Strict Single-Section Card Assignment & Deduplication**:
  - Pure helper `categorizeDashboardTools` in `src/lib/dashboardSections.ts`:
  - Every tool card appears in exactly ONE section:
    1. *Your tools* (`activeTools`): Contains tools to which the user has active, unexpired access (active or trialing, not expired, including manual grants), plus free tools (`rccp` with Return Converter).
    2. *Available* (`availableTools`): Contains catalog tools available for purchase that the user does not own.
    3. *Coming soon* (`comingSoonTools`): Contains tools with `status = 'coming_soon'` that the user does NOT own.
  - Active access automatically excludes a tool from both *Coming soon* and *Available*. For example, an owner with an active ListFlow grant sees ListFlow only under *Your tools*; ListFlow is excluded from *Coming soon*.
  - Order Bot exception: Visible under *Your tools* if user has active subscription AND active stores; visible under *Available* if user has active subscription but no stores yet; completely hidden otherwise.
  - Invoice Generator is always hidden.
- **Manual Grant Fixes & Subscription Management Gating**:
  - *Manage Subscription Button Visibility (`canManageSubscription`)*:
    - Shown ONLY when the user's subscription row has a Stripe link (`stripe_customer_id` or `stripe_subscription_id`) AND `manually_granted` is NOT true.
    - Added `manually_granted, stripe_subscription_id, stripe_customer_id` to the existing `subscriptions` query in `Dashboard.tsx` (no new queries).
    - For manual grants or rows without Stripe, the *Manage subscription* button is omitted entirely.
  - *Date Label Accuracy (`getSubscriptionDateText`)*:
    - For manually granted rows: Displays *"Access until {date}"* (or *"Access: no end date"* / *"CP Bot access: no end date"* when `current_period_end` is null) instead of *"renews {date}"*.
    - For paid Stripe rows: Displays *"Renews {date}"* (or *"CP Bot renews {date}"*).
    - For trial rows: Preserves *"Free trial ends {date}"*.

---

### 15. Email Logo Asset and Webhook Refund Fix (Release v1.9.4)

- **Email Branding Logo Asset**:
  - Hosted static asset: `https://www.automationalchemists.com/email-logo.png`.
  - Stored in `public/email-logo.png` (copied directly to `dist/email-logo.png` on build).
  - Specifications: 400x400 PNG, logo centered with ~12% padding (48px padding on each side, 304x304 inner logo area), flattened on pure `#000000` (RGB, no alpha channel transparency), optimized byte size under 100 KB (~30.56 KB).
  - Vercel routing guarantee: Static assets physically existing in `dist/` take precedence over SPA catch-all rewrites in `vercel.json`, serving the image directly with standard caching headers.
- **Webhook Refund Handling Under Modern Stripe API Versions (`2026-02-25.clover`)**:
  - In modern Stripe payload schemas (such as `2026-02-25.clover`), the Charge object delivered in `charge.refunded` payloads no longer contains the `invoice` field.
  - SDK Re-Retrieval: In the `charge.refunded` branch of `supabase/functions/stripe-webhook/index.ts`, only the charge ID (`event.data.object.id`) is read from the webhook payload.
  - The full charge object is re-retrieved via `stripe.charges.retrieve(chargeId)` using the SDK's pinned API version.
  - On retrieval failure, returns HTTP 500 so Stripe automatically retries delivery.
  - Invoice Resolution Helper (`getChargeInvoiceId`): Resolves the invoice ID from the retrieved charge (handling string IDs or expanded objects with `.id`).
  - Access Revocation: Retrieves the associated invoice, resolves the subscription ID via `getInvoiceSubscriptionId`, retrieves the subscription, and invokes the atomic RPC `process_stripe_webhook_event` with `p_quantity = 0` to revoke access.
  - If a charge is a non-subscription one-off payment with no invoice or subscription, returns HTTP 200 `{ received: true, skipped: 'no_subscription' }` to avoid retry loops.

---

### 16. Invoice Generator Product Page, Tools Card & Dashboard Button Accessibility (Release v1.10.0)

- **Invoice Generator Product Page (`/tools/invoice-generator`)**:
  - **What it does**: Provides a dedicated, responsive marketing landing page for the Invoice Generator web app built for marketplace sellers (eBay, Amazon, Walmart).
  - **Why**: Allows marketplace sellers to understand how to create custom invoices, save them to their account, and send PDF invoices via Gmail, starting with a free monthly allowance.
  - **Design & Layout**: Mirrors the `/tools/rccp` structure and brand tokens (`teal-900` `#0A363D`, `teal-800` `#104B54`, `teal-600` `#207680`, `mint-50` `#EBF4F4`, `bg-yellow-accent` `#FFD200` for primary CTA only). Includes breadcrumb navigation, product logo, parent brand badge ("by Automation Alchemists"), 4 feature cards, 3 workflow steps, "What's included for free" allowance, and an interactive 6-item accordion FAQ.
  - **External App Integration**: The main "Start free" button directs users to `https://invoice-generator-mu-pearl.vercel.app/signup` in a new tab (`target="_blank" rel="noopener noreferrer"`). Clearly informs users with a small note that it uses a separate Invoice Generator account for now.
  - **URLs Config**: App URLs are maintained in config constants (`APP_SIGNUP_URL`, `APP_PRIVACY_URL`) in `src/data/invoiceGeneratorPage.ts`.
  - **Screenshots Section**: Driven by a config array; remains cleanly hidden until screenshot assets are ready, avoiding placeholder imagery.
  - **Implementation**: Implemented in `src/pages/tools/InvoiceGeneratorToolPage.tsx`, `src/data/invoiceGeneratorPage.ts`, `src/App.tsx`, and `public/invoice-generator-logo.png`.

- **Tools Directory 3-Card Grid (`/tools`)**:
  - **What it does**: Displays the Invoice Generator alongside Return Converter x CopyPaste Bot and ListFlow in a balanced 3-column desktop/tablet layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
  - **Card Content**: Displays category tag "INVOICING", "Free" badge, product logo, title, description ("Create, save and send custom invoices for your marketplace customers."), feature bullet points, "Free to get started" price label, and a "Learn more" button linking to `/tools/invoice-generator`.
  - **Implementation**: Implemented in `src/pages/Tools.tsx`.

- **Site Navigation & SEO Registration**:
  - Added Invoice Generator to desktop navbar "Our Tools" dropdown (with logo icon) and mobile drawer.
  - Registered route in `scripts/prerender.js` and `scripts/generate-sitemap.js`.
  - Updated SoftwareApplication JSON-LD and SEO metadata.
  - **Implementation**: Implemented in `src/components/Navigation.tsx`, `scripts/prerender.js`, `scripts/generate-sitemap.js`.

- **Dashboard Button Visibility & Contrast Fixes (`/dashboard`)**:
  - **What it does**: Ensures every button on the customer dashboard has a crisp, clearly readable label.
  - **Root Cause & Fix**: Secondary outline buttons previously used shadcn `Button variant="outline"` which injected `bg-background` (`#0A363D`) underneath dark teal text (`text-teal-900`), making text invisible prior to hover. Explicitly added `bg-transparent` across all dashboard outline buttons ("Open Return Converter", "Manage subscription", "Buy now", store actions) to expose the white card background and deliver 11.4:1 contrast.
  - **ListFlow Button Update**: Changed the ListFlow card button from an active notify button to a muted, disabled "Coming soon" button matching `/tools` (`bg-teal-600/10 text-teal-900/60 font-semibold cursor-not-allowed border border-teal-600/20`).
  - **Dashboard Isolation**: Invoice Generator is strictly hidden from `/dashboard` (no card rendered, zero database changes).
  - **Implementation**: Implemented in `src/pages/Dashboard.tsx`.

---

### 17. Launch Readiness: Central Pricing, Australian GST, Terms Consent, and Billing States (Release v1.11.0)

- **Central Pricing Configuration (`src/config/pricing.tsx` & `src/config/pricing.ts`)**:
  - **What it does**: Establishes a single central source of truth for pricing across the entire frontend: standard price `9.99` AUD, promotional launch price `4.99` AUD, GST inclusive (`true`), and no fixed launch deadline (`launchEndsOn = null`).
  - **Why**: Eliminates hard-coded price strings and prevents inconsistent or broken pricing copy across pages, structured data schemas, and cart views.
  - **Display Requirements**:
    - Standard price rendered crossed out using `<s><span className="sr-only">was A$9.99</span>A$9.99</s>`.
    - Launch price rendered as `A$4.99/month` with a prominent `"Launch price"` pill and `"incl. GST"` notice.
    - Zero fake countdown timers or fabricated deadline dates.
  - **Trial Terms Policy Notice (`<TrialTermsLine />`)**:
    - Rendered immediately adjacent to every free trial CTA button across the site (`/tools`, `/tools/rccp`, and customer dashboard).
    - Exact copy: *"Free for 30 days, then A$4.99/month (launch price, normally A$9.99), incl. GST, charged automatically until you cancel. By starting your trial you agree to the Terms of Service and Privacy Policy."*
    - Trial length (`30`) dynamically resolves from `trial_offers` configuration; pricing values from `PRICING_CONFIG`. Links open in new tabs (`target="_blank" rel="noopener noreferrer"`).
  - **Implementation**: `src/config/pricing.tsx`, `src/config/pricing.ts`, `src/pages/Tools.tsx`, `src/pages/tools/RccpToolPage.tsx`, `src/components/DashboardTrialCard.tsx`, `src/pages/Cart.tsx`, `src/data/tools.ts`, `src/data/rccpPage.ts`.

- **Product Naming & Separation**:
  - **What it does**: Formally solidifies that the paid tool is named **"CP Bot"** (Copy Paste Bot).
  - **Clarification**: Return Converter is explicitly described as free and not part of the subscription plan.
  - **Implementation**: `src/data/tools.ts`, `src/data/rccpPage.ts`, `src/pages/Cart.tsx`.

- **Australian GST Compliance & Terms Consent in Checkout (`create-checkout-session`)**:
  - **What it does**: Ensures Stripe checkout sessions and all renewal invoices carry Australian GST (10% inclusive).
  - **Parameter Builder Helper**: Extracted into `supabase/functions/create-checkout-session/params.ts` (`buildCheckoutSessionParams`).
  - **Tax Rate Configuration**: Reads secret `STRIPE_GST_TAX_RATE_ID` via `Deno.env.get('STRIPE_GST_TAX_RATE_ID')` and sets `subscription_data.default_tax_rates = [taxRateId]`.
  - **Fail-Closed Security**: If `STRIPE_GST_TAX_RATE_ID` is missing or empty, returns HTTP 500 (`"GST tax rate not configured"`) and creates no session.
  - **No Automatic Tax Invariant**: Stripe Tax / `automatic_tax` is strictly disallowed and runtime-asserted.
  - **Terms Acceptance**: Enforces `consent_collection.terms_of_service = 'required'` and `custom_text.terms_of_service_acceptance.message = 'I agree to the [Terms of Service](https://rccp.automationalchemists.com/terms-of-service) and [Privacy Policy](https://rccp.automationalchemists.com/privacy).'`.
  - **Implementation**: `supabase/functions/create-checkout-session/params.ts`, `supabase/functions/create-checkout-session/index.ts`.

- **Customer Dashboard Billing States (`src/lib/billingView.ts`)**:
  - **What it does**: Evaluates subscription records into deterministic UI states:
    - `none / expired`: Subscribe / Start trial CTA.
    - `trialing`: *"Free trial active - ends on <date>"* with *"Manage billing"* button.
    - `trialing_canceled` (`cancel_at_period_end = true`): *"Trial cancelled - access until <date>; no charge"*.
    - `active` (paid): *"Subscription active - renews on <date>"* with *"Manage billing"* button.
    - `active_canceled` (paid, `cancel_at_period_end = true`): *"Cancelled - access until <date>"*.
    - `past_due`: Alert banner *"Payment failed - CP Bot is paused. Update your payment method to restore access."* with primary button *"Update payment method"* (opens Stripe Billing Portal via `create-portal-session`). All Subscribe / Start trial buttons and cards are suppressed in this state.
  - **Date Formatting**: Australian Sydney timezone (`Australia/Sydney`) in `en-AU` locale (e.g. "30 November 2026").
  - **Implementation**: `src/lib/billingView.ts`, `src/lib/dashboardSections.ts`, `src/pages/Dashboard.tsx`.

- **Signup Landing Redirect**:
  - **What it does**: Sets `emailRedirectTo: `${window.location.origin}/dashboard`` during user sign-up so confirmed users land on `/dashboard`.
  - **Implementation**: `src/hooks/useAuth.tsx`, `src/pages/Auth.tsx`.
---

### 18. Billing Details Collection at Checkout (Release v1.12.0)

- **Full Billing Address Collection (`create-checkout-session`)**:
  - **What it does**: Configures Stripe Checkout sessions to mandate collection of the customer's full physical billing address (street address, city, state/province, postal code, and country) rather than just country and postal code.
  - **Why**: Australian tax compliance and professional accounting require complete "Bill to" address details on tax invoices issued for trials and recurring subscriptions.
  - **Implementation**: Set `billing_address_collection: 'required'` in `buildCheckoutSessionParams` (`supabase/functions/create-checkout-session/params.ts`).
  - **Contact Details**: Enforces phone number collection (`phone_number_collection: { enabled: true }`) and customer email across all checkout sessions.

- **Customer Update & Saved Billing Details**:
  - **What it does**: Ensures customer names and billing addresses captured at checkout can be synchronized to the Stripe Customer object so subsequent automated invoices render complete billing details.
  - **Stripe API Constraint**: `customer_update: { name: 'auto', address: 'auto' }` is valid exclusively when a session is attached to an existing Stripe `customer` ID. Supplying `customer_update` alongside `customer_email` causes a Stripe API rejection (`customer_update requires a customer`).
  - **Implementation**: `buildCheckoutSessionParams` accepts `customerId?: string | null`. When `customerId` is provided, sets `customer` and attaches `customer_update: { name: 'auto', address: 'auto' }`. When only `user.email` is present (the current pattern in `create-checkout-session/index.ts`), `customer_update` is omitted to preserve API safety.

- **Business / Company Name Collection & SDK Compatibility Analysis**:
  - **What it does**: Researches and implements parameter support for collecting an optional business name alongside required individual names.
  - **Stripe API Version Dependency**: First-class `name_collection` (`{ individual: { enabled: true, optional: false }, business: { enabled: true, optional: true } }`) requires Stripe API version `2025-09-30.clover` or higher (available in `stripe` SDK v19+).
  - **SDK Status**: `create-checkout-session` currently imports `stripe@14.22.0` (Stripe API version `2023-10-16`), which rejects `name_collection` with `Received unknown parameter: name_collection`.
  - **Implementation Strategy**: Added type and parameter building support in pure helper `params.ts` (`nameCollection?: ...`) verified by offline unit tests. Live checkout execution pauses `name_collection` emission pending SDK upgrade to avoid runtime checkout errors.

---

### 19. Live Free-Trial Spots Banner on RCCP Tool Landing Page (Release v1.13.0)

- **Real-Time Spots Left Tracking & Database Single Source of Truth**:
  - **What it does**: Displays the real, live number of available free-trial spots out of the total capacity (e.g. *"100 of 100 free-trial spots left"* or *"Only 7 free-trial spots left"*) near the top of the RCCP tool landing page (`/tools/rccp`).
  - **Database Integration**: Directly queries `public.get_trial_public('rccp')` / `public.get_trial_status('rccp')`.
  - **Calculation Invariant**: `v_slots_taken := slots_reserved + (SELECT COUNT(*) FROM trial_claims WHERE tool_slug = p_tool_slug);` and `v_slots_left := GREATEST(slot_cap - v_slots_taken, 0);`.
  - **Zero Hard-Coding**: Fully dynamic; respects database changes (such as owner increasing cap from 5 to 100) with zero hardcoded numbers.
  - **State Machine Helper (`src/lib/trialBanner.ts`)**: Pure function `getTrialBannerView` mapping database stats to deterministic UI states:
    - `loading`: Structural skeleton, zero layout shift, hides all numerical claims.
    - `available`: Normal display with live spots count, percentage progress bar, and "Start your free trial" CTA.
    - `low`: Urgent state triggered when `spotsLeft <= Math.max(1, Math.ceil(slotCap * 0.1))` (e.g. <= 10 spots for cap 100, <= 1 for cap 5), featuring "Almost gone" badge, amber styling, singular/plural grammar ("Only N free-trial spots left"), and "Claim your spot now" CTA.
    - `sold_out`: 0 spots left; truthfully explains all promotional spots are claimed and CP Bot is available at the launch price (`A$4.99/mo`), with "Get CP Bot now" CTA.
    - `hidden`: Offer disabled, fetch error, or invalid data; fails closed and renders nothing.

- **Anonymous Visitor Access & Prerender Safety**:
  - **What it does**: Ensures unauthenticated prospects landing on `/tools/rccp` see live trial availability without authentication barriers.
  - **RPC Security**: Reuses existing `public.get_trial_public(p_tool_slug)` (`SECURITY DEFINER`, fixed `search_path = public, pg_temp`, granted to `anon` and `authenticated`). No new database migration or schema changes required.
  - **Prerender Guard**: Prerender script (`scripts/prerender.js`) executes in a headless browser with `window.__PRERENDER__ = true`. The banner detects prerendering and initial client mount, rendering a lightweight structural skeleton. Prerendered static HTML never bakes in stale or snapshot numbers.

- **Live Polling & Accessibility**:
  - **What it does**: Keeps displayed spots synchronized with live checkouts across active browser tabs.
  - **Polling Frequency**: Automatically refetches every 30 seconds while `document.visibilityState === 'visible'`.
  - **Refocus Refetch**: Immediately refetches when the browser tab regains focus (`window.addEventListener('focus')`) or visibility changes to visible.
  - **Smooth Number Countdown**: Animates numerical decrements using `framer-motion`'s `animate` helper over 0.8s.
  - **Accessibility**: Number element tagged with `aria-live="polite"` and `tabular-nums` to inform screen readers without spamming. Animation is bypassed instantly when `prefers-reduced-motion` is detected.
  - **Progress Bar**: Accessible `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`.

- **Call to Action & Pricing Transparency**:
  - **What it does**: Standardizes trial initiation directly to the unified checkout path.
  - **Single Checkout Path**: Clicking "Start your free trial" / "Claim your spot now" triggers `startTrialCheckout({ returnPath: '/tools/rccp', user, toast })` (redirects unauthenticated users to `/auth?mode=signup&next=/tools/rccp`, and initiates Stripe trial checkout for authenticated users). Clicking "Get CP Bot now" when sold out invokes `handleGetAccessLogic('rccp', user, toast)`.
  - **Dynamic Legal Terms**: Mounts `<TrialTermsLine trialDays={trialDays} />` directly under the CTA button, pulling launch price, standard price, and GST notices strictly from `PRICING_CONFIG` without hand-typed prices.

- **Landing Page Spots Counter Consolidation**:
  - **What it does**: Removes the duplicate small text line (`{slotsLeft} of {slotCap} free-trial spots left`) previously located below the secondary hero card trial CTA button on `/tools/rccp`.
  - **Single Banner Authority**: On the landing page, the spots remaining number is displayed exclusively by the new top `TrialSpotsBanner`, eliminating visual clutter and competing counters.
  - **Preserved Elements**: The hero card CTA button (`Get your 30-day free trial now`), promotional price display (`A$4.99/mo launch price`), and `<TrialTermsLine />` (terms of service and privacy links) are completely preserved.
  - **Dashboard Invariant**: The customer dashboard trial card (`DashboardTrialCard.tsx`) retains its own spots remaining counter.


---

### 20. Consistent Trial End Date & Trial Gating by Card and Email Only (Release v1.14.0)

- **Consistent Free Trial End Date Calculation & Formatting (Task A)**:
  - **What it does**: Resolves a critical date synchronization discrepancy where the customer dashboard trial banner (`DashboardTrialCard`) and tool card (`getBillingView` / `Dashboard.tsx`) displayed different calendar days for trial subscriptions initiated in evening Sydney time.
  - **Root Cause & Buffer Invariant**: Database procedure `process_stripe_webhook_event` provisions trialing subscriptions in `public.subscriptions` with `current_period_end = p_current_period_end + interval '6 hours'` to prevent the automated `pg_cron` job (`expire-past-due-subscriptions`) from terminating customer access during Stripe's ~1-hour invoice generation window. When a trial was started after ~18:00 Sydney time (AEDT UTC+11), adding 6 hours crossed midnight into the following day. Stored `current_period_end` remained buffered, causing `getBillingView` to format the next calendar day, while `DashboardTrialCard` formatted unbuffered `trial_claims.trial_ends_at` in a different locale format (`en-GB`).
  - **Shared Constants & Effective End Calculation**:
    - Extracted single source of truth in [`src/lib/billingView.ts`](file:///G:/app%20development/AutomationAlchemists/src/lib/billingView.ts): `TRIAL_GRACE_BUFFER_HOURS = 6` and `TRIAL_GRACE_BUFFER_MS = 21,600,000`.
    - Pure helper `getEffectiveTrialEnd(currentPeriodEnd, isTrial)`: Subtracts the 6-hour buffer exclusively for trial subscriptions (`is_trial = true` or `status = 'trialing'`), ensuring displayed dates strictly match Stripe's true `trial_end`.
    - Paid subscriptions (`is_trial = false`) remain unadjusted so renewal dates are never shifted.
    - Database storage and access gating remain unadjusted based on the buffered value.
  - **Standardized Display Format**:
    - Standardized on a single date format across all customer-facing surfaces: `formatBillingDate(date)` using `en-AU` locale and `Australia/Sydney` timezone with options `{ day: 'numeric', month: 'long', year: 'numeric' }` (e.g. `"3 December 2026"`).
    - Banner: `Free trial: 30 days left (ends 3 December 2026)` / `Your free trial is active until 3 December 2026`.
    - Tool Card: `Free trial active - ends on 3 December 2026`.
    - Both surfaces display the exact same calendar day matching Stripe Checkout.
  - **Files Implementing It**: [`src/lib/billingView.ts`](file:///G:/app%20development/AutomationAlchemists/src/lib/billingView.ts), [`src/lib/trial.ts`](file:///G:/app%20development/AutomationAlchemists/src/lib/trial.ts), [`src/components/DashboardTrialCard.tsx`](file:///G:/app%20development/AutomationAlchemists/src/components/DashboardTrialCard.tsx), [`src/lib/dashboardSections.ts`](file:///G:/app%20development/AutomationAlchemists/src/lib/dashboardSections.ts).

- **Trial Gating by Card Fingerprint and Normalized Email Only (Task B)**:
  - **What it does**: Redefines promotional free trial uniqueness rules so that trials are limited strictly per normalized email (`trial_claims.email_normalized`) and per card fingerprint (`trial_identities` where `kind = 'card'`). Phone numbers no longer block, deny, or lock customer access.
  - **Phone Numbers No Longer Block**:
    - A customer who provides a phone number previously entered on another account is no longer denied a free trial, provided they use a unique card and unique personal email.
    - Omission of phone number or duplicate phone entry never causes denial.
  - **Checkout Phone Collection Maintained**:
    - Stripe Checkout continues to collect phone numbers across all checkout sessions (`phone_number_collection = { enabled: true }`) to populate customer invoice and billing contact records.
  - **Historical Data Preservation**:
    - Existing records with `kind = 'phone'` in `public.trial_identities` are preserved without modification or deletion.
    - Stored procedure `public.finalize_card_trial` ignores existing `kind = 'phone'` rows and ceases writing new `kind = 'phone'` rows.
  - **Database Migration 035 (Pending Owner Execution)**:
    - Authored in [`supabase/migrations/035_trial_identity_card_email_only.sql`](file:///G:/app%20development/AutomationAlchemists/supabase/migrations/035_trial_identity_card_email_only.sql).
    - Preserves `p_phone_hash` parameter for zero-broken-window backward compatibility with live edge functions.
    - Removes `phone_missing` and `phone_already_used` denial triggers.
    - Checks and registers only `kind = 'card'`.
  - **Client Error Messages Updated**:
    - Removed `phone_already_used` and `phone_missing` from `getClaimErrorMessage` in [`src/lib/trial.ts`](file:///G:/app%20development/AutomationAlchemists/src/lib/trial.ts).
    - Email and card denial copy remains active.

---

### 21. Cart Page Crash Fix, RCCP Tool Page Crash Fix & Identifier Sweep (Release v1.14.1 Hotfix)

- **Cart Page Loading Crash Resolution (`src/pages/Cart.tsx`)**:
  - **What it does**: Resolves a critical launch blocker where clicking the "Subscribe" button on the customer dashboard alert (shown to a customer whose trial checkout was refused due to an already-used card) resulted in a full-page runtime crash on `/cart`.
  - **Root Cause**: `src/pages/Cart.tsx` rendered `<PageLoader pageName="Authenticating..." />` when `authLoading` was true or `!user`. However, `PageLoader` was referenced without being imported from `src/components/PageLoader.tsx`. At runtime, evaluation of the un-imported identifier threw `ReferenceError: PageLoader is not defined`, crashing into `ErrorBoundary`.
  - **Resolution**: Reused the standard shared `<PageLoader />` component via explicit import `import PageLoader from "@/components/PageLoader";`.
  - **Files Implementing It**: [`src/pages/Cart.tsx`](file:///G:/app%20development/AutomationAlchemists/src/pages/Cart.tsx).

- **Global Identifier Sweep & Account Deletion Modal Fix (`src/pages/Account.tsx`)**:
  - **What it does**: Comprehensive static sweep across all 149 TypeScript/TSX source files in `src/` to identify and resolve any un-imported components or identifiers causing runtime `ReferenceError` exceptions.
  - **Sweep Results**:
    - `src/pages/Cart.tsx:150`: Missing `PageLoader` import (fixed).
    - `src/pages/Account.tsx:538`: Missing `ShieldAlert` icon import in the delete account confirmation modal `<ShieldAlert className="w-6 h-6" />`. Fixed by adding `ShieldAlert` to `lucide-react` imports.
    - All other 8 occurrences of `PageLoader` across `src/` verified properly imported.
    - Zero TS2304 / TS2552 missing identifier errors remaining across the entire project. Total TypeScript diagnostic errors reduced from 101 to 98.
  - **Files Implementing It**: [`src/pages/Account.tsx`](file:///G:/app%20development/AutomationAlchemists/src/pages/Account.tsx), [`scripts/test-identifier-sweep.mjs`](file:///G:/app%20development/AutomationAlchemists/scripts/test-identifier-sweep.mjs).

- **Return Converter x CopyPaste Bot Tool Page Crash Fix (`src/pages/tools/RccpToolPage.tsx`)**:
  - **What it does**: Eliminates a runtime crash on `/tools/rccp` where logged-in accounts with an active free trial crashed into the full-page ErrorBoundary.
  - **Root Cause & Origin**: In `src/pages/tools/RccpToolPage.tsx:71`, `timeLeftFormatted` was assigned the direct result of `formatTrialTimeLeft(endsAt)` (which returns an object with shape `{ text, hoursLeft, daysLeft, formattedDate }`). When rendered in JSX inside `<span>({timeLeftFormatted})</span>` (line 248), React 18 threw an unhandled exception because plain JavaScript objects cannot be rendered as React children. Traced via `git log -S "timeLeftFormatted"` to commit `33db4b9` in v1.5.0 (dormant while free trials were switched off in production). It was not introduced in v1.13.0.
  - **Resolution**: Updated line 71 to extract the `.text` string property (`formatTrialTimeLeft(endsAt).text`). Added defensive `isNaN` guard in `src/lib/trial.ts` to return `'0 hours left'` safely if an invalid date string is encountered.
  - **Files Implementing It**: [`src/pages/tools/RccpToolPage.tsx`](file:///G:/app%20development/AutomationAlchemists/src/pages/tools/RccpToolPage.tsx), [`src/lib/trial.ts`](file:///G:/app%20development/AutomationAlchemists/src/lib/trial.ts).

- **Error Boundary Exception Logging Enhancement (`src/components/ErrorBoundary.tsx`)**:
  - **What it does**: Updates `ErrorBoundary`'s `componentDidCatch` lifecycle method to emit `console.error('ErrorBoundary caught an error:', error, errorInfo?.componentStack)` before triggering session reload or telemetry logging.
  - **Preserved UI**: What the user sees on crash screens remains completely unchanged.
  - **Files Implementing It**: [`src/components/ErrorBoundary.tsx`](file:///G:/app%20development/AutomationAlchemists/src/components/ErrorBoundary.tsx).

- **Automated Regression Guards**:
  - Integrated `scripts/test-identifier-sweep.mjs` into `scripts/test-launch-readiness.mjs` (Suite D2) to prevent any future missing identifier or broken mount regressions on `/cart` and `/tools/rccp`.

---

### 22. Denied-Trial Choices, Sign-Up Flow & Dashboard Open Tools Link (Release v1.15.0)

- **Denied-Trial Guided Recovery Choices (Task A)**:
  - **What it does**: Provides clear, actionable next steps when a customer's promotional free trial is denied after completing Stripe Checkout (due to an already-used card or email).
  - **Dual Recovery for Card Denial (`card_already_used`)**:
    - When a customer signs up with a valid account but enters a payment card already recorded for another trial, the webhook cancels the subscription and records `reason = 'card_already_used'`.
    - Under the retry cap, the dashboard alert and CP Bot tool card display TWO action buttons:
      1. *"Use another card"*: Invokes the standard existing `startTrialCheckout` flow to retry checkout with a different card.
      2. *"Subscribe at A$4.99/month"*: Invokes `handleGetAccessLogic('rccp')` to immediately subscribe to CP Bot at promotional launch pricing (charged today including GST).
  - **Single Recovery for Email Denial (`already_claimed`)**:
    - When a customer has already claimed a trial under this account or normalized email address, retrying with another card is impossible.
    - The dashboard alert and tool card display ONLY the *"Subscribe at A$4.99/month"* action button.
  - **Three-Strike Card Denial Cap**:
    - To prevent brute-force testing of multiple cards, each account is capped at a maximum of 3 card denials per tool (`CARD_DENIAL_RETRY_CAP = 3`).
    - The count is evaluated directly from `public.trial_denials` (`user_id = user.id`, `tool_slug = 'rccp'`, `reason = 'card_already_used'`).
    - When `cardDenialCount >= 3`:
      - *"Use another card"* is hidden.
      - *"Subscribe at A$4.99/month"* remains available.
      - Clear plain text is shown: *"The free trial is no longer available for this account."*.
  - **Server-Side Cap Enforcement in `create-checkout-session`**:
    - Pure helper `isCardDenialCapExceeded(cardDenialCount, cap)` in `supabase/functions/create-checkout-session/params.ts`.
    - `create-checkout-session` queries `public.trial_denials`. When `cardDenialCount >= 3`, forces `isEligibleTrial = false` with `trialEligibilityReason = 'card_denials_capped'`.
    - Safely falls back to a standard non-trial paid checkout session with default tax rates and terms consent (Edge Function updated, awaiting manual deployment by owner).
  - **Tool Card Consistency & Centralized Copy**:
    - CP Bot tool card on `/dashboard` suppresses the "Start free trial now" button when the account is in a denied state, displaying the exact same dual or single recovery options.
    - All button labels, alert copy, and prices are strictly centralized in `src/lib/trial.ts` (`TRIAL_DENIAL_TEXTS`, `getDeniedTrialChoice`, `getSubscribeButtonText`) and pulled dynamically from `PRICING_CONFIG`.
  - **Files Implementing It**: [`src/lib/trial.ts`](file:///G:/app%20development/AutomationAlchemists/src/lib/trial.ts), [`src/components/DashboardTrialCard.tsx`](file:///G:/app%20development/AutomationAlchemists/src/components/DashboardTrialCard.tsx), [`src/pages/Dashboard.tsx`](file:///G:/app%20development/AutomationAlchemists/src/pages/Dashboard.tsx), [`supabase/functions/create-checkout-session/params.ts`](file:///G:/app%20development/AutomationAlchemists/supabase/functions/create-checkout-session/params.ts), [`supabase/functions/create-checkout-session/index.ts`](file:///G:/app%20development/AutomationAlchemists/supabase/functions/create-checkout-session/index.ts).

- **Sign-Up Flow Guidance & Persistent Notice (Task B)**:
  - **What it does**: Eliminates confusion during customer onboarding when creating a new account.
  - **State Transition to Sign In**:
    - Upon successful submission of the "Create account" form in `src/pages/Auth.tsx`, the tab state automatically switches to "Sign in".
    - The email address entered during sign-up is automatically pre-filled in the sign-in form.
    - The password field is strictly wiped/cleared for security (never pre-filled).
  - **Persistent Confirmation Notice**:
    - Renders a prominent, persistent banner above the form: *"Account created. Check your email to confirm your account, then sign in."*.
    - Accompanied by a check icon and styled in brand teal (`bg-teal-600/10 border-teal-600/30 text-teal-900`).
    - Remains visible until the user navigates away or successfully authenticates.
  - **Preserved Email Verification Safeguards**:
    - Does NOT sign users in automatically (avoiding bypassed verification or authentication errors).
    - Preserves `emailRedirectTo: `${window.location.origin}/dashboard``.
  - **Pure State Helper**:
    - Pure function `getSignUpSuccessState({ email, hasSession })` in `src/lib/authFlow.ts` driving state changes with offline unit tests.
  - **Files Implementing It**: [`src/lib/authFlow.ts`](file:///G:/app%20development/AutomationAlchemists/src/lib/authFlow.ts), [`src/pages/Auth.tsx`](file:///G:/app%20development/AutomationAlchemists/src/pages/Auth.tsx).

- **Dashboard "Open Tools" Link Direct Routing (Task C)**:
  - **What it does**: Routes the top "Open Tools" action button on `/dashboard` directly to the tools selector page rather than the Return Converter root.
  - **Destination URL**:
    - Pinned exported constant `RCCP_CHOOSE_URL = 'https://rccp.automationalchemists.com/choose'` in `src/pages/Dashboard.tsx`.
    - Both primary header "Open Tools" buttons (empty and populated dashboard views) open `RCCP_CHOOSE_URL` with `target="_blank" rel="noopener noreferrer"`.
  - **Preserved Tool-Specific Links**:
    - Individual tool card "Open Return Converter" actions continue pointing directly to `https://rccp.automationalchemists.com`.
  - **Files Implementing It**: [`src/pages/Dashboard.tsx`](file:///G:/app%20development/AutomationAlchemists/src/pages/Dashboard.tsx).

---

### 23. Direct Non-Trial Subscription & UI Contrast Enhancements (Release v1.15.1)

- **Direct Non-Trial Paid Checkout on Cart & Recovery Paths (Bug A)**:
  - **What it does**: Ensures that customers explicitly choosing to subscribe (such as those clicking "Subscribe at A$4.99/month" following a trial refusal, or checking out via the shopping cart) receive an immediate paid subscription session with payment collected today, rather than an unwanted $0.00 free trial session.
  - **Explicit Skip-Trial Transmission**:
    - `src/pages/Cart.tsx` transmits `skip_trial: true` in the `create-checkout-session` POST payload when initiating checkout.
  - **Server-Side Decision Engine (`determineTrialEligibility`)**:
    - Pure decision helper in `supabase/functions/create-checkout-session/params.ts`.
    - If `skipTrial: true` is received, `isEligibleTrial` is strictly set to `false` with `reason = 'skip_trial'`.
    - Strips all trial period days, trial settings, and trial submit notices, ensuring Stripe charges the first monthly billing cycle immediately at checkout (A$4.99 incl. GST).
    - Preserves existing card-denial-cap enforcement (`'card_denials_capped'`) which shares the same non-trial checkout parameters.
  - **Security Constraint**:
    - A client-supplied skip-trial flag can only ever REMOVE a trial, never grant one. Ineligible accounts or non-trial tools cannot obtain a trial by omitting or spoofing flags.
  - **Preserved Trial Checkout Paths**:
    - "Use another card" and landing page trial CTAs continue to omit `skip_trial`, preserving the standard 30-day card-required free trial flow.
  - **Files Implementing It**: [`src/pages/Cart.tsx`](file:///G:/app%20development/AutomationAlchemists/src/pages/Cart.tsx), [`supabase/functions/create-checkout-session/params.ts`](file:///G:/app%20development/AutomationAlchemists/supabase/functions/create-checkout-session/params.ts), [`supabase/functions/create-checkout-session/index.ts`](file:///G:/app%20development/AutomationAlchemists/supabase/functions/create-checkout-session/index.ts).

- **UI Contrast Fix for Dashboard "Use Another Card" Action (Bug B)**:
  - **What it does**: Resolves an issue where the "Use another card" recovery button rendered as a solid dark teal block with invisible text on `/dashboard`.
  - **Contrast Standardization**:
    - Declares explicit `bg-transparent` alongside `border-teal-600 text-teal-900 hover:bg-teal-600 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-600` on the outline buttons.
    - Eliminates inheritance of the theme's default dark teal background (`--background: 188 72% 14%`, `#0A363D`), establishing compliant WCAG AA contrast (14.8:1 in default state, 6.5:1 on hover).
  - **Files Implementing It**: [`src/components/DashboardTrialCard.tsx`](file:///G:/app%20development/AutomationAlchemists/src/components/DashboardTrialCard.tsx), [`src/pages/Dashboard.tsx`](file:///G:/app%20development/AutomationAlchemists/src/pages/Dashboard.tsx).
