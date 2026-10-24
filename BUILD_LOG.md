# Build Log

## 2026-10-24 (v1.5.1 Auth Path Check, Tools Copy & Price Fixes, Behaviour Verify Script, Test Plan)
- Auth Regression Check (Task 1):
  - Audited `src/pages/Auth.tsx` navigation paths against commit `80d5f88` (v1.4.4): verified no-next navigation preserves exact original destinations (`/` for normal users, `/admin` for admins).
  - Restored `signUp` helper from `src/hooks/useAuth.tsx` by adding optional `redirectTo?: string` parameter to `signUp`, routing through `useAuth` rather than calling `supabase.auth.signUp` directly.
  - Confirmed `sanitizeNext` permits `?`, `#`, and URL-encoded query/hash strings for internal paths while rejecting protocol-relative URLs (`//evil.com`), external protocols (`https://evil.com`), backslashes (`/\evil`), control characters, and inputs >200 characters.
- Copy and Price Fixes (Task 2):
  - Corrected `rccp` `fullDescription` in `src/data/tools.ts` to exact approved wording.
  - Replaced dashboard label sentence in `howItWorks` with Return Converter web app instructions.
  - Updated `rccp` static catalog price in `src/data/tools.ts` from `AUD $19/month` to `AUD $9/month`, aligning with the live database. Audited all references in `src/`.
  - Updated `src/data/rccpPage.ts` history card to title `'History'` and unified orders + return labels description.
- Sitemap Verification (Task 3):
  - Audited `scripts/generate-sitemap.js` and `package.json`: confirmed sitemap is dynamically generated at the beginning of `npm run build` on Vercel deployments, overwriting `public/sitemap.xml` with canonical www URLs and fresh timestamps in the deployed bundle.
- Migration 032 Behaviour Verification Script (Task 4):
  - Authored `docs/sql/032_behaviour_verify.sql`: non-destructive test harness testing 8 cases against Migration 032 webhook handling and slug resolution in an isolated transaction that 100% rolls back via `RAISE EXCEPTION`.
  - Authored companion guide `docs/sql/032_behaviour_verify_README.md`.
- Documentation & Testing (Task 5 & 6):
  - Migration 032 noted as APPLIED in production by hand on 2026-10-24.
  - Added 1-day test runbook to `docs/FREE_TRIAL_AND_DISCOUNTS.md`.
  - Added Stripe test-mode plan for 2026-10-25 to `QA_CHECKLIST.md`.
  - Confirmed `.env.local` is git-ignored via `*.local` in `.gitignore`.
  - Deployed Edge Functions `create-checkout-session` (v4) and `stripe-webhook` (v5, `--no-verify-jwt`) to project `tdevgrwmafwrsmeymjzd` on 2026-10-24 (~09:50 UTC) from home PC. The earlier 403 was caused by the Supabase CLI being logged in to a different account; after logging in with the project-owning account, both deployed successfully.
  - Troubleshooting note: If a deploy returns 403, run `npx supabase projects list`; if Automation Alchemists is missing, the CLI is logged in to the wrong account: `npx supabase logout`, then `npx supabase login` with the owning account.
- Files touched: `src/hooks/useAuth.tsx`, `src/pages/Auth.tsx`, `src/data/tools.ts`, `src/data/rccpPage.ts`, `docs/sql/032_behaviour_verify.sql` (NEW), `docs/sql/032_behaviour_verify_README.md` (NEW), `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `QA_CHECKLIST.md`, `PRD.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`, `CHANGELOG.md`.

## 2026-10-24 (v1.5.0 Free Trial Claim Flow, Auth Return Path, Tools Copy Alignment)
- Implemented Task C1 (`src/lib/trial.ts`):
  - Typed wrappers for Supabase RPCs: `get_trial_public`, `get_trial_status`, and `claim_free_trial`.
  - Non-throwing error handling transforming failures into `{ ok: false, reason: 'network' }`.
  - Created hooks `useTrialPublic` and `useTrialStatus`, executing client-side only and skipped during prerendering (`window.__PRERENDER__`).
  - Added pure `sanitizeNext(raw)` enforcing open redirect protection (disallows `//`, `/\`, `://`, backslashes, control characters, max 200 chars).
  - Added `formatTrialTimeLeft` returning days or hours left (switching to hours under 48 hours).
  - Added `getClaimErrorMessage` mapping backend claim failure reasons to user-friendly messages without leaking internal domain blocklists.
- Implemented Task C2 (`src/pages/tools/RccpToolPage.tsx`, `src/data/rccpPage.ts`):
  - Wired dynamic trial button: "Get your {N}-day free trial now" with "{slots_left} of {slot_cap} free-trial spots left" when offer is enabled and slots remain.
  - Set signed-out click to `/auth?mode=signup&next=/dashboard%23claim-trial` and signed-in click to `/dashboard#claim-trial`.
  - Added active trial state: "Your free trial is active" status pill with formatted remaining time and "Open dashboard →" link.
  - Added ended trial state: primary "Get CP Bot" access button without trial promotion.
  - Guaranteed zero layout shift and fail-safe fallback to standard layout when offer is disabled or errors.
- Implemented Task C3 (`src/pages/Auth.tsx`, `src/lib/checkout.ts`):
  - Added `mode` and `next` query parameter handling to `Auth.tsx`.
  - Sanitized `next` using `sanitizeNext` and navigated there upon successful sign-in or immediate sign-up session.
  - Passed sanitized redirect URL to `supabase.auth.signUp` in `options.emailRedirectTo`.
  - Updated `handleGetAccessLogic` signed-out branch in `checkout.ts` to redirect to `/auth?next=${encodeURIComponent(currentPath)}`.
  - Verified `touchedPassword` in `Auth.tsx`: properly defined and functioning, no crash occurs.
- Implemented Task C4 (`src/components/DashboardTrialCard.tsx`, `src/pages/Dashboard.tsx`):
  - Created `DashboardTrialCard` with `id="claim-trial"`, supporting hash auto-scroll and subtle highlight.
  - Implemented 5 states: eligible unclaimed, claimed active, claimed ended, claim success confirmation, and silent/quiet sold out.
  - Triggered in-place refetch of dashboard subscription data upon claim without full page reload.
  - Styled with existing teal and mint design tokens, mobile-first responsive layout (16px side gutters, no horizontal scroll).
- Implemented Task 2 copy alignment (`src/data/tools.ts`):
  - Corrected description and four feature bullet descriptions for Return Converter x CopyPaste Bot (`rccp`).
  - Audited `src/data/rccpPage.ts` and `src/pages/tools/RccpToolPage.tsx` and compiled list of conflicting claims against CP Bot developer facts.
- Updated documentation:
  - `PRD.md`: added Part C specifications.
  - `QA_CHECKLIST.md`: added Part C manual test cases (checks 11-14).
  - `PROJECT_STATE.md`: updated to current v1.5.0 reality.
  - `CHANGELOG.md`: added [1.5.0] release notes.
- Tested:
  - Ran `npx tsc --noEmit -p .` (passed with code 0).
  - Verified no test runner in `package.json`.
- Files touched: `src/lib/trial.ts` (NEW), `src/components/DashboardTrialCard.tsx` (NEW), `src/pages/Dashboard.tsx`, `src/pages/Auth.tsx`, `src/lib/checkout.ts`, `src/pages/tools/RccpToolPage.tsx`, `src/data/rccpPage.ts`, `src/data/tools.ts`, `CHANGELOG.md`, `PRD.md`, `QA_CHECKLIST.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

## 2026-10-24 (v1.4.4 Tools Card Copy Alignment & CP Bot Architecture Docs)
- Updated Return Converter x CopyPaste Bot card copy on `/tools` (`src/pages/Tools.tsx`):
  - Description replaced with: "Paste eBay buyer addresses straight into Amazon checkout, and turn Amazon return codes into clean eBay return labels."
  - Four bullets replaced with:
    - "One-click copy - eBay buyer address into Amazon checkout"
    - "Instant labels - Amazon return codes into eBay return labels"
    - "History tracking - Fulfilment and return label history"
    - "Cloud clipboard - Copy in one browser, paste in another"
  - Styling, tags, layout, and links preserved; audited for desktop height parity with adjacent ListFlow card.
- Audited repository for occurrences of old copy strings across all files without modifying out-of-scope files.
- Incorporated CP Bot developer written answers (23 Oct 2026) across `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md`, and `PROJECT_STATE.md`:
  - Confirmed CP Bot unlock slug is `'cpbot'`, called via single-argument `check_product_subscription(p_product_slug = 'cpbot')`.
  - Corrected gating status: CP Bot web dashboard (`/cp-bot` pages) is gated by `check_product_subscription` in strict fail-closed mode.
  - Documented Chrome extension gating status: not gated today; gate ships in extension v1.0.5.3 (pending Chrome Web Store review); public trials must not open until live.
  - Documented 5-minute extension caching and immediate web dashboard lockout on next page load via RPC `current_period_end` evaluation.
  - Documented single overload invariant for `check_product_subscription` (never create second overload).
  - Documented table status: `cp_bot_licenses` is unused; `cp_bot_config` and `cp_bot_settings` are in active use; other active tables: `cp_bot_activity_log`, `cp_bot_fulfillments`, `cp_bot_gift_templates`, `cp_bot_insight_cards`, `cp_bot_cloud_clipboard`, `label_history`.
  - Documented Return Converter sign-in gating and production testing with dedicated test accounts.
  - Documented developer notification requirements before Stripe/webhook deploy and trial launch.
- Added QA check 10 to `QA_CHECKLIST.md` for `/tools` card copy and single-line bullet layout.
- Version bumped to 1.4.4; updated `CHANGELOG.md`.
- Files touched: `src/pages/Tools.tsx`, `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md`, `QA_CHECKLIST.md`, `PROJECT_STATE.md`, `CHANGELOG.md`, `BUILD_LOG.md`.

## 2026-10-23 (Free Trial Part B: Review Fixes - Webhook Reactivation & Order Bot Guard)
- Fixed webhook reactivation hole in `supabase/migrations/032_webhook_trial_conversion.sql`:
  - Disentangled single-seat handling by event type.
  - Only `p_event_type = 'checkout.session.completed'` may perform INSERT or UPSERT on `(user_id, product_slug) WHERE store_id IS NULL`, preceded by the active manual grant check and trial conversion lookup.
  - `p_event_type = 'customer.subscription.updated'` on single-seat products strictly updates `current_period_end` (and `updated_at`) on existing active rows matching `stripe_subscription_id AND status = 'active'`. It does not touch `cancel_at_period_end`, `is_trial`, `grant_reason`, or `status`, preventing late update events after cancellation from reactivating cancelled rows.
- Updated `supabase/functions/create-checkout-session/index.ts`:
  - Confirmed exactly one declaration of profile lookup in `CHECKOUT_ENABLED` guard; verified no fragments across the entire file.
  - Exempted Order Bot (`product_slug !== 'orderbot'`) from the 409 `already_subscribed` guard, adding an explanatory comment that Order Bot is a multi-slot product where additional store slots are purchased through checkout.
- Verified live DB schema columns in `live_db_snapshot.txt` and migration 031: confirmed `subscriptions.updated_at` exists in snapshot (line 277).
- Performed static syntax parse on `create-checkout-session/index.ts` and `stripe-webhook/index.ts` using `esbuild` (both exited 0).
- Updated documentation in `docs/FREE_TRIAL_AND_DISCOUNTS.md` (Section 9), `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md`, and added manual test checks 8 & 9 to `QA_CHECKLIST.md`.
- No database migrations applied to live database; no Edge Functions deployed; unversioned local commit only.
- Files touched: `supabase/functions/create-checkout-session/index.ts`, `supabase/migrations/032_webhook_trial_conversion.sql`, `docs/FREE_TRIAL_AND_DISCOUNTS.md`, `docs/CURRENT_STATE_BILLING_AND_ACCESS.md`, `PRD.md`, `QA_CHECKLIST.md`, `PROJECT_STATE.md`, `BUILD_LOG.md`.

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
