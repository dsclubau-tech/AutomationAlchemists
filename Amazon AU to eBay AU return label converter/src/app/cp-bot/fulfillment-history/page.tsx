import { redirect } from "next/navigation";
import { Bot, CheckCircle2, BarChart3, History } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getAppAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";
import { FulfillmentTable } from "@/components/cp-bot/FulfillmentTable";
import { ValidationLog } from "@/components/cp-bot/ValidationLog";
import { ActivityLog } from "@/components/cp-bot/ActivityLog";
import { FailedStatsCard } from "@/components/cp-bot/FailedStatsCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const dynamic = "force-dynamic";

export default async function FulfillmentHistoryPage() {
  const auth = await getAppAuthContext();

  if (auth.authEnabled && !auth.userId) {
    redirect("/login");
  }

  interface DbFulfillment {
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

  const allTimeStats = { total: 0, ordered: 0, failed: 0 };
  const stats = { total: 0, ordered: 0, failed: 0 };
  const failedBreakdown: Record<string, number> = {};
  let initialFulfillments: DbFulfillment[] = [];
  let totalCount = 0;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfMonthISO = startOfMonth.toISOString();

  if (auth.authEnabled && auth.userId) {
    try {
      const supabase = await createClient();
      const eventTypes = [
        "paste_failed",
        "checkout_error",
        "automation_stopped",
        "address_validation_warning",
        "captcha_detected",
        "prime_prompt_detected"
      ];

      // Fetch all required data in parallel to maximize page load performance
      const [
        allTimeOrderedRes,
        allTimeFailedRes,
        statsOrderedRes,
        statsFailedRes,
        statsActivityRes,
        listRes,
        ...activityTypeCounts
      ] = await Promise.all([
        supabase
          .from("cp_bot_fulfillments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", auth.userId)
          .eq("status", "ordered"),
        supabase
          .from("cp_bot_fulfillments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", auth.userId)
          .eq("status", "failed"),
        supabase
          .from("cp_bot_fulfillments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", auth.userId)
          .eq("status", "ordered")
          .gte("created_at", startOfMonthISO),
        supabase
          .from("cp_bot_fulfillments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", auth.userId)
          .eq("status", "failed")
          .gte("created_at", startOfMonthISO),
        supabase
          .from("cp_bot_activity_log")
          .select("id", { count: "exact", head: true })
          .eq("user_id", auth.userId)
          .gte("created_at", startOfMonthISO)
          .in("event_type", [
            "paste_failed",
            "checkout_error",
            "automation_stopped",
            "address_validation_warning"
          ]),
        supabase
          .from("cp_bot_fulfillments")
          .select("*", { count: "exact" })
          .eq("user_id", auth.userId)
          .order("created_at", { ascending: false })
          .range(0, 24),
        ...eventTypes.map((type) => {
          let query = supabase
            .from("cp_bot_activity_log")
            .select("id", { count: "exact", head: true })
            .eq("user_id", auth.userId)
            .eq("event_type", type);
          if (type === "prime_prompt_detected") {
            query = query.eq("detail->>dismissed", "false");
          }
          return query;
        })
      ]);

      allTimeStats.ordered = allTimeOrderedRes.count ?? 0;
      const fulfillmentFailedCount = allTimeFailedRes.count ?? 0;
      allTimeStats.failed = fulfillmentFailedCount;

      // Populate breakdown and sum all-time activity log counts to failed
      eventTypes.forEach((type, index) => {
        const count = activityTypeCounts[index]?.count ?? 0;
        if (count > 0) {
          failedBreakdown[type] = count;
          allTimeStats.failed += count;
        }
      });

      // Also count fulfillment-level failures in the breakdown
      if (fulfillmentFailedCount > 0) {
        failedBreakdown["fulfillment_failed"] = fulfillmentFailedCount;
      }

      // Recalculate Total as sum of Ordered and Failed for all-time stats
      allTimeStats.total = allTimeStats.ordered + allTimeStats.failed;

      stats.ordered = statsOrderedRes.count ?? 0;
      stats.failed = (statsFailedRes.count ?? 0) + (statsActivityRes.count ?? 0);

      // Recalculate Total as sum of Ordered and Failed for monthly stats
      stats.total = stats.ordered + stats.failed;

      const listData = listRes.data;
      const count = listRes.count;
      const listError = listRes.error;
      if (!listError && listData) {
        initialFulfillments = listData;
        totalCount = count ?? 0;
      }
    } catch (err) {
      console.error("Failed to load CP Bot initial data:", err);
    }
  }

  return (
    <AppShell authEnabled={auth.authEnabled} userEmail={auth.userEmail}>
      <div className="mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        {/* Page Header */}
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-panel backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-xl shadow-md shadow-cyan-100">
              <img src="/robot-logo-40.jpg" alt="CP Bot Logo" className="h-10 w-10 object-cover select-none" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-600">CP Bot Admin</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Fulfillment History & Logs</h1>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            Track orders, address validation warnings, and automation activity.
          </p>
        </section>

        {/* Section A: Stats Row */}
        <section className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 0: All-Time Stats */}
          <div className="rounded-2xl border border-slate-200/80 border-t-4 border-t-indigo-500 bg-white/70 p-5 shadow-sm backdrop-blur-md transition hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">All-time stats</span>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <History className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="space-y-1.5 mt-2.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">Total</span>
                <span className="text-slate-800 font-extrabold">{auth.authEnabled ? allTimeStats.total : "—"}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-emerald-600">Order Assists</span>
                <span className="text-emerald-700 font-extrabold">{auth.authEnabled ? allTimeStats.ordered : "—"}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-rose-600">Failed</span>
                <span className="text-rose-700 font-extrabold">{auth.authEnabled ? allTimeStats.failed : "—"}</span>
              </div>
            </div>
            {!auth.authEnabled && (
              <p className="mt-2 text-[10px] font-bold text-slate-400">Auth not configured</p>
            )}
          </div>

          {/* Card 1: Total This Month */}
          <div className="rounded-2xl border border-slate-200/80 border-t-4 border-t-cyan-500 bg-white/70 p-5 shadow-sm backdrop-blur-md transition hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total this month</span>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-800">
              {auth.authEnabled ? stats.total : "—"}
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-400">
              {auth.authEnabled ? "Fulfillment requests" : "Auth not configured"}
            </p>
          </div>

          {/* Card 2: Order Assists */}
          <div className="rounded-2xl border border-slate-200/80 border-t-4 border-t-emerald-500 bg-white/70 p-5 shadow-sm backdrop-blur-md transition hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Assists</span>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-800">
              {auth.authEnabled ? stats.ordered : "—"}
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-400">
              {auth.authEnabled ? "Pasted successfully" : "Auth not configured"}
            </p>
          </div>

          {/* Card 3: Failed (interactive) */}
          <FailedStatsCard
            totalFailed={stats.failed}
            breakdown={failedBreakdown}
            authEnabled={auth.authEnabled}
          />
        </section>

        {/* Section B: Fulfillment History Table */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-panel backdrop-blur-md">
          <ErrorBoundary>
            <FulfillmentTable
              initialData={initialFulfillments}
              initialCount={totalCount}
              authEnabled={auth.authEnabled}
            />
          </ErrorBoundary>
        </section>

        {/* Section divider */}
        <div className="border-t border-slate-200 my-8" />

        {/* Address Validation Log */}
        <ErrorBoundary>
          <ValidationLog userId={auth.userId} />
        </ErrorBoundary>

        {/* Section divider */}
        <div className="border-t border-slate-200 my-8" />

        {/* Activity Log */}
        <ErrorBoundary>
          <ActivityLog userId={auth.userId} />
        </ErrorBoundary>
      </div>
    </AppShell>
  );
}
