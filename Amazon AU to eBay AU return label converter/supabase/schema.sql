create extension if not exists pgcrypto;

create table if not exists public.templates (
  id text primary key,
  name text not null,
  short_name text not null,
  carrier text not null,
  type text not null,
  code_type text not null check (code_type in ('qr', 'barcode', 'label')),
  code_label text not null,
  instructions jsonb not null,
  validity_copy text not null,
  dropoff_note text not null,
  dropoff_link text,
  dropoff_link_instruction_index integer,
  show_item_table boolean not null default true,
  secondary_code_label text,
  secondary_code_help text,
  secondary_code_type text check (secondary_code_type in ('qr', 'barcode', 'label')),
  secondary_aspect_ratio numeric,
  secondary_required boolean not null default false,
  accent text not null,
  aspect_ratio numeric not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.templates enable row level security;

drop policy if exists "Templates are readable" on public.templates;
create policy "Templates are readable"
  on public.templates
  for select
  to anon, authenticated
  using (true);

insert into public.templates (
  id,
  name,
  short_name,
  carrier,
  type,
  code_type,
  code_label,
  instructions,
  validity_copy,
  dropoff_note,
  dropoff_link,
  dropoff_link_instruction_index,
  show_item_table,
  secondary_code_label,
  secondary_code_help,
  secondary_code_type,
  secondary_aspect_ratio,
  secondary_required,
  accent,
  aspect_ratio
) values
(
  'auspost_qr',
  'Australia Post no-label QR',
  'AusPost QR',
  'Australia Post',
  'No-label QR drop-off',
  'qr',
  'Return Code',
  '[
    "Australia Post (post office) will be able to accept the return successfully after 30 mins. Please ensure to drop the parcel only at Australia Post (post office). Click the link below to find no-label drop off locations:",
    "Show the code and Australia Post will print the label for you."
  ]'::jsonb,
  'The return code is valid for 14 days from creation date. If your code expires and your item is still eligible for returns, contact seller to request a new return.',
  'Drop off at Australia Post only. Do not place no-label returns in street posting boxes.',
  'https://auspost.com.au/locate/?services=9',
  0,
  true,
  null,
  null,
  null,
  null,
  false,
  '#2257c8',
  1
),
(
  'auspost_label',
  'Australia Post printable label',
  'AusPost label',
  'Australia Post',
  'Printable label',
  'label',
  'Return Mailing Label',
  '[
    "Ensure that there are no tracking labels attached to your package. If you are shipping a non-hazardous item, completely remove or cover any hazardous material markings.",
    "Affix the postage label squarely onto the address side of the parcel, covering up any previous delivery address and barcode without overlapping any adjacent side.",
    "Take the package to an Australia Post location or drop it in a street posting box. To find your closest Australia Post location, visit https://auspost.com.au/locate"
  ]'::jsonb,
  'Cut this label and affix to the outside of the return package',
  'Accepted at Australia Post return locations. Keep proof of lodgement.',
  null,
  null,
  false,
  'Return Authorisation Label',
  'Cut this and place inside the return package',
  'barcode',
  3.45,
  true,
  '#21704c',
  1.5
),
(
  'parcelpoint_barcode',
  'ParcelPoint no-label barcode (Hubbed)',
  'ParcelPoint code (Hubbed)',
  'ParcelPoint',
  'No-label barcode drop-off',
  'barcode',
  'Return Code',
  '[
    "The Parcelpoint store will be able to accept the return successfully after 30 mins. Please ensure to drop the parcel only in the Parcelpoint store.",
    "Show the code and ParcelPoint will print the label for you. The package should be taken only to ParcelPoint DropOff location:",
    "Please do NOT print the Commercial Invoice. It is provided for your records only, and does not need to be included in your return package."
  ]'::jsonb,
  'The return code is valid for 14 days from creation date. If your code expires and your item is still eligible for returns, contact seller to request a new return.',
  'Drop off at ParcelPoint partner locations only.',
  'https://parcelpoint.com.au/find-a-store',
  1,
  true,
  null,
  null,
  null,
  null,
  false,
  '#7d4ac7',
  2.8
),
(
  'parcelpoint_label',
  'ParcelPoint printable label (Hubbed)',
  'ParcelPoint label (Hubbed)',
  'ParcelPoint',
  'Printable label',
  'label',
  'Return Mailing Label',
  '[
    "Print this label and attach it securely to the outside of the package.",
    "Drop off the parcel at a ParcelPoint partner location.",
    "Keep the lodgement receipt until the return is completed."
  ]'::jsonb,
  'Cut this label and affix to the outside of the return package',
  'Accepted at ParcelPoint partner locations only.',
  null,
  null,
  false,
  'Return Authorisation Label',
  'Cut this and place inside the return package',
  'barcode',
  3.45,
  true,
  '#9a5b0f',
  1.5
),
(
  'parcelpoint_pickup',
  'ParcelPoint pick-up label (Hubbed)',
  'ParcelPoint pick-up (Hubbed)',
  'ParcelPoint',
  'Pick-up label',
  'label',
  'Return Mailing Label',
  '[
    "Parcel Point will collect your parcel within next two business days (Mon-Fri: 8AM – 5PM, excluding holidays), as long as the collection is booked before 11:30PM local time.",
    "Print your return label and securely pack your item(s) to be returned before collection. Parcel Point will be unable to collect the item(s) if you do not have a printed return label secured to the outside of the package.",
    "Return the item in the original condition and packaging, unless the item was damaged upon receipt. Make sure an adult is present at the time of pickup.",
    "If you cannot be present for the first pickup attempt, please call Parcel Point customer service at 1300 025 639 within 48 hrs of failed pickup attempt to schedule the second time pickup. Parcel Point customer service operation hours are Mon-Fri: 8:30AM to 7:30PM; Sat: 9AM - 3PM; Sun: 11AM - 3PM. If the second pickup attempt fails, please contact the seller to create a new return request."
  ]'::jsonb,
  'Cut this label and affix to the outside of the return package',
  'Scheduled collection by ParcelPoint. Keep proof of booking.',
  null,
  null,
  true,
  'Return Authorisation Label',
  'Cut this and place inside the return package',
  'barcode',
  3.45,
  true,
  '#dc2626',
  0.95
)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  carrier = excluded.carrier,
  type = excluded.type,
  code_type = excluded.code_type,
  code_label = excluded.code_label,
  instructions = excluded.instructions,
  validity_copy = excluded.validity_copy,
  dropoff_note = excluded.dropoff_note,
  dropoff_link = excluded.dropoff_link,
  dropoff_link_instruction_index = excluded.dropoff_link_instruction_index,
  show_item_table = excluded.show_item_table,
  secondary_code_label = excluded.secondary_code_label,
  secondary_code_help = excluded.secondary_code_help,
  secondary_code_type = excluded.secondary_code_type,
  secondary_aspect_ratio = excluded.secondary_aspect_ratio,
  secondary_required = excluded.secondary_required,
  accent = excluded.accent,
  aspect_ratio = excluded.aspect_ratio,
  updated_at = now();

create table if not exists public.label_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null references public.templates(id),
  item_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  order_ref text,
  code_image_url text,
  output_format text check (output_format in ('png', 'jpg', 'pdf')),
  created_at timestamptz not null default now()
);

alter table public.label_history enable row level security;

drop policy if exists "Users can read own label history" on public.label_history;
create policy "Users can read own label history"
  on public.label_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own label history" on public.label_history;
create policy "Users can insert own label history"
  on public.label_history
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own label history" on public.label_history;
create policy "Users can delete own label history"
  on public.label_history
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'label-uploads',
  'label-uploads',
  false,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own label uploads" on storage.objects;
create policy "Users can read own label uploads"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'label-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can upload own label uploads" on storage.objects;
create policy "Users can upload own label uploads"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'label-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can replace own label uploads" on storage.objects;
create policy "Users can replace own label uploads"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'label-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'label-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete own label uploads" on storage.objects;
create policy "Users can delete own label uploads"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'label-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create table if not exists public.cp_bot_fulfillments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ebay_order_id text not null,
  amazon_order_ref text,
  buyer_name text,
  postcode text,
  item_title text,
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'pending' check (status in ('pending', 'ordered', 'shipped', 'failed')),
  source text not null default 'cp_bot',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cp_bot_fulfillments_user_created_idx
  on public.cp_bot_fulfillments (user_id, created_at desc);

create index if not exists cp_bot_fulfillments_ebay_order_idx
  on public.cp_bot_fulfillments (ebay_order_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.cp_bot_fulfillments to authenticated;

alter table public.cp_bot_fulfillments enable row level security;

drop policy if exists "Users manage own CP Bot fulfillments" on public.cp_bot_fulfillments;
create policy "Users manage own CP Bot fulfillments"
  on public.cp_bot_fulfillments
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
