import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/config";
import { AUTH_COOKIE_MAX_AGE_SECONDS } from "@/lib/auth/cookie-config";

export function createClient() {
  const { url, key } = getSupabasePublicEnv();

  return createBrowserClient(url, key, {
    cookieOptions: {
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: typeof window !== "undefined"
        ? window.location.protocol === "https:"
        : true,
    },
  });
}

