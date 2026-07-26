"use client";

import { useEffect, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatAEST } from "@/lib/time";

interface ValidationLogProps {
  userId: string | null;
}

interface DbFulfillment {
  id: string;
  ebay_order_id: string;
  buyer_name: string;
  postcode: string;
  validation_warnings: string[];
  created_at: string;
}

export function ValidationLog({ userId }: ValidationLogProps) {
  const [logs, setLogs] = useState<DbFulfillment[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedWarning, setSelectedWarning] = useState("all");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchLogs = async () => {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("cp_bot_fulfillments")
          .select("id, ebay_order_id, buyer_name, postcode, validation_warnings, created_at")
          .eq("user_id", userId)
          .not("validation_warnings", "is", null)
          .neq("validation_warnings", "[]")
          .order("created_at", { ascending: false })
          .limit(50);

        if (fetchError) {
          throw fetchError;
        }

        // Standardize structure
        const parsed = (data || []).map((row) => {
          let warnings: string[] = [];
          if (Array.isArray(row.validation_warnings)) {
            warnings = row.validation_warnings as string[];
          } else if (typeof row.validation_warnings === "string") {
            try {
              warnings = JSON.parse(row.validation_warnings);
            } catch {
              warnings = [];
            }
          }
          return {
            ...row,
            validation_warnings: warnings,
          } as DbFulfillment;
        });

        setLogs(parsed);
      } catch (err) {
        console.error("Failed to fetch address validation warnings:", err);
        setError("Failed to load validation warnings.");
      } finally {
        setLoading(false);
      }
    };

    void fetchLogs();
  }, [userId]);

  // Extract unique warnings for filter dropdown
  const uniqueWarnings = Array.from(
    new Set(logs.flatMap((log) => log.validation_warnings || []))
  ).sort();

  // Helper to truncate text to 40 characters
  const truncate = (str: string, maxLen = 40) => {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen) + "...";
  };

  // Client-side filtering
  const filteredLogs = logs.filter((log) => {
    // 1. Warning type filter
    if (selectedWarning !== "all" && !log.validation_warnings.includes(selectedWarning)) {
      return false;
    }

    // 2. Search query filter (ebay_order_id or buyer_name)
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      const matchOrderId = log.ebay_order_id?.toLowerCase().includes(q);
      const matchBuyerName = log.buyer_name?.toLowerCase().includes(q);
      if (!matchOrderId && !matchBuyerName) {
        return false;
      }
    }

    return true;
  });

  // Calculate live stats
  const totalOrdersWithWarnings = filteredLogs.length;
  const totalWarningsLogged = filteredLogs.reduce(
    (acc, log) => acc + (log.validation_warnings?.length || 0),
    0
  );

  if (loading) {
    return (
      <div className="py-8 text-center text-sm font-semibold text-slate-500">
        Loading address validation logs...
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
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-800">
          Address Validation Warnings
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          Orders where CP Bot detected address issues before pasting. Review these to spot recurring problems.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">
          No validation warnings recorded yet.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Filters and Stats Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Dropdown */}
              <div className="relative">
                <select
                  value={selectedWarning}
                  onChange={(e) => setSelectedWarning(e.target.value)}
                  className="block w-48 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                >
                  <option value="all">All Warnings</option>
                  {uniqueWarnings.map((warning) => (
                    <option key={warning} value={warning}>
                      {truncate(warning)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search order ID or buyer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-9 pr-3 text-xs font-bold text-slate-700 placeholder-slate-400 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
            </div>

            {/* Stats Line */}
            <div className="text-xs font-extrabold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/30">
              {totalOrdersWithWarnings} orders with warnings — {totalWarningsLogged} total warnings logged
            </div>
          </div>

          {/* Cards List */}
          {filteredLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
              No matching warning records.
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/60 bg-white/50 p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div>
                    {/* Top Row: eBay Order ID + date */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold tracking-tight text-slate-800">
                        {log.ebay_order_id}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {formatAEST(new Date(log.created_at))}
                      </span>
                    </div>

                    {/* Second Row: Buyer + Postcode */}
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      {log.buyer_name} <span className="text-slate-400">({log.postcode})</span>
                    </div>
                  </div>

                  {/* Warning Badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {log.validation_warnings.map((warning, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/50 px-2 py-1 text-[10px] font-bold text-amber-700 shadow-sm"
                      >
                        <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                        {warning}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
