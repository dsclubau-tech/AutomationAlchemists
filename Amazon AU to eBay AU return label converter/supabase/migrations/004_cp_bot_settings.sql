create table if not exists cp_bot_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,
  automation_enabled boolean default true,
  auto_mark_ordered boolean default true,
  auto_select_address boolean default true,
  gift_options_enabled boolean default false,
  gift_message text default '',
  gift_from text default '',
  updated_at timestamptz default now()
);

alter table cp_bot_settings enable row level security;

create policy "Users manage own CP Bot settings"
  on public.cp_bot_settings
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
