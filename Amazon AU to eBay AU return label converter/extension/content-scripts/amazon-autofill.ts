import {
  addOrFillAmazonAddress,
  amazonPageContainsAddress,
  clickElement,
  detectAmazonCheckoutAnomaly,
  dismissPrimeExpeditedDeliveryPromptIfPresent,
  fillAmazonGiftOptions,
  findAmazonSpcChangeAddressElements,
  isAmazonAddressPageReady,
  findAmazonAddGiftOptionsLink,
  isAmazonGiftPageReady,
  selectExistingAmazonAddressAndDeliver,
  setStatusCallback,
  setUnlockButtonsCallback,
  isSlowNetwork,
  expandAddressListIfNeeded,
  isAmazonCheckoutPage,
  hasAddressRadioCards,
  type FillResult,
} from "../lib/amazonFieldMap";
import { detectSecurityChallenge, securityChallengeMessage } from "../lib/securityGuards";

let isUnloading = false;
let isRecoveryRunning = false;
let isRecoveryInitiated = false;
let recoveryInitiatedUrl: string | null = null;
let isRendering = false;
window.addEventListener("pagehide", () => {
  isUnloading = true;
});
window.addEventListener("beforeunload", () => {
  isUnloading = true;
});


let currentActionSessionId = Date.now();

function startNewActionSession(): number {
  currentActionSessionId = Date.now();
  return currentActionSessionId;
}

function isCurrentActionSession(sessionId: number): boolean {
  return sessionId === currentActionSessionId;
}

import {
  CPBOT_AUTOMATION_DISABLED_MESSAGE,
  CPBOT_CONTEXT_INVALIDATED_MESSAGE,
  CPBOT_SIGNED_OUT_MESSAGE,
  CPBOT_SUPABASE_AUTH_STORAGE_KEY,
  getSessionValue,
  getLocalValue,
  sendRuntimeMessage,
  setSessionValue,
  setLocalValue,
  STORAGE_KEYS,
  debugLog,
} from "../lib/storage";
import { mountWidget, updateWidgetStatus } from "../widget/Widget";
import type { Address, CpBotSettings } from "../types/Address";

interface AutomationLogEntry {
  buyerName: string;
  startedAt: number;
  messages: { text: string; at: number }[];
}

let activeAutomationMessage: string | null = null;
let activeAutomationMessageSetAt = 0;

async function setAutomationInProgress(inProgress: boolean, sessionId?: number) {
  if (sessionId !== undefined && !isCurrentActionSession(sessionId)) {
    debugLog("[CP Bot Diagnostic] Rejecting setAutomationInProgress from stale session:", sessionId, "current:", currentActionSessionId);
    return;
  }
  await setSessionValue("cpBot.automationInProgress", inProgress);
}

function isProgressMessage(msg: string): boolean {
  const normalized = msg.toLowerCase();
  const keywords = [
    "pasting", "finding", "adding", "navigating", "expanding",
    "recovery", "please wait", "scanning", "selecting",
    "filling", "checking", "waiting", "wating", "preparing", "attempting", "searching",
    "entering", "opening", "verifying", "submitting", "clicking", "dialog", "prompt"
  ];
  if (
    normalized.includes("successfully") ||
    normalized.includes("failed") ||
    normalized.includes("stopped") ||
    normalized.includes("complete") ||
    normalized.includes("finished") ||
    normalized.includes("canceled")
  ) {
    return false;
  }
  return keywords.some(keyword => normalized.includes(keyword));
}

function setActiveAutomationMessage(msg: string | null, sessionId?: number) {
  if (sessionId !== undefined && !isCurrentActionSession(sessionId)) {
    debugLog("[CP Bot Diagnostic] Rejecting setActiveAutomationMessage from stale session:", sessionId, "current session:", currentActionSessionId);
    return;
  }
  debugLog("[CP Bot Diagnostic] setActiveAutomationMessage called with:", msg, "at", Date.now(), "URL:", window.location.href);
  if (!msg && activeAutomationMessage && isProgressMessage(activeAutomationMessage)) {
    debugLog("[CP Bot Diagnostic] Rejecting clearing status to null/clear because current is mid-progress:", activeAutomationMessage);
    return;
  }
  activeAutomationMessage = msg;
  activeAutomationMessageSetAt = msg ? Date.now() : 0;
  // Push live status update to the widget immediately
  updateWidgetStatus(msg);
  // Append to automation log for message history
  if (msg) {
    void appendAutomationLogMessage(msg).catch(() => undefined);
    void setSessionValue("cpBot.activeAutomationMessage", msg).catch(() => undefined);
    void setSessionValue("cpBot.activeAutomationMessageSetAt", activeAutomationMessageSetAt).catch(() => undefined);
  } else {
    void setSessionValue("cpBot.activeAutomationMessage", null).catch(() => undefined);
    void setSessionValue("cpBot.activeAutomationMessageSetAt", 0).catch(() => undefined);
  }
}

let currentAutomationLog: AutomationLogEntry | null = null;
let activeBuyerName: string | null = null;

async function getActiveBuyerName(): Promise<string | null> {
  if (activeBuyerName) {
    return activeBuyerName;
  }
  const saved = await getSessionValue<string | null>("cpBot.activeBuyerName", null);
  if (saved) {
    activeBuyerName = saved;
    return activeBuyerName;
  }
  const state = await getState().catch(() => null);
  if (state?.activeOrder?.buyerName) {
    activeBuyerName = state.activeOrder.buyerName;
    await setSessionValue("cpBot.activeBuyerName", activeBuyerName);
    return activeBuyerName;
  }
  const recovery = await readUnexpectedCheckoutRecovery().catch(() => null);
  if (recovery?.order?.buyerName) {
    activeBuyerName = recovery.order.buyerName;
    await setSessionValue("cpBot.activeBuyerName", activeBuyerName);
    return activeBuyerName;
  }
  return null;
}

const AUTOMATION_LOG_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours (7,200,000 ms)

async function startAutomationLog(buyerName: string) {
  activeBuyerName = buyerName;
  await setSessionValue("cpBot.activeBuyerName", buyerName);
  const existing = await getLocalValue<AutomationLogEntry[]>(STORAGE_KEYS.automationLogs, []);
  const now = Date.now();
  
  // Filter out logs older than 2 hours (7,200,000 ms)
  const validLogs = existing.filter(log => now - log.startedAt < AUTOMATION_LOG_MAX_AGE_MS);

  // Resume existing log if started within the last 10 minutes for the same buyer
  const existingLog = [...validLogs].reverse().find(log => log.buyerName === buyerName && now - log.startedAt < 600000);
  if (existingLog) {
    currentAutomationLog = existingLog;
    await setLocalValue(STORAGE_KEYS.automationLogs, validLogs);
    updateWidgetStatus(activeAutomationMessage, validLogs);
    return;
  }

  // Create a new log entry for this run
  currentAutomationLog = {
    buyerName,
    startedAt: now,
    messages: [],
  };

  // Keep up to 19 previous valid logs, then push the new one (maximum 20 total)
  const trimmed = validLogs.slice(-19);
  trimmed.push(currentAutomationLog);
  await setLocalValue(STORAGE_KEYS.automationLogs, trimmed);
  updateWidgetStatus(activeAutomationMessage, trimmed);
}

async function appendAutomationLogMessage(text: string) {
  const now = Date.now();
  const logs = await getLocalValue<AutomationLogEntry[]>(STORAGE_KEYS.automationLogs, []);
  
  // Filter out logs older than 2 hours (7,200,000 ms)
  const validLogs = logs.filter(log => now - log.startedAt < AUTOMATION_LOG_MAX_AGE_MS);
  
  if (validLogs.length === 0) {
    return;
  }

  // Find the most recent log entry matching activeBuyerName, fallback to the last log
  const buyerName = await getActiveBuyerName();
  let lastLog = buyerName ? [...validLogs].reverse().find(log => log.buyerName === buyerName) : null;
  if (!lastLog) {
    lastLog = validLogs[validLogs.length - 1];
  }
  
  // Prevent duplicate consecutive messages with identical text within 2.5 seconds
  const lastMsg = lastLog.messages[lastLog.messages.length - 1];
  if (lastMsg && lastMsg.text === text && now - lastMsg.at < 2500) {
    return;
  }

  lastLog.messages.push({ text, at: now });
  currentAutomationLog = lastLog;

  await setLocalValue(STORAGE_KEYS.automationLogs, validLogs);
  updateWidgetStatus(activeAutomationMessage, validLogs);
}

export async function getAutomationLogs(): Promise<AutomationLogEntry[]> {
  const logs = await getLocalValue<AutomationLogEntry[]>(STORAGE_KEYS.automationLogs, []);
  const now = Date.now();
  const validLogs = logs.filter(log => now - log.startedAt < AUTOMATION_LOG_MAX_AGE_MS);
  
  // If logs were cleaned up, write back the filtered list to local storage
  if (validLogs.length !== logs.length) {
    await setLocalValue(STORAGE_KEYS.automationLogs, validLogs);
  }
  return validLogs;
}

interface StateResponse {
  ok?: boolean;
  error?: string;
  authRequired?: boolean;
  signedIn?: boolean;
  userEmail?: string | null;
  queue?: Address[];
  orders?: Address[];
  activeOrder?: Address | null;
  settings?: CpBotSettings;
}

interface UnexpectedCheckoutRecovery {
  order: Address;
  attempt: number;
  retryStarted: boolean;
  autoUseThisAddress: boolean;
  createdAt: number;
}

const UNEXPECTED_CHECKOUT_RETRY_LIMIT = 2;
const UNEXPECTED_CHECKOUT_RECOVERY_MAX_AGE_MS = 5 * 60 * 1000;
const SECOND_UNEXPECTED_CHECKOUT_MESSAGE =
  "Amazon showed the unexpected checkout state again after retrying. CP Bot stopped automation. Please go back to the checkout page and continue manually.";
const PENDING_AUTOFILL_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes to accommodate redirects/errors


function delay(ms: number) {
  if ((window as any).cpBotCancelled) {
    throw new Error("Task canceled by User");
  }
  const finalMs = isSlowNetwork() ? ms * 2 : ms;
  return new Promise<void>((resolve, reject) => {
    window.setTimeout(() => {
      if ((window as any).cpBotCancelled) {
        reject(new Error("Task canceled by User"));
      } else {
        resolve();
      }
    }, finalMs);
  });
}

function isUnexpectedCheckoutRecovery(value: unknown): value is UnexpectedCheckoutRecovery {
  if (!value || typeof value !== "object") {
    return false;
  }

  const recovery = value as Partial<UnexpectedCheckoutRecovery>;
  return Boolean(
    recovery.order &&
      typeof recovery.order === "object" &&
      typeof recovery.attempt === "number" &&
      typeof recovery.retryStarted === "boolean" &&
      typeof recovery.autoUseThisAddress === "boolean" &&
      typeof recovery.createdAt === "number",
  );
}

async function waitForAddressPageReady(timeoutMs = 5000): Promise<boolean> {
  const startedAt = Date.now();
  const limit = isSlowNetwork() ? timeoutMs * 2 : timeoutMs;
  setActiveAutomationMessage("Recovery: Waiting for page DOM to settle...");
  let lastProgressUpdate = 0;
  while (Date.now() - startedAt < limit) {
    if (isAmazonAddressPageReady()) {
      return true;
    }
    const elapsed = Date.now() - startedAt;
    if (elapsed - lastProgressUpdate >= 1500) {
      lastProgressUpdate = elapsed;
      const secs = Math.ceil(elapsed / 1000);
      setActiveAutomationMessage(`Recovery: Checking page state... (${secs}s)`);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }
  return isAmazonAddressPageReady();
}

async function readUnexpectedCheckoutRecovery() {
  const recovery = await getSessionValue<unknown>(STORAGE_KEYS.amazonUnexpectedCheckoutRecovery, null);
  if (!isUnexpectedCheckoutRecovery(recovery)) {
    return null;
  }

  if (Date.now() - recovery.createdAt > UNEXPECTED_CHECKOUT_RECOVERY_MAX_AGE_MS) {
    await clearUnexpectedCheckoutRecovery();
    return null;
  }

  return recovery;
}

async function writeUnexpectedCheckoutRecovery(recovery: UnexpectedCheckoutRecovery) {
  await setSessionValue(STORAGE_KEYS.amazonUnexpectedCheckoutRecovery, recovery);
}

async function clearUnexpectedCheckoutRecovery() {
  await setSessionValue(STORAGE_KEYS.amazonUnexpectedCheckoutRecovery, null);
}

async function cancelOngoingAutomation() {
  (window as any).cpBotCancelled = true;
  await setAutomationInProgress(false);

  const state = await getState().catch(() => null);
  const activeOrder = state?.activeOrder || null;

  setActiveAutomationMessage("Task canceled by User.");

  if (activeOrder) {
    try {
      await sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: activeOrder.orderId,
          event_type: "automation_stopped",
          detail: {
            reason: "Task canceled by User",
            slow_network_detected: isSlowNetwork()
          }
        }
      });
    } catch (err) {
      console.error("Failed to log canceled activity event:", err);
    }
  }

  await clearPendingAutofillInBackground().catch(console.error);
  await clearUnexpectedCheckoutRecovery().catch(console.error);

  await render();
}

async function handleStopAction() {
  await cancelOngoingAutomation();
}

function recoverableWidgetProps(
  state: StateResponse,
  addressOptions: Address[],
  statusMessage: string,
  logs?: AutomationLogEntry[],
  automationInProgress?: boolean
) {
  return {
    mode: "amazon" as const,
    orders: addressOptions,
    activeOrder: state.activeOrder ?? addressOptions[0] ?? null,
    settings: state.settings,
    initialMessage: statusMessage,
    automationLogs: logs,
    automationInProgress,
    onRefresh: () => render(),
    onPasteActive: (order: Address) => pasteOrder(order, state.settings),
    onAddGiftMessage: () => addGiftMessage(state.settings),
    onFindExistingAddress: (order: Address) => findExistingAddressAction(order, state.settings),
    onOpenLabelApp: (order: Address) => openLabelApp(order, state.settings),
    onStop: handleStopAction,
  };
}

async function getState() {
  return sendRuntimeMessage<StateResponse>({ type: "CPBOT_GET_STATE" });
}
async function pasteOrder(order: Address, settings?: CpBotSettings) {
  const sessionId = startNewActionSession();
  (window as any).cpBotCancelled = false;
  await setAutomationInProgress(true);
  await startAutomationLog(order.buyerName || "Unknown Buyer").catch(() => undefined);
  if (isCurrentActionSession(sessionId)) {
    setActiveAutomationMessage("Pasting address... Please wait.");
  }
  void sendRuntimeMessage({ type: "CPBOT_START_PASTE" }).catch(() => undefined);

  try {
    const latestState = await getState();
    const latestSettings = latestState.settings || settings;

    if (latestState.authRequired && !latestState.signedIn) {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage(null);
      }
      await setAutomationInProgress(false);
      return CPBOT_SIGNED_OUT_MESSAGE;
    }

    if (latestSettings?.automationDisabled) {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage(null);
      }
      await setAutomationInProgress(false);
      return CPBOT_AUTOMATION_DISABLED_MESSAGE;
    }

    const challenge = detectSecurityChallenge();
    if (challenge) {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage(null);
      }
      await setAutomationInProgress(false);
      return securityChallengeMessage(challenge);
    }

    const autoUseThisAddress = latestSettings?.autoUseThisAddress ?? false;

    // If we are not on the address selection page, try to navigate there by clicking
    // the Delivering to / Change address elements.
    const currentUrl = window.location.href;
    if (!isAmazonCheckoutPage(currentUrl) || !currentUrl.includes("/address")) {
      const { deliveringTo, changeLink } = findAmazonSpcChangeAddressElements();

      if (!deliveringTo && !changeLink) {
        if (isCurrentActionSession(sessionId)) {
          setActiveAutomationMessage(null);
        }
        await setAutomationInProgress(false);
        return "Could not locate the delivery address Change link — please click it manually.";
      }

      await sendRuntimeMessage({
        type: "CPBOT_SET_PENDING_AUTOFILL",
        payload: {
          order,
          autoUseThisAddress,
          createdAt: Date.now(),
          settings: latestSettings,
        },
      });

      startPendingAutofillPoller();

      // Click "Delivering to" area first (as requested by user)
      if (deliveringTo) {
        debugLog("CP Bot: Clicking 'Delivering to' area...");
        clickElement(deliveringTo);
      }

      // If we also have a distinct "Change" link, try clicking that after a tiny delay
      if (changeLink && changeLink !== deliveringTo) {
        setTimeout(() => {
          debugLog("CP Bot: Clicking 'Change' link fallback...");
          if (changeLink) {
            clickElement(changeLink);
          }
        }, 150);
      }

      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage("Navigating to Amazon address settings... Waiting 5-7 seconds for the form to load.");
      }
      return activeAutomationMessage || "Navigating to Amazon address settings...";
    }

    if (autoUseThisAddress) {
      await writeUnexpectedCheckoutRecovery({
        order,
        attempt: 0,
        retryStarted: false,
        autoUseThisAddress,
        createdAt: Date.now(),
      });
    } else {
      await clearUnexpectedCheckoutRecovery();
    }

    const result = await addOrFillAmazonAddress(order, { autoUseThisAddress });
    const anomalyAfterPaste = detectAmazonCheckoutAnomaly();

    if (!autoUseThisAddress) {
      if (isCurrentActionSession(sessionId)) await clearUnexpectedCheckoutRecovery();
    } else if (
      result.blockedBySecurityChallenge ||
      (result.manualActionRequired && !anomalyAfterPaste) ||
      (!result.submittedAddressForm && !anomalyAfterPaste)
    ) {
      if (isCurrentActionSession(sessionId)) await clearUnexpectedCheckoutRecovery();
    } else if (anomalyAfterPaste) {
      if (isCurrentActionSession(sessionId)) {
        void render(result.message).catch(() => undefined);
      }
    }

    void logAutofillOutcome(order, result, false).catch(console.error);

    if (result.submittedAddressForm) {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage("Address selected and submitted successfully!", sessionId);
        await clearUnexpectedCheckoutRecovery().catch(console.error);
      }
      await clearPendingAutofillInBackground().catch(console.error);
    } else {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage(result.message || null, sessionId);
      }
    }
    await setAutomationInProgress(false, sessionId);
    return result.message || `Filled ${result.filled.length} Amazon field(s).`;
  } catch (err) {
    await setAutomationInProgress(false, sessionId);
    if (err instanceof Error && err.message === "Task canceled by User") {
      throw err;
    }
    if (isCurrentActionSession(sessionId)) {
      setActiveAutomationMessage(null, sessionId);
    }
    throw err;
  }
}
async function findExistingAddressAction(order: Address, settings?: CpBotSettings): Promise<string> {
  const sessionId = startNewActionSession();
  (window as any).cpBotCancelled = false;
  await setAutomationInProgress(true);
  await startAutomationLog(order.buyerName || "Unknown Buyer").catch(() => undefined);
  if (isCurrentActionSession(sessionId)) {
    setActiveAutomationMessage("Finding existing address... Please wait.");
  }
  try {
    const latestState = await getState();
    const latestSettings = latestState.settings || settings;

    if (latestState.authRequired && !latestState.signedIn) {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage(null);
      }
      await setAutomationInProgress(false);
      return CPBOT_SIGNED_OUT_MESSAGE;
    }

    if (latestSettings?.automationDisabled) {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage(null);
      }
      await setAutomationInProgress(false);
      return CPBOT_AUTOMATION_DISABLED_MESSAGE;
    }

    const challenge = detectSecurityChallenge();
    if (challenge) {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage(null);
      }
      await setAutomationInProgress(false);
      return securityChallengeMessage(challenge);
    }

    const autoUseThisAddress = latestSettings?.autoUseThisAddress ?? false;

    // If we are not on the address selection page, try to navigate there by clicking
    // the Delivering to / Change address elements.
    const currentUrl = window.location.href;
    if (!isAmazonCheckoutPage(currentUrl) || !currentUrl.includes("/address")) {
      const { deliveringTo, changeLink } = findAmazonSpcChangeAddressElements();

      if (!deliveringTo && !changeLink) {
        if (isCurrentActionSession(sessionId)) {
          setActiveAutomationMessage(null);
        }
        await setAutomationInProgress(false);
        return "Could not locate the delivery address Change link — please click it manually.";
      }

      await sendRuntimeMessage({
        type: "CPBOT_SET_PENDING_AUTOFILL",
        payload: {
          order,
          autoUseThisAddress,
          createdAt: Date.now(),
          settings: latestSettings,
          findExistingOnly: true,
        },
      });

      startPendingAutofillPoller();

      // Click "Delivering to" area first (as requested by user)
      if (deliveringTo) {
        debugLog("CP Bot: Clicking 'Delivering to' area...");
        clickElement(deliveringTo);
      }

      // If we also have a distinct "Change" link, try clicking that after a tiny delay
      if (changeLink && changeLink !== deliveringTo) {
        setTimeout(() => {
          if (changeLink) {
            clickElement(changeLink);
          }
        }, 150);
      }

      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage("Navigating to Amazon address settings... Waiting 5-7 seconds for the form to load.");
      }
      return activeAutomationMessage || "Navigating to Amazon address settings...";
    }

    if (isCurrentActionSession(sessionId)) {
      setActiveAutomationMessage("Expanding address list and searching for buyer name...");
    }
    const result = await selectExistingAmazonAddressAndDeliver(order);

    if (result.foundExistingAddress === false) {
      await setAutomationInProgress(false);
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage("Address not found in saved list.");
      }
      void sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: order.orderId || null,
          event_type: "address_search_failed",
          detail: { message: result.message || "Address not found in saved list." }
        }
      }).catch(console.error);
      return result.message || "Address not found in saved list.";
    }
    if (result.blockedBySecurityChallenge) {
      await setAutomationInProgress(false);
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage("Security challenge detected.");
      }
      return result.message || "Security challenge detected.";
    }
    if (result.manualActionRequired || !result.submittedAddressForm) {
      await setAutomationInProgress(false);
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage("Manual action required.");
      }
      return result.message || "Manual action required.";
    }
    if (isCurrentActionSession(sessionId)) {
      setActiveAutomationMessage("Address selected and submitted successfully!");
    }
    await clearUnexpectedCheckoutRecovery().catch(console.error);
    await clearPendingAutofillInBackground().catch(console.error);
    void sendRuntimeMessage({
      type: "CPBOT_LOG_ACTIVITY",
      payload: {
        ebay_order_id: order.orderId || null,
        event_type: "address_search_success",
        detail: { message: result.message || "Address selected and submitted successfully!" }
      }
    }).catch(console.error);
    await setAutomationInProgress(false);
    return result.message || "Address selected and submitted successfully!";
  } catch (err: unknown) {
    await setAutomationInProgress(false);
    if (err instanceof Error && err.message === "Task canceled by User") {
      throw err;
    }
    const msg = err instanceof Error ? err.message : "Find existing address failed.";
    if (isCurrentActionSession(sessionId)) {
      setActiveAutomationMessage(msg);
    }
    return msg;
  }
}
async function addGiftMessage(settings?: CpBotSettings) {
  const sessionId = startNewActionSession();
  (window as any).cpBotCancelled = false;
  await setAutomationInProgress(true);
  const latestState = await getState();
  const latestSettings = latestState.settings || settings;

  await startAutomationLog(latestState.activeOrder?.buyerName || "Gift Message Automation").catch(() => undefined);

  if (latestState.authRequired && !latestState.signedIn) {
    if (isCurrentActionSession(sessionId)) {
      setActiveAutomationMessage(null);
    }
    await setAutomationInProgress(false);
    return CPBOT_SIGNED_OUT_MESSAGE;
  }

  if (latestSettings?.automationDisabled) {
    if (isCurrentActionSession(sessionId)) {
      setActiveAutomationMessage(null);
    }
    await setAutomationInProgress(false);
    return CPBOT_AUTOMATION_DISABLED_MESSAGE;
  }

  const challenge = detectSecurityChallenge();
  if (challenge) {
    if (isCurrentActionSession(sessionId)) {
      setActiveAutomationMessage(null);
    }
    await setAutomationInProgress(false);
    void sendRuntimeMessage({
      type: "CPBOT_LOG_ACTIVITY",
      payload: {
        ebay_order_id: latestState.activeOrder?.orderId || null,
        event_type: "captcha_detected",
        detail: { challenge }
      }
    }).catch(console.error);
    return securityChallengeMessage(challenge);
  }

  if (!latestSettings?.giftOptions.enabled) {
    if (isCurrentActionSession(sessionId)) {
      setActiveAutomationMessage(null);
    }
    await setAutomationInProgress(false);
    return "Gift message filling is disabled. Enable it in CP Bot popup settings first.";
  }

  // If we are on the SPC (First checkout) page, click the Add gift options link and wait for navigation.
  if (window.location.href.includes("/spc")) {
    const giftLink = findAmazonAddGiftOptionsLink();
    if (!giftLink) {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage(null);
      }
      await setAutomationInProgress(false);
      return "Could not locate the Add gift options link — please click it manually.";
    }

    await sendRuntimeMessage({
      type: "CPBOT_SET_PENDING_GIFT_MESSAGE",
      payload: {
        message: latestSettings.giftOptions.message,
        from: latestSettings.giftOptions.from,
        orderId: latestState.activeOrder?.orderId || null,
        createdAt: Date.now(),
        settings: latestSettings,
      },
    });

    startPendingAutofillPoller();
    clickElement(giftLink);

    if (isCurrentActionSession(sessionId)) {
      setActiveAutomationMessage("Navigating to Amazon gift settings... Waiting 5 seconds for the form to load.");
    }
    return activeAutomationMessage || "Navigating to Amazon gift settings...";
  }

  try {
    const result = await fillAmazonGiftOptions({
      message: latestSettings.giftOptions.message,
      from: latestSettings.giftOptions.from,
    });

    const orderId = latestState.activeOrder?.orderId || null;

    if (result.submittedAddressForm) {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage("Gift message added successfully!");
      }
      await clearUnexpectedCheckoutRecovery().catch(console.error);
      await clearPendingGiftMessageInBackground().catch(console.error);
      void sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: orderId,
          event_type: "gift_added",
          detail: {
            message: result.message || "Gift message added successfully.",
            slow_network_detected: isSlowNetwork()
          }
        }
      }).catch(console.error);
    } else {
      if (isCurrentActionSession(sessionId)) {
        setActiveAutomationMessage(result.message || null);
      }
      if (result.blockedBySecurityChallenge) {
        void sendRuntimeMessage({
          type: "CPBOT_LOG_ACTIVITY",
          payload: {
            ebay_order_id: orderId,
            event_type: "captcha_detected",
            detail: {
              message: result.message,
              slow_network_detected: isSlowNetwork()
            }
          }
        }).catch(console.error);
      } else if (result.manualActionRequired) {
        void sendRuntimeMessage({
          type: "CPBOT_LOG_ACTIVITY",
          payload: {
            ebay_order_id: orderId,
            event_type: "automation_stopped",
            detail: {
              reason: result.message,
              slow_network_detected: isSlowNetwork()
            }
          }
        }).catch(console.error);
      }
    }

    await setAutomationInProgress(false);
    return result.message || `Filled ${result.filled.length} Amazon gift field(s).`;
  } catch (err: unknown) {
    await setAutomationInProgress(false);
    if (err instanceof Error && err.message === "Task canceled by User") {
      throw err;
    }
    const msg = err instanceof Error ? err.message : "Gift message automation failed.";
    if (isCurrentActionSession(sessionId)) {
      setActiveAutomationMessage(msg);
    }
    return msg;
  }
}


function openLabelApp(order: Address, settings?: CpBotSettings) {
  const baseUrl = settings?.webAppUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const params = new URLSearchParams({
    orderRef: order.orderId,
    itemName: order.itemTitle || "",
    quantity: String(order.qty || 1),
  });
  window.open(`${baseUrl.replace(/\/$/, "")}/?${params.toString()}`, "_blank", "noopener,noreferrer");
}

function detectAmazonShippingRestriction(root: Document = document): boolean {
  const text = (root.body?.innerText || root.body?.textContent || "").replace(/\s+/g, " ").trim();
  return /can't\s+be\s+shipped\s+to\s+the\s+address\s+you\s+selected|cannot\s+be\s+shipped\s+to\s+the\s+address\s+you\s+selected/i.test(text);
}

function uniqueOrders(orders: Address[]) {
  return orders.filter((order, index, all) => all.findIndex((candidate) => candidate.orderId === order.orderId) === index);
}

function addressOptionsFromState(state: StateResponse) {
  const scanOrders = Array.isArray(state.orders) ? state.orders : [];
  const queue = Array.isArray(state.queue) ? state.queue : [];
  const activeOrder = state.activeOrder ? [state.activeOrder] : [];

  return uniqueOrders([...activeOrder, ...queue, ...scanOrders]);
}

function recoveryFromSelectedAddress(state: StateResponse, addressOptions: Address[]) {
  if (!state.settings?.autoUseThisAddress) {
    return null;
  }

  const order = state.activeOrder ?? addressOptions[0] ?? null;
  if (!order) {
    return null;
  }

  return {
    order,
    attempt: 0,
    retryStarted: false,
    autoUseThisAddress: true,
    createdAt: Date.now(),
  } satisfies UnexpectedCheckoutRecovery;
}

async function beginUnexpectedCheckoutRecovery(
  state: StateResponse,
  addressOptions: Address[],
  recovery: UnexpectedCheckoutRecovery,
) {
  if (recovery.attempt >= UNEXPECTED_CHECKOUT_RETRY_LIMIT) {
    setActiveAutomationMessage("Recovery: Retry limit reached. Stopping automation.");
    await clearUnexpectedCheckoutRecovery();
    await setAutomationInProgress(false);
    mountWidget(recoverableWidgetProps(state, addressOptions, SECOND_UNEXPECTED_CHECKOUT_MESSAGE, undefined, false));
    return true;
  }

  await startAutomationLog(recovery.order.buyerName || "Recovery").catch(() => undefined);
  await setAutomationInProgress(true);
  setActiveAutomationMessage("Recovery: Amazon showed unexpected checkout. Going back to verify address...");

  await writeUnexpectedCheckoutRecovery({
    ...recovery,
    attempt: recovery.attempt + 1,
    createdAt: Date.now(),
  });

  mountWidget(
    recoverableWidgetProps(
      state,
      addressOptions,
      "Amazon showed an unexpected checkout state. CP Bot is going back once to verify the copied address.",
      undefined,
      true
    ),
  );

  window.setTimeout(() => {
    if (window.history.length > 1) {
      setActiveAutomationMessage("Recovery: Navigating back to address page...");
      window.history.back();
      return;
    }

    setActiveAutomationMessage("Recovery: No browser history to go back. Stopping.");
    void clearUnexpectedCheckoutRecovery().then(async () => {
      await setAutomationInProgress(false);
      mountWidget(recoverableWidgetProps(state, addressOptions, SECOND_UNEXPECTED_CHECKOUT_MESSAGE, undefined, false));
    });
  }, 300);

  return true;
}

async function selectExistingAddressDuringRecovery(
  state: StateResponse,
  addressOptions: Address[],
  recovery: UnexpectedCheckoutRecovery,
) {
  setActiveAutomationMessage("Recovery: Address found on page. Preparing to select it...");

  await writeUnexpectedCheckoutRecovery({
    ...recovery,
    retryStarted: true,
    createdAt: Date.now(),
  });

  mountWidget(
    recoverableWidgetProps(
      state,
      addressOptions,
      "Copied address was found on Amazon AU. CP Bot is selecting it before continuing.",
      undefined,
      true
    ),
  );

  setActiveAutomationMessage("Recovery: Expanding address list and searching for buyer name...");
  const result = await selectExistingAmazonAddressAndDeliver(recovery.order);

  if (result.foundExistingAddress === false) {
    setActiveAutomationMessage("Recovery: Address not found in expanded list.");
    return false;
  }

  await setAutomationInProgress(false);

  if (result.blockedBySecurityChallenge) {
    setActiveAutomationMessage("Recovery: Security challenge detected. Stopping.");
    await clearUnexpectedCheckoutRecovery();
    mountWidget(
      recoverableWidgetProps(
        state,
        addressOptions,
        result.message || "Security challenge detected. CP Bot stopped automation. Complete this step manually.",
        undefined,
        false
      ),
    );
    return true;
  }

  if (detectAmazonCheckoutAnomaly()) {
    setActiveAutomationMessage("Recovery: Unexpected checkout state detected again. Stopping.");
    await clearUnexpectedCheckoutRecovery();
    mountWidget(recoverableWidgetProps(state, addressOptions, SECOND_UNEXPECTED_CHECKOUT_MESSAGE, undefined, false));
    return true;
  }

  if (result.manualActionRequired || !result.submittedAddressForm) {
    setActiveAutomationMessage("Recovery: Manual action required. Stopping automation.");
    await clearUnexpectedCheckoutRecovery();
    mountWidget(
      recoverableWidgetProps(
        state,
        addressOptions,
        result.message || "Copied address was found, but CP Bot could not continue safely. Please continue manually.",
        undefined,
        false
      ),
    );
    return true;
  }

  setActiveAutomationMessage("Recovery: Address selected and submitted successfully!");
  void logAutofillOutcome(recovery.order, result, true, { successEventOverride: "paste_success_address_search" }).catch(console.error);
  mountWidget(
    recoverableWidgetProps(
      state,
      addressOptions,
      `${result.message || "Copied address was selected and submitted to Amazon AU."} If Amazon shows the unexpected checkout state again, CP Bot will stop.`,
      undefined,
      false
    ),
  );
  return true;
}

async function resumeUnexpectedCheckoutRecovery(
  state: StateResponse,
  addressOptions: Address[],
  recovery: UnexpectedCheckoutRecovery,
) {
  if (recovery.attempt <= 0) {
    return false;
  }

  const automationInProgress = await getSessionValue<boolean>("cpBot.automationInProgress", false);

  if (recovery.retryStarted) {
    setActiveAutomationMessage("Recovery: Retry already used. Checking if Amazon accepted the address...");
    mountWidget(
      recoverableWidgetProps(
        state,
        addressOptions,
        "CP Bot already used its one retry. Checking whether Amazon accepted the address.",
        undefined,
        automationInProgress
      ),
    );

    await waitForAddressPageReady();
    await clearUnexpectedCheckoutRecovery();
    await setAutomationInProgress(false);

    setActiveAutomationMessage("Recovery: Checking for security challenges...");
    const challenge = detectSecurityChallenge();
    if (challenge) {
      setActiveAutomationMessage("Recovery: Security challenge detected.");
      mountWidget(recoverableWidgetProps(state, addressOptions, securityChallengeMessage(challenge), undefined, false));
      return true;
    }

    setActiveAutomationMessage("Recovery: Checking if address is active in summary header...");
    if (amazonPageContainsAddress(recovery.order)) {
      if (hasAddressRadioCards()) {
        setActiveAutomationMessage("Recovery: Address found on page! Selecting address card...");
        const selectedExistingAddress = await selectExistingAddressDuringRecovery(state, addressOptions, recovery);
        if (selectedExistingAddress) {
          return true;
        }
      }

      await clearUnexpectedCheckoutRecovery();
      await setAutomationInProgress(false);
      setActiveAutomationMessage("Recovery: Complete. Copied address is active in Amazon summary header.");
      void logAutofillOutcome(recovery.order, { filled: [], missing: [], submittedAddressForm: true }, true, { successEventOverride: "recovery_success_address_present" }).catch(console.error);
      mountWidget(
        recoverableWidgetProps(
          state,
          addressOptions,
          "Recovery complete. The copied address is active in Amazon AU summary header. Continue manually from here.",
          undefined,
          false
        ),
      );
      return true;
    }

    setActiveAutomationMessage("Recovery: Address not found after retry. Manual action needed.");
    await clearUnexpectedCheckoutRecovery();
    await setAutomationInProgress(false);
    mountWidget(
      recoverableWidgetProps(
        state,
        addressOptions,
        "CP Bot already used its one retry. Please review this Amazon page and continue manually.",
        undefined,
        false
      ),
    );
    return true;
  }

  setActiveAutomationMessage("Recovery: Checking if Amazon already accepted the copied address...");
  mountWidget(
    recoverableWidgetProps(
      state,
      addressOptions,
      "CP Bot is checking whether Amazon already accepted the copied address.",
      undefined,
      automationInProgress
    ),
  );

  await waitForAddressPageReady();

  setActiveAutomationMessage("Recovery: Checking for security challenges...");
  const challenge = detectSecurityChallenge();
  if (challenge) {
    setActiveAutomationMessage("Recovery: Security challenge detected.");
    await clearUnexpectedCheckoutRecovery();
    await setAutomationInProgress(false);
    mountWidget(recoverableWidgetProps(state, addressOptions, securityChallengeMessage(challenge), undefined, false));
    return true;
  }

  const anomalyAfterBack = detectAmazonCheckoutAnomaly();
  if (anomalyAfterBack) {
    setActiveAutomationMessage("Recovery: Unexpected checkout state persists. Attempting recovery...");
    await beginUnexpectedCheckoutRecovery(state, addressOptions, recovery);
    return true;
  }

  setActiveAutomationMessage("Recovery: Checking if address is active in summary header...");
  if (amazonPageContainsAddress(recovery.order)) {
    if (hasAddressRadioCards()) {
      setActiveAutomationMessage("Recovery: Address found on page! Selecting address card...");
      const selectedExistingAddress = await selectExistingAddressDuringRecovery(state, addressOptions, recovery);
      if (selectedExistingAddress) {
        return true;
      }
    }

    setActiveAutomationMessage("Recovery: Complete. Copied address is active in Amazon summary header.");
    await clearUnexpectedCheckoutRecovery();
    await setAutomationInProgress(false);
    void logAutofillOutcome(recovery.order, { filled: [], missing: [], submittedAddressForm: true }, true, { successEventOverride: "recovery_success_address_present" }).catch(console.error);
    mountWidget(
      recoverableWidgetProps(
        state,
        addressOptions,
        "Recovery complete. The copied address is active in Amazon AU summary header. Continue manually from here.",
        undefined,
        false
      ),
    );
    return true;
  }

  setActiveAutomationMessage("Recovery: Address not found in initial scan. Checking saved addresses...");
  await writeUnexpectedCheckoutRecovery({
    ...recovery,
    retryStarted: true,
    createdAt: Date.now(),
  });

  mountWidget(
    recoverableWidgetProps(
      state,
      addressOptions,
      "Copied address was not found after going back. CP Bot is searching for it in saved addresses.",
      undefined,
      true
    ),
  );

  const result = await selectExistingAmazonAddressAndDeliver(recovery.order);

  if (result.foundExistingAddress) {
    void logAutofillOutcome(recovery.order, result, true, { successEventOverride: "paste_success_address_search" }).catch(console.error);

    if (result.blockedBySecurityChallenge) {
      setActiveAutomationMessage("Recovery: Security challenge during retry.");
      await clearUnexpectedCheckoutRecovery();
      await setAutomationInProgress(false);
      mountWidget(
        recoverableWidgetProps(
          state,
          addressOptions,
          result.message || "Security challenge detected. CP Bot stopped automation. Complete this step manually.",
          undefined,
          false
        ),
      );
      return true;
    }

    if (detectAmazonCheckoutAnomaly()) {
      setActiveAutomationMessage("Recovery: Unexpected checkout state after retry. Stopping.");
      await clearUnexpectedCheckoutRecovery();
      await setAutomationInProgress(false);
      mountWidget(recoverableWidgetProps(state, addressOptions, SECOND_UNEXPECTED_CHECKOUT_MESSAGE, undefined, false));
      return true;
    }

    if (result.manualActionRequired || !result.submittedAddressForm) {
      setActiveAutomationMessage("Recovery: Manual action required after retry.");
      await clearUnexpectedCheckoutRecovery();
      await setAutomationInProgress(false);
      mountWidget(
        recoverableWidgetProps(
          state,
          addressOptions,
          result.message || "Copied address was found, but CP Bot could not continue safely. Please continue manually.",
          undefined,
          false
        ),
      );
      return true;
    }

    setActiveAutomationMessage("Recovery: Address selected and submitted successfully!");
    await setAutomationInProgress(false);
    mountWidget(
      recoverableWidgetProps(
        state,
        addressOptions,
        `${result.message || "Copied address was selected and submitted to Amazon AU."} If Amazon shows the unexpected checkout state again, CP Bot will stop.`,
        undefined,
        false
      ),
    );
    return true;
  }

  // Fallback: If not found in saved list, retry by adding/filling the address
  setActiveAutomationMessage("Recovery: Address not found in list. Retrying address add...");
  mountWidget(
    recoverableWidgetProps(
      state,
      addressOptions,
      "Copied address was not found in saved list. CP Bot is retrying the address add once.",
      undefined,
      true
    ),
  );

  setActiveAutomationMessage("Recovery: Filling address form...");
  const fillResult = await addOrFillAmazonAddress(recovery.order, {
    autoUseThisAddress: recovery.autoUseThisAddress,
  });

  void logAutofillOutcome(recovery.order, fillResult, true, { failureEventOverride: "paste_failed_address_search" }).catch(console.error);

  if (fillResult.blockedBySecurityChallenge) {
    setActiveAutomationMessage("Recovery: Security challenge during retry.");
    await clearUnexpectedCheckoutRecovery();
    await setAutomationInProgress(false);
    mountWidget(
      recoverableWidgetProps(
        state,
        addressOptions,
        fillResult.message || "Security challenge detected. CP Bot stopped automation. Complete this step manually.",
        undefined,
        false
      ),
    );
    return true;
  }

  if (detectAmazonCheckoutAnomaly()) {
    setActiveAutomationMessage("Recovery: Unexpected checkout state after retry. Stopping.");
    await clearUnexpectedCheckoutRecovery();
    await setAutomationInProgress(false);
    mountWidget(recoverableWidgetProps(state, addressOptions, SECOND_UNEXPECTED_CHECKOUT_MESSAGE, undefined, false));
    return true;
  }

  if (fillResult.manualActionRequired) {
    setActiveAutomationMessage("Recovery: Manual action required after retry.");
    await clearUnexpectedCheckoutRecovery();
    await setAutomationInProgress(false);
    mountWidget(recoverableWidgetProps(state, addressOptions, fillResult.message || SECOND_UNEXPECTED_CHECKOUT_MESSAGE, undefined, false));
    return true;
  }

  if (fillResult.submittedAddressForm) {
    setActiveAutomationMessage("Recovery: Address retry submitted. Waiting for confirmation...");
    await writeUnexpectedCheckoutRecovery({
      ...recovery,
      retryStarted: true,
      createdAt: Date.now(),
    });
    mountWidget(
      recoverableWidgetProps(
        state,
        addressOptions,
        fillResult.message ||
          "Address retry submitted. If Amazon shows the unexpected checkout state again, CP Bot will stop.",
        undefined,
        true
      ),
    );
    return true;
  }

  setActiveAutomationMessage("Recovery: Retry finished. Review needed.");
  await clearUnexpectedCheckoutRecovery();
  await setAutomationInProgress(false);
  mountWidget(
    recoverableWidgetProps(
      state,
      addressOptions,
      fillResult.message || "Address retry finished. Review Amazon AU before continuing.",
      undefined,
      false
    ),
  );
  return true;
}

async function render(statusMessage?: string) {
  if (isRendering) {
    return;
  }
  isRendering = true;
  try {
    await renderInternal(statusMessage);
  } finally {
    isRendering = false;
  }
}

async function renderInternal(statusMessage?: string) {
  const currentUrl = window.location.href;
  if (isRecoveryInitiated && recoveryInitiatedUrl && currentUrl !== recoveryInitiatedUrl) {
    isRecoveryInitiated = false;
    recoveryInitiatedUrl = null;
  }

  if (isRecoveryRunning || isRecoveryInitiated) {
    return;
  }

  // Restore activeBuyerName and keep activeAutomationMessage in sync with session storage
  await getActiveBuyerName().catch(() => null);
  const savedMsg = await getSessionValue<string | null>("cpBot.activeAutomationMessage", null);
  const savedTime = await getSessionValue<number>("cpBot.activeAutomationMessageSetAt", 0);
  if (savedMsg !== undefined) {
    if (savedMsg && Date.now() - savedTime < 45000) {
      activeAutomationMessage = savedMsg;
      activeAutomationMessageSetAt = savedTime;
    } else {
      activeAutomationMessage = null;
      activeAutomationMessageSetAt = 0;
    }
  }

  // Check defensive timeout: if active automation message has been set for > 45 seconds, clear it
  if (activeAutomationMessage && Date.now() - activeAutomationMessageSetAt > 45000) {
    setActiveAutomationMessage(null);
  }

  if (statusMessage) {
    setActiveAutomationMessage(statusMessage);
  }

  const url = window.location.href;
  const isCheckout = isAmazonCheckoutPage(url);
  const anomalyMessage = detectAmazonCheckoutAnomaly();
  let automationInProgress = await getSessionValue<boolean>("cpBot.automationInProgress", false);

  if (!isCheckout) {
    await clearUnexpectedCheckoutRecovery();
    await setAutomationInProgress(false);
    automationInProgress = false;
  } else {
    // If we successfully advanced past address selection/gift selection to /pay or /spc
    // and there is no anomaly, recovery is complete and must be cleared.
    const isAddressOrGiftPage = url.includes("/address") || url.includes("/gift");
    if (!isAddressOrGiftPage && !anomalyMessage && !automationInProgress) {
      await clearUnexpectedCheckoutRecovery();
      const storedAutofill = await getPendingAutofillFromBackground();
      if (storedAutofill && (Date.now() - storedAutofill.createdAt > PENDING_AUTOFILL_MAX_AGE_MS || url.includes("/pay") || url.includes("/thankyou"))) {
        await clearPendingAutofillInBackground().catch(console.error);
      }
      const storedGift = await getPendingGiftMessageFromBackground();
      if (storedGift && (Date.now() - storedGift.createdAt > PENDING_AUTOFILL_MAX_AGE_MS || url.includes("/pay") || url.includes("/thankyou"))) {
        await clearPendingGiftMessageInBackground().catch(console.error);
      }
    }
  }

  const displayMessage = statusMessage || activeAutomationMessage;

  const state = await getState();
  const invalidated = Boolean(state.error && /context invalidated|reloaded/i.test(state.error));
  const addressOptions = addressOptionsFromState(state);
  const challenge = detectSecurityChallenge();
  const signedOut = Boolean(state.authRequired && !state.signedIn);
  const recovery = isCheckout ? await readUnexpectedCheckoutRecovery() : null;
  const logs = await getAutomationLogs();

  automationDisabled = Boolean(state.settings?.automationDisabled || signedOut);

  if (signedOut) {
    mountWidget({
      mode: "amazon",
      orders: [],
      activeOrder: null,
      settings: state.settings,
      initialMessage: displayMessage || CPBOT_SIGNED_OUT_MESSAGE,
      automationLogs: logs,
      automationInProgress,
      onRefresh: () => render(),
      onStop: handleStopAction,
    });
    return;
  }

  if (state.settings?.automationDisabled) {
    mountWidget({
      mode: "amazon",
      orders: addressOptions,
      activeOrder: state.activeOrder ?? null,
      settings: state.settings,
      initialMessage: displayMessage || CPBOT_AUTOMATION_DISABLED_MESSAGE,
      automationLogs: logs,
      automationInProgress,
      onRefresh: () => render(),
      onOpenLabelApp: (order) => openLabelApp(order, state.settings),
      onStop: handleStopAction,
    });
    return;
  }

  if (detectAmazonShippingRestriction()) {
    await clearUnexpectedCheckoutRecovery();
    mountWidget({
      mode: "amazon",
      orders: addressOptions,
      activeOrder: state.activeOrder ?? null,
      settings: state.settings,
      initialMessage: displayMessage || "Amazon can't deliver this item to the address selected.",
      automationLogs: logs,
      automationInProgress,
      onRefresh: () => render(),
      onOpenLabelApp: (order) => openLabelApp(order, state.settings),
      onStop: handleStopAction,
    });
    return;
  }

  if (challenge) {
    await clearUnexpectedCheckoutRecovery();
    mountWidget({
      mode: "amazon",
      orders: addressOptions,
      activeOrder: state.activeOrder ?? null,
      settings: state.settings,
      initialMessage: displayMessage || securityChallengeMessage(challenge),
      automationLogs: logs,
      automationInProgress,
      onRefresh: () => render(),
      onOpenLabelApp: (order) => openLabelApp(order, state.settings),
      onStop: handleStopAction,
    });
    return;
  }

  if (anomalyMessage) {
    const recoverableError = recovery ?? recoveryFromSelectedAddress(state, addressOptions);
    if (recoverableError) {
      isRecoveryRunning = true;
      try {
        const recoveryStarted = await beginUnexpectedCheckoutRecovery(state, addressOptions, recoverableError);
        if (recoveryStarted) {
          isRecoveryInitiated = true;
          recoveryInitiatedUrl = window.location.href;
          return;
        }
      } finally {
        isRecoveryRunning = false;
      }
    }

    mountWidget({
      mode: "amazon",
      orders: addressOptions,
      activeOrder: state.activeOrder ?? null,
      settings: state.settings,
      initialMessage: displayMessage || anomalyMessage,
      automationLogs: logs,
      automationInProgress,
      onRefresh: () => render(),
      onOpenLabelApp: (order) => openLabelApp(order, state.settings),
      onStop: handleStopAction,
    });
    return;
  }

  if (recovery) {
    isRecoveryRunning = true;
    try {
      const recoveryHandled = await resumeUnexpectedCheckoutRecovery(state, addressOptions, recovery);
      if (recoveryHandled) {
        isRecoveryInitiated = true;
        recoveryInitiatedUrl = window.location.href;
        return;
      }
    } finally {
      isRecoveryRunning = false;
    }
  }

  mountWidget({
    mode: "amazon",
    orders: addressOptions,
    activeOrder: state.activeOrder ?? null,
    settings: state.settings,
    initialMessage: displayMessage || (invalidated ? CPBOT_CONTEXT_INVALIDATED_MESSAGE : undefined),
    automationLogs: logs,
    automationInProgress,
    onRefresh: () => render(),
    onPasteActive: (order) => pasteOrder(order, state.settings),
    onAddGiftMessage: () => addGiftMessage(state.settings),
    onFindExistingAddress: (order) => findExistingAddressAction(order, state.settings),
    onOpenLabelApp: (order) => openLabelApp(order, state.settings),
    onStop: handleStopAction,
  });
}

interface PendingAutofillData {
  order: Address;
  autoUseThisAddress: boolean;
  createdAt: number;
  settings?: CpBotSettings;
  findExistingOnly?: boolean;
}

async function getPendingAutofillFromBackground(): Promise<PendingAutofillData | null> {
  try {
    const res = await sendRuntimeMessage<{ ok?: boolean; data?: PendingAutofillData | null }>({
      type: "CPBOT_GET_PENDING_AUTOFILL",
    });
    return res.data || null;
  } catch (err) {
    console.error("Failed to get pending autofill from background:", err);
    return null;
  }
}

async function clearPendingAutofillInBackground(): Promise<void> {
  try {
    await sendRuntimeMessage({
      type: "CPBOT_CLEAR_PENDING_AUTOFILL",
    });
  } catch (err) {
    console.error("Failed to clear pending autofill in background:", err);
  }
}

let pendingAutofillPoller: number | null = null;
let isResuming = false;

function stopPendingAutofillPoller() {
  if (pendingAutofillPoller) {
    window.clearInterval(pendingAutofillPoller);
    pendingAutofillPoller = null;
  }
}function startPendingAutofillPoller() {
  stopPendingAutofillPoller();
  pendingAutofillPoller = window.setInterval(async () => {
    if (isUnloading) {
      return;
    }

    // 1. Check pending address autofill
    const storedAutofill = await getPendingAutofillFromBackground();
    if (storedAutofill) {
       if (Date.now() - storedAutofill.createdAt > PENDING_AUTOFILL_MAX_AGE_MS) {
        await clearPendingAutofillInBackground();
        stopPendingAutofillPoller();
        return;
      }

      const url = window.location.href;
      const isAddressPage = isAmazonCheckoutPage(url) && url.includes("/address");
      const isReady = isAddressPage && (isAmazonAddressPageReady() || Date.now() - storedAutofill.createdAt > 3000);
      if (isAddressPage && isReady) {
        stopPendingAutofillPoller();
        await checkAndResumePendingAutofill();
        return;
      }
    }

    // 2. Check pending gift message
    const storedGift = await getPendingGiftMessageFromBackground();
    if (storedGift) {
       if (Date.now() - storedGift.createdAt > PENDING_AUTOFILL_MAX_AGE_MS) {
        await clearPendingGiftMessageInBackground();
        stopPendingAutofillPoller();
        return;
      }

      const url = window.location.href;
      const isGiftPage = isAmazonCheckoutPage(url) && url.includes("/gift");
      const isReady = isGiftPage && (isAmazonGiftPageReady() || Date.now() - storedGift.createdAt > 3000);
      if (isGiftPage && isReady) {
        stopPendingAutofillPoller();
        await checkAndResumePendingGiftMessage();
        return;
      }
    }

    // If neither exists, stop the poller
    if (!storedAutofill && !storedGift) {
      stopPendingAutofillPoller();
    }
  }, 400);
}

async function logFailedFulfillment(order: Address) {
  try {
    await sendRuntimeMessage({
      type: "CPBOT_LOG_FULFILLMENT",
      payload: {
        order,
        status: "failed",
        amazonOrderRef: null,
      },
    });
  } catch (err) {
    console.error("Failed to send CPBOT_LOG_FULFILLMENT message:", err);
  }
}

async function checkAndResumePendingAutofill(): Promise<boolean> {
  if (isUnloading) return false;
  if (isResuming) return false;
  isResuming = true;

  try {
    const stored = await getPendingAutofillFromBackground();
    if (!stored) {
      return false;
    }

    // Check if it has expired
    if (Date.now() - stored.createdAt > PENDING_AUTOFILL_MAX_AGE_MS) {
      await clearPendingAutofillInBackground();
      stopPendingAutofillPoller();
      await setAutomationInProgress(false);
      void logFailedFulfillment(stored.order).catch(console.error);

      void sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: stored.order?.orderId || null,
          event_type: "paste_failed",
          detail: {
            error: "Autofill handoff expired.",
            extension_version: chrome.runtime.getManifest().version,
          },
        },
      }).catch(console.error);
      return false;
    }

    const url = window.location.href;

    // If we are on /address page, claim and run paste
    if (isAmazonCheckoutPage(url) && url.includes("/address")) {
      const isReady = isAmazonAddressPageReady() || Date.now() - stored.createdAt > 3000;
      if (isReady) {
        // Claim status message immediately before async work begins
        const initialStatus = stored.findExistingOnly
          ? "Expanding address list and searching for buyer name..."
          : "Pasting address... Please wait.";
        setActiveAutomationMessage(initialStatus);
        void render(initialStatus).catch(() => undefined);

        // Clear storage atomically (claim it)
        await clearPendingAutofillInBackground();
        stopPendingAutofillPoller();
        await setAutomationInProgress(true); // Set true immediately on resume path

        await startAutomationLog(stored.order.buyerName || "Unknown Buyer").catch(() => undefined);

        if (stored.findExistingOnly) {
          try {
            const resultMessage = await findExistingAddressAction(stored.order, stored.settings);
            // Ensure the final success/failure message is persisted before render/navigation
            await setSessionValue("cpBot.activeAutomationMessage", resultMessage);
            await render(resultMessage);
            if (resultMessage.includes("successfully")) {
              await clearUnexpectedCheckoutRecovery().catch(console.error);
              await clearPendingAutofillInBackground().catch(console.error);
              await clearPendingGiftMessageInBackground().catch(console.error);
            }
          } catch (err: unknown) {
            if (err instanceof Error && err.message === "Task canceled by User") {
              return true;
            }
            const msg = err instanceof Error ? err.message : "Find existing address failed.";
            await render(msg);
          }
        } else {
          try {
            const resultMessage = await pasteOrder(stored.order, stored.settings);
            // Ensure the final success/failure message is persisted before render/navigation
            await setSessionValue("cpBot.activeAutomationMessage", resultMessage);
            await render(resultMessage);
            if (resultMessage.includes("successfully")) {
              await clearUnexpectedCheckoutRecovery().catch(console.error);
              await clearPendingAutofillInBackground().catch(console.error);
              await clearPendingGiftMessageInBackground().catch(console.error);
            }
          } catch (err: unknown) {
            if (err instanceof Error && err.message === "Task canceled by User") {
              return true;
            }
            const msg = err instanceof Error ? err.message : "Autofill failed.";
            await render(msg);
            void logFailedFulfillment(stored.order).catch(console.error);
          }
        }
        return true;
      } else {
        // We are on /address but DOM elements are not ready yet.
        // Ensure widget is mounted with status message while we wait for readiness,
        // and keep the poller running.
        if (stored.findExistingOnly) {
          void render("Finding existing address... Please wait.");
        } else {
          void render("Pasting address... Please wait.");
        }
        startPendingAutofillPoller();
        return true;
      }
    } else if (isAmazonCheckoutPage(url) && url.includes("/spc") && !pendingAutofillPoller) {
      // If we are still on /spc but the poller isn't running (e.g. after a page refresh), restart it
      startPendingAutofillPoller();
    }
    return false;
  } finally {
    isResuming = false;
  }
}

interface PendingGiftMessageData {
  message: string;
  from: string;
  orderId: string | null;
  createdAt: number;
  settings?: CpBotSettings;
}

async function getPendingGiftMessageFromBackground(): Promise<PendingGiftMessageData | null> {
  try {
    const res = await sendRuntimeMessage<{ ok?: boolean; data?: PendingGiftMessageData | null }>({
      type: "CPBOT_GET_PENDING_GIFT_MESSAGE",
    });
    return res.data || null;
  } catch (err) {
    console.error("Failed to get pending gift message from background:", err);
    return null;
  }
}

async function clearPendingGiftMessageInBackground(): Promise<void> {
  try {
    await sendRuntimeMessage({
      type: "CPBOT_CLEAR_PENDING_GIFT_MESSAGE",
    });
  } catch (err) {
    console.error("Failed to clear pending gift message in background:", err);
  }
}

async function checkAndResumePendingGiftMessage(): Promise<boolean> {
  if (isUnloading) return false;
  if (isResuming) return false;
  isResuming = true;

  try {
    const stored = await getPendingGiftMessageFromBackground();
    if (!stored) {
      return false;
    }

    // Check if it has expired
    if (Date.now() - stored.createdAt > PENDING_AUTOFILL_MAX_AGE_MS) {
      await clearPendingGiftMessageInBackground();
      stopPendingAutofillPoller();
      await setAutomationInProgress(false);
      return false;
    }

    const url = window.location.href;

    // If we are on /gift page, claim and run gift messaging
    if (isAmazonCheckoutPage(url) && url.includes("/gift")) {
      const isReady = isAmazonGiftPageReady() || Date.now() - stored.createdAt > 3000;
      if (isReady) {
        // Claim status message immediately before async work begins
        setActiveAutomationMessage("Adding gift options... Please wait.");
        void render("Adding gift options... Please wait.").catch(() => undefined);

        // Clear storage atomically (claim it)
        await clearPendingGiftMessageInBackground();
        stopPendingAutofillPoller();
        await setAutomationInProgress(true); // Set true immediately on resume path

        const latestState = await getState();
        const buyerName = latestState.activeOrder?.buyerName || "Gift Message Automation";
        await startAutomationLog(buyerName).catch(() => undefined);

        try {
          const result = await fillAmazonGiftOptions({
            message: stored.message,
            from: stored.from,
          });

          if (result.submittedAddressForm) {
            setActiveAutomationMessage("Gift message added successfully!");
            await setSessionValue("cpBot.activeAutomationMessage", "Gift message added successfully!");
            await render("Gift message added successfully!");
            await clearUnexpectedCheckoutRecovery().catch(console.error);
            await clearPendingGiftMessageInBackground().catch(console.error);
            void sendRuntimeMessage({
              type: "CPBOT_LOG_ACTIVITY",
              payload: {
                ebay_order_id: stored.orderId,
                event_type: "gift_added",
                detail: { message: result.message || "Gift message added successfully." }
              }
            }).catch(console.error);
          } else {
            await render(result.message || "Could not save gift options.");
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.message === "Task canceled by User") {
            return true;
          }
          const msg = err instanceof Error ? err.message : "Gift message automation failed.";
          await render(msg);
        } finally {
          await setAutomationInProgress(false);
        }
        return true;
      } else {
        // We are on /gift but DOM elements are not ready yet.
        // Ensure widget shows the adding status immediately, and keep poller active.
        void render("Adding gift options... Please wait.");
        startPendingAutofillPoller();
        return true;
      }
    } else if (isAmazonCheckoutPage(url) && url.includes("/spc") && !pendingAutofillPoller) {
      // If we are still on /spc but the poller isn't running, restart it
      startPendingAutofillPoller();
    }
    return false;
  } finally {
    isResuming = false;
  }
}

let primePromptTimer: number | null = null;
let primePromptDismissalRunning = false;
let automationDisabled = true;

function schedulePrimePromptDismissal() {
  if (automationDisabled) {
    return;
  }

  const anomalyMessage = detectAmazonCheckoutAnomaly();
  if (anomalyMessage) {
    void render(anomalyMessage).catch(() => undefined);
    return;
  }

  if (detectSecurityChallenge()) {
    return;
  }

  if (primePromptTimer) {
    window.clearTimeout(primePromptTimer);
  }

  primePromptTimer = window.setTimeout(() => {
    if (primePromptDismissalRunning) {
      return;
    }

    primePromptDismissalRunning = true;
    void dismissPrimeExpeditedDeliveryPromptIfPresent(2500)
      .then((result) => {
        if (result.manualActionRequired) {
          void render(result.message).catch(() => undefined);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.message === "Task canceled by User") {
          return;
        }
        console.error("Prime prompt dismissal error:", err);
      })
      .finally(() => {
        primePromptDismissalRunning = false;
      });
  }, 300);
}

const primePromptObserver = new MutationObserver(schedulePrimePromptDismissal);

function onSpaUrlChange() {
  const url = window.location.href;

  if (isRecoveryInitiated && recoveryInitiatedUrl && url !== recoveryInitiatedUrl) {
    isRecoveryInitiated = false;
    recoveryInitiatedUrl = null;
  }

  if (isAmazonCheckoutPage(url)) {
    if (url.includes("/address") || url.includes("/gift")) {
      startPendingAutofillPoller();
    }
    if (url.includes("/address")) {
      void checkAndResumePendingAutofill().then((resumed) => {
        if (!resumed) void render().catch(() => undefined);
      }).catch(console.error);
    } else if (url.includes("/gift")) {
      void checkAndResumePendingGiftMessage().then((resumed) => {
        if (!resumed) void render().catch(() => undefined);
      }).catch(console.error);
    } else {
      void render().catch(() => undefined);
    }
  }
}

const originalPushState = history.pushState;
history.pushState = function (...args) {
  const result = originalPushState.apply(this, args);
  onSpaUrlChange();
  return result;
};

const originalReplaceState = history.replaceState;
history.replaceState = function (...args) {
  const result = originalReplaceState.apply(this, args);
  onSpaUrlChange();
  return result;
};

window.addEventListener("popstate", onSpaUrlChange);
window.addEventListener("hashchange", onSpaUrlChange);

async function handleBoot() {
  debugLog("[CP Bot Diagnostic] handleBoot() invoked at", Date.now(), "URL:", window.location.href);
  const storedAutofill = await getPendingAutofillFromBackground();
  const storedGift = await getPendingGiftMessageFromBackground();
  if (storedAutofill || storedGift) {
    startPendingAutofillPoller();
  }

  const autofillResumed = await checkAndResumePendingAutofill();
  if (autofillResumed) {
    return;
  }
  const giftResumed = await checkAndResumePendingGiftMessage();
  if (giftResumed) {
    return;
  }
  await render();
}

// Bind status updater to the widget state so selectExistingAmazonAddressAndDeliver can update status live
setStatusCallback(setActiveAutomationMessage);
setUnlockButtonsCallback(() => {
  void setAutomationInProgress(false).catch(console.error);
});

void handleBoot()
  .then(() => schedulePrimePromptDismissal())
  .catch(() => undefined);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    isUnloading = false;
    startNewActionSession();
    void handleBoot()
      .then(() => schedulePrimePromptDismissal())
      .catch(() => undefined);
  }
});
primePromptObserver.observe(document.documentElement, { childList: true, subtree: true });
chrome.storage.onChanged.addListener((changes, areaName) => {
  const localChanged =
    areaName === "local" &&
    (changes[STORAGE_KEYS.settings] ||
      changes[STORAGE_KEYS.authState] ||
      changes[CPBOT_SUPABASE_AUTH_STORAGE_KEY] ||
      changes[STORAGE_KEYS.automationLogs]);
  const sessionChanged =
    areaName === "session" &&
    (changes[STORAGE_KEYS.queue] ||
      changes[STORAGE_KEYS.activeOrder] ||
      changes[STORAGE_KEYS.orders] ||
      changes[STORAGE_KEYS.orderScanCache] ||
      changes["cpBot.automationInProgress"] ||
      changes["cpBot.activeAutomationMessage"] ||
      changes[STORAGE_KEYS.automationLogs]);

  if (localChanged || sessionChanged) {
    const oldSettings = changes[STORAGE_KEYS.settings]?.oldValue as Partial<CpBotSettings> | undefined;
    const newSettings = changes[STORAGE_KEYS.settings]?.newValue as Partial<CpBotSettings> | undefined;
    const authState = changes[STORAGE_KEYS.authState]?.newValue as
      | { signedIn?: boolean; userEmail?: string | null }
      | undefined;
    const autoSelectChanged =
      typeof oldSettings?.autoUseThisAddress === "boolean" &&
      typeof newSettings?.autoUseThisAddress === "boolean" &&
      oldSettings.autoUseThisAddress !== newSettings.autoUseThisAddress;
    const addressListChanged =
      changes[STORAGE_KEYS.queue] ||
      changes[STORAGE_KEYS.activeOrder] ||
      changes[STORAGE_KEYS.orders] ||
      changes[STORAGE_KEYS.orderScanCache];

    Promise.all([
      getSessionValue<boolean>("cpBot.automationInProgress", false),
      getSessionValue<string | null>("cpBot.activeAutomationMessage", null)
    ]).then(([automationActive, currentMsg]) => {
      const isSuccessOrProgress = currentMsg && (
        currentMsg.includes("successfully") ||
        isProgressMessage(currentMsg)
      );

      let statusMessage: string | undefined = undefined;
      if (typeof authState?.signedIn === "boolean") {
        statusMessage = authState.signedIn ? undefined : CPBOT_SIGNED_OUT_MESSAGE;
      } else if (autoSelectChanged) {
        if (!automationActive && !isSuccessOrProgress) {
          statusMessage = newSettings.autoUseThisAddress
            ? "Auto Select 'Use this address' is now enabled for this page."
            : "Auto Select 'Use this address' is now off for this page.";
        }
      } else if (addressListChanged) {
        if (!automationActive && !isSuccessOrProgress) {
          statusMessage = "Address list refreshed.";
        }
      }

      void render(statusMessage).catch(() => undefined);
    }).catch(console.error);
  }
});

async function logAutofillOutcome(order: Address, result: FillResult, isRetry: boolean, opts?: { successEventOverride?: string; failureEventOverride?: string }) {
  const anomaly = detectAmazonCheckoutAnomaly();
  const shippingRestriction = detectAmazonShippingRestriction();
  
  let status: "ordered" | "failed" = "ordered";
  if (
    result.blockedBySecurityChallenge ||
    (result.manualActionRequired && !anomaly) ||
    (result.submittedAddressForm === false && result.filled.length === 0) ||
    anomaly ||
    shippingRestriction
  ) {
    status = "failed";
  }

  // Send CPBOT_LOG_FULFILLMENT
  try {
    await sendRuntimeMessage({
      type: "CPBOT_LOG_FULFILLMENT",
      payload: {
        order,
        status,
        amazonOrderRef: null
      }
    });
  } catch (err) {
    console.error("Failed to send CPBOT_LOG_FULFILLMENT message:", err);
  }

  // Send Activity Logs
  try {
    // 1. Address Validation Warnings (log once per order, e.g. if not retry)
    if (!isRetry && order.validationWarnings && order.validationWarnings.length > 0) {
      await sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: order.orderId,
          event_type: "address_validation_warning",
          detail: { warnings: order.validationWarnings }
        }
      });
    }

    // 2. Security Challenge
    if (result.blockedBySecurityChallenge) {
      await sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: order.orderId,
          event_type: "captcha_detected",
          detail: { challenge: detectSecurityChallenge() || "CAPTCHA/2FA Prompt" }
        }
      });
    }

    // 3. Prime Prompt
    if (result.primePromptDetected) {
      await sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: order.orderId,
          event_type: "prime_prompt_detected",
          detail: {
            dismissed: result.primePromptDismissed ?? false,
            message: result.message || (result.primePromptDismissed ? "Prime Prompt Dismissed" : "Prime Prompt Dismissal Failed")
          }
        }
      });
    }

    // 4. Checkout Anomaly / Shipping Restriction
    if (anomaly || shippingRestriction) {
      await sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: order.orderId,
          event_type: "checkout_error",
          detail: {
            error: anomaly || "Shipping restriction",
            message: result.message,
            slow_network_detected: isSlowNetwork()
          }
        }
      });
    }

    // 5. Automation Stopped
    if (result.manualActionRequired && !result.blockedBySecurityChallenge) {
      await sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: order.orderId,
          event_type: "automation_stopped",
          detail: {
            reason: result.message || "Manual action required",
            slow_network_detected: isSlowNetwork()
          }
        }
      });
    }

    // 6. Paste Success / Failure
    if (status === "ordered") {
      await sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: order.orderId,
          event_type: opts?.successEventOverride || "paste_success",
          detail: {
            message: result.message || "Address paste succeeded",
            filled: result.filled,
            isRetry,
            slow_network_detected: isSlowNetwork()
          }
        }
      });
    } else {
      await sendRuntimeMessage({
        type: "CPBOT_LOG_ACTIVITY",
        payload: {
          ebay_order_id: order.orderId,
          event_type: opts?.failureEventOverride || "paste_failed",
          detail: {
            error: result.message || "Address paste failed",
            isRetry,
            slow_network_detected: isSlowNetwork()
          }
        }
      });
    }
  } catch (err) {
    console.error("Failed to send CPBOT_LOG_ACTIVITY message:", err);
  }
}

// Global unhandled rejection listener to swallow Task canceled by User errors
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason instanceof Error && event.reason.message === "Task canceled by User") {
    event.preventDefault();
  }
});
