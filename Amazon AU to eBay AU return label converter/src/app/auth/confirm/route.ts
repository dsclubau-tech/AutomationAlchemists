import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function cleanRedirectPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = cleanRedirectPath(url.searchParams.get("next"));
  const redirectTo = new URL(next, url.origin);

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(redirectTo);
  }

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`, url.origin),
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`, url.origin),
    );
  }

  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent("The sign-in link is missing its verification token.")}&next=${encodeURIComponent(next)}`,
      url.origin,
    ),
  );
}
