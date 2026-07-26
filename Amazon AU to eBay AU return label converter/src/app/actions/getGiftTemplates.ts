"use server";

import { getAppAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";
import type { GiftTemplate } from "@/types/cp-bot";

export async function getGiftTemplates(): Promise<GiftTemplate[]> {
  const auth = await getAppAuthContext();
  if (!auth.authEnabled || !auth.userId) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cp_bot_gift_templates")
      .select("id, name, message, from_name")
      .eq("user_id", auth.userId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error fetching gift templates:", error);
      return [];
    }

    return (data || []) as GiftTemplate[];
  } catch (err) {
    console.error("Failed to fetch gift templates:", err);
    return [];
  }
}
