"use client";

import { useState } from "react";
import { XCircle, X } from "lucide-react";

/** Label map: maps event_type keys to human-readable names. */
const FAILED_TYPE_LABELS: Record<string, string> = {
  paste_failed: "Paste Failed",
  checkout_error: "Checkout Error",
  automation_stopped: "Automation Stopped",
  address_validation_warning: "Address Validation Warning",
  captcha_detected: "CAPTCHA Detected",
  prime_prompt_detected: "Prime Prompt Detected",
  fulfillment_failed: "Fulfillment Failed",
};

function labelFor(key: string): string {
  return FAILED_TYPE_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Dot color for each type. */
function dotColor(key: string): string {
  switch (key) {
    case "paste_failed":
      return "bg-rose-500";
    case "checkout_error":
      return "bg-red-600";
    case "automation_stopped":
      return "bg-orange-500";
    case "address_validation_warning":
      return "bg-amber-500";
    case "captcha_detected":
      return "bg-yellow-500";
    case "prime_prompt_detected":
      return "bg-purple-500";
    case "fulfillment_failed":
      return "bg-rose-700";
    default:
      return "bg-slate-400";
  }
}

interface FailedStatsCardProps {
  totalFailed: number;
  /** Breakdown of failed types: { event_type: count } */
  breakdown: Record<string, number>;
  authEnabled: boolean;
}

export function FailedStatsCard({ totalFailed, breakdown, authEnabled }: FailedStatsCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sortedEntries = Object.entries(breakdown)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  if (!authEnabled) {
    return (
      <div className="rounded-2xl border border-slate-200/80 border-t-4 border-t-rose-500 bg-white/70 p-5 shadow-sm backdrop-blur-md transition hover-lift">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Failed</span>
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600">
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-extrabold text-slate-800">—</div>
        <p className="mt-1 text-[10px] font-bold text-slate-400">Auth not configured</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-t-4 border-t-rose-500 p-5 shadow-sm backdrop-blur-md transition-all duration-300 ${
        isOpen
          ? "border-rose-300 bg-rose-50/60"
          : "border-slate-200/80 bg-white/70 cursor-pointer hover:bg-rose-50/40 hover:border-rose-200 hover:shadow-md"
      }`}
      onClick={!isOpen ? () => setIsOpen(true) : undefined}
      role={!isOpen ? "button" : undefined}
      tabIndex={!isOpen ? 0 : undefined}
      onKeyDown={!isOpen ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen(true); } } : undefined}
    >
      {/* Header — always visible */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Failed</span>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600">
          <XCircle className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-800">{totalFailed}</div>
      <div className="flex items-end justify-between mt-1">
        <p className="text-[10px] font-bold text-slate-400">
          {isOpen ? "Breakdown by type" : "Failed attempts"}
        </p>
        {!isOpen && (
          <span className="text-[10px] font-extrabold text-rose-500 transition-colors leading-none">
            Show more details
          </span>
        )}
      </div>

      {/* Expanded breakdown */}
      {isOpen && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="border-t border-rose-200 pt-3">
            {sortedEntries.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No failed attempts recorded.</p>
            ) : (
              <ul className="space-y-2">
                {sortedEntries.map(([eventType, count]) => (
                  <li key={eventType} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${dotColor(eventType)}`} />
                      <span className="text-xs font-semibold text-slate-600">{labelFor(eventType)}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 hover:border-rose-300 active:scale-[0.98]"
          >
            <X className="h-3 w-3" />
            Close
          </button>
        </div>
      )}
    </div>
  );
}
