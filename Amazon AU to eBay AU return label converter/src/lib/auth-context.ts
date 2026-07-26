import { cache } from "react";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface AppAuthContext {
  authEnabled: boolean;
  userEmail: string | null;
  userId: string | null;
}

export const getAppAuthContext = cache(async (): Promise<AppAuthContext> => {
  const authEnabled = hasSupabaseEnv();

  if (!authEnabled) {
    return {
      authEnabled,
      userEmail: null,
      userId: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    authEnabled,
    userEmail: user?.email ?? null,
    userId: user?.id ?? null,
  };
});
