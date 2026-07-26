-- Migration 006: Add amazon_account column to cp_bot_fulfillments table if not exists

alter table cp_bot_fulfillments
  add column if not exists amazon_account text;
