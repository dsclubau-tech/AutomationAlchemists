import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getAppAuthContext } from "@/lib/auth-context";
import { getCpBotSettings } from "@/app/actions/getCpBotSettings";
import { getGiftTemplates } from "@/app/actions/getGiftTemplates";
import { SettingsForm } from "@/components/cp-bot/SettingsForm";
import { GiftTemplatesManager } from "@/components/cp-bot/GiftTemplatesManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const dynamic = "force-dynamic";

export default async function CpBotSettingsPage() {
  const auth = await getAppAuthContext();

  if (auth.authEnabled && !auth.userId) {
    redirect("/login");
  }

  const [initialSettings, initialTemplates] = await Promise.all([
    getCpBotSettings(),
    getGiftTemplates(),
  ]);

  return (
    <AppShell authEnabled={auth.authEnabled} userEmail={auth.userEmail}>
      <div className="mx-auto max-w-2xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        {/* Page Header */}
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-panel backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-xl shadow-md shadow-cyan-100">
              <img src="/robot-logo-40.jpg" alt="CP Bot Logo" className="h-10 w-10 object-cover select-none" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-600">CP Bot Admin</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Settings</h1>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            Configure your order fulfillment automation preferences and gift options. These settings will automatically sync to your browser extension popup.
          </p>
        </section>

        {/* Settings Form */}
        <ErrorBoundary>
          <SettingsForm
            initialSettings={initialSettings}
            authEnabled={auth.authEnabled}
          />
        </ErrorBoundary>

        {/* Gift Message Templates */}
        <ErrorBoundary>
          <GiftTemplatesManager
            initialTemplates={initialTemplates}
            authEnabled={auth.authEnabled}
          />
        </ErrorBoundary>
      </div>
    </AppShell>
  );
}
