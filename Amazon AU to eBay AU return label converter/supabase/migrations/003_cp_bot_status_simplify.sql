-- Remove pending from allowed statuses
-- Delete any existing pending records (they are meaningless now)
delete from cp_bot_fulfillments where status = 'pending';

alter table cp_bot_fulfillments
  drop constraint if exists cp_bot_fulfillments_status_check,
  add constraint cp_bot_fulfillments_status_check
    check (status in ('ordered', 'failed'));

-- Status default is now ordered (a record is only written on success)
alter table cp_bot_fulfillments
  alter column status set default 'ordered';
