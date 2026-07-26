"use server";

import { getAppAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";

export async function saveGiftTemplate(template: {
  id?: string;
  name: string;
  message: string;
  from_name: string;
  position: number;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const auth = await getAppAuthContext();
  if (!auth.authEnabled || !auth.userId) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const supabase = await createClient();

    if (!template.id) {
      const { count, error: countError } = await supabase
        .from("cp_bot_gift_templates")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.userId);

      if (countError) {
        return { success: false, error: countError.message };
      }

      if ((count || 0) >= 5) {
        return { success: false, error: "Maximum 5 templates allowed" };
      }
    }

    if (template.id) {
      const { error } = await supabase
        .from("cp_bot_gift_templates")
        .update({
          name: template.name,
          message: template.message,
          from_name: template.from_name,
          position: template.position,
          updated_at: new Date().toISOString(),
        })
        .eq("id", template.id)
        .eq("user_id", auth.userId);

      if (error) return { success: false, error: error.message };
      return { success: true, id: template.id };
    } else {
      const { data, error } = await supabase
        .from("cp_bot_gift_templates")
        .insert({
          user_id: auth.userId,
          name: template.name,
          message: template.message,
          from_name: template.from_name,
          position: template.position,
        })
        .select("id")
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data?.id };
    }
  } catch (err) {
    console.error("Failed to save gift template:", err);
    return { success: false, error: "Internal server error" };
  }
}
