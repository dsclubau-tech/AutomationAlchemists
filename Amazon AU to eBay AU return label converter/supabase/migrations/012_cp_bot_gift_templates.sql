create table if not exists public.cp_bot_gift_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  message text not null default '',
  from_name text not null default '',
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cp_bot_gift_templates enable row level security;

create policy "Users manage own gift templates"
  on public.cp_bot_gift_templates
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists cp_bot_gift_templates_user_idx
  on public.cp_bot_gift_templates (user_id, position);
