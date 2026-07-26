-- Run this in the Supabase Dashboard SQL Editor and paste the output back.
-- This does not modify anything — read-only diagnostic queries only.

-- 1. Max connection limit configured for this project (correlates with tier)
show max_connections;

-- 2. Current active connections (to see how close to the limit Realtime + normal traffic is running)
select count(*) as active_connections from pg_stat_activity;

-- 3. Realtime-specific connection usage, if visible
select
  application_name,
  count(*) as connection_count
from pg_stat_activity
group by application_name
order by connection_count desc;
