// Content script serving as a communication bridge between CP Bot Web App and Chrome Extension storage

function isContextReady(): boolean {
  try {
    return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

try {
  // Set data-cp-bot-active DOM attribute (CSP safe)
  document.documentElement.setAttribute("data-cp-bot-active", "true");
  document.documentElement.setAttribute("data-cp-bot-version", chrome.runtime.getManifest().version);
} catch (err) {
  // Silent fail if document or context is not ready
}

function updateAuthAttribute() {
  if (!isContextReady()) return;
  try {
    void chrome.storage.local.get("cpBot.authState").then((result) => {
      const authState = result["cpBot.authState"] as { signedIn?: boolean } | undefined;
      const signedIn = Boolean(authState && authState.signedIn);
      if (signedIn) {
        document.documentElement.setAttribute("data-cp-bot-signed-in", "true");
      } else {
        document.documentElement.removeAttribute("data-cp-bot-signed-in");
      }
    }).catch(() => {
      // Silent catch
    });
  } catch (err) {
    // Silent catch on context invalidation
  }
}

// Initialize on script load
try {
  updateAuthAttribute();
} catch (err) {
  // Silent catch
}

// Watch for authState change to update DOM attribute in real-time
if (isContextReady()) {
  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes["cpBot.authState"]) {
        updateAuthAttribute();
      }
    });
  } catch (err) {
    // Silent catch
  }
}


// 1. Listen for settings updates from the Web App Settings Form
window.addEventListener("cp_bot_settings_updated", (e: Event) => {
  if (!isContextReady()) return;
  const customEvent = e as CustomEvent;
  if (customEvent.detail) {
    try {
      void chrome.storage.local.get("cpBot.settings").then((result) => {
        const current = (result["cpBot.settings"] || {}) as Record<string, unknown>;
        const detail = (customEvent.detail || {}) as Record<string, unknown>;
        const currentGift = (current.giftOptions || {}) as Record<string, unknown>;
        const detailGift = (detail.giftOptions || {}) as Record<string, unknown>;
        const next = {
          ...current,
          ...detail,
          giftOptions: {
            ...currentGift,
            ...detailGift,
          },
        };
        
        if (isContextReady()) {
          void chrome.storage.local.set({ "cpBot.settings": next });
          // Broadcast update to service worker / other scripts
          chrome.runtime.sendMessage({
            type: "CPBOT_SET_SETTINGS",
            settings: next,
          }).catch(() => undefined);
        }
      });
    } catch (err) {
      // Silent catch on context invalidation
    }
  }
});

// 2. Listen for settings requests from the Web App Settings Form
window.addEventListener("cp_bot_request_settings", () => {
  if (!isContextReady()) return;
  try {
    void chrome.storage.local.get("cpBot.settings").then((result) => {
      const settings = result["cpBot.settings"];
      if (settings) {
        const responseEvent = new CustomEvent("cp_bot_settings_loaded", {
          detail: settings,
        });
        window.dispatchEvent(responseEvent);
      }
    });
  } catch (err) {
    // Silent catch on context invalidation
  }
});

async function syncExtensionAuthToWebsite() {
  if (!isContextReady()) return;
  try {
    const localData = await chrome.storage.local.get(["cpBot.authState", "cp-bot-supabase-auth"]);
    const authState = localData["cpBot.authState"] as { signedIn?: boolean } | undefined;
    const supabaseAuthStr = localData["cp-bot-supabase-auth"] as string | null;

    if (authState?.signedIn && supabaseAuthStr) {
      const parsed = JSON.parse(supabaseAuthStr) as {
        currentSession?: {
          access_token?: string;
          refresh_token?: string;
        };
      };
      const accessToken = parsed.currentSession?.access_token;
      const refreshToken = parsed.currentSession?.refresh_token;

      if (accessToken && refreshToken) {
        console.log("CP Bot WebApp Bridge: Extension is signed in, sending login request to website...");
        window.dispatchEvent(
          new CustomEvent("cp_bot_auth_login_request", {
            detail: { accessToken, refreshToken },
          })
        );
      }
    }
  } catch (err) {
    // Silent catch
  }
}

// 3. Listen for auth bridge events from Next.js AuthBridge component
window.addEventListener("cp_bot_auth_bridge", (e: Event) => {
  if (!isContextReady()) {
    return; // Return silently without logging to avoid warnings in Chrome Errors tab
  }
  const customEvent = e as CustomEvent;
  const detail = customEvent.detail;
  console.log("CP Bot WebApp Bridge: Received cp_bot_auth_bridge event", detail);
  if (detail && detail.origin === window.location.origin) {
    if (!detail.signedIn && !detail.isSignOutEvent) {
      // Website is signed out (e.g. session expired or fresh load), but this is NOT an explicit sign-out event.
      // Let's see if we should sync extension auth back to website.
      void syncExtensionAuthToWebsite();
    }

    console.log("CP Bot WebApp Bridge: Forwarding CPBOT_AUTH_BRIDGE_UPDATE to background worker...");
    try {
      chrome.runtime.sendMessage({
        type: "CPBOT_AUTH_BRIDGE_UPDATE",
        source: detail.source,
        payload: detail,
      }).catch((err) => {
        console.log("CP Bot WebApp Bridge: Failed to send message to background:", err);
      });
    } catch (err) {
      // Silent catch on context invalidation
    }
  } else {
    console.log("CP Bot WebApp Bridge: Ignored auth bridge event due to origin mismatch", {
      detailOrigin: detail?.origin,
      windowOrigin: window.location.origin,
    });
  }
});

// 4. Request current auth state from Next.js AuthBridge component on startup (with retries)
function requestAuthWithRetries() {
  if (!isContextReady()) return;
  try {
    console.log("CP Bot WebApp Bridge: Dispatching cp_bot_request_auth");
    window.dispatchEvent(new CustomEvent("cp_bot_request_auth"));
  } catch (err) {
    // Silent catch
  }
}

// Initial request
requestAuthWithRetries();

// Retries to handle race conditions during page load/hydration
setTimeout(requestAuthWithRetries, 100);
setTimeout(requestAuthWithRetries, 500);
setTimeout(requestAuthWithRetries, 1000);
setTimeout(requestAuthWithRetries, 3000);

