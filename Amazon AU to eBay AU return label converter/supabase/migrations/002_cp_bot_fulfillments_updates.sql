alter table cp_bot_fulfillments
  add column if not exists item_title text,
  add column if not exists amazon_asin text,
  add column if not exists validation_warnings jsonb default '[]',
  alter column status set default 'pending';

-- Status must be one of these values
alter table cp_bot_fulfillments
  drop constraint if exists cp_bot_fulfillments_status_check,
  add constraint cp_bot_fulfillments_status_check
    check (status in ('pending', 'ordered', 'shipped', 'failed'));
