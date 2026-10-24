# Migration 032 Behaviour Verification Script

## Purpose
`docs/sql/032_behaviour_verify.sql` performs an automated, end-to-end behavioural verification of Migration 032 (`process_stripe_webhook_event`, `resolve_access_slug`, and `check_product_subscription`) against live database schemas.

## How to Run
1. Open the Supabase SQL Editor for project `tdevgrwmafwrsmeymjzd`.
2. Copy and paste the entire contents of `docs/sql/032_behaviour_verify.sql`.
3. Click **Run**.

## Results & Guaranteed Rollback
- The script executes inside a single anonymous `DO $$ ... $$` block and finishes with an intentional `RAISE EXCEPTION`.
- Because of this intentional exception, **100% of all test mutations are rolled back automatically**. Nothing is saved to the database, and no production data is touched or left behind.
- **The error message returned by Postgres IS the report**: look at the error output, which renders the pretty-printed JSON containing pass/fail details for all 8 test cases.
