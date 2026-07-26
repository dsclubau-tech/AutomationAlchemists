-- Cloud clipboard table for cross-device address handoff.
-- Stores short-lived (5 minute TTL) address payloads that can be picked up
-- on a different Chrome browser signed into the same CP Bot account.

create table if not exists cp_bot_cloud_clipboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  ebay_order_id text not null,
  address jsonb not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  unique (user_id, ebay_order_id)
);

alter table cp_bot_cloud_clipboard enable row level security;

create policy "Users manage own cloud clipboard"
  on public.cp_bot_cloud_clipboard
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists cp_bot_cloud_clipboard_user_expiry
  on cp_bot_cloud_clipboard (user_id, expires_at);

-- Cleanup function to delete expired rows. Correctness does NOT depend on
-- this function being called periodically — the read-time expiry filter
-- (expires_at > now()) in the CPBOT_GET_CLOUD_CLIPBOARD handler always
-- enforces TTL regardless.
create or replace function cleanup_expired_cp_bot_cloud_clipboard()
returns void
language sql
security definer
as $$
  delete from cp_bot_cloud_clipboard where expires_at < now();
$$;

-- Attempt to schedule the cleanup via pg_cron if the extension is available.
-- If pg_cron is not enabled on this Supabase project, the block emits a
-- notice and continues — the migration does not fail.
do $body$
begin
  if exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) then
    perform cron.schedule(
      'cleanup-cp-bot-cloud-clipboard',
      '* * * * *',
      $$select cleanup_expired_cp_bot_cloud_clipboard();$$
    );
    raise notice 'pg_cron: scheduled cleanup-cp-bot-cloud-clipboard every minute.';
  else
    raise notice 'pg_cron extension is not enabled — skipping scheduled cleanup. '
                 'Expired rows will still be filtered at read time.';
  end if;
end
$body$;
