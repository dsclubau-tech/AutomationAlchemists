import React, { useState, useRef, useCallback } from "react";
import type { Address } from "../types/Address";

interface OrderCardProps {
  order: Address;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onCopy: () => void;
  onCopyToCloud?: () => Promise<{ ok: boolean; error?: string }>;
}

export function OrderCard({ order, selected, onSelect, onCopy, onCopyToCloud }: OrderCardProps) {
  console.log("CP Bot OrderCard render: orderId =", order.orderId, "phone =", order.phone);
  const [cloudStatus, setCloudStatus] = useState<"idle" | "copying" | "success" | "error">("idle");
  const [cloudError, setCloudError] = useState<string | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyToCloud = useCallback(async () => {
    if (!onCopyToCloud || cloudStatus === "copying") return;

    setCloudStatus("copying");
    setCloudError(null);

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    try {
      const result = await onCopyToCloud();
      if (result.ok) {
        setCloudStatus("success");
      } else {
        setCloudStatus("error");
        setCloudError(result.error || "Cloud copy failed.");
      }
    } catch {
      setCloudStatus("error");
      setCloudError("Cloud copy failed.");
    }

    clearTimerRef.current = setTimeout(() => {
      setCloudStatus("idle");
      setCloudError(null);
      clearTimerRef.current = null;
    }, 4000);
  }, [onCopyToCloud, cloudStatus]);

  return (
    <article className="cp-card">
      <div className="cp-reference">
        <strong>{order.orderId}</strong>
        {order.itemTitle ? <small>{order.itemTitle}</small> : null}
      </div>
      <div className="cp-card-top">
        <label className="cp-check">
          <input
            checked={selected}
            type="checkbox"
            onChange={(event) => onSelect(event.currentTarget.checked)}
          />
          <span>{order.buyerName}</span>
        </label>
        <span className="cp-pill">Qty {order.qty || 1}</span>
      </div>
      <p className="cp-address">
        {order.street1}
        {order.street2 ? (
          <>
            <br />
            {order.street2}
          </>
        ) : null}
        <br />
        {order.suburb} {order.state} {order.postcode}
      </p>
      {order.phone ? <p className="cp-muted">Phone: {order.phone}</p> : null}
      {order.validationWarnings && order.validationWarnings.length > 0 ? (
        <div className="cp-warning-panel">
          <ul>
            {order.validationWarnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="cp-actions">
        <button type="button" className="cp-button cp-primary" onClick={onCopy}>
          Copy
        </button>
        {onCopyToCloud ? (
          <button
            type="button"
            className="cp-button cp-cloud-copy"
            disabled={cloudStatus === "copying"}
            onClick={handleCopyToCloud}
          >
            {cloudStatus === "copying" ? "Copying…" : "Copy to Cloud"}
          </button>
        ) : null}
      </div>
      {cloudStatus === "success" ? (
        <p className="cp-cloud-confirmation">
          Copied to cloud — available for 5 minutes on your other devices.
        </p>
      ) : null}
      {cloudStatus === "error" && cloudError ? (
        <p className="cp-cloud-error">{cloudError}</p>
      ) : null}
    </article>
  );
}
