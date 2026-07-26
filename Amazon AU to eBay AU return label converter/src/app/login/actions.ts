"use server";
 
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSupabaseEnv, getSupabasePublicEnv } from "@/lib/supabase/config";
import { AUTH_COOKIE_MAX_AGE_SECONDS, getAuthCookieExpiry } from "@/lib/auth/cookie-config";

function cleanEmail(value: FormDataEntryValue | null) {
  return String(value || "").trim().toLowerCase();
}

function buildAuthErrorUrl(pathname: "/login" | "/register", message: string, email: string, next?: string) {
  const params = new URLSearchParams({ error: message });

  if (email) {
    params.set("email", email);
  }

  if (next) {
    params.set("next", next);
  }

  return `${pathname}?${params.toString()}`;
}

async function getRequestOrigin() {
  const headerStore = await headers();

  return headerStore.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/**
 * Creates a Supabase server client that sets cookies.
 * This controls session persistence.
 */
async function createClientWithMaxAge() {
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
              // Ensure the cookie persists in a real browser (not just session-scoped)
              expires: getAuthCookieExpiry(),
            });
          });
        } catch {
          // Server Components cannot always write cookies; the middleware proxy handles refresh.
        }
      },
    },
  });
}

export async function signInWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/");
  }

  const email = cleanEmail(formData.get("email"));
  const password = String(formData.get("password") || "");
  const next = "/choose";

  if (!email || !password) {
    redirect(buildAuthErrorUrl("/login", "Enter your email and password.", email, next));
  }

  const supabase = await createClientWithMaxAge();


  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(buildAuthErrorUrl("/login", error.message, email, next));
  }

  redirect("/choose");
}

export async function registerWithPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/");
  }

  const email = cleanEmail(formData.get("email"));
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(buildAuthErrorUrl("/register", "Enter your email and password.", email));
  }

  const cookieStore = await cookies();
  const { url, key } = getSupabasePublicEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies.
        }
      },
    },
  });

  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    redirect(buildAuthErrorUrl("/register", error.message, email));
  }

  if (data.session) {
    redirect("/choose");
  }

  redirect(`/login?registered=${encodeURIComponent(email)}`);
}
