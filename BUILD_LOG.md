# Build Log

## 2026-10-23 (Free Trial Part B: Webhook Conversion, Pricing & Access Decoupling)
- Authored migration `supabase/migrations/032_webhook_trial_conversion.sql`:
  - Implemented `public.resolve_access_slug(p_tool_slug text)` mapping tool catalog slugs to entitlement access slugs (restricted to `postgres` role).
  - Re-implemented `public.process_stripe_webhook_event` preserving exact 13-argument signature.
  - Added fallback resolution for missing `user_id`, `email`, and `product_slug` from existing subscriptions by `stripe_subscription_id`; skips gracefully with HTTP 200 on unresolved identity.
  - Implemented manual grant protection: active `manually_granted = true` subscriptions are never overwritten.
  - Implemented single-seat `UPSERT` on `(user_id, product_slug) WHERE store_id IS NULL`, converting trial rows in place (`is_trial = false`) and stamping `public.trial_claims.converted_at = now()`.
  - Preserved Order Bot multi-store quantity logic.
- Authored `docs/sql/032_rollback.sql` restoring original snapshot definition and dropping `resolve_access_slug`.
- Authored `docs/sql/032_verify.sql` returning single JSON validating function overload count (1), signatures, and grants.
- Updated `supabase/functions/stripe-webhook/index.ts` to extract user ID, email, and tool slug from session and subscription metadata across all events, returning 200 on skipped RPC outcomes.
- Updated `supabase/functions/create-checkout-session/index.ts`:
  - Server-side price resolution from `public.tools.price_monthly` and `public.user_price_overrides` using `price_data`.
  - Enforced minimum unit amount (50 cents AUD) with HTTP 400 (`price_too_low`).
  - Added double-charge guard checking active paid subscriptions for resolved access slug with HTTP 409 (`already_subscribed`), while allowing trial upgrades.
  - Attached metadata to both session and `subscription_data.metadata`.
- Updated documentation in `docs/FREE_TRIAL_AND_DISCOUNTS.md` and `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`. Created `PRD.md` and `QA_CHECKLIST.md`.
- No database migrations applied to live database; no Edge Functions deployed. Unversioned backend change.
- Files touched: `supabase/migrations/032_webhook_trial_conversion.sql` (NEW), `docs/sql/032_rollback.sql` (NEW), `docs/sql/032_verify.sql` (NEW), `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/create-checkout-session/index.ts`, `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md` (NEW), `QA_CHECKLIST.md` (NEW), `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-23 (Migration 031 Constraint Fix & Verify Script Column Correction)
- Resolved PostgreSQL duplicate constraint error (`ERROR 42710`) on `public.user_price_overrides`:
  - Removed duplicate inline check on `kind` column.
  - Named table check constraints uniquely: `user_price_overrides_kind_valid` for `CHECK (kind IN ('fixed_price', 'percent_off'))` and `user_price_overrides_values_present` for the amount/percentage requirement check.
  - Scanned all 4 migration tables (`trial_offers`, `blocked_email_domains`, `trial_claims`, `user_price_overrides`) and confirmed zero duplicate constraint names, auto-name collisions, or collisions with live objects.
- Fixed `docs/sql/031_free_trial_verify.sql` Script 1: replaced non-existent `pg_class.rowsecurity` with `pg_class.relrowsecurity`.
- No database migrations applied to live environment; no application runtime code or dependencies modified.
- Files touched: `supabase/migrations/031_free_trial_and_discounts.sql`, `docs/sql/031_free_trial_verify.sql`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-23 (Free Trial Part A Review Fixes - In Place)
- Revised Part A migration `supabase/migrations/031_free_trial_and_discounts.sql`:
  - Added transaction-level timeouts: `SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';`.
  - Fixed `user_price_overrides` CHECK constraint NULL hole with explicit `IS NOT NULL` checks on `amount_cents` and `percent_off`; added `CHECK (ends_at IS NULL OR ends_at > starts_at)`.
  - Fixed PL/pgSQL row-variable `IS NOT NULL` bug in `get_trial_status` by setting boolean flags from `FOUND` (`v_claim_found`, `v_sub_found`).
  - Aligned evaluation order across `get_trial_status` and `claim_free_trial`: unauthenticated -> unconfirmed email -> blocked domain -> [FOR UPDATE lock in claim] -> already claimed -> existing subscriptions -> disabled -> sold out -> ok. Existing claimants consistently receive `already_claimed`.
  - Hardened security: zero policies on all four tables, revoked all direct table privileges from `anon` and `authenticated` to hide administrative columns (`note`, `revoked_reason`).
  - Set immutable search path `SET search_path = pg_catalog, pg_temp` on `normalize_email`.
  - Switched interval generation to `make_interval(days => v_offer.trial_days)` in `claim_free_trial`.
  - Documented privacy retention rationale for `trial_claims.email_normalized` on account deletion.
- Rewrote `docs/sql/031_free_trial_rollback.sql` with `SET LOCAL lock_timeout = '5s'`, explicit function signatures, `DROP TABLE ... CASCADE` without brittle policy drops, and commented-out optional trial expiration warning.
- Rewrote `docs/sql/031_free_trial_verify.sql` into two distinct single-result scripts: Script 1 (read-only diagnostic returning single jsonb) and Script 2 (atomic DO block testing full claim lifecycle and permissions, ending with intentional `RAISE EXCEPTION` to roll back all changes).
- Updated `docs/FREE_TRIAL_AND_DISCOUNTS.md` with review findings, zero-policy security model, operational runbook steps, email verification requirements, and manual SQL commands for testing.
- No migrations applied to live production database; no application code or runtime packages modified.
- Files touched: `supabase/migrations/031_free_trial_and_discounts.sql`, `docs/sql/031_free_trial_rollback.sql`, `docs/sql/031_free_trial_verify.sql`, `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-23 (Free Trial & Discounts Database Layer - Part A)
- Authored migration `supabase/migrations/031_free_trial_and_discounts.sql` in a single idempotent transaction creating `subscriptions.is_trial`, `trial_offers`, `trial_claims`, `user_price_overrides`, and `blocked_email_domains` tables with strict RLS and privilege revocations.
- Implemented immutable `normalize_email` (dot/alias stripping, googlemail normalization) and atomic security-definer RPCs `get_trial_public`, `get_trial_status`, and `claim_free_trial` (with FOR UPDATE slot locking, confirmed-email checks, disposable domain blocking, and unique constraint handling).
- Authored rollback script `docs/sql/031_free_trial_rollback.sql`, verification script `docs/sql/031_free_trial_verify.sql` (including email unit tests and an atomic lifecycle test that rolls back), and architecture runbook `docs/FREE_TRIAL_AND_DISCOUNTS.md`.
- No migrations applied to live database; no application code or runtime packages modified.
- Files touched: `supabase/migrations/031_free_trial_and_discounts.sql` (NEW), `docs/sql/031_free_trial_rollback.sql` (NEW), `docs/sql/031_free_trial_verify.sql` (NEW), `docs/FREE_TRIAL_AND_DISCOUNTS.md` (NEW), `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-23 (Current State of Billing and Access Architecture Audit)
- Completed architectural audit of live database schema, subscription data models, product slug mappings, access RPCs, Stripe checkout and webhook pipelines, admin actions, and customer account touchpoints.
- Authored comprehensive report in `docs/CURRENT_STATE_BILLING_AND_ACCESS.md` detailing findings, slug divergence (`rccp` vs `cpbot`), root causes of webhook HTTP 500 errors, secondary source disagreements, and technical risks prior to implementing free trials or per-user discounts.
- No code, migrations, packages, or environment configurations modified.
- Files touched: `docs/CURRENT_STATE_BILLING_AND_ACCESS.md` (NEW), `BUILD_LOG.md`.

## 2026-10-22 (v1.4.3 RCCP Logo Without Tile & Changelog Correction)
- Removed mint tile wrapper around `/images/rccp-logo.png` on `/tools/rccp` (`RccpToolPage.tsx`). Rendered raw `<img>` element with explicit `width="949"` and `height="650"`, `className="w-[80px] lg:w-[110px] h-auto object-contain"`, no background, border, shadow, padding, rounded frame, filter, or mix-blend mode. Card background confirmed pure white (`bg-white`).
- Corrected `CHANGELOG.md` entry for v1.4.2 to remove the premature clause stating the logo appeared without a box in that release. Added v1.4.3 entry for the actual logo tile removal.
- Bumped version to 1.4.3.
- Files touched: `src/pages/tools/RccpToolPage.tsx`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-22 (v1.4.2 RCCP Hero Layout, Card Icon, Logo Inspection)
- Refactored hero pricing and buttons layout on `/tools/rccp` (`RccpToolPage.tsx`): price rows stacked into two clean lines with `min-w-[140px]` labels, `whitespace-nowrap`, and `shrink-0`. Buttons grouped in a flexible wrapping container (`gap-3`, `whitespace-nowrap`, `shrink-0`, matching 50px height via `border border-transparent` on primary CTA). Outer container wraps gracefully (`gap-x-8 gap-y-5`) so buttons wrap cleanly below prices at constrained viewports while sitting side by side on wide desktop.
- Removed Sparkles icon and its mint tile from the "For eBay AU sellers" card, removed unused `Sparkles` import from `lucide-react`, equalized card padding, and ensured equal column heights on desktop via `className="h-full"` on `RevealBlock`.
- Inspected `public/images/rccp-logo.png` via Node `fs` and `zlib`: 949x650 px, 8-bit RGBA (colour type 6), no tRNS chunk, top-left pixel `[253, 255, 254, 255]`. Under condition (c) (opaque non-pure-white background), retained the logo tile until a transparent asset is supplied.
- Bumped version to 1.4.2.
- Files touched: `src/pages/tools/RccpToolPage.tsx`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-22 (v1.4.1 Rename Virtual Assistance to Virtual Assistant)
- Renamed visible labels from "Virtual Assistance" to "Virtual Assistant" in desktop/mobile navigation (`Navigation.tsx`), footer (`Footer.tsx`), PageLoader, and SEO title/JSON-LD metadata (`VirtualAssistance.tsx`).
- Migrated route from `/virtual-assistance` to `/virtual-assistant` in `App.tsx`, `scripts/prerender.js`, and `scripts/generate-sitemap.js`.
- Configured 301 permanent redirects in `vercel.json` placed before SPA catch-all rewrites: `/virtual-assistance` -> `/virtual-assistant`, and repointed `/services/virtual-assistants` directly to `/virtual-assistant` (avoiding redirect chain).
- Verified canonical and og:url use `https://www.automationalchemists.com/virtual-assistant`.
- Bumped version to 1.4.1.
- Files touched: `src/components/Navigation.tsx`, `src/components/Footer.tsx`, `src/App.tsx`, `src/pages/VirtualAssistance.tsx`, `scripts/prerender.js`, `scripts/generate-sitemap.js`, `vercel.json`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-22 (SEO Canonical Host Alignment & RevealText Word Spacing)
- Updated all canonical URLs, SEOHead props, SchemaMarkup JSON-LD metadata, and sitemap/robots generator scripts to use the primary www host (`https://www.automationalchemists.com`).
- Fixed heading word spacing in `RevealText.tsx` by inserting real whitespace text nodes (`{" "}`) between adjacent word spans instead of relying solely on CSS margins (`mr-[0.25em]`), ensuring extracted page text from static HTML and screen scrapers preserves proper word separation.
- Files touched: `src/components/RevealText.tsx`, `src/components/SEO.tsx`, `src/pages/Index.tsx`, `src/pages/Tools.tsx`, `src/pages/tools/RccpToolPage.tsx`, `src/pages/VirtualAssistance.tsx`, `src/pages/WorkflowAutomation.tsx`, `src/pages/WebDevelopment.tsx`, `src/pages/VirtualAssistants.tsx`, `src/pages/VibeToApp.tsx`, `src/pages/ServiceDetail.tsx`, `src/pages/SaasDevelopment.tsx`, `src/pages/Automation.tsx`, `src/pages/AppDevelopment.tsx`, `scripts/generate-sitemap.js`, `scripts/generate-pages.js`, `scripts/generate.cjs`, `scripts/generate.py`, `public/robots.txt`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-22 (v1.4.0 Return Converter x CopyPaste Bot Page Rebuild)
- Rebuilt dedicated product page for `/tools/rccp` ("Return Converter x CopyPaste Bot") matching design specifications with brand tokens (teal-900/800/600, mint-50, white, yellow CTA accents).
- Created `src/data/rccpPage.ts` holding all copy word for word to decouple page components from text changes.
- Implemented `src/pages/tools/RccpToolPage.tsx` with responsive layout (desktop split, mobile stacked), fixed-size icon tile, price rows with dynamic DB fetching (fallback 9, no hardcoded 19), and "Get access" / "Use Return Converter free" CTAs.
- Integrated safe animations matching `/virtual-assistance` using `RevealText` and `RevealBlock`: hero sequence on load (<1.2s total), scroll reveals with masked word rise for H2s, staggered step badges (0.1s), and capped card stagger (0.08s, max 0.4s). Preserved reduced-motion and prerender safeguards (`data-prerendered`, `window.__PRERENDER__`).
- Updated `src/App.tsx` routing to explicitly route `/tools/rccp` to `RccpToolPage` while preserving `ToolDetail.tsx` for all other tool routes (`/tools/listflow`, `/tools/orderbot`, `/tools/invoicegen`).
- Added missing tool routes (`/tools/rccp`, `/tools/listflow`, `/tools/orderbot`, `/tools/invoicegen`) to `scripts/prerender.js` and `scripts/generate-sitemap.js`.
- Configured SEO tags via `SEOHead` with unique title, meta description, and canonical URL.
- Bumped version to 1.4.0.
Files touched: `src/data/rccpPage.ts`, `src/pages/tools/RccpToolPage.tsx`, `src/App.tsx`, `scripts/prerender.js`, `scripts/generate-sitemap.js`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-09-28 (v1.3.3 UI Polish & Footer Links)
- Fixed hero button hover state sticking on touch devices by wrapping hover styles in `[@media(hover:hover)]` and adding explicit active states. Applied to both buttons in Virtual Assistance hero and Pricing section.
- Redesigned ContactPage layout to ensure equal columns on desktop with cohesive unified padding. Reordered flex items so ExpandableContactForm appears above contact details on mobile.
- Enforced 16px text-base for all form inputs in ExpandableContactForm to prevent iOS zoom.
- Updated Footer to use original gold logo (removed `brightness-0 invert` filter).
- Replaced Twitter/LinkedIn/GitHub footer icons with Mail/Facebook/Instagram/WhatsApp configuration block using lucide-react and SVG.
- Streamlined footer links: removed dead/redirect routes, unified services, renamed Virtual Assistance, keeping only distinct pages.
- Bumped version to 1.3.3.
Files touched: `src/pages/VirtualAssistance.tsx`, `src/pages/ContactPage.tsx`, `src/components/ExpandableContactForm.tsx`, `src/components/Footer.tsx`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-09-28 (v1.3.2 Virtual Assistance Fixes)
- Fixed Virtual Assistance mobile layout where `items-center` on the grid flex wrapper caused video blocks with `aspect-video` to collapse to 0 height. Added `w-full` to both wrapper divs.
- Fixed an issue where the video's dark teal placeholder was too transparent (`bg-teal-900/5`), changing it to `bg-teal-900`.
- Applied iOS playback hardening by manually assigning `video.muted = true` before calling `video.play()` inside the IntersectionObserver.
- Fixed a text flash occurring on prerendered initial loads (where the static HTML was rendered, hidden by React/Framer Motion, and re-animated in) by implementing a React `useLayoutEffect` check against a `data-prerendered` attribute. 
- Integrated `window.__PRERENDER__` into `scripts/prerender.js` to ensure the HTML correctly ships in its fully-visible final state regardless of Puppeteer User-Agent obfuscation.
- Bumped version to 1.3.2.
Files touched: `scripts/prerender.js`, `src/components/StorySection.tsx`, `src/components/RevealText.tsx`, `src/components/RevealBlock.tsx`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-09-28 (v1.3.1 Virtual Assistance Animation & Polish)
- Fixed contrast on the "See How It Works" button (turns dark teal text to white on hover).
- Removed the final CTA block on `/virtual-assistance` and redesigned the pricing strip with a cleaner split layout (left text block, right outlined button linking to `/contact`).
- Created reusable Framer Motion components (`RevealText.tsx`, `RevealBlock.tsx`) to handle on-load (hero) and on-scroll (stories, pricing) sequences safely.
- Integrated a prerender safety hook (`useSafeAnimation`) that detects Puppeteer via the `HeadlessChrome` user agent, bypassing animations for prerender HTML snapshots while seamlessly gracefully degrading for `prefers-reduced-motion`.
- Bumped version to 1.3.1.
Files touched: `src/pages/VirtualAssistance.tsx`, `src/components/StorySection.tsx`, `src/components/RevealText.tsx`, `src/components/RevealBlock.tsx`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-09-28 (v1.3.0 Virtual Assistance Polish)
- Applied exact copy updates to `/virtual-assistance` stories, adding a bold `lead` prefix feature.
- Extracted video dimensions (854x480 landscape) and updated `StorySection.tsx` to use `aspect-video` filling the column instead of vertical vertical capping.
- Appended `#t=0.1` to video source URLs to force an initial frame in iOS Safari.
- Configured edge caching for `/videos/(.*)` in `vercel.json` (max-age=86400, stale-while-revalidate=604800).
- Bumped version to 1.3.0 and updated project state docs.
Files touched: `src/data/virtualAssistance.ts`, `src/components/StorySection.tsx`, `vercel.json`, `CHANGELOG.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-09-28 — Front-end Fixes
Requested: Three front-end fixes on the integrate-office-home branch. Remove Virtual Assistance section from Services page, update tools fallback prices, and wire up the Dashboard Buy Now buttons.
Built:
- Removed Virtual Assistance section from `src/pages/Services.tsx` and repointed all stale links (`/services/virtual-assistants`) to `/virtual-assistance` in `Footer.tsx`, `prerender.js`, `generate-sitemap.js`, and `App.tsx`.
- Updated `dbTools` fallback state in `Tools.tsx` to match live production prices (specifically updating `rccp` from 19 to 9).
- Extracted `handleGetAccessLogic` in `Tools.tsx` and wired it to `Dashboard.tsx` "Buy now" buttons to ensure checkout feature flag parity across the app.
- Added 301 permanent redirect from `/services/virtual-assistants` to `/virtual-assistance` in `vercel.json`.
- Deployed server-side guard to `create-checkout-session` Edge Function to reject non-admin users with 403 when `CHECKOUT_ENABLED` is not 'true'.
- Refactored `handleGetAccessLogic` to `src/lib/checkout.ts`.
- Merged to main as v1.2.0.

## 2026-09-28 (Virtual Assistance Media)
- Integrated 5 video stories into `/virtual-assistance` using alternating left/right layout on desktop and single-column on mobile.
- Refactored `StorySection.tsx` to support alternating full-width background bands (`teal-900` and `mint-50`) without floating divider gaps.
- Locked video aspect ratios to `9/16` and removed obsolete 'More details' links.
- Prepared `va-01.mp4` through `va-05.mp4` in `public/videos/va/`.
Files touched: `VirtualAssistance.tsx`, `StorySection.tsx`, `virtualAssistance.ts`.
Deviations: The orphaned `VirtualAssistants.tsx` component was left intact, but its route was removed.

## 2026-09-28
- **Requested:** Update Contact page cards: remove business hours, redesign contact details card with icons and functional links. Audit repo for other business hours.
- **Built:** 
  - Removed "Temporal Availability" card from `src/pages/ContactPage.tsx`. 
  - Redesigned "Get in touch" card with a mailto link, custom WhatsApp SVG links for both offices, and a Google Maps link for the Australia office.
  - Audited repo for business hours: confirmed no display text or JSON-LD contains business hours outside of admin settings.
- **Files touched:** 
  - `src/pages/ContactPage.tsx`
- **Deviations:** 
  - Bangladesh address was left as plain text since the room/floor specifics do not resolve sensibly on Google Maps.

## 2026-09-06 — Wire public /tools page to database
Requested: Update `/tools` page to pull dynamic pricing and status from the `public.tools` database table, replacing hardcoded JSX values, without changing the visual design.
Built: 
- Replaced hardcoded frontend pricing and status in `Tools.tsx` with a live Supabase query.
- Configured card rendering to safely ignore (return null for) any rows marked as 'hidden' in the database.
- Mapped CP Bot & Return Converter to the 'rccp' bundle slug.
- Created PROJECT_STATE.md, BUILD_LOG.md, and CHANGELOG.md to formalize project tracking.
Files touched: `src/pages/Tools.tsx`, `PROJECT_STATE.md`, `BUILD_LOG.md`, `CHANGELOG.md`.
Notes/deviations: None.

## 2026-09-06 — Cart/Checkout page and "Get access" fix
Requested: Build a new `/cart` page and fix the broken "Get access" flow that was redirecting logged-in users to the dead `/pricing` route (which bounced to homepage).
Built:
- Created `src/pages/Cart.tsx`: auth-gated cart page with per-item checkout buttons (Option C — each tool creates its own Stripe session via existing `create-checkout-session` Edge Function, no backend changes).
- Cart fetches live pricing from `public.tools` (only `status='available'` rows). Items not available are silently filtered out of the cart.
- "You might also like" sidebar shows other available tools not already in the cart, with "Add to Cart" buttons.
- Handles `?checkout=success` (clears cart, redirects to dashboard) and `?checkout=cancel` (shows toast, stays on cart).
- Updated `src/pages/Tools.tsx`: `handleGetAccess(slug)` now writes to localStorage cart and navigates to `/cart` instead of dead `/pricing`.
- Updated `src/App.tsx`: replaced `<Route path="/pricing" element={<Navigate to="/" replace />} />` with `<Route path="/cart" element={<Cart />} />` and added lazy import.
Files touched: `src/pages/Cart.tsx` (NEW), `src/pages/Tools.tsx`, `src/App.tsx`, `PROJECT_STATE.md`, `BUILD_LOG.md`.
Notes/deviations: Edge Function `create-checkout-session` only accepts a single `product_slug`, so multi-item cart uses individual checkout buttons per tool (Option C) rather than a unified checkout. This avoids modifying the webhook pipeline.
