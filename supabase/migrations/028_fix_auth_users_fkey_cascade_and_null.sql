-- Migration 028: Fix Foreign Key Constraints referencing auth.users(id) to prevent deletion blockage

-- 1. admin_audit_log: Set NULL on delete (Preserves immutable audit trail & email snapshot)
ALTER TABLE public.admin_audit_log
  DROP CONSTRAINT IF EXISTS admin_audit_log_target_user_id_fkey,
  DROP CONSTRAINT IF EXISTS admin_audit_log_admin_user_id_fkey;

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_target_user_id_fkey
    FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT admin_audit_log_admin_user_id_fkey
    FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. subscriptions: Set NULL if granting admin is deleted (Preserves granted subscription)
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_granted_by_admin_id_fkey;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_granted_by_admin_id_fkey
    FOREIGN KEY (granted_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. educational_content: Set NULL if content author is deleted (Preserves published content)
ALTER TABLE public.educational_content
  DROP CONSTRAINT IF EXISTS educational_content_created_by_fkey;

ALTER TABLE public.educational_content
  ADD CONSTRAINT educational_content_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. cp_bot_activity_log: Set NULL on delete (Preserves fulfillment & eBay operational telemetry)
ALTER TABLE public.cp_bot_activity_log
  DROP CONSTRAINT IF EXISTS cp_bot_activity_log_user_id_fkey;

ALTER TABLE public.cp_bot_activity_log
  ADD CONSTRAINT cp_bot_activity_log_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. cp_bot_insight_cards: Set NULL if creator is deleted (Preserves insight cards)
ALTER TABLE public.cp_bot_insight_cards
  DROP CONSTRAINT IF EXISTS cp_bot_insight_cards_created_by_fkey;

ALTER TABLE public.cp_bot_insight_cards
  ADD CONSTRAINT cp_bot_insight_cards_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
