# Build Log

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
