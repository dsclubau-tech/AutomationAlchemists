"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FailureRateBannerProps {
  userId: string | null;
}

export function FailureRateBanner({ userId }: FailureRateBannerProps) {
  const [failureCount, setFailureCount] = useState<number>(0);

  const fetchFailureCount = useCallback(async () => {
    if (!userId) return;

    try {
      const supabase = createClient();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from("cp_bot_activity_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("event_type", ["paste_failed", "checkout_error", "automation_stopped"])
        .gte("created_at", oneHourAgo);

      if (error) {
        throw error;
      }

      setFailureCount(count ?? 0);
    } catch (err) {
      console.error("Failed to fetch failure rate count:", err);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchFailureCount();
  }, [fetchFailureCount]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("failure-rate-banner-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cp_bot_activity_log" },
        () => {
          void fetchFailureCount();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchFailureCount]);

  if (failureCount < 5) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm backdrop-blur-md animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
          <AlertTriangle className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-extrabold text-amber-800">
            High Failure Rate Detected
          </h4>
          <p className="text-xs font-semibold leading-relaxed text-amber-700">
            CP Bot has logged {failureCount} failed automations in the last hour — check Fulfillment History & Logs for details.
          </p>
          <div className="pt-1">
            <Link
              href="/cp-bot/fulfillment-history"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900 underline transition"
            >
              View Fulfillment History & Logs
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
