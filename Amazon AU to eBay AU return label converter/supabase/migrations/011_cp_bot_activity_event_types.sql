-- Migration 011: Add new event types to cp_bot_activity_log constraint
-- Adds address_search_success, address_search_failed,
-- paste_success_address_search, paste_failed_address_search

alter table cp_bot_activity_log
  drop constraint if exists cp_bot_activity_log_event_type_check;

alter table cp_bot_activity_log
  add constraint cp_bot_activity_log_event_type_check
  check (event_type in (
    'paste_success',
    'paste_failed',
    'paste_success_address_search',
    'paste_failed_address_search',
    'address_search_success',
    'address_search_failed',
    'scan',
    'gift_added',
    'address_validation_warning',
    'checkout_error',
    'captcha_detected',
    'prime_prompt_detected',
    'automation_stopped'
  ));
