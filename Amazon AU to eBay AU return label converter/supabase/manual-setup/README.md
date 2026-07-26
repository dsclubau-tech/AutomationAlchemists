# CP Bot License Setup

This directory contains a standalone script for manual execution in Supabase.

## What is this for?
The script `cp_bot_licenses_setup.sql` creates the necessary table (`cp_bot_licenses`) and security policies for Automation Alchemists to sync CP Bot license statuses via webhooks.

## Where to run it
Run this script manually in the Supabase project that handles CP Bot.
1. Open your Supabase Dashboard.
2. Go to the **SQL Editor**.
3. Create a new query, paste the contents of `cp_bot_licenses_setup.sql`, and hit **Run**.

## Important Notes
- **Run Once:** This script only needs to be run once per project, though it is safe to re-run.
- **Webhook Requirement:** The webhook route (`/api/webhooks/aalchemists-license`) expects this exact table structure to exist before it will work properly.
