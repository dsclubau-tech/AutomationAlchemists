-- Migration 010: Enable Supabase Realtime for CP Bot tables
-- This allows the admin page to receive instant updates when new rows are inserted.

alter publication supabase_realtime add table cp_bot_fulfillments;
alter publication supabase_realtime add table cp_bot_activity_log;
