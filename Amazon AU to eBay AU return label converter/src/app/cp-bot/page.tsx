import { redirect } from "next/navigation";
import { Bot } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getAppAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";
import { OnboardingChecklist } from "@/components/cp-bot/OnboardingChecklist";
import { FailureRateBanner } from "@/components/cp-bot/FailureRateBanner";

export const dynamic = "force-dynamic";

export default async function CpBotMainPage() {
  const auth = await getAppAuthContext();

  if (auth.authEnabled && !auth.userId) {
    redirect("/login");
  }

  let hasCompletedPaste = false;
  let hasCompletedScan = false;
  let minimumSupportedVersion: string | null = null;

  if (auth.authEnabled && auth.userId) {
    try {
      const supabase = await createClient();
      const [pasteRes, scanRes, configRes] = await Promise.all([
        supabase
          .from("cp_bot_fulfillments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", auth.userId)
          .eq("status", "ordered"),
        supabase
          .from("cp_bot_activity_log")
          .select("id", { count: "exact", head: true })
          .eq("user_id", auth.userId)
          .eq("event_type", "scan"),
        supabase
          .from("cp_bot_config")
          .select("minimum_supported_version")
          .eq("id", 1)
          .maybeSingle(),
      ]);

      if (!pasteRes.error && pasteRes.count && pasteRes.count > 0) {
        hasCompletedPaste = true;
      }

      if (!scanRes.error && scanRes.count && scanRes.count > 0) {
        hasCompletedScan = true;
      }

      if (!configRes.error && configRes.data) {
        minimumSupportedVersion = configRes.data.minimum_supported_version;
      }
    } catch (err) {
      console.error("Failed to query onboarding completed status or config:", err);
    }
  }

  return (
    <AppShell authEnabled={auth.authEnabled} userEmail={auth.userEmail}>
      <div className="mx-auto max-w-2xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        {/* Section A: Overview Header */}
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-panel backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-xl shadow-md shadow-cyan-100">
              <img src="/robot-logo-40.jpg" alt="CP Bot Logo" className="h-10 w-10 object-cover select-none" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-600">by Automation Alchemists</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">CP Bot</h1>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            Automate your eBay AU to Amazon AU order fulfilment. Copy buyer addresses from eBay and paste them directly into Amazon checkout in seconds.
          </p>
        </section>

        {/* Failure Rate Monitor Banner */}
        <FailureRateBanner userId={auth.userId} />

        {/* Section B: Onboarding Checklist */}
        <OnboardingChecklist
          hasCompletedScan={hasCompletedScan}
          hasCompletedPaste={hasCompletedPaste}
          minimumSupportedVersion={minimumSupportedVersion}
        />
      </div>
    </AppShell>
  );
}
