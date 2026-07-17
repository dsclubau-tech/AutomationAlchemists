-- Migration: Rate Limits Table

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Service role will bypass)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies needed; edge functions will use service role to read/write

-- Optional: Create an index to speed up the count queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint_time 
ON public.rate_limits (ip_address, endpoint, created_at);
