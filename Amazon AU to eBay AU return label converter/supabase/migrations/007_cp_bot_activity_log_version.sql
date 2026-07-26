alter table cp_bot_activity_log
  add column if not exists extension_version text;

create index if not exists cp_bot_activity_log_version_idx
  on cp_bot_activity_log (extension_version);
