"use server";

import { getAppAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";
import { CpBotSettings } from "@/types/cp-bot";

export async function getCpBotSettings(): Promise<CpBotSettings | null> {
  const auth = await getAppAuthContext();
  if (!auth.authEnabled || !auth.userId) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cp_bot_settings")
      .select("automation_enabled, auto_mark_ordered, auto_select_address")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching CP Bot settings:", error);
      return null;
    }

    return data as CpBotSettings | null;
  } catch (err) {
    console.error("Failed to run getCpBotSettings:", err);
    return null;
  }
}
