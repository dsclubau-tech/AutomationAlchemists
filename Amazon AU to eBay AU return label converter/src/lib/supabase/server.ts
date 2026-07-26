import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/supabase/config";
import { AUTH_COOKIE_MAX_AGE_SECONDS, getAuthCookieExpiry } from "@/lib/auth/cookie-config";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabasePublicEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
              expires: getAuthCookieExpiry(),
            });
          });
        } catch {
          // Server Components cannot always write cookies. src/lib/supabase/proxy.ts refreshes them.
        }
      },
    },
  });
}

