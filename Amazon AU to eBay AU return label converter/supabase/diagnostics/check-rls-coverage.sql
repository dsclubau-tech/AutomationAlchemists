-- Run this in the Supabase Dashboard SQL Editor and paste the output back.
-- Read-only diagnostic queries only — does not modify any table or policy.

-- 1. Every table in the public schema and whether RLS is enabled
select
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2. Every existing policy, grouped by table, so coverage can be checked
-- per-table (a table can show rls_enabled = true above but still have
-- zero policies, which silently blocks ALL access rather than scoping it —
-- both extremes are worth catching)
select
  tablename,
  policyname,
  cmd as applies_to,
  roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
