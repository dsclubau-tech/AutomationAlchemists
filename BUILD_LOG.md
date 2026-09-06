# Build Log

## 2026-09-06 — Wire public /tools page to database
Requested: Update `/tools` page to pull dynamic pricing and status from the `public.tools` database table, replacing hardcoded JSX values, without changing the visual design.
Built: 
- Replaced hardcoded frontend pricing and status in `Tools.tsx` with a live Supabase query.
- Configured card rendering to safely ignore (return null for) any rows marked as 'hidden' in the database.
- Mapped CP Bot & Return Converter to the 'rccp' bundle slug.
- Created PROJECT_STATE.md, BUILD_LOG.md, and CHANGELOG.md to formalize project tracking.
Files touched: `src/pages/Tools.tsx`, `PROJECT_STATE.md`, `BUILD_LOG.md`, `CHANGELOG.md`.
Notes/deviations: None.
