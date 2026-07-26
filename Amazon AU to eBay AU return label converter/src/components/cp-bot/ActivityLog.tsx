"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRelativeTime } from "@/lib/time";

interface ActivityLogProps {
  userId: string | null;
}

interface DbActivity {
  id: string;
  event_type: string;
  ebay_order_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}

const EVENT_CONFIG: Record<string, { color: string; label: string }> = {
  paste_success: { color: "green", label: "Paste Successful" },
  paste_failed: { color: "red", label: "Paste Failed" },
  paste_success_address_search: { color: "green", label: "Paste Successful - Using Address Search" },
  paste_failed_address_search: { color: "red", label: "Paste Failed - Address Search Failed" },
  address_search_success: { color: "green", label: "Address Search Successful" },
  address_search_failed: { color: "red", label: "Address Search Failed" },
  scan: { color: "blue", label: "eBay Orders Scanned" },
  gift_added: { color: "purple", label: "Gift Message Added" },
  address_validation_warning: { color: "amber", label: "Address Warning" },
  checkout_error: { color: "red", label: "Checkout Error" },
  captcha_detected: { color: "orange", label: "CAPTCHA Detected" },
  prime_prompt_detected: { color: "orange", label: "Prime Prompt Detected" },
  automation_stopped: { color: "red", label: "Automation Stopped" },
};

export function ActivityLog({ userId }: ActivityLogProps) {
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats / Last Refreshed
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("all");

  // Expand state
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (!userId) {
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("cp_bot_activity_log")
        .select("id, event_type, ebay_order_id, detail, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      const standardized = (data || []).map((row) => {
        let detailObj: Record<string, unknown> = {};
        if (typeof row.detail === "object" && row.detail !== null) {
          detailObj = row.detail as Record<string, unknown>;
        } else if (typeof row.detail === "string") {
          try {
            detailObj = JSON.parse(row.detail);
          } catch {
            detailObj = {};
          }
        }
        return {
          ...row,
          detail: detailObj,
        } as DbActivity;
      });

      setActivities(standardized);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      console.error("Failed to fetch activity log:", err);
      setError("Failed to load activity logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchActivities();
  }, [fetchActivities]);

  // Supabase Realtime: auto-refresh when new activity log rows are inserted
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("activity-log-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cp_bot_activity_log" },
        () => {
          void fetchActivities(true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchActivities]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Client-side filtering
  const filteredActivities = activities.filter((act) => {
    // 1. Event Type filter
    if (selectedEventType !== "all" && act.event_type !== selectedEventType) {
      return false;
    }

    // 2. Search query filter (ebay_order_id)
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      if (!act.ebay_order_id?.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });

  const getDotColorClass = (color: string) => {
    switch (color) {
      case "green":
        return "bg-emerald-500 ring-4 ring-emerald-50 border-emerald-400";
      case "red":
        return "bg-rose-500 ring-4 ring-rose-50 border-rose-400";
      case "blue":
        return "bg-blue-500 ring-4 ring-blue-50 border-blue-400";
      case "purple":
        return "bg-purple-500 ring-4 ring-purple-50 border-purple-400";
      case "amber":
        return "bg-amber-500 ring-4 ring-amber-50 border-amber-400";
      case "orange":
        return "bg-orange-500 ring-4 ring-orange-50 border-orange-400";
      default:
        return "bg-slate-500 ring-4 ring-slate-50 border-slate-400";
    }
  };

  const getLabelColorClass = (color: string) => {
    switch (color) {
      case "green":
        return "text-emerald-700 bg-emerald-50 border-emerald-100";
      case "red":
        return "text-rose-700 bg-rose-50 border-rose-100";
      case "blue":
        return "text-blue-700 bg-blue-50 border-blue-100";
      case "purple":
        return "text-purple-700 bg-purple-50 border-purple-100";
      case "amber":
        return "text-amber-700 bg-amber-50 border-amber-100";
      case "orange":
        return "text-orange-700 bg-orange-50 border-orange-100";
      default:
        return "text-slate-700 bg-slate-50 border-slate-100";
    }
  };

  const formatLastRefreshed = () => {
    if (!lastRefreshed) return "";
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(lastRefreshed);
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm font-semibold text-slate-500">
        Loading CP Bot activity log...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm font-bold text-rose-500">
        {error}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-panel backdrop-blur-md">
      {/* Header and Refresh */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">
            Automation Activity Log
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Real-time log of CP Bot automation events. Use this to debug failed pastes or checkout issues.
          </p>
        </div>
        <button
          onClick={() => void fetchActivities(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">
          No activity recorded yet — CP Bot will log events here as you use it.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Filter Bar & Refreshed Timestamp */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Event Type Filter */}
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="block w-48 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              >
                <option value="all">All Events</option>
                {Object.entries(EVENT_CONFIG).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.label}
                  </option>
                ))}
              </select>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search eBay order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-9 pr-3 text-xs font-bold text-slate-700 placeholder-slate-400 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
            </div>

            {/* Last Refreshed timestamp */}
            {lastRefreshed && (
              <div className="text-[10px] font-bold text-slate-400">
                Last Refreshed: {formatLastRefreshed()}
              </div>
            )}
          </div>

          {/* Timeline list */}
          {filteredActivities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
              No matching activity records.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
              {filteredActivities.map((act) => {
                const config = EVENT_CONFIG[act.event_type] || {
                  color: "grey",
                  label: act.event_type.replace(/_/g, " "),
                };
                const hasDetail =
                  act.detail &&
                  typeof act.detail === "object" &&
                  Object.keys(act.detail).length > 0;
                const isExpanded = !!expandedIds[act.id];

                return (
                  <div key={act.id} className="relative group">
                    {/* Circle marker dot positioned on the timeline line */}
                    <span
                      className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border border-white shadow-sm transition-all group-hover:scale-110 ${getDotColorClass(
                        config.color
                      )}`}
                    />

                    <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
                      {/* Label + Monospace eBay Order ID */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getLabelColorClass(
                            config.color
                          )}`}
                        >
                          <Activity className="h-3 w-3 shrink-0" />
                          {config.label}
                        </span>

                        {act.ebay_order_id && (
                          <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {act.ebay_order_id}
                          </span>
                        )}
                      </div>

                      {/* Relative Time Timestamp */}
                      <span className="text-[10px] font-bold text-slate-400 md:text-right shrink-0">
                        {getRelativeTime(new Date(act.created_at))}
                      </span>
                    </div>

                    {/* Collapsible Detail JSON */}
                    {hasDetail && (
                      <div className="mt-2.5">
                        <button
                          onClick={() => toggleExpand(act.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3" /> Hide event details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" /> View event details
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-1.5">
                            <pre className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-lg overflow-x-auto text-slate-600 font-mono leading-relaxed shadow-inner max-w-full">
                              {JSON.stringify(act.detail, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
