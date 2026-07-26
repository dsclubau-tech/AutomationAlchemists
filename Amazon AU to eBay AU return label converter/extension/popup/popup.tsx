import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { getLocalValue, setLocalValue, STORAGE_KEYS } from "../lib/storage";
import { cpBotWebAppUrl, getSupabaseClient } from "../lib/supabaseClient";
import type { CpBotSettings } from "../types/Address";
import { extensionSettingsToDb } from "../lib/settingsSync";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

const defaultSettings: CpBotSettings = {
  autoUseThisAddress: false,
  automationDisabled: false,
  giftOptions: {
    enabled: false,
    message: "Enjoy your gift!",
    from: "Automation Alchemists",
  },
  webAppUrl: cpBotWebAppUrl,
};

function normalizeSettings(settings: Partial<CpBotSettings>): CpBotSettings {
  const giftOptions = isRecord(settings.giftOptions) ? settings.giftOptions : {};

  return {
    ...defaultSettings,
    ...settings,
    giftOptions: {
      ...defaultSettings.giftOptions,
      enabled:
        typeof giftOptions.enabled === "boolean" ? giftOptions.enabled : defaultSettings.giftOptions.enabled,
      message:
        typeof giftOptions.message === "string" ? giftOptions.message : defaultSettings.giftOptions.message,
      from: typeof giftOptions.from === "string" ? giftOptions.from : defaultSettings.giftOptions.from,
    },
  };
}

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function App() {
  const [authState, setAuthState] = useState<{
    signedIn: boolean;
    userEmail: string | null;
    source?: "localhost" | "vercel" | null;
    webAppUrl?: string | null;
  }>({
    signedIn: false,
    userEmail: null,
  });
  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState<CpBotSettings>(defaultSettings);
  const [giftDraft, setGiftDraft] = useState(defaultSettings.giftOptions);
  const [amazonAccount, setAmazonAccount] = useState<{
    email: string | null;
    status: "active" | "challenge" | "no_picker" | "unknown";
    checkedAt: number;
  } | null>(null);
  const [giftTemplates, setGiftTemplates] = useState<{ id: string; name: string; message: string; from_name: string }[]>([]);
  const [giftSaved, setGiftSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const storedSettings = await getLocalValue<Partial<CpBotSettings>>(STORAGE_KEYS.settings, defaultSettings);
      const currentSettings = normalizeSettings(storedSettings);
      setSettings(currentSettings);
      setGiftDraft(currentSettings.giftOptions);

      // Fetch initial computed auth state from background worker
      const response = await chrome.runtime.sendMessage({ type: "CPBOT_GET_STATE" }).catch(() => null);
      if (response && response.ok) {
        setAuthState({
          signedIn: response.signedIn,
          userEmail: response.userEmail,
          source: response.source,
          webAppUrl: response.webAppUrl,
        });
        if (response.amazonAccount) {
          setAmazonAccount(response.amazonAccount);
        }
      }
      setChecking(false);
    })();

    // Listen for real-time auth state updates from the background worker
    const listener = (message: unknown) => {
      if (message && typeof message === "object") {
        const msg = message as Record<string, unknown>;
        if (msg.type === "CPBOT_AUTH_CHANGED" && msg.auth && typeof msg.auth === "object") {
          const auth = msg.auth as Record<string, unknown>;
          setAuthState({
            signedIn: Boolean(auth.signedIn),
            userEmail: typeof auth.userEmail === "string" ? auth.userEmail : null,
            source: auth.source === "localhost" || auth.source === "vercel" ? auth.source : null,
            webAppUrl: typeof auth.webAppUrl === "string" ? auth.webAppUrl : null,
          });
        }
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (!authState.signedIn) {
      setGiftTemplates([]);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void (async () => {
      await supabase.auth.getSession();
      const { data } = await supabase
        .from("cp_bot_gift_templates")
        .select("id, name, message, from_name")
        .order("position", { ascending: true });
      if (data) setGiftTemplates(data as { id: string; name: string; message: string; from_name: string }[]);
    })();
  }, [authState.signedIn]);

  async function saveSettings(next: CpBotSettings) {
    setSettings(next);
    setGiftDraft(next.giftOptions);
    await setLocalValue(STORAGE_KEYS.settings, next);
    await chrome.runtime.sendMessage({ type: "CPBOT_SET_SETTINGS", settings: next });

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.getSession();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          const dbSettings = extensionSettingsToDb(next);
          await supabase.from("cp_bot_settings").upsert(
            {
              user_id: user.id,
              ...dbSettings,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch (err) {
          console.error("Failed to save settings to Supabase database:", err);
        }
      }
    }
  }

  async function saveGiftOptions() {
    await saveSettings({
      ...settings,
      giftOptions: {
        ...settings.giftOptions,
        message: giftDraft.message,
        from: giftDraft.from,
      },
    });
    setGiftSaved(true);
    setTimeout(() => setGiftSaved(false), 2000);
  }

  function handleLoginRedirect(url: string) {
    chrome.tabs.create({ url });
  }

  const activeDashboardUrl = authState.webAppUrl
    ? `${authState.webAppUrl}/cp-bot`
    : (authState.source === "localhost"
        ? "http://localhost:3000/cp-bot"
        : "https://amazon-au-ebay-au-return-label-conv.vercel.app/cp-bot");

  return (
    <main>
      <style>{styles}</style>
      <header>
        <img src="../icons/logo-38.png" className="logo" alt="CP Bot Logo" />
        <div>
          <h1>CP Bot</h1>
          <p>Automation Alchemists</p>
        </div>
        {checking ? <div className="cp-spinner" style={{ marginLeft: "auto" }} /> : null}
      </header>

      <section className="panel">
        {authState.signedIn ? (
          <>
            <h2>Signed in</h2>
            <div className="signed-in" style={{ marginTop: "6px" }}>
              <strong>{authState.userEmail}</strong>
              <div className="source-label" style={{ fontSize: "11px", color: "#64748b" }}>
                via {authState.source === "localhost" ? "Developer (localhost)" : "CP Bot Admin"}
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleLoginRedirect(activeDashboardUrl)}
              >
                Open Dashboard
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Not signed in</h2>
            <p className="muted">Sign in to CP Bot Admin to activate automation.</p>
            <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => handleLoginRedirect("http://localhost:3000/login")}
              >
                Developer Login
              </button>
              <button
                type="button"
                onClick={() =>
                  handleLoginRedirect(
                    authState.webAppUrl
                      ? `${authState.webAppUrl}/login?next=%2F`
                      : "https://amazon-au-ebay-au-return-label-conv.vercel.app/login?next=%2F"
                  )
                }
              >
                Login to CP Bot Admin
              </button>
            </div>
          </>
        )}
      </section>

      {authState.signedIn ? (
        <section className="panel">
          <h2>Settings</h2>

          <div className="amazon-account-section" style={{ marginTop: "10px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", marginBottom: "8px", fontWeight: 900 }}>Amazon Account Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", fontSize: "12px", lineHeight: "1.4" }}>
              <span style={{ color: "#64748b" }}>Amazon Account</span>
              <span style={{ fontWeight: 600 }}>
                {amazonAccount?.status === "signed_out" ? "—" : (amazonAccount?.email || "Not detected")}
              </span>

              <span style={{ color: "#64748b" }}>Connection status</span>
              {(() => {
                const status = amazonAccount?.status || "unknown";
                let color = "#64748b";
                let text = "Unknown";
                if (status === "active") {
                  color = "#16a34a";
                  text = "Active";
                } else if (status === "challenge") {
                  color = "#d97706";
                  text = "Verification Required";
                } else if (status === "signed_out") {
                  color = "#ef4444";
                  text = "Not Logged In";
                } else if (status === "no_picker") {
                  color = "#475569";
                  text = "Single Account";
                }
                return <span style={{ color, fontWeight: 700 }}>{text}</span>;
              })()}
            </div>
            {amazonAccount?.checkedAt ? (
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
                Last checked {getRelativeTime(amazonAccount.checkedAt)}
              </div>
            ) : null}
            {amazonAccount?.status === "challenge" ? (
              <div className="warning" style={{ marginTop: "8px", fontSize: "11px" }}>
                Amazon requested verification — open Amazon manually to check your account.
              </div>
            ) : null}
          </div>

          <label className="toggle danger-toggle">
            <input
              checked={settings.automationDisabled}
              type="checkbox"
              onChange={(event) => void saveSettings({ ...settings, automationDisabled: event.currentTarget.checked })}
            />
            <span>Disable extension automation</span>
          </label>
          {settings.automationDisabled ? (
            <p className="warning">Automation is paused. CP Bot will not scan, copy, paste, or mark orders.</p>
          ) : null}
          <label className="toggle">
            <input
              checked={settings.autoUseThisAddress}
              type="checkbox"
              onChange={(event) => void saveSettings({ ...settings, autoUseThisAddress: event.currentTarget.checked })}
            />
            <span>Auto Select &apos;Use this address&apos;</span>
          </label>
          <div className="gift-settings">
            <h3>Gift Option Settings</h3>
            <label className="toggle">
              <input
                checked={settings.giftOptions.enabled}
                type="checkbox"
                onChange={(event) =>
                  void saveSettings({
                    ...settings,
                    giftOptions: {
                      ...settings.giftOptions,
                      enabled: event.currentTarget.checked,
                      message: giftDraft.message,
                      from: giftDraft.from,
                    },
                  })
                }
              />
              <span>Enable gift message filling</span>
            </label>
            {giftTemplates.length > 0 && (
              <label>
                Load from template
                <select
                  value=""
                  onChange={(e) => {
                    const tpl = giftTemplates.find((t) => t.id === e.currentTarget.value);
                    if (tpl) setGiftDraft((current) => ({ ...current, message: tpl.message, from: tpl.from_name }));
                  }}
                >
                  <option value="">— Select a template —</option>
                  {giftTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Gift message
              <textarea
                maxLength={240}
                rows={4}
                value={giftDraft.message}
                onChange={(event) => {
                  const message = event.currentTarget.value;
                  setGiftDraft((current) => ({ ...current, message }));
                }}
              />
            </label>
            <label>
              From
              <input
                value={giftDraft.from}
                onChange={(event) => {
                  const from = event.currentTarget.value;
                  setGiftDraft((current) => ({ ...current, from }));
                }}
              />
            </label>
            <button type="button" className={`secondary-button${giftSaved ? " saved-feedback" : ""}`} onClick={() => void saveGiftOptions()}>
              {giftSaved ? "✓ Saved!" : "Save gift option settings"}
            </button>
          </div>
        </section>
      ) : null}

      <a className="open-app" href={activeDashboardUrl} target="_blank" rel="noreferrer">
        Open return label app
      </a>
    </main>
  );
}

const styles = `
  body {
    margin: 0;
    min-width: 340px;
    background: #f8fafc;
    color: #172033;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  main { padding: 14px; }
  header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .cp-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #cbd5e1;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: cp-spin 0.8s linear infinite;
  }
  @keyframes cp-spin {
    to { transform: rotate(360deg); }
  }
  .logo {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    object-fit: cover;
    display: block;
  }
  h1, h2, p { margin: 0; }
  h1 { font-size: 16px; }
  header p { color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; }
  .panel {
    border: 1px solid #dbe5f4;
    border-radius: 12px;
    background: #fff;
    margin-top: 10px;
    padding: 12px;
  }
  h2 { font-size: 12px; text-transform: uppercase; color: #475569; }
  .muted { margin-top: 6px; color: #64748b; font-size: 12px; line-height: 1.4; }
  form, label { display: grid; gap: 7px; }
  form { margin-top: 10px; }
  label { margin-top: 10px; color: #475569; font-size: 11px; font-weight: 900; text-transform: uppercase; }
  input,
  textarea {
    height: 36px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    padding: 0 10px;
    color: #172033;
    font: 600 13px inherit;
    text-transform: none;
  }
  textarea {
    min-height: 74px;
    padding: 9px 10px;
    resize: vertical;
  }
  button, .open-app {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    border: 1px solid #2563eb;
    border-radius: 9px;
    background: #2563eb;
    color: #fff;
    cursor: pointer;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
  }
  button:disabled { cursor: not-allowed; opacity: .5; }
  .signed-in { display: grid; gap: 9px; margin-top: 10px; }
  .signed-in strong { font-size: 13px; }
  .signed-in button { border-color: #dbe5f4; background: #fff; color: #1e293b; }
  .toggle { display: flex; align-items: center; gap: 8px; text-transform: none; }
  .toggle input { width: 16px; height: 16px; }
  .danger-toggle span { color: #b91c1c; font-weight: 950; }
  .warning {
    margin-top: 8px;
    border: 1px solid #fecaca;
    border-radius: 9px;
    background: #fef2f2;
    color: #991b1b;
    padding: 8px 9px;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.35;
  }
  .gift-settings {
    margin-top: 12px;
    border: 1px solid #dbe5f4;
    border-radius: 10px;
    background: #f8fafc;
    padding: 10px;
  }
  h3 {
    margin: 0 0 6px;
    color: #334155;
    font-size: 12px;
    text-transform: uppercase;
  }
  select {
    height: 36px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    padding: 0 10px;
    color: #172033;
    font: 600 13px inherit;
    text-transform: none;
    background: #fff;
    cursor: pointer;
  }
  .secondary-button {
    width: 100%;
    margin-top: 10px;
    border-color: #dbe5f4;
    background: #fff;
    color: #1e293b;
  }
  .saved-feedback {
    border-color: #16a34a !important;
    background: #dcfce7 !important;
    color: #16a34a !important;
    transition: all 0.3s ease;
  }
  .open-app { margin-top: 10px; width: 100%; }
`;

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
