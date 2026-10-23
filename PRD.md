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

### 3. Part B: Checkout Integration & Webhook Conversion (In Development)
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
