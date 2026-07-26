import {
  findEbayOrderDetailLinks,
  formatAddressForClipboard,
  parseEbayOrderDetailsPage,
  parseEbayOrders,
  type EbayOrderDetailLink,
} from "../lib/addressParser";
import { detectSecurityChallenge, securityChallengeMessage } from "../lib/securityGuards";
import {
  CPBOT_AUTOMATION_DISABLED_MESSAGE,
  CPBOT_CONTEXT_INVALIDATED_MESSAGE,
  CPBOT_SIGNED_OUT_MESSAGE,
  CPBOT_SUPABASE_AUTH_STORAGE_KEY,
  sendRuntimeMessage,
  STORAGE_KEYS,
} from "../lib/storage";
import { mountWidget, updateWidgetStatus } from "../widget/Widget";
import type { Address, CpBotSettings } from "../types/Address";

const DETAIL_SCAN_LIMIT = 5;
const ITEM_TITLE_CHECK_FAILED = "Name Check Failed";
const detailOrderCache = new Map<string, Promise<Address | null>>();

interface StateResponse {
  ok?: boolean;
  error?: string;
  authRequired?: boolean;
  signedIn?: boolean;
  userEmail?: string | null;
  orders?: Address[];
  orderScanExpiresAt?: number;
  settings?: CpBotSettings;
}

async function automationBlockMessage() {
  const state = await sendRuntimeMessage<StateResponse>({ type: "CPBOT_GET_STATE" });
  if (state.authRequired && !state.signedIn) {
    return CPBOT_SIGNED_OUT_MESSAGE;
  }

  if (state.settings?.automationDisabled) {
    return CPBOT_AUTOMATION_DISABLED_MESSAGE;
  }

  return null;
}

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}



async function copyOrder(order: Address) {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return blockMessage;
  }

  await writeClipboard(formatAddressForClipboard(order));
  const response = await sendRuntimeMessage<{ ok: boolean; error?: string }>({ type: "CPBOT_COPY_ORDER", order });
  if (!response.ok) {
    return response.error || "Could not store copied order.";
  }

  if (order.validationWarnings && order.validationWarnings.length > 0) {
    void sendRuntimeMessage({
      type: "CPBOT_LOG_ACTIVITY",
      payload: {
        ebay_order_id: order.orderId,
        event_type: "address_validation_warning",
        detail: { warnings: order.validationWarnings }
      }
    }).catch(console.error);
  }

  return `Copied ${order.buyerName} to clipboard and CP Bot session.`;
}

async function queueOrders(orders: Address[]) {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return blockMessage;
  }

  if (orders.length === 0) {
    return "Select at least one order first.";
  }

  await writeClipboard(formatAddressForClipboard(orders[0]));
  const response = await sendRuntimeMessage<{ ok: boolean; error?: string; queueCount?: number }>({
    type: "CPBOT_QUEUE_ORDERS",
    orders,
  });

  if (!response.ok) {
    return response.error || "Could not queue orders.";
  }

  return `Queued ${response.queueCount || orders.length} order(s). First address copied.`;
}



function isInvalidatedContext(error?: string) {
  return Boolean(error && /context invalidated|reloaded/i.test(error));
}

let extensionDisconnected = false;
let refreshSequence = 0;
let scanInProgress = false;
let lastSellerHubOrders: Address[] = [];
let lastSellerHubOrdersExpiresAt = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function isAddress(value: unknown): value is Address {
  return isRecord(value) && typeof value.orderId === "string" && typeof value.buyerName === "string";
}

function getStoredOrders(state: StateResponse) {
  return Array.isArray(state.orders) ? state.orders.filter(isAddress) : [];
}

function scanCacheExpiresAt(state: StateResponse) {
  return typeof state.orderScanExpiresAt === "number" ? state.orderScanExpiresAt : 0;
}

function scanCacheMinutesRemaining(expiresAt: number) {
  return Math.max(1, Math.ceil((expiresAt - Date.now()) / 60000));
}

function manualScanCacheMessage(count: number, expiresAt: number) {
  return `Showing ${count} address(es) from your manual scan. They expire in about ${scanCacheMinutesRemaining(expiresAt)} minute(s).`;
}

function isSellerHubOrdersPage() {
  return window.location.hostname.endsWith("ebay.com.au") && window.location.pathname.includes("/sh/ord");
}

function isEbayOrderDetailsPage() {
  return window.location.hostname.endsWith("ebay.com.au") && window.location.pathname.includes("/mesh/ord/details");
}

function isBackgroundScannerTab() {
  return new URL(window.location.href).searchParams.get("cpbot_scan") === "1";
}

function ebayRefreshMode() {
  return isSellerHubOrdersPage() ? "scan" : "refresh";
}

function refreshCurrentEbayPage() {
  return isEbayOrderDetailsPage()
    ? refresh({ statusMessage: "Refresh completed. You can refresh again after 60 seconds." })
    : refresh({ scanDetails: true });
}

async function fetchDetailOrder(link: EbayOrderDetailLink) {
  try {
    const response = await fetch(link.href, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`eBay detail fetch failed with ${response.status}`);
    }

    const html = await response.text();
    const detailDocument = new DOMParser().parseFromString(html, "text/html");
    const order = parseEbayOrderDetailsPage(detailDocument, link.href);

    if (order) {
      return normalizeDetailOrder(order, link);
    }
  } catch {
    // eBay sometimes returns an app shell to fetch(). The background window scanner is the primary fallback.
  }

  return null;
}

function normalizeDetailOrder(order: Address, link: EbayOrderDetailLink): Address {
  return {
    ...order,
    orderId: order.orderId || link.orderId,
    itemTitle: order.itemTitle || ITEM_TITLE_CHECK_FAILED,
    sourceUrl: link.href,
  };
}

function getCachedDetailOrder(link: EbayOrderDetailLink, forceRescan: boolean) {
  if (forceRescan) {
    detailOrderCache.delete(link.href);
  }

  const existing = detailOrderCache.get(link.href);
  if (existing) {
    return existing;
  }

  const request = fetchDetailOrder(link).then((order) => {
    if (!order) {
      detailOrderCache.delete(link.href);
    }
    return order;
  });
  detailOrderCache.set(link.href, request);
  return request;
}

async function scanDetailOrders(detailLinks: EbayOrderDetailLink[], forceRescan: boolean) {
  const blockMessage = await automationBlockMessage();
  if (blockMessage) {
    return [];
  }

  if (detectSecurityChallenge()) {
    return [];
  }

  scanInProgress = true;
  try {
    if (forceRescan) {
      detailLinks.forEach((link) => detailOrderCache.delete(link.href));
    }

    const backgroundScan = await sendRuntimeMessage<{
      ok?: boolean;
      orders?: Address[];
      error?: string;
      scannedCount?: number;
    }>({
      type: "CPBOT_SCAN_ORDER_DETAILS",
      links: detailLinks,
    });

    if (Array.isArray(backgroundScan.orders) && backgroundScan.orders.length > 0) {
      return backgroundScan.orders;
    }

    return (await Promise.all(detailLinks.map((link) => getCachedDetailOrder(link, forceRescan))))
      .filter((order): order is Address => order !== null)
      .filter((order, index, all) => all.findIndex((candidate) => candidate.orderId === order.orderId) === index);
  } catch {
    return [];
  } finally {
    scanInProgress = false;
  }
}

async function getOrdersForCurrentPage(scanDetails = false) {
  if (!isSellerHubOrdersPage()) {
    return {
      orders: parseEbayOrders(document),
      detailLinkCount: 0,
      scannedDetails: false,
    };
  }

  const detailLinks = findEbayOrderDetailLinks(document, DETAIL_SCAN_LIMIT);
  if (detailLinks.length === 0 || !scanDetails) {
    return {
      orders: [],
      detailLinkCount: detailLinks.length,
      scannedDetails: false,
    };
  }

  const detailOrders = await scanDetailOrders(detailLinks, true);

  return {
    orders: detailOrders,
    detailLinkCount: detailLinks.length,
    scannedDetails: true,
  };
}

async function refresh(options: { scanDetails?: boolean; statusMessage?: string } = {}) {
  if (extensionDisconnected) {
    return;
  }

  if (options.scanDetails) {
    scanInProgress = true;
  }

  if (scanInProgress && !options.scanDetails) {
    return;
  }

  const cooldownSeconds = isSellerHubOrdersPage() ? 90 : 60;

  const challenge = detectSecurityChallenge();
  if (challenge) {
    extensionDisconnected = true;
    observer.disconnect();
    mountWidget({
      mode: "ebay",
      orders: [],
      refreshMode: ebayRefreshMode(),
      refreshCooldownSeconds: cooldownSeconds,
      initialMessage: securityChallengeMessage(challenge),
    });
    return;
  }

  const sequence = ++refreshSequence;
  const state = await sendRuntimeMessage<StateResponse>({ type: "CPBOT_GET_STATE" });

  if (sequence !== refreshSequence) {
    return;
  }

  if (state.authRequired && !state.signedIn) {
    mountWidget({
      mode: "ebay",
      orders: [],
      settings: state.settings,
      refreshMode: ebayRefreshMode(),
      refreshCooldownSeconds: cooldownSeconds,
      initialMessage: options.statusMessage || CPBOT_SIGNED_OUT_MESSAGE,
    });
    return;
  }

  if (state.settings?.automationDisabled) {
    mountWidget({
      mode: "ebay",
      orders: [],
      settings: state.settings,
      refreshMode: ebayRefreshMode(),
      refreshCooldownSeconds: cooldownSeconds,
      initialMessage: CPBOT_AUTOMATION_DISABLED_MESSAGE,
    });
    return;
  }

  if (isSellerHubOrdersPage() && !options.scanDetails) {
    const detailLinkCount = findEbayOrderDetailLinks(document, DETAIL_SCAN_LIMIT).length;
    const storedOrders = getStoredOrders(state);
    const storedExpiresAt = scanCacheExpiresAt(state);
    const memoryValid = lastSellerHubOrders.length > 0 && lastSellerHubOrdersExpiresAt > Date.now();
    const storageValid = storedOrders.length > 0 && storedExpiresAt > Date.now();
    const orders = memoryValid ? lastSellerHubOrders : storageValid ? storedOrders : [];
    const expiresAt = memoryValid ? lastSellerHubOrdersExpiresAt : storageValid ? storedExpiresAt : 0;

    if (orders.length > 0) {
      lastSellerHubOrders = orders;
      lastSellerHubOrdersExpiresAt = expiresAt;
    } else {
      lastSellerHubOrders = [];
      lastSellerHubOrdersExpiresAt = 0;
    }

    mountWidget({
      mode: "ebay",
      orders,
      settings: state.settings,
      refreshMode: "scan",
      refreshCooldownSeconds: cooldownSeconds,
      initialMessage:
        options.statusMessage ||
        (orders.length > 0
          ? manualScanCacheMessage(orders.length, expiresAt)
          : detailLinkCount > 0
            ? "Press Scan to scan the first 5 order detail links."
            : undefined),
      onRefresh: () => refreshCurrentEbayPage(),
      onCopyOrder: copyOrder,
      onQueueOrders: queueOrders,
    });
    return;
  }

  const detailLinkCount = isSellerHubOrdersPage()
    ? findEbayOrderDetailLinks(document, DETAIL_SCAN_LIMIT).length
    : 0;

  if (detailLinkCount > 0 && options.scanDetails) {
    mountWidget({
      mode: "ebay",
      orders: [],
      settings: state.settings,
      refreshMode: "scan",
      refreshCooldownSeconds: cooldownSeconds,
      initialMessage: `Scanning first ${detailLinkCount} order detail page(s)...`,
      onRefresh: () => refresh({ scanDetails: true }),
      onCopyOrder: copyOrder,
      onQueueOrders: queueOrders,
    });
  }

  try {
    const {
      orders,
      detailLinkCount: scannedLinkCount,
      scannedDetails,
    } = await getOrdersForCurrentPage(Boolean(options.scanDetails));

    if (scannedDetails) {
      void sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: orders[0]?.orderId || null,
          event_type: "scan",
          detail: {
            scannedCount: scannedLinkCount || 1,
            successCount: orders.length,
          }
        }
      }).catch(console.error);
    }

    if (sequence !== refreshSequence && !options.scanDetails) {
      return;
    }

    const sellerHubPage = isSellerHubOrdersPage();
    let displayOrders = orders;

    if (sellerHubPage && scannedDetails) {
      if (orders.length > 0) {
        lastSellerHubOrders = orders;
        lastSellerHubOrdersExpiresAt = Date.now() + 60 * 60 * 1000;
      } else {
        const storedOrders = getStoredOrders(state);
        const storedExpiresAt = scanCacheExpiresAt(state);
        const memoryValid = lastSellerHubOrders.length > 0 && lastSellerHubOrdersExpiresAt > Date.now();
        const storageValid = storedOrders.length > 0 && storedExpiresAt > Date.now();
        displayOrders = memoryValid ? lastSellerHubOrders : storageValid ? storedOrders : [];
      }
    }

    const saveResponse = { ok: true, error: undefined as string | undefined };
    const invalidated = isInvalidatedContext(saveResponse.error) || isInvalidatedContext(state.error);

    if (invalidated) {
      extensionDisconnected = true;
      observer.disconnect();
    }

    mountWidget({
      mode: "ebay",
      orders: displayOrders,
      settings: state.settings,
      refreshMode: ebayRefreshMode(),
      refreshCooldownSeconds: cooldownSeconds,
      initialMessage:
        options.statusMessage ||
        (invalidated
          ? CPBOT_CONTEXT_INVALIDATED_MESSAGE
            : scannedDetails && scannedLinkCount > 0
            ? "Scan complete."
            : scannedLinkCount > 0
              ? "Press Scan to scan the first 5 order detail links."
              : undefined),
      onRefresh: () => refreshCurrentEbayPage(),
      onCopyOrder: copyOrder,
      onQueueOrders: queueOrders,
    });
  } finally {
    if (options.scanDetails) {
      scanInProgress = false;
    }
  }
}

const observer = {
  observe(_target: Node, _options?: MutationObserverInit) {},
  disconnect() {},
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (isRecord(message) && message.type === "CPBOT_SCAN_PROGRESS") {
    if (typeof message.text === "string") {
      updateWidgetStatus(message.text);
    }
    return false;
  }

  if (!isRecord(message) || message.type !== "CPBOT_EXTRACT_EBAY_ORDER") {
    return false;
  }

  const challenge = detectSecurityChallenge();
  if (challenge) {
    sendResponse({ ok: false, error: securityChallengeMessage(challenge), orders: [] });
    return false;
  }

  const orders = parseEbayOrders(document, window.location.href);
  sendResponse({ ok: true, orders });
  return false;
});

if (!isBackgroundScannerTab()) {
  void refresh().catch(() => undefined);
  if (!isEbayOrderDetailsPage()) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (
      areaName === "local" &&
      (changes[STORAGE_KEYS.settings] || changes[STORAGE_KEYS.authState] || changes[CPBOT_SUPABASE_AUTH_STORAGE_KEY])
    ) {
      const authState = changes[STORAGE_KEYS.authState]?.newValue as
        | { signedIn?: boolean; userEmail?: string | null }
        | undefined;
      const statusMessage =
        typeof authState?.signedIn === "boolean"
          ? authState.signedIn
            ? `Signed in to CP Bot${authState.userEmail ? ` as ${authState.userEmail}` : ""}.`
            : CPBOT_SIGNED_OUT_MESSAGE
          : undefined;

      void refresh({ statusMessage }).catch(() => undefined);
    }
  });
}
