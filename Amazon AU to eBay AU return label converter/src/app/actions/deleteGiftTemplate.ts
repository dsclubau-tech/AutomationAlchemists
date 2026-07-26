"use server";

import { getAppAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";

export async function deleteGiftTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAppAuthContext();
  if (!auth.authEnabled || !auth.userId) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("cp_bot_gift_templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", auth.userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    console.error("Failed to delete gift template:", err);
    return { success: false, error: "Internal server error" };
  }
}
