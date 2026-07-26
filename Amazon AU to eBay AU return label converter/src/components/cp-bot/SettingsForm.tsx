"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { CpBotSettings, DEFAULT_CP_BOT_SETTINGS } from "@/types/cp-bot";
import { saveCpBotSettings } from "@/app/actions/saveCpBotSettings";

interface SettingsFormProps {
  initialSettings: CpBotSettings | null;
  authEnabled: boolean;
}

export function SettingsForm({ initialSettings, authEnabled }: SettingsFormProps) {
  const [settings, setSettings] = useState<CpBotSettings>(
    initialSettings || DEFAULT_CP_BOT_SETTINGS
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let resolved = false;

    const handleLoadedSettings = (e: Event) => {
      const customEvent = e as CustomEvent;
      const extSettings = customEvent.detail;
      if (extSettings) {
        resolved = true;
        setSettings((prev) => ({
          ...prev,
          automation_enabled: !extSettings.automationDisabled, // INVERTED
          auto_select_address: extSettings.autoUseThisAddress,
        }));
      }
    };

    window.addEventListener("cp_bot_settings_loaded", handleLoadedSettings);

    // Request settings from extension
    window.dispatchEvent(new CustomEvent("cp_bot_request_settings"));

    const timer = setTimeout(() => {
      if (!resolved) {
        // Fallback keeping DB values
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("cp_bot_settings_loaded", handleLoadedSettings);
    };
  }, []);

  const updateSetting = (key: keyof CpBotSettings, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEnabled) return;

    setSaving(true);
    try {
      const res = await saveCpBotSettings(settings);
      if (res.success) {
        toast.success("Settings saved — changes will apply to CP Bot on next use");

        // Sync with extension if running
        const win = window as unknown as Record<string, unknown>;
        const active =
          typeof window !== "undefined" &&
          (!!win.__CP_BOT_ACTIVE__ ||
            document.documentElement.getAttribute("data-cp-bot-active") === "true");
        if (active) {
          const extSettings = {
            automationDisabled: !settings.automation_enabled, // INVERTED
            autoUseThisAddress: settings.auto_select_address,
            webAppUrl: window.location.origin,
          };
          const event = new CustomEvent("cp_bot_settings_updated", {
            detail: extSettings,
          });
          window.dispatchEvent(event);
        }
      } else {
        toast.error(res.error || "Failed to save settings — please try again");
      }
    } catch {
      toast.error("Failed to save settings — please try again");
    } finally {
      setSaving(false);
    }
  };

  // Helper toggle switch renderer
  const renderToggle = (
    key: keyof CpBotSettings,
    label: string,
    description: string,
    isMuted: boolean
  ) => {
    const checked = !!settings[key];
    return (
      <div
        className={cn(
          "flex items-start justify-between gap-4 transition-opacity duration-200",
          isMuted ? "opacity-40" : "opacity-100"
        )}
      >
        <div className="flex-1">
          <label className="block text-sm font-bold text-slate-800">{label}</label>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-400">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => updateSetting(key, !checked)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
            checked ? "bg-cyan-600" : "bg-slate-200"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              checked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
    );
  };

  const isSubOptionsMuted = !settings.automation_enabled;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Auth Bypass Notice */}
      {!authEnabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800">
          Sign in to save your settings across devices
        </div>
      )}

      {/* Section 1: Automation */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Automation Preferences
        </h2>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md space-y-4">
          {/* Enable Automation (Master Kill Switch) */}
          <div className="pb-1">
            {renderToggle(
              "automation_enabled",
              "Enable Automation",
              "Master kill switch. When off, CP Bot will not perform any automatic actions on eBay or Amazon.",
              false
            )}
          </div>

          {/* Auto-select Address */}
          <div className="pt-4">
            {renderToggle(
              "auto_select_address",
              'Auto-select "Use this address"',
              'Automatically click "Use this address" on Amazon after filling in the buyer\'s details. Waits 3 seconds before clicking.',
              isSubOptionsMuted
            )}
          </div>
        </div>
      </div>


      {/* Form Action Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !authEnabled}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-6 text-xs font-bold text-white shadow-sm shadow-cyan-100 transition hover:bg-cyan-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </button>
      </div>
    </form>
  );
}
