"use server";

import { getAppAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";
import { CpBotSettings } from "@/types/cp-bot";

export async function saveCpBotSettings(
  settings: Partial<CpBotSettings>
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAppAuthContext();
  if (!auth.authEnabled || !auth.userId) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("cp_bot_settings")
      .upsert(
        {
          user_id: auth.userId,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Error saving CP Bot settings:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to run saveCpBotSettings server action:", err);
    return { success: false, error: "Internal server error" };
  }
}
