# Build Log

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
Files touched: `Services.tsx`, `Footer.tsx`, `App.tsx`, `prerender.js`, `generate-sitemap.js`, `Tools.tsx`, `Dashboard.tsx`, `CHANGELOG.md`, `vercel.json`, `supabase/functions/create-checkout-session/index.ts`, `src/lib/checkout.ts`.
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
