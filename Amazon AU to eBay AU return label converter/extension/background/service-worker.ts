import {
  CPBOT_AUTOMATION_DISABLED_MESSAGE,
  CPBOT_SIGNED_OUT_MESSAGE,
  getLocalValue,
  getSessionValue,
  setLocalValue,
  setSessionValue,
  STORAGE_KEYS,
  debugLog,
} from "../lib/storage";
import { cpBotWebAppUrl, getSupabaseClient } from "../lib/supabaseClient";
import type { Address, CpBotSettings } from "../types/Address";

const EXTENSION_VERSION = chrome.runtime.getManifest().version;

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.session) {
  const session = chrome.storage.session as unknown as {
    setAccessLevel?: (options: { accessLevel: string }) => Promise<void>;
  };
  if (typeof session.setAccessLevel === "function") {
    session
      .setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" })
      .catch((err: unknown) => console.error("Failed to set CP Bot storage session access level:", err));
  }
}
interface DetailScanLink {
  href: string;
  itemTitle: string;
  orderId: string;
}

interface BrowserTab {
  id?: number;
  status?: string;
  url?: string;
}

interface BrowserWindow {
  id?: number;
  tabs?: BrowserTab[];
}

interface CpBotAuthState {
  authRequired: boolean;
  signedIn: boolean;
  userEmail: string | null;
  source?: "localhost" | "vercel" | null;
  webAppUrl?: string | null;
}

interface StoredAuthState {
  signedIn?: boolean;
  userEmail?: string | null;
  source?: "localhost" | "vercel" | null;
  webAppUrl?: string | null;
}

interface OrderScanCache {
  orders?: unknown[];
  expiresAt?: number;
  createdAt?: number;
}

type TabUpdateListener = (tabId: number, changeInfo: { status?: string }, tab?: BrowserTab) => void;

interface ChromeScanApi {
  windows: {
    create: (options: Record<string, unknown>, callback: (createdWindow?: BrowserWindow) => void) => void;
    remove: (windowId: number, callback?: () => void) => void;
  };
  tabs: {
    get: (tabId: number, callback: (tab?: BrowserTab) => void) => void;
    query: (queryInfo: Record<string, unknown>, callback: (tabs: BrowserTab[]) => void) => void;
    sendMessage: (tabId: number, message: unknown, callback: (response?: unknown) => void) => void;
    onUpdated: {
      addListener: (callback: TabUpdateListener) => void;
      removeListener: (callback: TabUpdateListener) => void;
    };
  };
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
const DETAIL_SCAN_LIMIT = 5;
const DETAIL_SCAN_RENDER_WAIT_MS = 7000;
const DETAIL_SCAN_READY_TIMEOUT_MS = 25000;
const DETAIL_SCAN_EXTRACT_RETRIES = 12;
const DETAIL_SCAN_EXTRACT_RETRY_MS = 1000;
const DETAIL_SCAN_OPEN_GAP_MS = 2000;
const ITEM_TITLE_CHECK_FAILED = "Name Check Failed";
const ORDER_SCAN_CACHE_TTL_MS = 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function isAddress(value: unknown): value is Address {
  return isRecord(value) && typeof value.orderId === "string" && typeof value.buyerName === "string";
}

function isDetailScanLink(value: unknown): value is DetailScanLink {
  return (
    isRecord(value) &&
    typeof value.href === "string" &&
    typeof value.orderId === "string" &&
    typeof value.itemTitle === "string" &&
    value.href.includes("ebay.com.au/mesh/ord/details")
  );
}

async function getSettings() {
  const stored = await getLocalValue<Partial<CpBotSettings>>(STORAGE_KEYS.settings, defaultSettings);
  return {
    ...defaultSettings,
    ...stored,
    giftOptions: {
      ...defaultSettings.giftOptions,
      ...(isRecord(stored.giftOptions) ? stored.giftOptions : {}),
    },
  };
}

interface SourceAuthState {
  signedIn: boolean;
  user: { id: string; email: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  lastSeen: number;
  updatedAt: number;
  origin?: string;
}

interface AuthBridgePayload {
  source: "localhost" | "vercel";
  origin: string;
  signedIn: boolean;
  isSignOutEvent?: boolean;
  user: { id: string; email: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  timestamp: number;
}

interface AuthBridgeState {
  localhost: SourceAuthState;
  vercel: SourceAuthState;
}

const defaultSourceState: SourceAuthState = {
  signedIn: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  lastSeen: 0,
  updatedAt: 0,
};

async function broadcastMessage(msg: Record<string, any>) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => undefined);
      }
    }
  } catch (err) {
    // Ignore errors during broadcast
  }

  try {
    chrome.runtime.sendMessage(msg).catch(() => undefined);
  } catch (err) {
    // Popup might not be open
  }
}

async function recomputeEffectiveSession(state: AuthBridgeState, isExplicitSignOut = false) {
  debugLog("CP Bot SW: Recomputing effective session with state:", state, "isExplicitSignOut:", isExplicitSignOut);
  const activeSources: { name: "localhost" | "vercel"; data: SourceAuthState }[] = [];

  if (state.localhost.signedIn && state.localhost.accessToken) {
    activeSources.push({ name: "localhost", data: state.localhost });
  }

  if (state.vercel.signedIn && state.vercel.accessToken) {
    activeSources.push({ name: "vercel", data: state.vercel });
  }

  const currentAuth = await getLocalValue<StoredAuthState | null>(STORAGE_KEYS.authState, null);

  if (activeSources.length === 0) {
    if (!isExplicitSignOut) {
      const supabase = getSupabaseClient();
      const existingSession = supabase ? await getSupabaseSessionSilent(supabase) : null;
      if (existingSession?.user) {
        debugLog("CP Bot SW: Active extension session present despite empty web sources; preserving extension auth.");
        const nextAuth = {
          signedIn: true,
          userEmail: existingSession.user.email || null,
          updatedAt: new Date().toISOString(),
          source: currentAuth?.source || "extension",
          webAppUrl: currentAuth?.webAppUrl || null,
        };
        await setLocalValue(STORAGE_KEYS.authState, nextAuth);
        await broadcastMessage({
          type: "CPBOT_AUTH_CHANGED",
          auth: nextAuth,
        });
        return;
      }
    }

    const nextAuth = {
      signedIn: false,
      userEmail: null,
      updatedAt: new Date().toISOString(),
      source: null,
      webAppUrl: null,
    };
    await setLocalValue(STORAGE_KEYS.authState, nextAuth);
    await broadcastMessage({
      type: "CPBOT_AUTH_CHANGED",
      auth: nextAuth,
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("Failed to fetch") ||
          msg.includes("fetch") ||
          msg.includes("NetworkError") ||
          msg.includes("TypeError")
        ) {
          console.warn("CP Bot SW: Failed to sign out from Supabase in background (Network issue):", err);
        } else {
          console.error("CP Bot SW: Failed to sign out from Supabase in background:", err);
        }
      }
    }
  } else {
    let winner = activeSources[0];
    if (activeSources.length > 1) {
      if (activeSources[1].data.updatedAt > activeSources[0].data.updatedAt) {
        winner = activeSources[1];
      }
    }

    const nextAuth = {
      signedIn: true,
      userEmail: winner.data.user?.email || null,
      updatedAt: new Date().toISOString(),
      source: winner.name,
      webAppUrl: winner.data.origin || (winner.name === "localhost" ? "http://localhost:3000" : "https://amazon-au-ebay-au-return-label-conv.vercel.app"),
    };

    // Update storage and broadcast state changes instantly
    await setLocalValue(STORAGE_KEYS.authState, nextAuth);

    if (currentAuth?.signedIn && currentAuth.userEmail !== winner.data.user?.email) {
      void logActivity({
        ebay_order_id: null,
        event_type: "account_switched",
        detail: {
          from_email: currentAuth.userEmail,
          to_email: winner.data.user?.email,
          source: winner.name,
        },
      }).catch(console.error);
    }

    await broadcastMessage({
      type: "CPBOT_AUTH_CHANGED",
      auth: nextAuth,
    });

    // Restore Supabase session in the background
    const supabase = getSupabaseClient();
    if (supabase && winner.data.accessToken && winner.data.refreshToken) {
      void supabase.auth.setSession({
        access_token: winner.data.accessToken,
        refresh_token: winner.data.refreshToken,
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("Failed to fetch") ||
          msg.includes("fetch") ||
          msg.includes("NetworkError") ||
          msg.includes("TypeError")
        ) {
          console.warn("CP Bot SW: Failed to restore Supabase session in background (Network issue):", err);
        } else {
          console.error("CP Bot SW: Failed to restore Supabase session in background:", err);
        }
      });
    }
  }
}

async function handleAuthBridgeUpdate(source: "localhost" | "vercel", payload: AuthBridgePayload) {
  debugLog("CP Bot SW: Handling auth bridge update from source:", source, "with payload:", payload);
  const state = await getLocalValue<AuthBridgeState>(STORAGE_KEYS.authBridgeState, {
    localhost: { ...defaultSourceState },
    vercel: { ...defaultSourceState },
  });

  const currentSource = state[source] || { ...defaultSourceState };
  const now = Date.now();

  const signedInChanged = currentSource.signedIn !== payload.signedIn;
  const userChanged = currentSource.user?.id !== payload.user?.id;

  const nextSource: SourceAuthState = {
    signedIn: payload.signedIn,
    user: payload.user,
    accessToken: payload.signedIn ? payload.accessToken : null,
    refreshToken: payload.signedIn ? payload.refreshToken : null,
    lastSeen: now,
    updatedAt: (signedInChanged || userChanged) ? now : (currentSource.updatedAt || now),
    origin: payload.origin,
  };

  state[source] = nextSource;
  await setLocalValue(STORAGE_KEYS.authBridgeState, state);

  await recomputeEffectiveSession(state, payload.isSignOutEvent ?? false);
  return { ok: true };
}

async function getSupabaseSessionSilent(supabase: any): Promise<any> {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.map(a => (a instanceof Error ? a.message : String(a))).join(" ");
    if (
      msg.includes("Invalid Refresh Token") ||
      msg.includes("Refresh Token Not Found") ||
      msg.includes("Failed to fetch") ||
      msg.includes("fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("TypeError")
    ) {
      console.warn("CP Bot SW (Supabase Auth Warning/Network issue):", ...args);
    } else {
      originalConsoleError.apply(console, args);
    }
  };

  try {
    const { data } = await supabase.auth.getSession();
    let session = data.session;

    // If getSession() returned null (expired session with autoRefreshToken:false,
    // or SW cold-start before async storage load completes), read the raw stored
    // session directly from chrome.storage.local as a fallback.
    let storedSession: any = null;
    if (!session) {
      try {
        const raw = await chrome.storage.local.get("cp-bot-supabase-auth");
        const val = raw["cp-bot-supabase-auth"];
        if (typeof val === "string") {
          const parsed = JSON.parse(val);
          if (parsed) {
            storedSession = parsed.currentSession || parsed;
          }
        }
      } catch (err) {
        console.warn("CP Bot SW: Failed to read raw stored session:", err);
      }
    }

    const activeSession = session || storedSession;

    if (activeSession && activeSession.refresh_token && activeSession.expires_at) {
      const now = Math.round(Date.now() / 1000);
      if (activeSession.expires_at - now < 120) {
        // Session is expired or expiring soon — refresh on-demand with explicit token
        debugLog("CP Bot SW: Supabase session is expired or expiring soon. Refreshing on-demand...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: activeSession.refresh_token,
        });
        if (refreshError) {
          throw refreshError;
        }
        session = refreshData.session;
      } else if (!session && storedSession && storedSession.access_token && storedSession.refresh_token) {
        // Valid session exists in storage but client hasn't loaded it yet (SW cold-start race).
        // Populate the client immediately so subsequent getUser() calls succeed.
        const { data: setData } = await supabase.auth.setSession({
          access_token: storedSession.access_token,
          refresh_token: storedSession.refresh_token,
        });
        session = setData?.session || storedSession;
      }
    }

    return session;
  } finally {
    console.error = originalConsoleError;
  }
}

async function getAuthState(): Promise<CpBotAuthState> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      authRequired: false,
      signedIn: true,
      userEmail: null,
      webAppUrl: null,
    };
  }

  // Check the actual Supabase session (cached in chrome.storage.local)
  let session = null;
  try {
    session = await getSupabaseSessionSilent(supabase);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("Failed to fetch") ||
      msg.includes("fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("TypeError")
    ) {
      console.warn("CP Bot SW: Failed to get Supabase session in getAuthState (Network issue):", err);
    } else {
      console.error("CP Bot SW: Failed to get Supabase session in getAuthState:", err);
    }
  }

  const storedAuth = await getLocalValue<StoredAuthState | null>(STORAGE_KEYS.authState, null);
  const isSupabaseSignedIn = Boolean(session?.user);

  // Self-heal authState storage key if it's out of sync with actual Supabase session
  if (isSupabaseSignedIn && !storedAuth?.signedIn) {
    const nextAuth: StoredAuthState = {
      signedIn: true,
      userEmail: session?.user?.email || null,
      source: storedAuth?.source || "vercel",
      webAppUrl: storedAuth?.webAppUrl || cpBotWebAppUrl,
    };
    await setLocalValue(STORAGE_KEYS.authState, nextAuth);
    await broadcastMessage({
      type: "CPBOT_AUTH_CHANGED",
      auth: nextAuth,
    });
    return {
      authRequired: true,
      signedIn: true,
      userEmail: nextAuth.userEmail || null,
      source: nextAuth.source,
      webAppUrl: nextAuth.webAppUrl,
    };
  } else if (!isSupabaseSignedIn && storedAuth?.signedIn) {
    const nextAuth: StoredAuthState = {
      signedIn: false,
      userEmail: null,
      source: null,
      webAppUrl: null,
    };
    await setLocalValue(STORAGE_KEYS.authState, nextAuth);
    await broadcastMessage({
      type: "CPBOT_AUTH_CHANGED",
      auth: nextAuth,
    });
    return {
      authRequired: true,
      signedIn: false,
      userEmail: null,
      source: null,
      webAppUrl: null,
    };
  }

  return {
    authRequired: true,
    signedIn: Boolean(storedAuth?.signedIn),
    userEmail: storedAuth?.userEmail || null,
    source: storedAuth?.source || null,
    webAppUrl: storedAuth?.webAppUrl || null,
  };
}

async function automationBlockMessage() {
  const auth = await getAuthState();
  if (auth.authRequired && !auth.signedIn) {
    return CPBOT_SIGNED_OUT_MESSAGE;
  }

  const settings = await getSettings();
  if (settings.automationDisabled) {
    return CPBOT_AUTOMATION_DISABLED_MESSAGE;
  }

  return null;
}

async function saveOrders(orders: unknown[]) {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return { ok: false, count: 0, error: blockMessage };
  }

  const safeOrders = orders.filter(isAddress);
  await setSessionValue(STORAGE_KEYS.orders, safeOrders);
  return { ok: true, count: safeOrders.length };
}

async function getValidOrderScanCache() {
  const cache = await getSessionValue<OrderScanCache | null>(STORAGE_KEYS.orderScanCache, null);
  const expiresAt = typeof cache?.expiresAt === "number" ? cache.expiresAt : 0;

  if (!cache || expiresAt <= Date.now()) {
    await setSessionValue(STORAGE_KEYS.orderScanCache, null);
    return { orders: [] as Address[], expiresAt: 0 };
  }

  return {
    orders: Array.isArray(cache.orders) ? cache.orders.filter(isAddress) : [],
    expiresAt,
  };
}

async function saveOrderScanCache(orders: unknown[]) {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return { ok: false, count: 0, error: blockMessage };
  }

  const safeOrders = orders.filter(isAddress);
  if (safeOrders.length === 0) {
    return { ok: true, count: 0 };
  }

  await setSessionValue(STORAGE_KEYS.orderScanCache, {
    orders: safeOrders,
    createdAt: Date.now(),
    expiresAt: Date.now() + ORDER_SCAN_CACHE_TTL_MS,
  });
  return { ok: true, count: safeOrders.length };
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function chromeLastError() {
  return (chrome.runtime as unknown as { lastError?: { message?: string } }).lastError;
}

function chromeScanApi() {
  return chrome as unknown as ChromeScanApi;
}

function chromeErrorMessage(fallback: string) {
  return chromeLastError()?.message || fallback;
}

function toScannerUrl(href: string) {
  try {
    const url = new URL(href);
    url.searchParams.set("cpbot_scan", "1");
    return url.toString();
  } catch {
    return href;
  }
}

function createWindowWithOptions(options: Record<string, unknown>) {
  return new Promise<BrowserWindow>((resolve, reject) => {
    chromeScanApi().windows.create(options, (createdWindow) => {
      const error = chromeLastError();
      if (error || !createdWindow?.id) {
        reject(new Error(error?.message || "Could not create CP Bot scan window."));
        return;
      }

      resolve(createdWindow as BrowserWindow);
    });
  });
}

async function createScanWindow(urls: string[]) {
  try {
    return await createWindowWithOptions({
      url: urls,
      focused: false,
      state: "minimized",
    });
  } catch {
    return createWindowWithOptions({
      url: urls,
      focused: false,
    });
  }
}

function queryWindowTabs(windowId: number) {
  return new Promise<BrowserTab[]>((resolve) => {
    chromeScanApi().tabs.query({ windowId }, (tabs) => {
      if (chromeLastError()) {
        resolve([]);
        return;
      }

      resolve(tabs as BrowserTab[]);
    });
  });
}

function removeScanWindow(windowId?: number) {
  if (!windowId) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    chromeScanApi().windows.remove(windowId, () => {
      resolve();
    });
  });
}

function waitForTabReady(tabId: number) {
  return new Promise<void>((resolve) => {
    let settled = false;
    const timeout = setTimeout(cleanup, DETAIL_SCAN_READY_TIMEOUT_MS);

    function cleanup() {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      chromeScanApi().tabs.onUpdated.removeListener(listener);
      resolve();
    }

    function listener(updatedTabId: number, changeInfo: { status?: string }) {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        cleanup();
      }
    }

    chromeScanApi().tabs.onUpdated.addListener(listener);
    chromeScanApi().tabs.get(tabId, (tab) => {
      if (!chromeLastError() && tab?.status === "complete") {
        cleanup();
      }
    });
  });
}

function sendExtractMessage(tabId: number) {
  return new Promise<{ ok?: boolean; orders?: unknown[] }>((resolve, reject) => {
    chromeScanApi().tabs.sendMessage(tabId, { type: "CPBOT_EXTRACT_EBAY_ORDER" }, (response) => {
      const error = chromeLastError();
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve(isRecord(response) ? (response as { ok?: boolean; orders?: unknown[] }) : {});
    });
  });
}

function normalizeScannedOrder(order: Address, link: DetailScanLink): Address {
  return {
    ...order,
    orderId: order.orderId || link.orderId,
    itemTitle: isUsefulItemTitle(order.itemTitle) ? order.itemTitle : ITEM_TITLE_CHECK_FAILED,
    sourceUrl: link.href,
  };
}

function isUsefulItemTitle(value: string) {
  const title = value.trim();
  return (
    title.length > 12 &&
    !/^g'?day\b/i.test(title) &&
    !/^\d+\s*\(\d+\s+available\)$/i.test(title) &&
    !/^(quantity|qty|item|order|postage|payment|tracking)\b/i.test(title)
  );
}

function findTabForLink(tabs: BrowserTab[], link: DetailScanLink, fallbackIndex: number) {
  const orderId = encodeURIComponent(link.orderId);
  return tabs.find((tab) => tab.url?.includes(`orderid=${orderId}`)) || tabs[fallbackIndex] || null;
}

async function extractOrderFromTab(tabId: number, link: DetailScanLink, renderWaitMs = DETAIL_SCAN_RENDER_WAIT_MS) {
  await waitForTabReady(tabId);
  if (renderWaitMs > 0) {
    await delay(renderWaitMs);
  }

  for (let attempt = 0; attempt < DETAIL_SCAN_EXTRACT_RETRIES; attempt += 1) {
    try {
      const response = await sendExtractMessage(tabId);
      const orders = Array.isArray(response.orders) ? response.orders.filter(isAddress) : [];
      const matchingOrder = orders.find((order) => order.orderId === link.orderId) || orders[0];

      if (matchingOrder?.buyerName && matchingOrder.street1 && matchingOrder.postcode) {
        return normalizeScannedOrder(matchingOrder, link);
      }
    } catch {
      // The content script may not have connected yet; retry until the rendered page is ready.
    }

    await delay(DETAIL_SCAN_EXTRACT_RETRY_MS);
  }

  return null;
}

function getOrdinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  if (n === 4) return "4th";
  if (n === 5) return "5th";
  return `${n}th`;
}

async function scanOrderDetails(links: unknown[], senderTabId?: number) {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return { ok: false, orders: [], scannedCount: 0, error: blockMessage };
  }

  const safeLinks = links.filter(isDetailScanLink).slice(0, DETAIL_SCAN_LIMIT);
  if (safeLinks.length === 0) {
    return { ok: true, orders: [], scannedCount: 0 };
  }

  let scanWindow: BrowserWindow | null = null;

  try {
    const scannedOrders: Address[] = [];

    for (const [index, link] of safeLinks.entries()) {
      const ordinal = getOrdinal(index + 1);

      if (senderTabId) {
        chrome.tabs.sendMessage(senderTabId, {
          type: "CPBOT_SCAN_PROGRESS",
          text: `Opening the ${ordinal} order link...`,
        }).catch(() => undefined);
      }
      await delay(800);

      if (senderTabId) {
        chrome.tabs.sendMessage(senderTabId, {
          type: "CPBOT_SCAN_PROGRESS",
          text: `Opening the ${ordinal} order link then scanning...`,
        }).catch(() => undefined);
      }
      await delay(200);

      scanWindow = await createScanWindow([toScannerUrl(link.href)]);
      const windowId = scanWindow.id;

      if (!windowId) {
        return { ok: false, orders: [], scannedCount: safeLinks.length, error: "Could not open CP Bot scan window." };
      }

      await delay(1000);
      const tabs = scanWindow.tabs?.length ? scanWindow.tabs : await queryWindowTabs(windowId);
      const tab = findTabForLink(tabs, link, 0);

      if (tab?.id) {
        const order = await extractOrderFromTab(tab.id, link);
        if (order) {
          scannedOrders.push(order);
        }
      }

      await removeScanWindow(windowId);
      scanWindow = null;

      await delay(500);
    }

    const uniqueScannedOrders = scannedOrders
      .filter((order): order is Address => order !== null)
      .filter((order, index, all) => all.findIndex((candidate) => candidate.orderId === order.orderId) === index);

    await saveOrderScanCache(uniqueScannedOrders);
    void logActivity({
      ebay_order_id: null,
      event_type: "scan",
      detail: {
        scannedCount: safeLinks.length,
        successCount: uniqueScannedOrders.length,
      }
    }).catch(console.error);
    return { ok: true, orders: uniqueScannedOrders, scannedCount: safeLinks.length };
  } catch (error) {
    return {
      ok: false,
      orders: [],
      scannedCount: safeLinks.length,
      error: error instanceof Error ? error.message : chromeErrorMessage("Could not scan eBay order detail pages."),
    };
  } finally {
    await removeScanWindow(scanWindow?.id);
  }
}

async function copyOrder(order: unknown) {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return { ok: false, error: blockMessage };
  }

  if (!isAddress(order)) {
    return { ok: false, error: "Invalid order payload." };
  }

  await setSessionValue(STORAGE_KEYS.queue, [order]);
  await setSessionValue(STORAGE_KEYS.activeOrder, order);
  return { ok: true, order };
}

async function queueOrders(orders: unknown[]) {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return { ok: false, error: blockMessage, queueCount: 0 };
  }

  const safeOrders = orders.filter(isAddress);
  await setSessionValue(STORAGE_KEYS.queue, safeOrders);
  await setSessionValue(STORAGE_KEYS.activeOrder, safeOrders[0] || null);
  return { ok: true, activeOrder: safeOrders[0] || null, queueCount: safeOrders.length };
}

const ACCOUNT_CACHE_TTL_MS = 10 * 60 * 1000;   // 10 minutes
const ACCOUNT_CHECK_COOLDOWN_MS = 60 * 1000;   // 60 seconds hard floor between navigations

interface AmazonAccountCheckState {
  email: string | null;
  status: "active" | "challenge" | "no_picker" | "signed_out" | "unknown";
  checkedAt: number;
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestAmazonAccountCheck(force = false): Promise<AmazonAccountCheckState> {
  const cached = await getSessionValue<AmazonAccountCheckState | null>(
    STORAGE_KEYS.amazonAccountCheck,
    null
  );

  const now = Date.now();
  if (!force) {
    // signed_out is authoritative until a fresh check proves otherwise —
    // still allow periodic re-checks (using normal TTL) in case the user
    // logs back in without triggering the passive nav-bar detection first.
    if (cached && now - cached.checkedAt < ACCOUNT_CACHE_TTL_MS) {
      return cached;
    }

    const lastAttempt = await getSessionValue<number>(STORAGE_KEYS.amazonAccountCheckLastAttempt, 0);
    if (now - lastAttempt < ACCOUNT_CHECK_COOLDOWN_MS) {
      return cached ?? { email: null, status: "unknown", checkedAt: 0 };
    }
  } else {
    // Debounce forced switch check: ignore duplicate force triggers within 10s (prevents double listener & refresh spam)
    const lastForcedCheck = await getSessionValue<number>("cpBot.lastForcedSwitchAccountCheckTime", 0);
    if (now - lastForcedCheck < 10000) {
      debugLog("CP Bot SW: Ignoring forced switch check due to 10s debounce guard.");
      return cached ?? { email: null, status: "unknown", checkedAt: 0 };
    }
    await setSessionValue("cpBot.lastForcedSwitchAccountCheckTime", now);
  }

  await setSessionValue(STORAGE_KEYS.amazonAccountCheckLastAttempt, now);

  await randomDelay(500, 1500);

  const SWITCH_ACCOUNTS_URL =
    "https://www.amazon.com.au/ap/signin?openid.return_to=https%3A%2F%2Fwww.amazon.com.au%2F%3F_encoding%3DUTF8%26ref_%3Dnav_youraccount_switchacct&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=auflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&switch_account=picker&ignoreAuthState=1&_encoding=UTF8";

  let tab: chrome.tabs.Tab | null = null;
  try {
    tab = await chrome.tabs.create({ url: SWITCH_ACCOUNTS_URL, active: false });
  } catch (err) {
    console.error("CP Bot SW: Failed to create switcher tab:", err);
    return cached ?? { email: null, status: "unknown", checkedAt: 0 };
  }

  const result = await new Promise<AmazonAccountCheckState>((resolve) => {
    const timeout = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener);
      resolve({ email: null, status: "unknown", checkedAt: now });
    }, 8000);

    function listener(message: unknown, sender: chrome.runtime.MessageSender) {
      if (message && typeof message === "object") {
        const msg = message as Record<string, unknown>;
        if (msg.type === "CPBOT_AMAZON_ACCOUNT_CHECK_RESULT" && sender.tab?.id === tab?.id) {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(listener);
          resolve({
            email: typeof msg.email === "string" ? msg.email : null,
            status: typeof msg.status === "string" && (msg.status === "active" || msg.status === "challenge" || msg.status === "no_picker" || msg.status === "unknown") ? msg.status : "unknown",
            checkedAt: now,
          });
        }
      }
    }
    chrome.runtime.onMessage.addListener(listener);
  });

  await randomDelay(800, 2000);
  if (tab?.id) {
    try {
      await chrome.tabs.remove(tab.id);
    } catch {
      // Tab may already be closed
    }
  }

  await setSessionValue(STORAGE_KEYS.amazonAccountCheck, result);
  return result;
}

let lastLocalhostReachabilityCheck = 0;
let lastLocalhostReachabilityResult = true;

async function verifyLocalhostReachability() {
  const currentAuth = await getLocalValue<StoredAuthState | null>(STORAGE_KEYS.authState, null);
  if (!currentAuth?.signedIn || currentAuth.source !== "localhost" || !currentAuth.webAppUrl) {
    return;
  }

  const now = Date.now();
  // Throttle to once every 15 seconds to avoid excessive network probes
  if (now - lastLocalhostReachabilityCheck < 15000) {
    if (!lastLocalhostReachabilityResult) {
      await markLocalhostStale();
    }
    return;
  }

  lastLocalhostReachabilityCheck = now;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    
    // We try to reach the localhost server
    await fetch(currentAuth.webAppUrl, {
      method: "GET",
      mode: "no-cors",
      signal: controller.signal,
      cache: "no-store",
    });
    
    clearTimeout(timeoutId);
    lastLocalhostReachabilityResult = true;
  } catch (err) {
    console.log("CP Bot SW: Localhost is not reachable via active probe:", err);
    lastLocalhostReachabilityResult = false;
    await markLocalhostStale();
  }
}

async function markLocalhostStale() {
  const state = await getLocalValue<AuthBridgeState>(STORAGE_KEYS.authBridgeState, null);
  if (state && state.localhost.signedIn) {
    state.localhost = {
      ...defaultSourceState,
      updatedAt: Date.now(),
    };
    await setLocalValue(STORAGE_KEYS.authBridgeState, state);
    await recomputeEffectiveSession(state);
  }
}

async function getState(isPopup = false) {
  if (isPopup) {
    await verifyLocalhostReachability();
  }
  const [orders, scanCache, queue, activeOrder, settings, auth] = await Promise.all([
    getSessionValue<Address[]>(STORAGE_KEYS.orders, []),
    getValidOrderScanCache(),
    getSessionValue<Address[]>(STORAGE_KEYS.queue, []),
    getSessionValue<Address | null>(STORAGE_KEYS.activeOrder, null),
    getSettings(),
    getAuthState(),
  ]);
  const signedOut = auth.authRequired && !auth.signedIn;

  let amazonAccount: AmazonAccountCheckState | null = null;
  if (isPopup) {
    amazonAccount = await requestAmazonAccountCheck();
  } else {
    amazonAccount = await getSessionValue<AmazonAccountCheckState | null>(
      STORAGE_KEYS.amazonAccountCheck,
      null
    );
  }

  return {
    ok: true,
    authRequired: auth.authRequired,
    signedIn: auth.signedIn,
    userEmail: auth.userEmail,
    source: auth.source,
    webAppUrl: auth.webAppUrl,
    orders: signedOut ? [] : scanCache.orders,
    savedOrders: signedOut ? [] : orders,
    orderScanExpiresAt: signedOut ? 0 : scanCache.expiresAt,
    queue: signedOut ? [] : queue,
    activeOrder: signedOut ? null : activeOrder,
    queueCount: signedOut ? 0 : queue.length,
    settings,
    amazonAccount,
  };
}

async function advanceQueue() {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return { ok: false, activeOrder: null, queueCount: 0, error: blockMessage };
  }

  const queue = await getSessionValue<Address[]>(STORAGE_KEYS.queue, []);
  const nextQueue = queue.slice(1);
  const activeOrder = nextQueue[0] || null;
  await setSessionValue(STORAGE_KEYS.queue, nextQueue);
  await setSessionValue(STORAGE_KEYS.activeOrder, activeOrder);
  return { ok: true, activeOrder, queueCount: nextQueue.length };
}

async function logFulfillment(payload: unknown) {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return { ok: false, error: blockMessage };
  }

  if (!isRecord(payload) || !isAddress(payload.order)) {
    return { ok: false, error: "Invalid fulfillment payload." };
  }

  const fulfillment = payload as {
    order: Address;
    status: "ordered" | "failed";
    amazonOrderRef: string | null;
  };
  const supabase = getSupabaseClient();

  let amazonAccount: string | null = null;
  if (fulfillment.status === "ordered" || fulfillment.status === "failed") {
    const checkState = await getSessionValue<AmazonAccountCheckState | null>(
      STORAGE_KEYS.amazonAccountCheck,
      null
    );
    amazonAccount = checkState?.email || null;
  }

  if (!supabase) {
    const localRows = await getLocalValue<unknown[]>(STORAGE_KEYS.localFulfillments, []);
    await setLocalValue(STORAGE_KEYS.localFulfillments, [
      {
        ...fulfillment,
        amazon_account: amazonAccount,
        created_at: new Date().toISOString(),
        local_only: true,
      },
      ...localRows,
    ].slice(0, 100));
    return { ok: true, localOnly: true };
  }

  await getSupabaseSessionSilent(supabase);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await setLocalValue(STORAGE_KEYS.authState, {
      signedIn: false,
      userEmail: null,
      updatedAt: new Date().toISOString(),
    });
    return { ok: false, skipped: true, error: "Sign in to CP Bot before logging fulfillments." };
  }

  const { error } = await supabase.from("cp_bot_fulfillments").insert({
    user_id: user.id,
    ebay_order_id: fulfillment.order.orderId,
    amazon_order_ref: fulfillment.amazonOrderRef || null,
    buyer_name: fulfillment.order.buyerName,
    postcode: fulfillment.order.postcode,
    item_title: fulfillment.order.itemTitle || null,
    quantity: fulfillment.order.qty || 1,
    status: fulfillment.status,
    validation_warnings: fulfillment.order.validationWarnings || [],
    amazon_account: amazonAccount,
    created_at: new Date().toISOString(),
  });

  if (error) {
    // If the database has not run the amazon_account migration, fallback and retry inserting without it
    if (error.message?.includes("amazon_account") || error.code === "PGRST204") {
      console.warn("CP Bot SW: Remote database is missing amazon_account column. Retrying insert without it...");
      const { error: retryError } = await supabase.from("cp_bot_fulfillments").insert({
        user_id: user.id,
        ebay_order_id: fulfillment.order.orderId,
        amazon_order_ref: fulfillment.amazonOrderRef || null,
        buyer_name: fulfillment.order.buyerName,
        postcode: fulfillment.order.postcode,
        item_title: fulfillment.order.itemTitle || null,
        quantity: fulfillment.order.qty || 1,
        status: fulfillment.status,
        validation_warnings: fulfillment.order.validationWarnings || [],
        created_at: new Date().toISOString(),
      });
      if (retryError) {
        return { ok: false, error: retryError.message };
      }
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

async function logActivity(payload: unknown) {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return { ok: false, error: blockMessage };
  }

  if (!isRecord(payload) || typeof payload.event_type !== "string") {
    return { ok: false, error: "Invalid activity payload." };
  }

  const activity = payload as {
    ebay_order_id: string | null;
    event_type: string;
    detail: Record<string, unknown>;
  };
  
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { ok: true, localOnly: true };
  }

  await getSupabaseSessionSilent(supabase);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await setLocalValue(STORAGE_KEYS.authState, {
      signedIn: false,
      userEmail: null,
      updatedAt: new Date().toISOString(),
    });
    return { ok: false, skipped: true, error: "Sign in to CP Bot before logging activities." };
  }

  const detail = activity.detail || {};
  const { error } = await supabase.from("cp_bot_activity_log").insert({
    user_id: user.id,
    event_type: activity.event_type,
    ebay_order_id: activity.ebay_order_id || null,
    extension_version: EXTENSION_VERSION,
    detail: {
      ...detail,
      extension_version: EXTENSION_VERSION,
    },
    created_at: new Date().toISOString(),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

async function setSettings(settings: unknown) {
  if (!isRecord(settings)) {
    return { ok: false, error: "Invalid settings." };
  }

  const current = await getSettings();
  const next: CpBotSettings = {
    autoUseThisAddress:
      typeof settings.autoUseThisAddress === "boolean"
        ? settings.autoUseThisAddress
        : current.autoUseThisAddress,
    automationDisabled:
      typeof settings.automationDisabled === "boolean"
        ? settings.automationDisabled
        : current.automationDisabled,
    giftOptions: {
      enabled:
        isRecord(settings.giftOptions) && typeof settings.giftOptions.enabled === "boolean"
          ? settings.giftOptions.enabled
          : current.giftOptions.enabled,
      message:
        isRecord(settings.giftOptions) && typeof settings.giftOptions.message === "string"
          ? settings.giftOptions.message
          : current.giftOptions.message,
      from:
        isRecord(settings.giftOptions) && typeof settings.giftOptions.from === "string"
          ? settings.giftOptions.from
          : current.giftOptions.from,
    },
    webAppUrl: typeof settings.webAppUrl === "string" && settings.webAppUrl ? settings.webAppUrl : current.webAppUrl,
  };

  await setLocalValue(STORAGE_KEYS.settings, next);
  return { ok: true, settings: next };
}

chrome.webNavigation.onBeforeNavigate.addListener(
  async (details) => {
    // Only act on the top-level frame, ignore iframes/subframes
    if (details.frameId !== 0) return;

    await handleAmazonSignOutDetected();
  },
  {
    url: [
      {
        hostSuffix: "amazon.com.au",
        pathEquals: "/gp/flex/sign-out.html",
      },
    ],
  }
);

async function handleAmazonSignOutDetected() {
  const signedOutState: AmazonAccountCheckState = {
    email: null,
    status: "signed_out",
    checkedAt: Date.now(),
  };

  // Bypass TTL and cooldown entirely — this is a reactive event, not a poll.
  // Overwrite the cache immediately so any concurrent or subsequent read sees it.
  await setSessionValue(STORAGE_KEYS.amazonAccountCheck, signedOutState);

  // Reset the cooldown timer to 0 so the *next* trigger (popup open or paste)
  // is allowed to immediately perform a fresh Switch-Accounts check rather
  // than waiting out the normal 60-second cooldown window.
  await setSessionValue(STORAGE_KEYS.amazonAccountCheckLastAttempt, 0);

  // Optional: broadcast to any open popup so it updates without needing to reopen
  chrome.runtime.sendMessage({
    type: "CPBOT_AMAZON_ACCOUNT_CHECK_RESULT",
    status: "signed_out",
    email: null,
  }).catch(() => { /* no popup open — safe to ignore */ });
}

chrome.runtime.onInstalled.addListener(() => {
  void getSettings().then((settings) => setLocalValue(STORAGE_KEYS.settings, settings));
});

/**
 * On browser startup or background worker boot, silently open the CP Bot web app
 * in a separate background window to trigger the AuthBridge component. The bridge
 * fires CPBOT_AUTH_BRIDGE_UPDATE back to the service worker, refreshing the stored
 * auth state. The window is closed automatically after 10 seconds.
 *
 * This check is run exactly once per browser/profile session using a session storage flag.
 */
async function runStartupAuthCheck() {
  try {
    const session = chrome.storage.session || chrome.storage.local;
    const sessionKey = "cpBot.startupAuthChecked";

    const result = await session.get(sessionKey);
    if (result[sessionKey]) {
      return;
    }

    // Set flag immediately to prevent duplicate runs
    await session.set({ [sessionKey]: true });

    // Retrieve stored authState to get the active webAppUrl
    const storedAuth = await getLocalValue<StoredAuthState | null>(STORAGE_KEYS.authState, null);
    const baseCheckUrl = storedAuth?.webAppUrl || cpBotWebAppUrl;
    const authCheckUrl = baseCheckUrl.endsWith("/")
      ? `${baseCheckUrl}cp-bot`
      : `${baseCheckUrl}/cp-bot`;

    // Open an unfocused background window (separate from any existing window)
    chrome.windows.create(
      {
        url: authCheckUrl,
        focused: false,
        state: "minimized",
        type: "popup",
        width: 1,
        height: 1,
        left: -9999,
        top: -9999,
      },
      (createdWindow) => {
        if (chrome.runtime.lastError || !createdWindow?.id) {
          return;
        }

        const winId = createdWindow.id;

        // Wait 10 seconds for the AuthBridge to run, then close the window
        setTimeout(() => {
          chrome.windows.remove(winId, () => {
            // Ignore "no such window" errors if it was already closed
            void chrome.runtime.lastError;
          });
        }, 10000);
      }
    );
  } catch (err) {
    console.error("CP Bot SW: Startup auth check failed:", err);
  }
}

// Run startup check immediately on worker boot
void runStartupAuthCheck();

// Also register onStartup as a fallback
chrome.runtime.onStartup.addListener(() => {
  void runStartupAuthCheck();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isRecord(message) || typeof message.type !== "string") {
    sendResponse({ ok: false, error: "Unknown CP Bot message." });
    return false;
  }

  // Every CP Bot message type starts with "CPBOT_" and expects to return a response
  // asynchronously. Checking by prefix eliminates the need to manually keep a
  // static string array in sync with the types.
  const isAsync = message.type.startsWith("CPBOT_");

  void (async () => {
    switch (message.type) {
      case "CPBOT_SAVE_ORDERS":
        return saveOrders(Array.isArray(message.orders) ? message.orders : []);
      case "CPBOT_SCAN_ORDER_DETAILS":
        return scanOrderDetails(Array.isArray(message.links) ? message.links : [], _sender.tab?.id);
      case "CPBOT_COPY_ORDER":
        return copyOrder(message.order);
      case "CPBOT_QUEUE_ORDERS":
        return queueOrders(Array.isArray(message.orders) ? message.orders : []);
      case "CPBOT_GET_STATE":
        return getState(!_sender.tab);
      case "CPBOT_ADVANCE_QUEUE":
        return advanceQueue();

      case "CPBOT_START_PASTE": {
        const accountState = await requestAmazonAccountCheck();
        if (accountState.status === "signed_out") {
          return {
            success: false,
            error: "Amazon account is signed out. Please log in before pasting.",
          };
        }
        void requestAmazonAccountCheck().catch((err) => {
          console.log("CP Bot SW: Background account check failed:", err);
        });
        return { ok: true };
      }

      case "CPBOT_SET_PENDING_AUTOFILL": {
        await setSessionValue(STORAGE_KEYS.pendingAutofill, message.payload);
        return { ok: true };
      }

      case "CPBOT_SET_ACTIVE_ORDER": {
        await setSessionValue(STORAGE_KEYS.activeOrder, message.payload);
        return { ok: true };
      }

      case "CPBOT_GET_PENDING_AUTOFILL": {
        const stored = await getSessionValue<unknown>(STORAGE_KEYS.pendingAutofill, null);
        return { ok: true, data: stored };
      }

      case "CPBOT_CLEAR_PENDING_AUTOFILL": {
        await setSessionValue(STORAGE_KEYS.pendingAutofill, null);
        return { ok: true };
      }

      case "CPBOT_SET_PENDING_GIFT_MESSAGE": {
        await setSessionValue(STORAGE_KEYS.pendingGiftMessage, message.payload);
        return { ok: true };
      }

      case "CPBOT_GET_PENDING_GIFT_MESSAGE": {
        const stored = await getSessionValue<unknown>(STORAGE_KEYS.pendingGiftMessage, null);
        return { ok: true, data: stored };
      }

      case "CPBOT_CLEAR_PENDING_GIFT_MESSAGE": {
        await setSessionValue(STORAGE_KEYS.pendingGiftMessage, null);
        return { ok: true };
      }

      case "CPBOT_LOG_FULFILLMENT":
        return logFulfillment(message.payload);
      case "CPBOT_LOG_ACTIVITY":
        return logActivity(message.payload);
      case "CPBOT_AUTH_BRIDGE_UPDATE": {
        const msg = message as { source: unknown; payload: unknown };
        debugLog("CP Bot SW: Received CPBOT_AUTH_BRIDGE_UPDATE", msg);
        if (
          (msg.source === "localhost" || msg.source === "vercel") &&
          msg.payload &&
          typeof msg.payload === "object"
        ) {
          return handleAuthBridgeUpdate(msg.source, msg.payload as AuthBridgePayload);
        }
        console.warn("CP Bot SW: Invalid CPBOT_AUTH_BRIDGE_UPDATE payload:", msg);
        return { ok: false, error: "Invalid bridge update payload." };
      }

      case "CPBOT_GET_SETTINGS":
        return { ok: true, settings: await getSettings() };
      case "CPBOT_SET_SETTINGS":
        return setSettings(message.settings);

      case "CPBOT_COPY_ORDER_TO_CLOUD": {
        const supabase = getSupabaseClient();
        if (!supabase) {
          return { ok: false, error: "Supabase client not available." };
        }

        await getSupabaseSessionSilent(supabase);
        const { data: { user: cloudCopyUser }, error: cloudCopyUserError } = await supabase.auth.getUser();
        if (cloudCopyUserError || !cloudCopyUser) {
          return { ok: false, error: "Not signed in." };
        }

        if (!isAddress(message.order)) {
          return { ok: false, error: "Invalid order payload." };
        }

        const cloudOrder = message.order as Address;
        const { error: upsertError } = await supabase
          .from("cp_bot_cloud_clipboard")
          .upsert(
            {
              user_id: cloudCopyUser.id,
              ebay_order_id: cloudOrder.orderId,
              address: cloudOrder,
              expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            },
            { onConflict: "user_id,ebay_order_id" }
          );

        if (upsertError) {
          return { ok: false, error: upsertError.message };
        }
        return { ok: true };
      }

      case "CPBOT_GET_CLOUD_CLIPBOARD": {
        const supabase = getSupabaseClient();
        if (!supabase) {
          return { ok: true, data: [] };
        }

        await getSupabaseSessionSilent(supabase);
        const { data: { user: cloudFetchUser }, error: cloudFetchUserError } = await supabase.auth.getUser();
        if (cloudFetchUserError || !cloudFetchUser) {
          return { ok: true, data: [] };
        }

        const { data: cloudData, error: cloudFetchError } = await supabase
          .from("cp_bot_cloud_clipboard")
          .select("ebay_order_id, address, created_at, expires_at")
          .eq("user_id", cloudFetchUser.id)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });

        if (cloudFetchError) {
          return { ok: false, error: cloudFetchError.message };
        }
        return { ok: true, data: cloudData ?? [] };
      }

      default:
        return { ok: false, error: "Unsupported CP Bot action." };
    }
  })()
    .then((res) => {
      if (isAsync) {
        sendResponse(res);
      }
    })
    .catch((error: unknown) => {
      if (isAsync) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unexpected CP Bot error." });
      }
    });

  return isAsync;
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0 && details.url && details.url.includes("ref_=nav_youraccount_switchacct")) {
    debugLog("CP Bot SW: Detected Switch-Account onCompleted navigation to:", details.url);
    void requestAmazonAccountCheck(true).catch((err) => {
      console.error("CP Bot SW: Account check after Switch-Account onCompleted failed:", err);
    });
  }
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0 && details.url && details.url.includes("ref_=nav_youraccount_switchacct")) {
    debugLog("CP Bot SW: Detected Switch-Account onHistoryStateUpdated navigation to:", details.url);
    void requestAmazonAccountCheck(true).catch((err) => {
      console.error("CP Bot SW: Account check after Switch-Account onHistoryStateUpdated failed:", err);
    });
  }
});


