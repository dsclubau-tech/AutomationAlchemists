# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.15.1] - 2026-11-04
### Fixed
- Fixed an issue where clicking "Subscribe" after a declined trial opened another free trial checkout instead of a paid subscription charged today
- Fixed a visual display issue where the "Use another card" button rendered with dark text on a dark background, restoring clear readability and contrast

## [1.15.0] - 2026-11-03
### Added
- Clear recovery choices for customers whose free trial was declined after checkout, including one-click retry with another card or immediate subscription at promotional launch pricing
- Anti-abuse retry limit capping trial attempts at 3 cards per account while ensuring direct paid subscription remains accessible
- Smooth sign-up flow that automatically switches new users to the sign-in form with their email address pre-filled and a persistent reminder to confirm their inbox

### Changed
- Updated the dashboard "Open Tools" button to open the tools selector page (`/choose`) directly

### Fixed
- Addressed page errors on cart checkout and promotional landing pages (including hotfix 1.14.1)

## [1.14.1] - 2026-11-03
### Fixed
- Fixed critical Cart page crash where clicking "Subscribe" from the customer dashboard caused a full-page error due to a missing loading component import
- Fixed Return Converter x CopyPaste Bot tool page crash for customers with an active free trial by properly formatting remaining trial time as text rather than a raw object
- Added missing alert icon import on the account deletion confirmation modal, eliminating potential runtime errors
- Enhanced application error boundary to log caught component exceptions and stack traces for streamlined diagnostics

## [1.14.0] - 2026-11-03
### Fixed
- Fixed free trial end date displays so that every dashboard surface, including the trial reminder banner and the product card, displays the exact same expiration day in Sydney time matching Stripe Checkout
- Standardized date formatting across all dashboard billing cards and status banners to a consistent Australian date format (day, full month name, and year)

### Changed
- Simplified trial eligibility rules so free trials are limited per customer email and per payment card only, ensuring phone numbers no longer block, restrict, or delay trial activation
- Retained phone number collection at checkout solely for invoice contact details and billing communication

## [1.13.0] - 2026-11-03
### Added
- Streamlined the trial sign-up area on the Return Converter x CopyPaste Bot tool page by removing the duplicate spots counter below the action button, focusing capacity updates exclusively in the new prominent top banner
- Prominent live free-trial spots banner on the Return Converter x CopyPaste Bot tool page displaying real remaining spots with animated countdown and progress bar
- Dynamic urgency styling activating when remaining spots drop to 10% or below, featuring subtle amber styling, singular/plural grammar, and urgent spot reservation copy
- Truthful sold-out state presenting CP Bot launch pricing without fake timers or fabricated availability claims
- 30-second live polling and immediate refocus updates keeping trial capacity synchronized across browser sessions
- Full prerendering and accessibility protections with polite screen reader updates and reduced-motion compliance

## [1.12.0] - 2026-11-03
### Changed
- Enhanced checkout to collect complete billing addresses (street address, city, state, postal code, and country) for all trial and subscription signups, ensuring issued tax invoices contain full customer address details
- Prepared billing profile and business name collection support for seamless tax invoice generation

## [1.11.0] - 2026-11-02
### Added
- Launch readiness pricing configuration establishing the A$4.99/month promotional launch price for CP Bot (normally A$9.99/month), inclusive of GST
- Clear trial policy notice next to every trial button detailing the 30-day trial duration, renewal terms, and links to Terms of Service and Privacy Policy
- Australian GST compliance configuration applying the 10% tax rate to all subscription invoices and renewals via Stripe
- Comprehensive customer billing states on the dashboard distinguishing active trials, cancelled trials, active subscriptions, cancelled subscriptions, and payment-failed notices with direct link to update payment methods
- Seamless signup redirect landing newly verified customers directly onto the customer dashboard

### Changed
- Clarified product naming so CP Bot (Copy Paste Bot) is clearly distinguished as the paid tool and Return Converter is recognized as completely free
- Updated all pricing references across product landing pages, the tools directory, and cart to reflect promotional pricing

## [1.10.0] - 2026-10-31
### Added
- Added Invoice Generator product landing page at `/tools/invoice-generator` with full feature overview, workflow walkthrough, free monthly allowance details, and interactive seller questions
- Added Invoice Generator tool card to the Tools directory with direct link to learn more
- Added Invoice Generator to website navigation menus and sitemaps

### Fixed
- Fixed dashboard button visibility so labels on secondary action buttons and tool access buttons are always clearly readable against card surfaces
- Updated the ListFlow preview button on the customer dashboard to a clear, muted "Coming soon" label matching the Tools catalog

## [1.9.4] - 2026-10-27
### Added
- Added high-resolution email branding logo asset for automated confirmation and password reset emails

### Fixed
- Improved payment processing so refunds accurately revoke tool access when processed through updated Stripe billing systems

## [1.9.3] - 2026-10-27
### Changed
- Refreshed customer dashboard with the clean light landing-page styling matching the Tools directory, including high-contrast surfaces, readable status badges, and accessible controls
- Streamlined dashboard tool displays so active tools only appear under "Your tools" and never duplicate in "Coming soon"
- Adjusted access labels for manually granted tools to show exact access duration rather than automated renewal dates
- Hidden subscription management buttons on manually granted tools that do not have an associated payment provider

## [1.9.2] - 2026-10-27
### Fixed
- Enhanced payment webhook resilience to support new and future Stripe API payload versions seamlessly without interruptions or processing delays
- Hardened subscription renewal and cancellation synchronization against missing or reorganized date fields from payment providers

## [1.9.1] - 2026-10-27
### Fixed
- Protected against accidental duplicate subscriptions if a customer submits checkout multiple times in parallel, ensuring only one active subscription is kept and any duplicates are cancelled without charge
- Enforced single-seat checkouts on standard tools so customers cannot accidentally order multiple seats of a single-user product

## [1.9.0] - 2026-10-26
### Added
- Integrated Stripe subscription checkout with free trial support, card verification, and automatic renewal dates
- Created customer billing portal integration allowing subscribers to easily update payment methods and manage subscriptions
- Real-time setup screen on the dashboard that automatically confirms trial activation after completing checkout
- Added clear pricing notices and cancel-anytime terms next to all trial buttons

### Changed
- Dashboard tool cards now show exact subscription and trial end dates with direct access to the billing portal
- Upgraded the billing page so customers can open their self-service subscription management portal
- Completely removed the retired no-card trial claiming path

## [1.8.1] - 2026-10-26
### Fixed
- Fixed trial conversion handling so that customer cancellations during a free trial keep trial status and end dates rather than prematurely converting to paid subscriptions
- Enhanced status mapping to safely ignore incomplete Stripe subscriptions and treat paused subscriptions as past due

### Changed
- Card-required free trial database updates applied to production; free trials remain switched off
- Deployed payment webhook improvements with automatic fallback resolution for customer card details

## [1.8.0] - 2026-10-26
### Added
- Card-required trial security updates and database architecture (prepared, pending deployment; trials remain disabled)
- Anti-abuse checks to ensure one trial per customer, payment card, and phone number
- Automated trial-to-paid conversion handling with grace period to prevent renewal lockouts

### Changed
- Legacy cardless trial claiming path has been closed in preparation for card-backed trials

## [1.7.0] - 2026-10-26
### Changed
- Refreshed the Tools page with equal-height cards, a larger Return Converter x CopyPaste Bot logo, and a single primary action button
- Updated the Tools and Dashboard pages with the refined background ripple pattern from the home page
- Simplified the navigation menu to show only active tools
- Improved the profile menu so all options are clearly visible and easy to select when hovering or using a keyboard

### Fixed
- Fixed dashboard card sizing so cards fill the screen properly on computers and tablets
- Fixed button clipping on dashboard tool cards on smaller screens
- Restored missing button text on dashboard store action buttons

## [1.6.0] - 2026-10-24
### Added
- Admin controls for free trials and per-customer price discounts

## [1.5.1] - 2026-10-24
### Fixed
- Corrected the Return Converter x CopyPaste Bot descriptions and listed price in the Tools data

## [1.5.0] - 2026-10-24
### Added
- Free-trial sign-up flow for CP Bot on the Dashboard and the Return Converter x CopyPaste Bot page (prepared, switched off until launch)

### Changed
- Signing in or signing up now returns you to the page you came from

### Fixed
- Corrected the Return Converter x CopyPaste Bot description in the Tools data

## [1.4.4] - 2026-10-24
### Changed
- Corrected the description and feature list on the Return Converter x CopyPaste Bot card on the Tools page so it describes exactly what each tool does.

## [1.4.3] - 2026-10-22
### Changed
- The Return Converter x CopyPaste Bot logo now appears without a box.

## [1.4.2] - 2026-10-22
### Changed
- Tidier header layout and buttons on the Return Converter x CopyPaste Bot page for computers.

## [1.4.1] - 2026-10-22
### Changed
- The Virtual Assistance page is now called Virtual Assistant, with a simpler address; the old address still works.

## [1.4.0] - 2026-10-22
### Changed
- A new look and clearer layout for the Return Converter x CopyPaste Bot page, with smooth scroll animations.

## [1.3.3] - 2026-09-28
### Added
- Facebook and WhatsApp links in the footer.

### Changed
- Cleaner Contact page layout on computers and phones.
- Simpler footer links.
- The footer now shows the original gold logo.

### Fixed
- A button on the Virtual Assistance page is readable on phones.

## [1.3.2] - 2026-09-28
### Fixed
- Videos now appear on phones and tablets; the page's text no longer flickers as it loads.

## [1.3.1] - 2026-09-28
### Changed
- The Virtual Assistance page now reveals its text smoothly as you scroll, and its pricing section has a cleaner look.

### Fixed
- Button labels are readable when you hover over them.

## [1.3.0] - 2026-09-28
### Added
- Five short videos on the Virtual Assistance page.

### Changed
- Clearer wording throughout that page.

## [1.2.0] - 2026-09-28
### Added
- A dedicated Virtual Assistance page; the Tools page now shows current prices and availability.

### Changed
- Refreshed Contact page with new office addresses, WhatsApp links and email; Virtual Assistance moved off the Services page onto its own page.

### Fixed
- "Get access" buttons no longer send people back to the homepage; the site no longer occasionally shows an error screen after an update is published.

## [1.1.0] - 2026-09-06
### Changed
- The public Tools page now automatically updates its pricing and availability statuses in real-time based on the admin dashboard, replacing previously static placeholder text.
- Hidden or internal backend tools will no longer accidentally display on the public marketing site.
