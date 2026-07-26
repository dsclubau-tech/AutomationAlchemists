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
