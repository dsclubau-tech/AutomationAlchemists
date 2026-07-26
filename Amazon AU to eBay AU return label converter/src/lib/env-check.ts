const REQUIRED_SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function isRunningOnVercel(): boolean {
  // Vercel sets this automatically on every deployment (preview and production).
  // Do not use NODE_ENV === "production" for this check — a local
  // \`next build && next start\` also sets NODE_ENV=production and must NOT
  // be treated as a real deployment requiring hard-fail behaviour.
  return process.env.VERCEL === "1";
}

export function getMissingSupabaseEnvVars(): string[] {
  return REQUIRED_SUPABASE_ENV_VARS.filter((key) => !process.env[key]);
}

export function assertSupabaseEnvInProduction(): void {
  if (!isRunningOnVercel()) {
    return; // local dev — existing no-auth fallback behaviour is intentional, leave it alone
  }
  const missing = getMissingSupabaseEnvVars();
  if (missing.length > 0) {
    throw new Error(
      `CRITICAL: Missing required Supabase environment variables in a live deployment: ${missing.join(", ")}. ` +
      `The app cannot safely start without these — refusing to boot with auth silently bypassed.`
    );
  }
}
