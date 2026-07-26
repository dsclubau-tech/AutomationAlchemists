create table if not exists cp_bot_config (
  id int primary key default 1,
  minimum_supported_version text not null default '1.0.0',
  updated_at timestamptz default now(),
  constraint cp_bot_config_singleton check (id = 1)
);

insert into cp_bot_config (id, minimum_supported_version)
values (1, '1.0.0')
on conflict (id) do nothing;

alter table cp_bot_config enable row level security;

-- Readable by any authenticated user, writable only via service role
create policy "Authenticated users can read config"
  on public.cp_bot_config
  for select
  to authenticated
  using (true);
