-- ==============================================================================
-- 026_tool_credentials.sql
-- Table and security definitions for external machine credentials (tool API keys).
-- Used by external tool background workers (e.g. ListFlow, OrderBot) to query
-- subscription status without a user browser session.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tool_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug text NOT NULL,
  credential_hash text NOT NULL,
  key_prefix text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz NULL,
  last_used_at timestamptz NULL
);

-- Documentation comments
COMMENT ON TABLE public.tool_credentials IS 'Stores hashed machine credentials for server-to-server tool integrations.';
COMMENT ON COLUMN public.tool_credentials.tool_slug IS 'Identifier of the external tool (e.g. listflow, orderbot).';
COMMENT ON COLUMN public.tool_credentials.credential_hash IS 'SHA-256 cryptographic hash of the raw token. Plaintext is never stored.';
COMMENT ON COLUMN public.tool_credentials.key_prefix IS 'Non-sensitive prefix (e.g. aa_live_listflow_...a1b2) for admin identification.';
COMMENT ON COLUMN public.tool_credentials.revoked_at IS 'Timestamp when credential was revoked. NULL indicates active credential.';
COMMENT ON COLUMN public.tool_credentials.last_used_at IS 'Timestamp of last successful authentication using this credential.';

-- Multi-credential support & fast lookup indices on active credentials
CREATE INDEX IF NOT EXISTS idx_tool_credentials_active 
  ON public.tool_credentials (tool_slug) 
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tool_credentials_hash_active
  ON public.tool_credentials (credential_hash)
  WHERE revoked_at IS NULL;

-- ==============================================================================
-- Security & RLS Lockdown
-- Only service_role (backend Edge Functions) can read/write this table.
-- Public, anon, and authenticated roles have zero access.
-- ==============================================================================

-- 1. Enable Row Level Security (with zero policies for anon/authenticated)
ALTER TABLE public.tool_credentials ENABLE ROW LEVEL SECURITY;

-- 2. Explicitly revoke all privileges from public, anon, and authenticated roles
REVOKE ALL ON TABLE public.tool_credentials FROM PUBLIC;
REVOKE ALL ON TABLE public.tool_credentials FROM anon;
REVOKE ALL ON TABLE public.tool_credentials FROM authenticated;

-- 3. Grant access exclusively to service_role (and postgres)
GRANT ALL ON TABLE public.tool_credentials TO service_role;
