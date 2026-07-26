"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FilterX,
  Loader2,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FulfillmentRow {
  id: string;
  ebay_order_id: string;
  buyer_name: string;
  postcode: string;
  item_title: string;
  amazon_asin?: string;
  amazon_account?: string;
  status: "ordered" | "failed";
  validation_warnings?: unknown;
  created_at: string;
}

interface FulfillmentTableProps {
  initialData: FulfillmentRow[];
  initialCount: number;
  authEnabled: boolean;
}

export function FulfillmentTable({
  initialData,
  initialCount,
  authEnabled,
}: FulfillmentTableProps) {
  const [data, setData] = useState<FulfillmentRow[]>(initialData);
  const [count, setCount] = useState<number>(initialCount);
  const [loading, setLoading] = useState<boolean>(false);
  const [csvExporting, setCsvExporting] = useState<boolean>(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const isFirstRender = useRef<boolean>(true);

  // Debounce search query changes by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch paginated/filtered data
  const fetchData = useCallback(
    async (
      currentPage: number,
      status: string,
      from: string,
      to: string
    ) => {
      if (!authEnabled) return;
      setLoading(true);

      try {
        const supabase = createClient();
        const fromIndex = (currentPage - 1) * 25;
        const toIndex = currentPage * 25 - 1;

        let query = supabase
          .from("cp_bot_fulfillments")
          .select("*", { count: "exact" });

        if (status !== "") {
          query = query.eq("status", status);
        }

        if (from) {
          const fromDate = new Date(from);
          fromDate.setHours(0, 0, 0, 0);
          query = query.gte("created_at", fromDate.toISOString());
        }

        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          query = query.lte("created_at", toDate.toISOString());
        }

        const { data: fetchedData, count: fetchedCount, error } = await query
          .order("created_at", { ascending: false })
          .range(fromIndex, toIndex);

        if (error) throw error;

        setData((fetchedData as FulfillmentRow[]) || []);
        setCount(fetchedCount ?? 0);
      } catch (err) {
        console.error("Error fetching CP Bot fulfillments:", err);
        toast.error("Failed to load fulfillments.");
      } finally {
        setLoading(false);
      }
    },
    [authEnabled]
  );

  // Re-fetch when dependencies change, bypassing first render to avoid duplication
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    void fetchData(page, statusFilter, dateFrom, dateTo).catch(() => undefined);
  }, [page, statusFilter, dateFrom, dateTo, fetchData]);

  // Supabase Realtime: auto-refresh when new fulfillment rows are inserted
  useEffect(() => {
    if (!authEnabled) return;
    const supabase = createClient();
    const channel = supabase
      .channel("fulfillments-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cp_bot_fulfillments" },
        () => {
          void fetchData(page, statusFilter, dateFrom, dateTo).catch(() => undefined);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authEnabled, page, statusFilter, dateFrom, dateTo, fetchData]);

  // Reset page when filters change
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleDateFromChange = (newDate: string) => {
    setDateFrom(newDate);
    setPage(1);
  };

  const handleDateToChange = (newDate: string) => {
    setDateTo(newDate);
    setPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // Helper: Format Date string to AEST timezone
  const formatAEST = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Australia/Sydney",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      const formatter = new Intl.DateTimeFormat("en-AU", options);
      const parts = formatter.formatToParts(date);

      const day = parts.find((p) => p.type === "day")?.value || "";
      const month = parts.find((p) => p.type === "month")?.value || "";
      const year = parts.find((p) => p.type === "year")?.value || "";
      const hour = parts.find((p) => p.type === "hour")?.value || "";
      const minute = parts.find((p) => p.type === "minute")?.value || "";

      return `${day} ${month} ${year} ${hour}:${minute}`;
    } catch {
      return dateStr;
    }
  };

  // Helper: Export current filtered data to CSV
  const handleExportCSV = async () => {
    if (!authEnabled) return;
    setCsvExporting(true);

    try {
      const supabase = createClient();
      let query = supabase.from("cp_bot_fulfillments").select("*");

      if (statusFilter !== "") {
        query = query.eq("status", statusFilter);
      }

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        query = query.gte("created_at", fromDate.toISOString());
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", toDate.toISOString());
      }

      const { data: allData, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      if (!allData || allData.length === 0) {
        toast.error("No data found matching current filters.");
        return;
      }

      const typedData = allData as FulfillmentRow[];

      const headers = [
        "eBay Order ID",
        "Buyer Name",
        "Postcode",
        "Item Title",
        "Amazon ASIN",
        "Amazon Account",
        "Status",
        "Date (AEST)",
        "Validation Warnings",
      ];

      const escapeCSV = (val: unknown) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (
          str.includes(",") ||
          str.includes('"') ||
          str.includes("\n") ||
          str.includes("\r")
        ) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = typedData.map((row) => {
        let warningsStr = "";
        if (row.validation_warnings) {
          try {
            const warnings =
              typeof row.validation_warnings === "string"
                ? JSON.parse(row.validation_warnings)
                : row.validation_warnings;
            if (Array.isArray(warnings)) {
              warningsStr = warnings.join(" | ");
            }
          } catch {
            warningsStr = String(row.validation_warnings);
          }
        }

        const displayStatus =
          row.status === "ordered"
            ? "Order Assists"
            : row.status === "failed"
            ? "Failed Assists"
            : row.status;

        return [
          escapeCSV(row.ebay_order_id),
          escapeCSV(row.buyer_name),
          escapeCSV(row.postcode),
          escapeCSV(row.item_title),
          escapeCSV(row.amazon_asin),
          escapeCSV(row.amazon_account),
          escapeCSV(displayStatus),
          escapeCSV(formatAEST(row.created_at)),
          escapeCSV(warningsStr),
        ].join(",");
      });

      // Prepend UTF-8 BOM so Excel decodes characters correctly
      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `cp-bot-fulfillments-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSV file downloaded successfully.");
    } catch (err) {
      console.error("CSV Export error:", err);
      toast.error("Failed to export CSV.");
    } finally {
      setCsvExporting(false);
    }
  };

  // Client-side filtering by searchQuery
  const filteredData = data.filter((row) => {
    if (!debouncedSearchQuery) return true;
    const q = debouncedSearchQuery.toLowerCase();
    const ebayMatch = (row.ebay_order_id || "").toLowerCase().includes(q);
    const buyerMatch = (row.buyer_name || "").toLowerCase().includes(q);
    return ebayMatch || buyerMatch;
  });

  const showingStart = count === 0 ? 0 : (page - 1) * 25 + 1;
  const showingEnd = Math.min(page * 25, count);

  const hasActiveFilters =
    statusFilter !== "" ||
    searchQuery !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm";
    switch (status) {
      case "ordered":
        return <span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-100`}>Order Assists</span>;
      case "failed":
        return <span className={`${base} bg-rose-50 text-rose-700 border border-rose-100`}>Failed Assists</span>;
      default:
        return <span className={`${base} bg-slate-50 text-slate-600 border border-slate-100`}>{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Field */}
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search order ID or buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="">All Statuses</option>
            <option value="ordered">Order Assists</option>
            <option value="failed">Failed Assists</option>
          </select>

          {/* Date Range: From – To */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
            <span className="text-xs font-bold text-slate-400">to</span>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <FilterX className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>

        {/* CSV Export Button */}
        {authEnabled && (
          <button
            onClick={handleExportCSV}
            disabled={csvExporting}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-4 text-xs font-bold text-white shadow-sm shadow-cyan-100 transition hover:bg-cyan-700 disabled:opacity-50"
          >
            {csvExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export CSV
          </button>
        )}
      </div>

      {/* Main Table Layout */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/50 shadow-sm backdrop-blur-md">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">eBay Order ID</th>
              <th className="px-4 py-3.5">Buyer</th>
              <th className="px-4 py-3.5 min-w-[320px]">Item</th>
              <th className="px-4 py-3.5">Amazon Account</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse bg-white/30">
                  <td className="px-4 py-4">
                    <div className="h-4 w-28 rounded bg-slate-200"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="mb-1.5 h-4 w-24 rounded bg-slate-200"></div>
                    <div className="h-3.5 w-12 rounded bg-slate-200"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-48 rounded bg-slate-200"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-32 rounded bg-slate-200"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-6 w-16 rounded-full bg-slate-200"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-36 rounded bg-slate-200"></div>
                  </td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              // Empty States
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="mx-auto max-w-md">
                    <p className="text-sm font-bold text-slate-800">
                      {hasActiveFilters
                        ? "No results match your filters"
                        : "No fulfillments yet — start using CP Bot to see your order history here"}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-3 inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              filteredData.map((row) => {
                return (
                  <tr
                    key={row.id}
                    className="bg-white/40 text-xs font-medium text-slate-700 transition hover:bg-slate-50/50"
                  >
                    {/* eBay Order ID */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap min-w-[140px]">
                      <span className="rounded bg-slate-100 border border-slate-200/50 px-2 py-0.5">
                        {row.ebay_order_id}
                      </span>
                    </td>

                    {/* Buyer (Name + Postcode) */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{row.buyer_name}</div>
                      <div className="mt-0.5 font-semibold text-slate-400">{row.postcode}</div>
                    </td>

                    {/* Item */}
                    <td className="px-4 py-3.5 min-w-[320px] break-words text-slate-700">
                      {row.item_title || "—"}
                    </td>

                    {/* Amazon Account */}
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm">
                      {row.amazon_account || "—"}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      {renderStatusBadge(row.status)}
                    </td>

                    {/* Date (AEST) */}
                    <td className="px-4 py-3.5 text-slate-500" suppressHydrationWarning={true}>
                      {formatAEST(row.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Row */}
      {count > 25 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400">
            Showing {showingStart}–{showingEnd} of {count} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 25 >= count || loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
