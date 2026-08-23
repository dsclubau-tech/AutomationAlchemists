-- 1. Table-level RLS check
SELECT relrowsecurity 
FROM pg_class 
WHERE relname = 'subscriptions';

-- 2. List every existing policy on subscriptions
SELECT 
    cmd as command,
    roles,
    qual as using_clause,
    with_check as with_check_clause,
    policyname as policy_name
FROM pg_policies 
WHERE tablename = 'subscriptions';

-- 3. Grants on the table
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'subscriptions' 
  AND grantee IN ('anon', 'public');

-- 4. RPC Grants
SELECT grantee, privilege_type 
FROM information_schema.role_routine_grants 
WHERE routine_name = 'get_active_subscription_count'
  AND grantee IN ('anon', 'public', 'PUBLIC');
