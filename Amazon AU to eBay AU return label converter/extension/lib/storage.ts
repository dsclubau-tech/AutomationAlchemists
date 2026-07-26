export const STORAGE_KEYS = {
  orders: "cpBot.orders",
  orderScanCache: "cpBot.orderScanCache",
  amazonUnexpectedCheckoutRecovery: "cpBot.amazonUnexpectedCheckoutRecovery",
  queue: "cpBot.queue",
  activeOrder: "cpBot.activeOrder",
  settings: "cpBot.settings",
  authState: "cpBot.authState",
  localFulfillments: "cpBot.localFulfillments",
  authBridgeState: "cpBot.authBridgeState",
  amazonAccountCheck: "cpBot.amazonAccountCheck",
  amazonAccountCheckLastAttempt: "cpBot.amazonAccountCheckLastAttempt",
  pendingAutofill: "cpBot.pendingAutofill",
  pendingGiftMessage: "cpBot.pendingGiftMessage",
  automationLogs: "cpBot.automationLogs",
} as const;

export const CPBOT_SUPABASE_AUTH_STORAGE_KEY = "cp-bot-supabase-auth";

export type CpBotMessage =
  | { type: "CPBOT_SAVE_ORDERS"; orders: unknown[] }
  | { type: "CPBOT_SCAN_ORDER_DETAILS"; links: unknown[] }
  | { type: "CPBOT_COPY_ORDER"; order: unknown }
  | { type: "CPBOT_QUEUE_ORDERS"; orders: unknown[] }
  | { type: "CPBOT_GET_STATE" }
  | { type: "CPBOT_ADVANCE_QUEUE" }
  | { type: "CPBOT_MARK_ORDERED"; payload: unknown }
  | { type: "CPBOT_LOG_FULFILLMENT"; payload: unknown }
  | { type: "CPBOT_LOG_ACTIVITY"; payload: unknown }
  | { type: "CPBOT_GET_SETTINGS" }
  | { type: "CPBOT_SET_SETTINGS"; settings: unknown }
  | { type: "CPBOT_START_PASTE" }
  | { type: "CPBOT_AMAZON_ACCOUNT_CHECK_RESULT"; status: "active" | "challenge" | "no_picker"; email?: string | null }
  | { type: "CPBOT_SET_PENDING_AUTOFILL"; payload: unknown }
  | { type: "CPBOT_GET_PENDING_AUTOFILL" }
  | { type: "CPBOT_CLEAR_PENDING_AUTOFILL" }
  | { type: "CPBOT_SET_PENDING_GIFT_MESSAGE"; payload: unknown }
  | { type: "CPBOT_GET_PENDING_GIFT_MESSAGE" }
  | { type: "CPBOT_CLEAR_PENDING_GIFT_MESSAGE" }
  | { type: "CPBOT_COPY_ORDER_TO_CLOUD"; order: unknown }
  | { type: "CPBOT_GET_CLOUD_CLIPBOARD" };

export const CPBOT_CONTEXT_INVALIDATED_MESSAGE =
  "CP Bot was reloaded. Refresh this eBay/Amazon page to reconnect the extension.";

export const CPBOT_AUTOMATION_DISABLED_MESSAGE =
  "CP Bot automation is disabled in extension settings. Turn it back on from the CP Bot popup when you want to use Scan, Copy, Paste, or Mark ordered.";

export const CPBOT_SIGNED_OUT_MESSAGE =
  "Signed out of CP Bot. Sign in from the CP Bot popup to use extension automation on this page.";

export function isExtensionContextReady() {
  try {
    return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id && chrome.storage?.local);
  } catch {
    return false;
  }
}

function messageFromError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return CPBOT_CONTEXT_INVALIDATED_MESSAGE;
}

function failureResponse<T>(error: unknown): T {
  return {
    ok: false,
    error: messageFromError(error),
  } as T;
}

function sessionArea() {
  if (!isExtensionContextReady()) {
    return null;
  }

  return chrome.storage.session || chrome.storage.local;
}

export async function getSessionValue<T>(key: string, fallback: T): Promise<T> {
  const area = sessionArea();
  if (!area) {
    return fallback;
  }

  try {
    const result = await area.get(key);
    return (result[key] as T | undefined) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setSessionValue(key: string, value: unknown): Promise<void> {
  const area = sessionArea();
  if (!area) {
    return;
  }

  try {
    await area.set({ [key]: value });
  } catch {
    // The page may still be running an old content script after an extension reload.
  }
}

export async function getLocalValue<T>(key: string, fallback: T): Promise<T> {
  if (!isExtensionContextReady()) {
    return fallback;
  }

  try {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T | undefined) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function setLocalValue(key: string, value: unknown): Promise<void> {
  if (!isExtensionContextReady()) {
    return;
  }

  try {
    await chrome.storage.local.set({ [key]: value });
  } catch {
    // Ignore writes from stale content scripts. A page refresh reconnects them.
  }
}

export async function sendRuntimeMessage<T>(message: CpBotMessage): Promise<T> {
  if (!isExtensionContextReady()) {
    return failureResponse<T>(CPBOT_CONTEXT_INVALIDATED_MESSAGE);
  }

  try {
    const res = await chrome.runtime.sendMessage<T>(message);
    if (res === undefined) {
      const errorMsg = chrome.runtime.lastError?.message || "No response received from background service worker.";
      return failureResponse<T>(errorMsg);
    }
    return res;
  } catch (error) {
    return failureResponse<T>(error);
  }
}

declare const __CP_BOT_DEBUG__: boolean;

export function debugLog(...args: unknown[]): void {
  if (typeof __CP_BOT_DEBUG__ !== "undefined" && __CP_BOT_DEBUG__) {
    console.log(...args);
  }
}

