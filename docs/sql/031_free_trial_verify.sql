-- ==============================================================================
-- Verification Script for Migration 031: Free Trial & User Price Overrides
-- ==============================================================================
-- Instructions: Run in Supabase SQL Editor after applying 031.
-- This script contains read-only diagnostic checks, followed by an atomic test block
-- that ends in ROLLBACK so no persistent state is altered.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1: Object Existence Checks
-- ------------------------------------------------------------------------------
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions' 
  AND column_name = 'is_trial';

SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('trial_offers', 'trial_claims', 'user_price_overrides', 'blocked_email_domains')
ORDER BY table_name;

-- ------------------------------------------------------------------------------
-- PART 2: Row Level Security (RLS) Status
-- ------------------------------------------------------------------------------
SELECT 
  relname AS table_name,
  rowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN ('trial_offers', 'trial_claims', 'user_price_overrides', 'blocked_email_domains')
ORDER BY relname;

-- ------------------------------------------------------------------------------
-- PART 3: Security & Privilege Verification
-- ------------------------------------------------------------------------------
-- Routine execute privileges for anon and authenticated
SELECT 
  p.proname AS function_name,
  pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('normalize_email', 'get_trial_public', 'get_trial_status', 'claim_free_trial')
ORDER BY p.proname;

-- Table privileges for anon
SELECT 
  tablename,
  has_table_privilege('anon', 'public.' || tablename, 'SELECT') AS anon_can_select,
  has_table_privilege('anon', 'public.' || tablename, 'INSERT') AS anon_can_insert
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('trial_offers', 'trial_claims', 'user_price_overrides', 'blocked_email_domains')
ORDER BY tablename;

-- ------------------------------------------------------------------------------
-- PART 4: Email Normalization Unit Tests
-- ------------------------------------------------------------------------------
SELECT 
  test_input,
  expected_output,
  actual_output,
  (actual_output = expected_output) AS test_passed
FROM (
  VALUES 
    ('Dsclub.Au+x@Gmail.com', 'dsclubau@gmail.com', public.normalize_email('Dsclub.Au+x@Gmail.com')),
    ('A.B+c@googlemail.com', 'ab@gmail.com', public.normalize_email('A.B+c@googlemail.com')),
    ('Name+tag@Example.com', 'name@example.com', public.normalize_email('Name+tag@Example.com')),
    ('first.last@example.com', 'first.last@example.com', public.normalize_email('first.last@example.com')),
    (' Test@X.COM ', 'test@x.com', public.normalize_email(' Test@X.COM '))
) AS t(test_input, expected_output, actual_output);

-- Blocked-domain verification check (expected true)
SELECT 
  'X@Mailinator.com' AS raw_email,
  public.normalize_email('X@Mailinator.com') AS normalized_email,
  EXISTS (
    SELECT 1 FROM public.blocked_email_domains 
    WHERE domain = substr(public.normalize_email('X@Mailinator.com'), position('@' in public.normalize_email('X@Mailinator.com') ) + 1)
  ) AS is_domain_blocked;

-- ------------------------------------------------------------------------------
-- PART 5: Atomic Claim Lifecycle & Slot Math Test (Rolls back completely)
-- ------------------------------------------------------------------------------
-- NOTE: Fill in <TEST_USER_UUID> with a real authenticated user ID for manual dry-run.
-- That user must NOT already have an active subscription row for 'cpbot'.
BEGIN;

  -- 1. Impersonate test user in transaction context
  SELECT set_config('request.jwt.claims', '{"sub":"<TEST_USER_UUID>", "role":"authenticated"}', true);

  -- 2. Configure offer inside transaction: enable, 500 cap, 59 reserved
  UPDATE public.trial_offers 
  SET enabled = true,
      slot_cap = 500,
      slots_reserved = 59,
      require_confirmed_email = false
  WHERE tool_slug = 'rccp';

  -- 3. Verify slot math calculation: slots_taken = 59, slots_left = 441
  SELECT 
    'Slot math check' AS step,
    public.get_trial_public('rccp') AS public_status;

  -- 4. Check status before claiming (expected eligible: true, reason: 'ok')
  SELECT 
    'Status before claim' AS step,
    public.get_trial_status('rccp') AS user_status;

  -- 5. First Claim (expected ok: true)
  SELECT 
    'First claim attempt' AS step,
    public.claim_free_trial('rccp') AS claim_1_result;

  -- 6. Second Claim (expected ok: false, reason: 'already_claimed')
  SELECT 
    'Second claim attempt (idempotency check)' AS step,
    public.claim_free_trial('rccp') AS claim_2_result;

  -- 7. Verify created records
  SELECT 
    'Subscriptions row created' AS step,
    id, user_id, email, product_slug, status, current_period_start, current_period_end, is_trial
  FROM public.subscriptions
  WHERE user_id = nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::uuid
    AND product_slug = 'cpbot';

  SELECT 
    'Trial claims row created' AS step,
    id, tool_slug, user_id, email_normalized, trial_ends_at, subscription_id
  FROM public.trial_claims
  WHERE tool_slug = 'rccp'
    AND user_id = nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::uuid;

  -- 8. Verify public slot math updated (slots_taken should now be 60, slots_left 440)
  SELECT 
    'Slot math after 1 claim' AS step,
    public.get_trial_public('rccp') AS public_status_after;

-- ROLLBACK: Nothing is persisted
ROLLBACK;
