# CP Bot Changelog

<!-- Process Requirement: Every future version bump of manifest.json must add a corresponding entry in this changelog file. -->

## [1.0.3] — 2026-07-24

### Fixed
- All 3 automations (Add/Paste address, Find existing address, Add Gift Message) restored after omission regression
- Automation logs now display most recent run at top, steps in ascending chronological order within each run
- Passive AuthBridge sign-out no longer logs out the extension when an unauthenticated web tab is opened
- `automationInProgress` now correctly cleared after address submission, re-enabling automation buttons on subsequent pages
- Stale async promise from previous action session no longer overwrites active status message on next page
- SPA history interception (pushState/replaceState/popstate) now correctly resumes pending autofill and gift message tasks on /address and /gift without full page reload
- isAmazonAddressPageReady and isAmazonGiftPageReady broadened — bot no longer hangs on navigation message when Amazon's radio inputs use zero-size custom styling
- isRecoveryInitiated now resets on URL change so recovery resumes correctly on target page after SPA navigation
- Recovery flow now immediately completes when copied address is already active in Amazon summary header (no unnecessary radio card search on /spc)
- Automation log entries no longer merge separate runs for the same buyer — runs older than 5 minutes or completed always create a new distinct entry
- Removed artificial 3-second delay and "Checking for security challenges..." message before form submission — replaced with scroll-into-view and human-like MouseEvent dispatch on the submit button
- waitForAddressPageReady default timeout reduced from 8000ms to 5000ms, live status messages now shown during DOM settlement wait
- Recovery order assist now correctly logged when copied address is detected as active in Amazon checkout header
- Automation logs switched from session storage to local storage with 24-hour retention and 20-run limit

## [1.0.0] - 2026-07-06
- Initial tracked release.
