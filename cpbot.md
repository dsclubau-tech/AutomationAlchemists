# Database Schema

Complete reference for the Supabase (PostgreSQL) schema backing both products in this repo:
the **Return Label Converter** web app and the **CP Bot** Chrome extension. Both share one
Supabase project, one `auth.users` table, and one account system.

**Generated from the SQL in this repo** — `supabase/schema.sql`, `supabase/cp_bot_licenses_setup.sql`,
and `supabase/migrations/*.sql` — with every migration applied in order, so each table below shows its
*final resolved* shape rather than its original `CREATE TABLE`.

> **Caveat:** this reflects the repo's SQL files, not a live introspection of the database.
> If some migrations have not been applied to your Supabase project yet, the live schema will
> differ. See [Migration history](#migration-history) for what each file changes.

---

## Contents

- [Table summary](#table-summary)
- [Return Label Converter tables](#return-label-converter-tables)
  - [`templates`](#templates)
  - [`label_history`](#label_history)
- [CP Bot tables](#cp-bot-tables)
  - [`cp_bot_fulfillments`](#cp_bot_fulfillments)
  - [`cp_bot_activity_log`](#cp_bot_activity_log)
  - [`cp_bot_settings`](#cp_bot_settings)
  - [`cp_bot_gift_templates`](#cp_bot_gift_templates)
  - [`cp_bot_cloud_clipboard`](#cp_bot_cloud_clipboard)
  - [`cp_bot_licenses`](#cp_bot_licenses)
  - [`cp_bot_config`](#cp_bot_config)
  - [`cp_bot_insight_cards`](#cp_bot_insight_cards)
- [Storage buckets](#storage-buckets)
- [Functions & scheduled jobs](#functions--scheduled-jobs)
- [Realtime](#realtime)
- [Grants & extensions](#grants--extensions)
- [RLS pattern reference](#rls-pattern-reference)
- [Migration history](#migration-history)

---

## Table summary

| Table | Product | Rows scoped by | RLS | Realtime |
|---|---|---|---|---|
| `templates` | Return Converter | Global (read-only reference data) | ✅ | — |
| `label_history` | Return Converter | `user_id` | ✅ | — |
| `cp_bot_fulfillments` | CP Bot | `user_id` | ✅ | ✅ |
| `cp_bot_activity_log` | CP Bot | `user_id` | ✅ | ✅ |
| `cp_bot_settings` | CP Bot | `user_id` (one row per user) | ✅ | — |
| `cp_bot_gift_templates` | CP Bot | `user_id` | ✅ | — |
| `cp_bot_cloud_clipboard` | CP Bot | `user_id` (5-minute TTL) | ✅ | — |
| `cp_bot_licenses` | CP Bot | `user_id` (read-only to clients) | ✅ | — |
| `cp_bot_config` | CP Bot | Global singleton (read-only to clients) | ✅ | — |
| `cp_bot_insight_cards` | CP Bot | Global (dev-managed) | ✅ | — |

All tables live in the `public` schema.

---

## Return Label Converter tables

### `templates`

Reference data for return-label templates (carrier, code type, instructions, styling).
Seeded by `schema.sql` with 5 rows: `auspost_qr`, `auspost_label`, `parcelpoint_barcode`,
`parcelpoint_label`, `parcelpoint_pickup`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `text` | no | — | **PK** |
| `name` | `text` | no | — | Full display name |
| `short_name` | `text` | no | — | Compact label |
| `carrier` | `text` | no | — | e.g. `Australia Post` |
| `type` | `text` | no | — | e.g. `Printable label` |
| `code_type` | `text` | no | — | `CHECK IN ('qr','barcode','label')` |
| `code_label` | `text` | no | — | Heading above the code |
| `instructions` | `jsonb` | no | — | Array of instruction strings |
| `validity_copy` | `text` | no | — | Expiry / validity wording |
| `dropoff_note` | `text` | no | — | Drop-off guidance |
| `dropoff_link` | `text` | yes | — | Store locator URL |
| `dropoff_link_instruction_index` | `integer` | yes | — | Which instruction gets the link |
| `show_item_table` | `boolean` | no | `true` | Render the item table |
| `secondary_code_label` | `text` | yes | — | Second code heading |
| `secondary_code_help` | `text` | yes | — | Second code help text |
| `secondary_code_type` | `text` | yes | — | `CHECK IN ('qr','barcode','label')` |
| `secondary_aspect_ratio` | `numeric` | yes | — | |
| `secondary_required` | `boolean` | no | `false` | |
| `accent` | `text` | no | — | Hex accent colour |
| `aspect_ratio` | `numeric` | no | `1` | |
| `created_at` | `timestamptz` | no | `now()` | |
| `updated_at` | `timestamptz` | no | `now()` | |

**Policies**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Templates are readable` | `SELECT` | `anon`, `authenticated` | `USING (true)` |

No insert/update/delete policies — templates are maintained via `schema.sql` (service role).

---

### `label_history`

One row per converted label, so users can review or re-download past conversions.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | no | — | **FK** → `auth.users(id)` `ON DELETE CASCADE` |
| `template_id` | `text` | no | — | **FK** → `templates(id)` |
| `item_name` | `text` | no | — | |
| `quantity` | `integer` | no | `1` | `CHECK (quantity > 0)` |
| `order_ref` | `text` | yes | — | |
| `code_image_url` | `text` | yes | — | Path in the `label-uploads` bucket |
| `output_format` | `text` | yes | — | `CHECK IN ('png','jpg','pdf')` |
| `created_at` | `timestamptz` | no | `now()` | |

**Policies**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Users can read own label history` | `SELECT` | `authenticated` | `USING ((select auth.uid()) = user_id)` |
| `Users can insert own label history` | `INSERT` | `authenticated` | `WITH CHECK ((select auth.uid()) = user_id)` |
| `Users can delete own label history` | `DELETE` | `authenticated` | `USING ((select auth.uid()) = user_id)` |

No `UPDATE` policy — history rows are immutable once written.

---

## CP Bot tables

### `cp_bot_fulfillments`

One row per fulfilment attempt. Used for the history table, duplicate-order detection, and
the Order Assists / Failed stat cards.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | no | — | **FK** → `auth.users(id)` `ON DELETE CASCADE` |
| `ebay_order_id` | `text` | no | — | |
| `amazon_order_ref` | `text` | yes | — | |
| `buyer_name` | `text` | yes | — | |
| `postcode` | `text` | yes | — | |
| `item_title` | `text` | yes | — | |
| `quantity` | `integer` | no | `1` | `CHECK (quantity > 0)` |
| `status` | `text` | no | `'ordered'` | `CHECK IN ('ordered','failed')` — see note |
| `source` | `text` | no | `'cp_bot'` | |
| `amazon_asin` | `text` | yes | — | Added in `002` |
| `validation_warnings` | `jsonb` | yes | `'[]'` | Added in `002` |
| `amazon_account` | `text` | yes | — | Added in `006` |
| `created_at` | `timestamptz` | no | `now()` | |
| `updated_at` | `timestamptz` | no | `now()` | |

> **`status` history:** originally `'pending'` default with
> `CHECK IN ('pending','ordered','shipped','failed')`. Migration `003` deleted all `pending`
> rows and narrowed it to `('ordered','failed')` with default `'ordered'`, because a row is
> only written once an attempt resolves.

**Indexes**

| Name | Definition |
|---|---|
| `cp_bot_fulfillments_user_created_idx` | `(user_id, created_at DESC)` |
| `cp_bot_fulfillments_ebay_order_idx` | `(ebay_order_id)` |

**Policies**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Users manage own CP Bot fulfillments` | `ALL` | `authenticated` | `USING ((select auth.uid()) = user_id)` · `WITH CHECK ((select auth.uid()) = user_id)` |

---

### `cp_bot_activity_log`

Append-only automation event stream. Drives the Automation Activity Log and the
"Breakdown by type" stat cards.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | yes | — | **FK** → `auth.users(id)` (no cascade clause) |
| `event_type` | `text` | no | — | `CHECK` — see allowed values below |
| `ebay_order_id` | `text` | yes | — | |
| `detail` | `jsonb` | yes | `'{}'` | Free-form event metadata |
| `extension_version` | `text` | yes | — | Added in `007` |
| `created_at` | `timestamptz` | yes | `now()` | |

**`event_type` allowed values** (constraint `cp_bot_activity_log_event_type_check`, final form after `016`)

| Value | Added in |
|---|---|
| `paste_success` | `005` |
| `paste_failed` | `005` |
| `scan` | `005` |
| `gift_added` | `005` |
| `address_validation_warning` | `005` |
| `checkout_error` | `005` |
| `captcha_detected` | `005` |
| `prime_prompt_detected` | `005` |
| `automation_stopped` | `005` |
| `paste_success_address_search` | `011` |
| `paste_failed_address_search` | `011` |
| `address_search_success` | `011` |
| `address_search_failed` | `011` |
| `manual_edit_used` | `016` |

> Adding a new event type requires a migration that drops and recreates this constraint with
> the **full** list (see `011` and `016` for the pattern) — inserting an unlisted value fails.

**Indexes**

| Name | Definition |
|---|---|
| `cp_bot_activity_log_user_created` | `(user_id, created_at DESC)` |
| `cp_bot_activity_log_version_idx` | `(extension_version)` |

**Policies**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Users manage own CP Bot activity` | `ALL` | `authenticated` | `USING ((select auth.uid()) = user_id)` · `WITH CHECK ((select auth.uid()) = user_id)` |

---

### `cp_bot_settings`

One row per user. Mirrored into `chrome.storage.local` by the extension; the mapping between
these column names and the extension's field names lives in `extension/lib/settingsSync.ts`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | no | — | **UNIQUE**, **FK** → `auth.users(id)` |
| `automation_enabled` | `boolean` | yes | `true` | Master kill switch (inverted in the extension as `automationDisabled`) |
| `auto_mark_ordered` | `boolean` | yes | `true` | |
| `auto_select_address` | `boolean` | yes | `true` | Auto-click "Use this address" |
| `gift_options_enabled` | `boolean` | yes | `false` | |
| `gift_message` | `text` | yes | `''` | |
| `gift_from` | `text` | yes | `''` | |
| `show_place_order_banner` | `boolean` | no | `false` | Added in `017` — on-page verdict notice above "Place your order" |
| `updated_at` | `timestamptz` | yes | `now()` | |

> Gift options are stored **locally only** by the extension and are deliberately omitted from
> `extensionSettingsToDb()`, so the extension never overwrites these gift columns.

**Policies**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Users manage own CP Bot settings` | `ALL` | `authenticated` | `USING ((select auth.uid()) = user_id)` · `WITH CHECK ((select auth.uid()) = user_id)` |

---

### `cp_bot_gift_templates`

Reusable gift-message presets (the app limits these to 5 per account).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | no | — | **FK** → `auth.users(id)` `ON DELETE CASCADE` |
| `name` | `text` | no | — | Template name |
| `message` | `text` | no | `''` | |
| `from_name` | `text` | no | `''` | |
| `position` | `smallint` | no | `0` | Display order |
| `created_at` | `timestamptz` | no | `now()` | |
| `updated_at` | `timestamptz` | no | `now()` | |

**Indexes**

| Name | Definition |
|---|---|
| `cp_bot_gift_templates_user_idx` | `(user_id, position)` |

**Policies**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Users manage own gift templates` | `ALL` | `authenticated` | `USING ((select auth.uid()) = user_id)` · `WITH CHECK ((select auth.uid()) = user_id)` |

---

### `cp_bot_cloud_clipboard`

Short-lived cross-device address handoff: copy an order in one browser, paste it in another
signed into the same account.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | no | — | **FK** → `auth.users(id)` |
| `ebay_order_id` | `text` | no | — | |
| `address` | `jsonb` | no | — | Full address payload |
| `created_at` | `timestamptz` | yes | `now()` | |
| `expires_at` | `timestamptz` | no | `now() + interval '5 minutes'` | TTL |

**Constraints**

- `UNIQUE (user_id, ebay_order_id)` — re-copying the same order upserts rather than duplicating.

**Indexes**

| Name | Definition |
|---|---|
| `cp_bot_cloud_clipboard_user_expiry` | `(user_id, expires_at)` |

**Policies**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Users manage own cloud clipboard` | `ALL` | `authenticated` | `USING ((select auth.uid()) = user_id)` · `WITH CHECK ((select auth.uid()) = user_id)` |

> **TTL correctness does not depend on the cron job.** The read path filters
> `expires_at > now()`, so expired rows are never returned even if cleanup never runs.

---

### `cp_bot_licenses`

Subscription state synced in from automationalchemists.com via webhook.
Defined in `supabase/cp_bot_licenses_setup.sql` (run manually, not a numbered migration).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | yes | — | **FK** → `auth.users(id)` `ON DELETE CASCADE`. Nullable — a purchase can precede account creation |
| `email` | `text` | no | — | **UNIQUE** — the join key from the webhook |
| `status` | `text` | no | — | `CHECK IN ('active','inactive','cancelled')` |
| `updated_at` | `timestamptz` | no | `now()` | |

**Policies**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Users can read own cp_bot_license` | `SELECT` | `authenticated` | `USING ((select auth.uid()) = user_id)` |

> **Intentionally no INSERT/UPDATE/DELETE policies.** Clients can never modify their own
> license status; the webhook writes with the service-role key, which bypasses RLS.

---

### `cp_bot_config`

Global singleton for server-tunable knobs — lets you change extension behaviour without
shipping a new version.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `int` | no | `1` | **PK**, `CHECK (id = 1)` (singleton) |
| `minimum_supported_version` | `text` | no | `'1.0.0'` | Forces upgrade below this version |
| `paste_hourly_soft_limit` | `int` | no | `15` | Added in `013` — Layer 2 rate limiter |
| `paste_hourly_hard_limit` | `int` | no | `20` | Added in `013` |
| `paste_min_gap_seconds` | `int` | no | `60` | Added in `013` |
| `updated_at` | `timestamptz` | yes | `now()` | |

Seeded with `(1, '1.0.0')` via `ON CONFLICT DO NOTHING`.

**Policies**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Authenticated users can read config` | `SELECT` | `authenticated` | `USING (true)` |

> Read-only to clients. Writes require the service role or the Supabase dashboard.

---

### `cp_bot_insight_cards`

Developer-managed "Insights & recommendations" promo cards shown to all users on the CP Bot
dashboard.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | no | `gen_random_uuid()` | **PK** |
| **Content** | | | | |
| `category` | `text` | no | `'UPSELL'` | Small tag label |
| `badge` | `text` | yes | — | Corner badge, e.g. "New" |
| `badge_color` | `text` | no | `'blue'` | Accent key |
| `title` | `text` | no | — | |
| `body` | `text` | no | `''` | Multi-line, rendered as text |
| `highlight` | `text` | yes | — | Big callout chip, e.g. "$500" |
| **Visual** | | | | |
| `icon` | `text` | yes | — | Curated lucide icon name |
| `emoji` | `text` | yes | — | Alternative to `icon` |
| `accent_color` | `text` | no | `'cyan'` | Theme colour key |
| `image_url` | `text` | yes | — | Hosted image (http/https) |
| `layout` | `text` | no | `'icon-left'` | `icon-left` \| `highlight` \| `image-top` |
| **Call to action** | | | | |
| `cta_label` | `text` | yes | — | |
| `cta_url` | `text` | yes | — | External link (http/https) |
| `cta_new_tab` | `boolean` | no | `true` | |
| **Behaviour** | | | | |
| `is_active` | `boolean` | no | `true` | |
| `position` | `smallint` | no | `0` | Display order |
| `starts_at` | `timestamptz` | yes | — | Optional schedule start |
| `ends_at` | `timestamptz` | yes | — | Optional schedule end |
| **Meta** | | | | |
| `created_by` | `uuid` | yes | — | **FK** → `auth.users(id)` |
| `created_at` | `timestamptz` | no | `now()` | |
| `updated_at` | `timestamptz` | no | `now()` | |

**Indexes**

| Name | Definition |
|---|---|
| `cp_bot_insight_cards_active_idx` | `(is_active, position)` |

**Policies**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Anyone can read active insight cards` | `SELECT` | `authenticated` | `USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()))` |
| `Dev admin manages insight cards` | `ALL` | `authenticated` | `USING ((auth.jwt() ->> 'email') = 'dsclub.au@gmail.com')` · `WITH CHECK (same)` |

> Postgres RLS policies are **permissive and OR'd together**, so the developer account also
> sees inactive and out-of-window cards for management, while everyone else is limited to the
> read policy. Authorisation is enforced in the database by JWT email claim — not just in the UI.

---

## Storage buckets

### `label-uploads` — private

Uploaded return-label / QR / barcode images. Per-user folder isolation: the first path
segment must equal the user's UID.

| Setting | Value |
|---|---|
| `public` | `false` |
| `file_size_limit` | `8388608` (8 MB) |
| `allowed_mime_types` | `image/png`, `image/jpeg`, `image/webp` |

**Policies on `storage.objects`**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Users can read own label uploads` | `SELECT` | `authenticated` | `bucket_id = 'label-uploads' AND (storage.foldername(name))[1] = (select auth.uid())::text` |
| `Users can upload own label uploads` | `INSERT` | `authenticated` | same, as `WITH CHECK` |
| `Users can replace own label uploads` | `UPDATE` | `authenticated` | same, as both `USING` and `WITH CHECK` |
| `Users can delete own label uploads` | `DELETE` | `authenticated` | same, as `USING` |

### `insight-images` — public

Promo images for `cp_bot_insight_cards`. Public read so every user can load them by URL;
writes restricted to the developer account.

| Setting | Value |
|---|---|
| `public` | `true` |

**Policies on `storage.objects`**

| Name | Command | Roles | Expression |
|---|---|---|---|
| `Public can read insight images` | `SELECT` | `public` | `bucket_id = 'insight-images'` |
| `Dev can upload insight images` | `INSERT` | `authenticated` | `bucket_id = 'insight-images' AND (auth.jwt() ->> 'email') = 'dsclub.au@gmail.com'` |
| `Dev can update insight images` | `UPDATE` | `authenticated` | same, as `USING` |
| `Dev can delete insight images` | `DELETE` | `authenticated` | same, as `USING` |

---

## Functions & scheduled jobs

### `cleanup_expired_cp_bot_cloud_clipboard()`

```sql
returns void
language sql
security definer
as $$
  delete from cp_bot_cloud_clipboard where expires_at < now();
$$;
```

Deletes expired clipboard rows. Purely housekeeping — see the TTL note on
[`cp_bot_cloud_clipboard`](#cp_bot_cloud_clipboard).

### Scheduled job (conditional)

Migration `009` schedules `cleanup-cp-bot-cloud-clipboard` to run **every minute** via `pg_cron`,
but only if the `pg_cron` extension is enabled. If it isn't, the migration raises a notice and
continues rather than failing.

---

## Realtime

Migration `010` adds these tables to the `supabase_realtime` publication so the admin dashboard
receives instant updates on insert:

- `cp_bot_fulfillments`
- `cp_bot_activity_log`

---

## Grants & extensions

```sql
create extension if not exists pgcrypto;   -- for gen_random_uuid()

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.cp_bot_fulfillments to authenticated;
```

Table access is governed by RLS, not by grants — the grants above simply allow the
`authenticated` role to reach the table so policies can be evaluated.

---

## RLS pattern reference

RLS is enabled on **every** table. Three patterns are used:

**1. Per-user ownership** — the default for user data:

```sql
create policy "..." on public.<table>
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

`(select auth.uid())` rather than bare `auth.uid()` lets Postgres evaluate it once per query
instead of once per row.

**2. Read-only reference data** — `templates`, `cp_bot_config`, and the read half of
`cp_bot_insight_cards`: a `SELECT` policy for `authenticated` (and `anon` for `templates`) with
no write policies. Writes go through the service role.

**3. Developer-only administration** — `cp_bot_insight_cards` and the `insight-images` bucket,
gated on the JWT email claim:

```sql
using ((auth.jwt() ->> 'email') = 'dsclub.au@gmail.com')
```

> The extension only ever uses the public **anon** key, scoped by these policies. The
> service-role key is never stored in or transmitted to the extension.

---

## Migration history

| File | Adds / changes |
|---|---|
| `schema.sql` | `pgcrypto`; `templates` (+ 5 seed rows); `label_history`; `label-uploads` bucket + policies; `cp_bot_fulfillments` (original form) |
| `cp_bot_licenses_setup.sql` | `cp_bot_licenses` + read-only policy (run manually) |
| `002_cp_bot_fulfillments_updates` | `item_title`, `amazon_asin`, `validation_warnings`; status default `'pending'`; 4-value status check |
| `003_cp_bot_status_simplify` | Deletes `pending` rows; status narrowed to `('ordered','failed')`, default `'ordered'` |
| `004_cp_bot_settings` | `cp_bot_settings` + policy |
| `005_cp_bot_activity_log` | `cp_bot_activity_log` + event-type check + policy + index |
| `006_cp_bot_amazon_account` | `cp_bot_fulfillments.amazon_account` |
| `007_cp_bot_activity_log_version` | `cp_bot_activity_log.extension_version` + index |
| `008_cp_bot_config` | `cp_bot_config` singleton + read policy + seed row |
| `009_cp_bot_cloud_clipboard` | `cp_bot_cloud_clipboard` + policy + index + cleanup function + optional cron |
| `010_cp_bot_realtime` | Realtime for `cp_bot_fulfillments`, `cp_bot_activity_log` |
| `011_cp_bot_activity_event_types` | +4 event types (address-search variants) |
| `012_cp_bot_gift_templates` | `cp_bot_gift_templates` + policy + index |
| `013_cp_bot_config_rate_limits` | 3 paste rate-limit columns on `cp_bot_config` |
| `014_cp_bot_insight_cards` | `cp_bot_insight_cards` + read/dev policies + index |
| `015_cp_bot_insight_images` | `insight-images` public bucket + 4 policies |
| `016_cp_bot_activity_manual_edit` | +`manual_edit_used` event type |
| `017_cp_bot_place_order_banner` | `cp_bot_settings.show_place_order_banner` |

There is no `001` — `schema.sql` is the baseline.

### Known duplication

`supabase/cp_bot_fulfillments.sql` is a **standalone copy** of the original
`cp_bot_fulfillments` definition already present in `schema.sql`. It predates migrations
`002`/`003`, so its `status` column still shows the old default (`'pending'`) and the old
4-value check. It is superseded by those migrations and is not part of the resolved schema
documented above.
