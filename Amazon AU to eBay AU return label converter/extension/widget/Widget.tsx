import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { isExtensionContextReady, sendRuntimeMessage } from "../lib/storage";
import { OrderCard } from "./OrderCard";
import type { Address, CpBotSettings } from "../types/Address";

interface AutomationLogEntry {
  buyerName: string;
  startedAt: number;
  messages: { text: string; at: number }[];
}

interface WidgetProps {
  mode: "ebay" | "amazon";
  orders?: Address[];
  activeOrder?: Address | null;
  settings?: CpBotSettings;
  refreshMode?: "scan" | "refresh";
  refreshCooldownSeconds?: number;
  onRefresh?: () => void | Promise<unknown>;
  onCopyOrder?: (order: Address) => Promise<string>;
  onQueueOrders?: (orders: Address[]) => Promise<string>;
  onPasteActive?: (order: Address) => Promise<string>;
  onAddGiftMessage?: () => Promise<string>;
  onFindExistingAddress?: (order: Address) => Promise<string>;
  onOpenLabelApp?: (order: Address) => void;
  onStop?: () => void | Promise<unknown>;
  initialMessage?: string;
  automationLogs?: AutomationLogEntry[];
  automationInProgress?: boolean;
}

let widgetRoot: Root | null = null;
let widgetHost: HTMLDivElement | null = null;
const WIDGET_POSITION_KEY = "cpBot.widgetPosition";
const VIEWPORT_MARGIN = 16;
const EXPANDED_WIDTH = 340;
const MINIMIZED_WIDTH = 76;
const MINIMIZED_HEIGHT = 190;

type WidgetPosition = { x: number; y: number };
type DragState = {
  mode: "expanded" | "minimized";
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  moved: boolean;
};

function clampPosition(position: WidgetPosition, width: number, height: number): WidgetPosition {
  if (typeof window === "undefined") {
    return position;
  }

  const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
  const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);

  return {
    x: Math.min(Math.max(VIEWPORT_MARGIN, position.x), maxX),
    y: Math.min(Math.max(VIEWPORT_MARGIN, position.y), maxY),
  };
}

function isStoredPosition(value: unknown): value is WidgetPosition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const position = value as Record<string, unknown>;
  return typeof position.x === "number" && typeof position.y === "number";
}

function samePosition(a: WidgetPosition, b: WidgetPosition) {
  return Math.round(a.x) === Math.round(b.x) && Math.round(a.y) === Math.round(b.y);
}

function expandedDefaultPosition() {
  if (typeof window === "undefined") {
    return { x: 24, y: 104 };
  }

  return clampPosition(
    {
      x: Math.max(VIEWPORT_MARGIN, window.innerWidth - EXPANDED_WIDTH - 24),
      y: Math.max(VIEWPORT_MARGIN, window.innerHeight - 560),
    },
    EXPANDED_WIDTH,
    Math.min(560, window.innerHeight - VIEWPORT_MARGIN * 2),
  );
}

function minimizedDefaultPosition() {
  if (typeof window === "undefined") {
    return { x: 24, y: 104 };
  }

  return clampPosition(
    {
      x: window.innerWidth - MINIMIZED_WIDTH - VIEWPORT_MARGIN,
      y: (window.innerHeight - MINIMIZED_HEIGHT) / 2,
    },
    MINIMIZED_WIDTH,
    MINIMIZED_HEIGHT,
  );
}

function truncate(value: string, length = 42) {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

function epochAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

interface CloudClipboardEntry {
  ebay_order_id: string;
  address: Address;
  created_at: string;
  expires_at: string;
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M20 12a8 8 0 1 1-2.35-5.65L20 8.7M20 4v4.7h-4.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SmallRefreshIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 24 24" width="12">
      <path
        d="M20 12a8 8 0 1 1-2.35-5.65L20 8.7M20 4v4.7h-4.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M6 12h12" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}

function Widget(props: WidgetProps) {
  const {
    mode,
    orders = [],
    activeOrder = null,
    settings,
    refreshMode = mode === "ebay" ? "scan" : "refresh",
    refreshCooldownSeconds,
    onRefresh,
    onCopyOrder,
    onQueueOrders,
    onPasteActive,
    onAddGiftMessage,
    onFindExistingAddress,
    onOpenLabelApp,
    onStop,
    initialMessage,
    automationLogs = [],
    automationInProgress = false,
  } = props;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedAmazonOrderId, setSelectedAmazonOrderId] = useState(activeOrder?.orderId || "");
  const [message, setMessage] = useState("Ready");
  const [logsOpen, setLogsOpen] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<{
    status: "success" | "fail";
    text: string;
    extra: string | null;
  } | null>(null);
  const [position, setPosition] = useState(expandedDefaultPosition);
  const [minimizedPosition, setMinimizedPosition] = useState(minimizedDefaultPosition);
  const [minimized, setMinimized] = useState(!automationInProgress);
  const [rescanCooldown, setRescanCooldown] = useState(0);
  const [prevCooldown, setPrevCooldown] = useState(0);
  const [cloudClipboard, setCloudClipboard] = useState<CloudClipboardEntry[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const minimizedButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressMinimizedClickRef = useRef(false);

  // Sync initialMessage prop → internal message state (React-recommended pattern for deriving state from props)
  const [prevInitialMessage, setPrevInitialMessage] = useState(initialMessage);
  if (initialMessage !== prevInitialMessage) {
    setPrevInitialMessage(initialMessage);
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }

  const [prevActiveOrder, setPrevActiveOrder] = useState(activeOrder);
  if (activeOrder?.orderId !== prevActiveOrder?.orderId) {
    setPrevActiveOrder(activeOrder);
    if (activeOrder?.orderId) {
      setSelectedAmazonOrderId(activeOrder.orderId);
    }
  }

  async function fetchCloudClipboard() {
    if (!isExtensionContextReady()) return;
    setCloudLoading(true);
    try {
      const result = await sendRuntimeMessage<{ ok: boolean; data?: CloudClipboardEntry[]; error?: string }>({
        type: "CPBOT_GET_CLOUD_CLIPBOARD",
      });
      if (result.ok && result.data) {
        setCloudClipboard(result.data);
      }
    } catch {
      // Silently ignore fetch failures — cloud clipboard is best-effort
    } finally {
      setCloudLoading(false);
    }
  }

  useEffect(() => {
    if (!isExtensionContextReady()) return;
    void sendRuntimeMessage<{ ok: boolean; data?: CloudClipboardEntry[] }>({
      type: "CPBOT_GET_CLOUD_CLIPBOARD",
    })
      .then((result) => {
        if (result.ok && result.data) {
          setCloudClipboard(result.data);
        }
      })
      .catch(() => undefined);
  }, []);

  async function handleCopyToCloud(order: Address): Promise<{ ok: boolean; error?: string }> {
    if (!isExtensionContextReady()) {
      return { ok: false, error: "Extension context not ready." };
    }
    // Perform local copy first
    if (onCopyOrder) {
      await runAction(() => onCopyOrder(order));
    }
    // Then cloud copy
    const result = await sendRuntimeMessage<{ ok: boolean; error?: string }>({
      type: "CPBOT_COPY_ORDER_TO_CLOUD",
      order,
    });
    if (result.ok) {
      void fetchCloudClipboard();
    }
    return result;
  }

  async function handleLoadFromCloud(entry: CloudClipboardEntry) {
    await runAction(async () => {
      const result = await sendRuntimeMessage<{ ok: boolean; order?: Address; error?: string }>({
        type: "CPBOT_COPY_ORDER",
        order: entry.address,
      });
      if (!result.ok) {
        throw new Error(result.error || "Failed to load cloud address.");
      }
      return `Loaded ${entry.ebay_order_id} from cloud clipboard.`;
    });
  }

  useEffect(() => {
    if (!isExtensionContextReady()) {
      return;
    }

    void chrome.storage.local
      .get(WIDGET_POSITION_KEY)
      .then((result) => {
        const storedExpanded = result[WIDGET_POSITION_KEY];

        if (isStoredPosition(storedExpanded)) {
          setPosition(storedExpanded);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!widgetHost) {
      return;
    }

    if (minimized) {
      const clamped = clampPosition(minimizedPosition, MINIMIZED_WIDTH, MINIMIZED_HEIGHT);
      widgetHost.style.left = "0";
      widgetHost.style.top = "0";
      widgetHost.style.right = "auto";
      widgetHost.style.bottom = "auto";
      widgetHost.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
      return;
    }

    const rect = shellRef.current?.getBoundingClientRect();
    const clamped = clampPosition(position, rect?.width || EXPANDED_WIDTH, rect?.height || 560);
    if (!samePosition(clamped, position)) {
      setPosition(clamped);
    }
    widgetHost.style.left = "0";
    widgetHost.style.top = "0";
    widgetHost.style.right = "auto";
    widgetHost.style.bottom = "auto";
    widgetHost.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
  }, [minimized, minimizedPosition, position]);

  useEffect(() => {
    if (rescanCooldown <= 0) {
      if (prevCooldown > 0 && mode === "ebay") {
        setMessage("Press Scan to scan the first 5 order detail links.");
      }
      setPrevCooldown(0);
      return;
    }

    setPrevCooldown(rescanCooldown);

    const timer = window.setInterval(() => {
      setRescanCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [rescanCooldown, prevCooldown, mode]);

  useEffect(() => {
    if (automationInProgress) {
      setMinimized(false);
    }
  }, [automationInProgress]);

  useEffect(() => {
    function clampOnResize() {
      setPosition((current) => {
        const rect = shellRef.current?.getBoundingClientRect();
        return clampPosition(current, rect?.width || EXPANDED_WIDTH, rect?.height || 560);
      });
      setMinimizedPosition(minimizedDefaultPosition());
    }

    window.addEventListener("resize", clampOnResize);
    return () => window.removeEventListener("resize", clampOnResize);
  }, []);

  useEffect(() => {
    const target = minimized ? null : shellRef.current;

    if (!target || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width || EXPANDED_WIDTH;
      const height = entry?.contentRect.height || 560;

      setPosition((current) => {
        const next = clampPosition(current, width, height);
        return samePosition(next, current) ? current : next;
      });
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, [minimized]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.has(order.orderId)),
    [orders, selectedIds],
  );
  const amazonOrders = useMemo(() => {
    const merged = [...orders];
    if (activeOrder && !merged.some((order) => order.orderId === activeOrder.orderId)) {
      merged.unshift(activeOrder);
    }

    return merged.filter(
      (order, index, all) => all.findIndex((candidate) => candidate.orderId === order.orderId) === index,
    );
  }, [activeOrder, orders]);
  const selectedAmazonOrder =
    amazonOrders.find((order) => order.orderId === selectedAmazonOrderId) ||
    amazonOrders.find((order) => order.orderId === activeOrder?.orderId) ||
    amazonOrders[0] ||
    null;

  useEffect(() => {
    if (!selectedAmazonOrderId || !isExtensionContextReady()) return;
    const matchedOrder = amazonOrders.find((order) => order.orderId === selectedAmazonOrderId);
    if (matchedOrder) {
      void sendRuntimeMessage({
        type: "CPBOT_SET_ACTIVE_ORDER",
        payload: matchedOrder,
      }).catch(() => undefined);
    }
  }, [selectedAmazonOrderId, amazonOrders]);

  const statusMessage = message;
  const automationDisabled = Boolean(settings?.automationDisabled);
  const actionCooldownSeconds = refreshCooldownSeconds ?? (refreshMode === "scan" ? 60 : 0);

  function setSelected(order: Address, selected: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(order.orderId);
      } else {
        next.delete(order.orderId);
      }
      return next;
    });
  }

  async function runAction(action: () => Promise<string>) {
    try {
      setMessage(await action());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    }
  }

  function beginDrag(mode: DragState["mode"], event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }

    if (mode === "expanded" && event.pointerType === "mouse") {
      event.preventDefault();
    }

    const current = mode === "expanded" ? position : minimizedPosition;
    const rect =
      mode === "expanded"
        ? shellRef.current?.getBoundingClientRect()
        : minimizedButtonRef.current?.getBoundingClientRect();
    const clamped = clampPosition(
      current,
      rect?.width || (mode === "expanded" ? EXPANDED_WIDTH : MINIMIZED_WIDTH),
      rect?.height || (mode === "expanded" ? 560 : MINIMIZED_HEIGHT),
    );

    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      originX: clamped.x,
      originY: clamped.y,
      currentX: clamped.x,
      currentY: clamped.y,
      moved: false,
    };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail if the browser has already canceled the pointer.
    }
  }

  function moveDrag(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }

    const rect =
      drag.mode === "expanded"
        ? shellRef.current?.getBoundingClientRect()
        : minimizedButtonRef.current?.getBoundingClientRect();
    const next = clampPosition(
      {
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY,
      },
      rect?.width || (drag.mode === "expanded" ? EXPANDED_WIDTH : MINIMIZED_WIDTH),
      rect?.height || (drag.mode === "expanded" ? 560 : MINIMIZED_HEIGHT),
    );

    drag.currentX = next.x;
    drag.currentY = next.y;
    drag.moved = drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5;

    if (drag.mode === "expanded") {
      setPosition(next);
    } else {
      setMinimizedPosition(next);
    }
  }

  function endDrag(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }

    const finalPosition = { x: drag.currentX, y: drag.currentY };

    if (drag.mode === "minimized" && drag.moved) {
      suppressMinimizedClickRef.current = true;
      window.setTimeout(() => {
        suppressMinimizedClickRef.current = false;
      }, 0);
    }

    if (drag.mode === "expanded" && isExtensionContextReady()) {
      void chrome.storage.local.set({ [WIDGET_POSITION_KEY]: finalPosition }).catch(() => undefined);
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Capture may already be released by the browser.
    }

    dragRef.current = null;
  }

  function maximizeWidget() {
    setPosition((current) => {
      const rect = shellRef.current?.getBoundingClientRect();
      return clampPosition(current || expandedDefaultPosition(), rect?.width || EXPANDED_WIDTH, rect?.height || 560);
    });
    setMinimized(false);
  }

  function handleMinimizedClick() {
    if (suppressMinimizedClickRef.current) {
      return;
    }

    maximizeWidget();
  }

  function runScan(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!onRefresh || rescanCooldown > 0) {
      return;
    }

    setMessage("Scanning first 5 order detail page(s)...");
    if (actionCooldownSeconds > 0) {
      setRescanCooldown(actionCooldownSeconds);
    }
    onRefresh();
  }

  async function runRefresh(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!onRefresh || rescanCooldown > 0) {
      return;
    }

    if (actionCooldownSeconds > 0) {
      setRescanCooldown(actionCooldownSeconds);
    }

    try {
      const refreshResult = onRefresh();
      if (refreshResult instanceof Promise) {
        await refreshResult;
      }

      // Check state to confirm context and login status
      const state = await sendRuntimeMessage<{ ok?: boolean; authRequired?: boolean; signedIn?: boolean }>({ type: "CPBOT_GET_STATE" });
      if (state.authRequired && !state.signedIn) {
        throw new Error("You are signed out. Please sign in to CP Bot popup first.");
      }

      setRefreshStatus({
        status: "success",
        text: "Refresh Done!",
        extra: null,
      });

      window.setTimeout(() => {
        setRefreshStatus(null);
      }, 5000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      let extra = "Please refresh this page to reconnect.";
      if (errorMsg.includes("signed out") || errorMsg.includes("login") || errorMsg.includes("sign in")) {
        extra = "Please sign in from the CP Bot popup first.";
      } else if (
        errorMsg.includes("context invalidated") ||
        errorMsg.includes("reloaded") ||
        errorMsg.includes("Extension context invalidated")
      ) {
        extra = "CP Bot extension was reloaded. Please refresh this page to reconnect.";
      }

      setRefreshStatus({
        status: "fail",
        text: "Refresh Failed!",
        extra: `CP Bot extension was reloaded or signed out. ${extra}`,
      });

      window.setTimeout(() => {
        setRefreshStatus(null);
      }, 30000);
    }
  }

  async function handleStopAutomation() {
    if (onStop) {
      await onStop();
    }
  }

  if (minimized) {
    return (
      <button
        ref={minimizedButtonRef}
        type="button"
        className={`cp-minimized${automationDisabled ? " cp-minimized-disabled" : ""}`}
        onClick={handleMinimizedClick}
        onPointerCancel={endDrag}
        onPointerDown={(event) => beginDrag("minimized", event)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        title={automationDisabled ? "CP Bot automation is disabled" : "Open CP Bot"}
      >
        <span className="cp-minimized-dot" />
        <span className="cp-minimized-label">
          <strong>CP Bot</strong>
          <small>{mode === "ebay" ? "eBay AU" : "Amazon AU"}</small>
        </span>
        <em>{mode === "amazon" ? amazonOrders.length : orders.length}</em>
      </button>
    );
  }

  return (
    <div ref={shellRef} className="cp-shell">
      <div
        className="cp-titlebar"
        onPointerCancel={endDrag}
        onPointerDown={(event) => beginDrag("expanded", event)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
      >
        <div>
          <strong>CP Bot</strong>
          <span>{mode === "ebay" ? "eBay AU orders" : "Amazon AU address"}</span>
        </div>
        <div className="cp-title-actions">
          <button
            type="button"
            className="cp-stop-button"
            onClick={handleStopAutomation}
            onPointerDown={(event) => event.stopPropagation()}
            title="Stop CP Bot automation"
          >
            <StopIcon />
          </button>
          {refreshMode === "scan" ? (
            <button
              type="button"
              className="cp-rescan-button"
              disabled={!onRefresh || rescanCooldown > 0}
              onClick={runScan}
              onPointerDown={(event) => event.stopPropagation()}
              title={rescanCooldown > 0 ? `Scan available in ${rescanCooldown} seconds` : "Scan order details"}
            >
              {rescanCooldown > 0 ? `Scan ${rescanCooldown}s` : "Scan"}
            </button>
          ) : (
            <button
              type="button"
              className="cp-refresh-button"
              disabled={!onRefresh || rescanCooldown > 0}
              onClick={runRefresh}
              onPointerDown={(event) => event.stopPropagation()}
              title={
                rescanCooldown > 0
                  ? `Refresh available in ${rescanCooldown} seconds`
                  : mode === "ebay"
                    ? "Refresh this order details page"
                    : "Refresh copied addresses"
              }
            >
              <RefreshIcon />
            </button>
          )}
          <button
            type="button"
            className="cp-minimize-button"
            onClick={() => {
              if (automationInProgress) {
                // Ignore single click to minimize when automation is active
                return;
              }
              setMinimizedPosition(minimizedDefaultPosition());
              setMinimized(true);
            }}
            onDoubleClick={() => {
              // Force minimize on double-click regardless of automation status
              setMinimizedPosition(minimizedDefaultPosition());
              setMinimized(true);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            title={automationInProgress ? "Double click to force minimize CP Bot" : "Minimize CP Bot"}
          >
            <MinimizeIcon />
          </button>
        </div>
      </div>

      <div className="cp-body">
        {mode === "ebay" ? (
          <>
            <div className="cp-summary">
              <span>{orders.length} AU order address{orders.length === 1 ? "" : "es"}</span>
              <span>{selectedOrders.length} selected</span>
            </div>
            <div className="cp-bulk">
              <button
                type="button"
                className="cp-button cp-primary"
                disabled={selectedOrders.length === 0}
                onClick={() =>
                  onQueueOrders &&
                  void runAction(() => onQueueOrders(selectedOrders.length ? selectedOrders : orders))
                }
              >
                Fast copy selected
              </button>
              <button
                type="button"
                className="cp-button"
                disabled={orders.length === 0}
                onClick={() => {
                  const allIds = orders.map((order) => order.orderId);
                  setSelectedIds(new Set(allIds));
                }}
              >
                Select all
              </button>
            </div>
            <div className="cp-list">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    selected={selectedIds.has(order.orderId)}
                    onSelect={(selected) => setSelected(order, selected)}
                    onCopy={() => onCopyOrder && void runAction(() => onCopyOrder(order))}
                    onCopyToCloud={() => handleCopyToCloud(order)}
                  />
                ))
              ) : (
                <p className="cp-empty">
                  No AU order addresses detected yet. On All Orders, use Scan to scan the first 5 order detail links.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="cp-amazon">
            {selectedAmazonOrder ? (
              <>
                <div className="cp-summary">
                  <span>{amazonOrders.length} copied address{amazonOrders.length === 1 ? "" : "es"}</span>
                  <span>1 selected</span>
                </div>
                <div className="cp-amazon-list">
                  {amazonOrders.map((order) => {
                    const selected = selectedAmazonOrder.orderId === order.orderId;
                    console.log("CP Bot Widget render: orderId =", order.orderId, "phone =", order.phone);
                    return (
                      <label
                        className={`cp-address-option${selected ? " cp-address-option-active" : ""}`}
                        key={order.orderId}
                      >
                        <input
                          checked={selected}
                          name="cp-amazon-address"
                          type="radio"
                          onChange={() => setSelectedAmazonOrderId(order.orderId)}
                        />
                        <span className="cp-address-option-body">
                          <span className="cp-option-reference">
                            <strong>{order.orderId}</strong>
                            {order.itemTitle ? <small>{truncate(order.itemTitle, 72)}</small> : null}
                          </span>
                          <span className="cp-buyer-name">{order.buyerName}</span>
                          <small className="cp-option-address">
                            {order.street1}
                            {order.street2 ? (
                              <>
                                <br />
                                {order.street2}
                              </>
                            ) : null}
                            <br />
                            {order.suburb} {order.postcode}
                            {order.phone ? (
                              <>
                                <br />
                                Phone: {order.phone}
                              </>
                            ) : null}
                          </small>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {selectedAmazonOrder.validationWarnings && selectedAmazonOrder.validationWarnings.length > 0 ? (
                  <div className="cp-warning-panel">
                    <ul>
                      {selectedAmazonOrder.validationWarnings.map((warn, idx) => (
                        <li key={idx}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {(() => {
                  const hasWarnings = selectedAmazonOrder.validationWarnings && selectedAmazonOrder.validationWarnings.length > 0;
                  const isPOBox = selectedAmazonOrder.isPOBox;
                  let pasteButtonClass = "cp-button cp-primary cp-wide";
                  let pasteButtonLabel = "Add/Paste Amazon address";
                  let pasteButtonDisabled = !onPasteActive || automationInProgress;

                  if (isPOBox) {
                    pasteButtonDisabled = true;
                    pasteButtonLabel = "Cannot paste — PO Box";
                    pasteButtonClass += " cp-paste-disabled";
                  } else if (hasWarnings) {
                    pasteButtonClass += " cp-paste-amber";
                  } else {
                    pasteButtonClass += " cp-paste-green";
                  }

                  return (
                    <button
                      type="button"
                      className={pasteButtonClass}
                      disabled={pasteButtonDisabled}
                      onClick={() => onPasteActive && void runAction(() => onPasteActive(selectedAmazonOrder))}
                    >
                      {pasteButtonLabel}
                    </button>
                  );
                })()}
              <button
                type="button"
                className="cp-button cp-wide"
                disabled={!onAddGiftMessage || !settings?.giftOptions.enabled || automationInProgress}
                onClick={() => onAddGiftMessage && void runAction(() => onAddGiftMessage())}
              >
                Add Gift Message
              </button>
              <button
                type="button"
                className="cp-button cp-wide"
                style={{ marginTop: "6px" }}
                disabled={!onFindExistingAddress || !selectedAmazonOrder || automationInProgress}
                onClick={() => onFindExistingAddress && selectedAmazonOrder && void runAction(() => onFindExistingAddress(selectedAmazonOrder))}
              >
                Find existing address
              </button>
                <button type="button" className="cp-link" onClick={() => onOpenLabelApp?.(selectedAmazonOrder)}>
                  Open return label app with this eBay ref
                </button>
              </>
            ) : (
              <p className="cp-empty">Copy an eBay AU order first, then return to Amazon AU to paste.</p>
            )}
            {settings?.autoUseThisAddress ? (
              <p className="cp-muted">Auto Select &apos;Use this address&apos; is enabled.</p>
            ) : (
              <p className="cp-muted">Auto Select &apos;Use this address&apos; is off.</p>
            )}
            {settings?.giftOptions.enabled ? (
              <p className="cp-muted">Gift message filling is enabled.</p>
            ) : (
              <p className="cp-muted">Gift message filling is off.</p>
            )}
          </div>
        )}
        {cloudClipboard.length > 0 ? (
          <details className="cp-cloud-section" open>
            <summary className="cp-cloud-summary">
              <span>Cloud Clipboard ({cloudClipboard.length})</span>
              <button
                type="button"
                className="cp-cloud-refresh"
                disabled={cloudLoading}
                onClick={(e) => { e.preventDefault(); void fetchCloudClipboard(); }}
                title="Refresh cloud clipboard"
              >
                <SmallRefreshIcon />
              </button>
            </summary>
            <div className="cp-cloud-list">
              {cloudClipboard.map((entry) => (
                <div className="cp-cloud-entry" key={entry.ebay_order_id}>
                  <div className="cp-cloud-entry-header">
                    <code className="cp-cloud-order-id">{entry.ebay_order_id}</code>
                    <small className="cp-cloud-time">Copied {timeAgo(entry.created_at)}</small>
                  </div>
                  <span className="cp-cloud-buyer">{(entry.address as Address).buyerName}</span>
                  <button
                    type="button"
                    className="cp-button cp-cloud-load"
                    onClick={() => void handleLoadFromCloud(entry)}
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      <div className="cp-status">
        {refreshStatus ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ color: refreshStatus.status === "success" ? "#16a34a" : "#dc2626", fontWeight: "bold" }}>
              {refreshStatus.text}
            </span>
            {refreshStatus.extra ? <small style={{ color: "#dc2626", fontSize: "11px", display: "block", marginTop: "2px" }}>{refreshStatus.extra}</small> : null}
          </div>
        ) : (
          statusMessage
        )}
      </div>

      {mode === "amazon" ? (
        <div className="cp-logs-section">
          <button
            type="button"
            className={`cp-logs-toggle ${logsOpen ? "cp-logs-toggle-active" : ""}`}
            onClick={() => setLogsOpen(!logsOpen)}
          >
            <span className="cp-logs-toggle-icon">📋</span>
            <span>Automation Logs</span>
            <span className={`cp-logs-chevron ${logsOpen ? "cp-logs-chevron-open" : ""}`}>‹</span>
          </button>

          {logsOpen ? (() => {
            const now = Date.now();
            const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
            const activeLogs = [...automationLogs]
              .filter((log) => now - log.startedAt < TWO_HOURS_MS)
              .sort((a, b) => b.startedAt - a.startedAt);

            return (
              <div className="cp-logs-panel">
                <div className="cp-logs-panel-header">
                  <span>Recent Automation Runs</span>
                  <span className="cp-logs-badge">{activeLogs.length}</span>
                </div>
                <div className="cp-logs-panel-body">
                  {activeLogs.length === 0 ? (
                    <p className="cp-logs-empty">No automation runs in the last 2 hours.</p>
                  ) : (
                    activeLogs.map((log, idx) => (
                      <div className="cp-log-entry" key={`${log.startedAt}-${idx}`}>
                        <div className="cp-log-entry-header">
                          <span className="cp-log-buyer">{log.buyerName}</span>
                          <span className="cp-log-time">{epochAgo(log.startedAt)}</span>
                        </div>
                        <div className="cp-log-steps">
                          {log.messages.map((msg, mIdx) => (
                            <div className="cp-log-step" key={`${msg.at}-${mIdx}`}>
                              <span className="cp-log-dot" />
                              <span className="cp-log-step-text">{msg.text}</span>
                              <span className="cp-log-step-time">{epochAgo(msg.at)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })() : null}
        </div>
      ) : null}
    </div>
  );
}

const styles = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .cp-shell {
    width: 340px;
    max-height: calc(100vh - 32px);
    overflow: visible;
    border: 1px solid #dbe5f4;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 22px 60px rgba(15, 23, 42, 0.20);
    color: #172033;
    display: flex;
    flex-direction: column;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
  }
  .cp-titlebar {
    cursor: move;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    background: linear-gradient(135deg, #1d4ed8, #0f766e);
    color: #ffffff;
    user-select: none;
    border-radius: 13px 13px 0 0;
  }
  .cp-titlebar strong { display: block; font-size: 15px; line-height: 1.1; }
  .cp-titlebar span { display: block; margin-top: 2px; color: rgba(255,255,255,.78); font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .cp-title-actions {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .cp-rescan-button {
    min-width: 74px;
    height: 30px;
    border: 1px solid rgba(255,255,255,.35);
    border-radius: 8px;
    background: rgba(255,255,255,.14);
    color: #fff;
    font-size: 11px;
    font-weight: 900;
    cursor: pointer;
    padding: 0 9px;
    white-space: nowrap;
  }
  .cp-rescan-button:disabled {
    cursor: not-allowed;
    opacity: .62;
  }
  .cp-refresh-button {
    width: 34px;
    height: 30px;
    border: 1px solid rgba(255,255,255,.35);
    border-radius: 8px;
    background: rgba(255,255,255,.14);
    color: #fff;
    cursor: pointer;
    display: inline-grid;
    place-items: center;
  }
  .cp-refresh-button:hover { background: rgba(255,255,255,.22); }
  .cp-refresh-button:disabled {
    cursor: not-allowed;
    opacity: .62;
  }
  .cp-stop-button {
    width: 30px;
    height: 30px;
    border: 1px solid rgba(239, 68, 68, 0.45);
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    cursor: pointer;
    display: inline-grid;
    place-items: center;
  }
  .cp-stop-button:hover { background: rgba(239, 68, 68, 0.35); }
  .cp-minimize-button {
    width: 30px;
    height: 30px;
    border: 1px solid rgba(255,255,255,.35);
    border-radius: 8px;
    background: rgba(255,255,255,.14);
    color: #fff;
    cursor: pointer;
    display: inline-grid;
    place-items: center;
  }
  .cp-minimize-button:hover { background: rgba(255,255,255,.22); }
  .cp-minimized {
    align-items: center;
    border: 1px solid #bfdbfe;
    border-radius: 18px;
    background: linear-gradient(135deg, #1d4ed8, #0f766e);
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.24);
    color: #ffffff;
    cursor: grab;
    display: flex;
    flex-direction: column;
    height: 190px;
    justify-content: center;
    max-height: 190px;
    max-width: 76px;
    min-height: 190px;
    min-width: 76px;
    overflow: hidden;
    padding: 12px 8px;
    position: relative;
    width: 76px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    touch-action: none;
    user-select: none;
  }
  .cp-minimized:active { cursor: grabbing; }
  .cp-minimized:hover { filter: brightness(1.05); }
  .cp-minimized-disabled {
    border-color: #fecaca;
    background: linear-gradient(135deg, #991b1b, #b91c1c);
  }
  .cp-minimized-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #86efac;
    box-shadow: 0 0 0 4px rgba(134,239,172,.18);
    flex: 0 0 auto;
    left: 50%;
    position: absolute;
    top: 13px;
    transform: translateX(-50%);
  }
  .cp-minimized-disabled .cp-minimized-dot {
    background: #f87171;
    box-shadow: 0 0 0 4px rgba(248,113,113,.22);
  }
  .cp-minimized-label {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
    left: 50%;
    line-height: 1.05;
    position: absolute;
    text-align: center;
    text-shadow: 0 1px 2px rgba(15, 23, 42, .45);
    top: 50%;
    transform: translate(-50%, -50%) rotate(-90deg);
    width: 136px;
  }
  .cp-minimized strong {
    display: block;
    font-size: 18px;
    font-weight: 950;
    letter-spacing: 0;
    white-space: nowrap;
  }
  .cp-minimized small {
    display: block;
    margin-top: 0;
    max-width: 136px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: rgba(255,255,255,.90);
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0;
  }
  .cp-minimized em {
    align-items: center;
    background: rgba(255,255,255,.16);
    border: 1px solid rgba(255,255,255,.28);
    border-radius: 999px;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 11px;
    font-style: normal;
    font-weight: 950;
    height: 26px;
    justify-content: center;
    left: 50%;
    min-width: 26px;
    padding: 4px 7px;
    position: absolute;
    bottom: 12px;
    transform: translateX(-50%);
    width: 26px;
  }
  .cp-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    padding: 12px;
    background: #f8fafc;
  }
  .cp-summary, .cp-bulk, .cp-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .cp-summary { margin-bottom: 10px; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; }
  .cp-bulk { margin-bottom: 10px; }
  .cp-list { display: grid; gap: 10px; }
  .cp-card, .cp-active {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    padding: 11px;
  }
  .cp-reference {
    border: 1px solid #dbeafe;
    border-radius: 9px;
    background: #eff6ff;
    margin-bottom: 10px;
    padding: 8px 9px;
  }
  .cp-reference strong {
    display: block;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.2;
  }
  .cp-reference small {
    display: block;
    margin-top: 4px;
    color: #475569;
    font-size: 11px;
    font-weight: 750;
    line-height: 1.35;
  }
  .cp-card-top { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
  .cp-check { display: flex; gap: 8px; align-items: flex-start; color: #172033; font-size: 13px; font-weight: 800; line-height: 1.25; }
  .cp-check input { margin-top: 2px; }
  .cp-pill { border-radius: 999px; background: #dcfce7; color: #166534; padding: 3px 7px; font-size: 10px; font-weight: 900; white-space: nowrap; }
  .cp-address { margin: 8px 0 5px; color: #334155; line-height: 1.35; }
  .cp-muted { margin: 0; color: #64748b; font-size: 11px; line-height: 1.35; }
  .cp-actions { margin-top: 10px; justify-content: flex-start; }
  .cp-button {
    border: 1px solid #d4deee;
    border-radius: 9px;
    background: #ffffff;
    color: #1e293b;
    cursor: pointer;
    font-size: 12px;
    font-weight: 850;
    min-height: 34px;
    padding: 0 11px;
  }
  .cp-button:hover { background: #f1f5f9; }
  .cp-button:disabled { cursor: not-allowed; opacity: .48; }
  .cp-primary { border-color: #2563eb; background: #2563eb; color: #ffffff; }
  .cp-primary:hover { background: #1d4ed8; }
  .cp-warning-panel {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 8px 12px;
    margin-top: 8px;
    color: #92400e;
    max-height: 80px;
    overflow-y: auto;
    font-size: 11px;
    font-weight: 600;
    text-align: left;
  }
  .cp-warning-panel ul {
    margin: 0;
    padding-left: 16px;
  }
  .cp-warning-panel li {
    margin-bottom: 4px;
  }
  .cp-warning-panel li:last-child {
    margin-bottom: 0;
  }
  .cp-paste-green { border-color: #16a34a !important; background: #16a34a !important; color: #ffffff !important; }
  .cp-paste-green:hover { background: #15803d !important; }
  .cp-paste-amber { border-color: #d97706 !important; background: #d97706 !important; color: #ffffff !important; }
  .cp-paste-amber:hover { background: #b45309 !important; }
  .cp-paste-disabled { opacity: 0.48 !important; cursor: not-allowed !important; background: #cbd5e1 !important; border-color: #cbd5e1 !important; color: #64748b !important; }
  .cp-wide { width: 100%; margin-top: 9px; }
  .cp-amazon { display: grid; gap: 8px; }
  .cp-amazon-list { display: grid; gap: 8px; }
  .cp-address-option {
    align-items: flex-start;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    cursor: pointer;
    display: flex;
    gap: 9px;
    padding: 10px;
  }
  .cp-address-option:hover { border-color: #bfdbfe; background: #f8fbff; }
  .cp-address-option-active { border-color: #2563eb; background: #eff6ff; }
  .cp-address-option input { margin-top: 3px; }
  .cp-address-option-body { display: block; min-width: 0; width: 100%; }
  .cp-option-reference {
    border: 1px solid #dbeafe;
    border-radius: 8px;
    background: #eff6ff;
    display: block;
    margin-bottom: 8px;
    padding: 7px 8px;
  }
  .cp-option-reference strong {
    color: #1d4ed8;
    display: block;
    font-size: 11px;
    font-weight: 900;
    line-height: 1.2;
  }
  .cp-option-reference small {
    color: #475569;
    display: block;
    font-size: 10px;
    font-weight: 800;
    line-height: 1.3;
    margin-top: 4px;
  }
  .cp-buyer-name {
    color: #172033;
    display: block;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.25;
  }
  .cp-option-address {
    color: #64748b;
    display: block;
    font-size: 12px;
    line-height: 1.35;
    margin-top: 4px;
  }
  .cp-active span { color: #64748b; display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; }
  .cp-active strong { display: block; margin-top: 4px; font-size: 15px; }
  .cp-active small { display: block; margin-top: 5px; color: #64748b; font-size: 12px; }
  .cp-link {
    border: 0;
    background: transparent;
    color: #2563eb;
    cursor: pointer;
    font-size: 12px;
    font-weight: 850;
    padding: 4px 2px;
    text-align: left;
  }
  .cp-empty {
    border: 1px dashed #cbd5e1;
    border-radius: 10px;
    margin: 0;
    padding: 14px;
    color: #64748b;
    line-height: 1.45;
    background: #ffffff;
  }
  .cp-status {
    border-top: 1px solid #e2e8f0;
    flex: 0 0 auto;
    padding: 9px 12px;
    background: #ffffff;
    color: #475569;
    font-size: 11px;
    font-weight: 800;
  }
  .cp-cloud-copy {
    border-color: #7c3aed;
    background: #7c3aed;
    color: #ffffff;
  }
  .cp-cloud-copy:hover { background: #6d28d9; }
  .cp-cloud-copy:disabled { opacity: .55; cursor: wait; }
  .cp-cloud-confirmation {
    margin: 6px 0 0;
    color: #059669;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.35;
  }
  .cp-cloud-error {
    margin: 6px 0 0;
    color: #dc2626;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.35;
  }
  .cp-cloud-section {
    border-top: 1px solid #e2e8f0;
    margin-top: 12px;
    padding-top: 10px;
  }
  .cp-cloud-summary {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: #7c3aed;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    list-style: none;
    user-select: none;
  }
  .cp-cloud-summary::-webkit-details-marker { display: none; }
  .cp-cloud-summary::marker { content: ''; }
  .cp-cloud-summary span { display: flex; align-items: center; gap: 4px; }
  .cp-cloud-summary span::before {
    content: '▸';
    display: inline-block;
    transition: transform 0.15s ease;
  }
  details[open] > .cp-cloud-summary span::before {
    transform: rotate(90deg);
  }
  .cp-cloud-refresh {
    width: 24px;
    height: 24px;
    border: 1px solid #ddd6fe;
    border-radius: 6px;
    background: #f5f3ff;
    color: #7c3aed;
    cursor: pointer;
    display: inline-grid;
    place-items: center;
    padding: 0;
  }
  .cp-cloud-refresh:hover { background: #ede9fe; }
  .cp-cloud-refresh:disabled { opacity: .5; cursor: wait; }
  .cp-cloud-list {
    display: grid;
    gap: 8px;
    margin-top: 8px;
  }
  .cp-cloud-entry {
    border: 1px solid #ddd6fe;
    border-radius: 9px;
    background: #faf5ff;
    padding: 9px 10px;
    display: grid;
    gap: 4px;
  }
  .cp-cloud-entry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .cp-cloud-order-id {
    color: #7c3aed;
    font-size: 11px;
    font-weight: 900;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  .cp-cloud-time {
    color: #8b5cf6;
    font-size: 10px;
    font-weight: 700;
  }
  .cp-cloud-buyer {
    color: #172033;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.25;
  }
  .cp-cloud-load {
    margin-top: 4px;
    border-color: #7c3aed;
    background: #7c3aed;
    color: #ffffff;
    font-size: 11px;
    min-height: 30px;
  }
  .cp-cloud-load:hover { background: #6d28d9; }

  /* ── Automation Message Logs ── */
  .cp-logs-section {
    position: relative;
  }
  .cp-logs-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border: none;
    border-top: 1px solid #e8edf5;
    background: linear-gradient(135deg, #f0f4f8 0%, #e8ecf2 100%);
    color: #475569;
    font-size: 11.5px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    border-radius: 0 0 14px 14px;
  }
  .cp-logs-toggle:hover {
    background: linear-gradient(135deg, #e2e8f0 0%, #dbe1ea 100%);
    color: #1e293b;
  }
  .cp-logs-toggle-active {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #e2e8f0;
    border-top-color: #334155;
  }
  .cp-logs-toggle-active:hover {
    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
    color: #f1f5f9;
  }
  .cp-logs-toggle-icon {
    font-size: 13px;
    line-height: 1;
  }
  .cp-logs-chevron {
    margin-left: auto;
    font-size: 14px;
    font-weight: 700;
    transition: transform 0.25s ease;
  }
  .cp-logs-chevron-open {
    transform: rotate(-90deg);
  }

  /* Panel extends LEFT from the widget */
  .cp-logs-panel {
    position: absolute;
    right: 100%;
    bottom: 0;
    width: 320px;
    max-height: 420px;
    margin-right: 8px;
    border-radius: 14px;
    background: linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    border: 1px solid rgba(99, 102, 241, 0.25);
    box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(99, 102, 241, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: cp-logs-slide-in 0.25s ease-out;
    color: #e2e8f0;
    font-family: inherit;
    font-size: 12px;
  }
  @keyframes cp-logs-slide-in {
    from { opacity: 0; transform: translateX(12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .cp-logs-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
    font-weight: 700;
    font-size: 12px;
    color: #c7d2fe;
    letter-spacing: 0.3px;
  }
  .cp-logs-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: #fff;
    font-size: 10.5px;
    font-weight: 700;
  }
  .cp-logs-panel-body {
    overflow-y: auto;
    padding: 8px 10px 12px;
    flex: 1;
  }
  .cp-logs-panel-body::-webkit-scrollbar { width: 4px; }
  .cp-logs-panel-body::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 2px;
  }
  .cp-logs-empty {
    color: #64748b;
    text-align: center;
    padding: 20px 0;
    font-style: italic;
    font-size: 11.5px;
    margin: 0;
  }
  .cp-log-entry {
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 10px;
    background: rgba(30, 41, 59, 0.6);
    padding: 10px 12px;
    margin-bottom: 8px;
  }
  .cp-log-entry:last-child { margin-bottom: 0; }
  .cp-log-entry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .cp-log-buyer {
    font-weight: 700;
    font-size: 12px;
    color: #a5b4fc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 190px;
  }
  .cp-log-time {
    font-size: 10px;
    color: #64748b;
    flex-shrink: 0;
    margin-left: 8px;
  }
  .cp-log-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-left: 6px;
    border-left: 2px solid rgba(99, 102, 241, 0.2);
  }
  .cp-log-step {
    display: grid;
    grid-template-columns: 8px 1fr auto;
    gap: 8px;
    align-items: start;
    padding: 3px 0;
    min-height: 20px;
  }
  .cp-log-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6366f1;
    margin-top: 4px;
    margin-left: -4px;
    flex-shrink: 0;
  }
  .cp-log-step-text {
    color: #cbd5e1;
    font-size: 11px;
    line-height: 1.35;
    word-break: break-word;
  }
  .cp-log-step-time {
    color: #475569;
    font-size: 9.5px;
    white-space: nowrap;
    margin-top: 1px;
  }
`;

let lastWidgetProps: WidgetProps | null = null;

export function mountWidget(props: WidgetProps) {
  lastWidgetProps = props;
  widgetHost = document.getElementById("cp-bot-shadow-host") as HTMLDivElement | null;

  if (!widgetHost) {
    widgetHost = document.createElement("div");
    widgetHost.id = "cp-bot-shadow-host";
    widgetHost.style.position = "fixed";
    widgetHost.style.left = "0";
    widgetHost.style.top = "0";
    widgetHost.style.zIndex = "2147483647";
    document.documentElement.appendChild(widgetHost);
  }

  const shadow = widgetHost.shadowRoot || widgetHost.attachShadow({ mode: "open" });
  let mount = shadow.getElementById("cp-bot-root");

  if (!mount) {
    const style = document.createElement("style");
    style.textContent = styles;
    mount = document.createElement("div");
    mount.id = "cp-bot-root";
    shadow.append(style, mount);
  }

  if (!widgetRoot) {
    widgetRoot = createRoot(mount);
  }

  widgetRoot.render(<Widget {...props} />);
}

/**
 * Immediately re-render the widget with an updated status message.
 * Used by setActiveAutomationMessage to push live step updates
 * without needing the full props or a render() cycle.
 */
export function updateWidgetStatus(message: string | null, logs?: AutomationLogEntry[]) {
  if (!lastWidgetProps) return;
  mountWidget({
    ...lastWidgetProps,
    initialMessage: message || undefined,
    automationLogs: logs || lastWidgetProps.automationLogs,
  });
}
