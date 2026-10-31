# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
