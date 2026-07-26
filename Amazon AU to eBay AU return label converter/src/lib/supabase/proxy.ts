import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv, hasSupabaseEnv } from "@/lib/supabase/config";
import { AUTH_COOKIE_MAX_AGE_SECONDS, getAuthCookieExpiry } from "@/lib/auth/cookie-config";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth");
  const isLoginRoute = pathname === "/login";
  const isRegisterRoute = pathname === "/register";
  const isPrivacyRoute = pathname === "/privacy";

  // Bypass getUser calls for unauthenticated requests to improve performance and avoid console logs
  const hasSbCookies = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
  if (!hasSbCookies) {
    if (isAuthRoute || isLoginRoute || isRegisterRoute || isPrivacyRoute) {
      return NextResponse.next({ request });
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({ request });
  const { url, key } = getSupabasePublicEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
            expires: getAuthCookieExpiry(),
          });
        });
      },
    },
  });


  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && (error.status === 400 || error.code === "refresh_token_not_found")) {
    // If the refresh token is invalid or missing, delete the authentication cookies
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith("sb-")) {
        response.cookies.delete(cookie.name);
      }
    });
  }


  if (!user && !isAuthRoute && !isLoginRoute && !isRegisterRoute && !isPrivacyRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Propagate cookie updates to the redirect response
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      });
    });
    return redirectResponse;
  }

  if (user && (isLoginRoute || isRegisterRoute)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/choose";
    redirectUrl.search = "";
    
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Propagate cookie updates to the redirect response
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      });
    });
    return redirectResponse;
  }

  return response;
}
