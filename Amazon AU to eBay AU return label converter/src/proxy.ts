import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { assertSupabaseEnvInProduction } from "@/lib/env-check";

// Hard-fail if environment variables are missing in production/Vercel
assertSupabaseEnvInProduction();

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

