create table if not exists cp_bot_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  event_type text not null,
  ebay_order_id text,
  detail jsonb default '{}',
  created_at timestamptz default now()
);

-- event_type allowed values
alter table cp_bot_activity_log
  add constraint cp_bot_activity_log_event_type_check
  check (event_type in (
    'paste_success',
    'paste_failed',
    'scan',
    'gift_added',
    'address_validation_warning',
    'checkout_error',
    'captcha_detected',
    'prime_prompt_detected',
    'automation_stopped'
  ));

alter table cp_bot_activity_log enable row level security;

create policy "Users manage own CP Bot activity"
  on public.cp_bot_activity_log
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Index for fast per-user queries sorted by time
create index cp_bot_activity_log_user_created
  on cp_bot_activity_log (user_id, created_at desc);
