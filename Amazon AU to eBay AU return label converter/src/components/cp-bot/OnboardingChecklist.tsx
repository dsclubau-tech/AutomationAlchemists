"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Chrome, ExternalLink, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DownloadExtensionCard } from "./DownloadExtensionCard";

interface OnboardingChecklistProps {
  hasCompletedScan: boolean;
  hasCompletedPaste: boolean;
  minimumSupportedVersion: string | null;
}

function isVersionBelow(current: string, minimum: string): boolean {
  const c = current.split('.').map(Number);
  const m = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] ?? 0) < (m[i] ?? 0)) return true;
    if ((c[i] ?? 0) > (m[i] ?? 0)) return false;
  }
  return false;
}

export function OnboardingChecklist({
  hasCompletedScan,
  hasCompletedPaste,
  minimumSupportedVersion,
}: OnboardingChecklistProps) {
  const router = useRouter();
  const [isExtensionActive, setIsExtensionActive] = useState(false);
  const [isExtensionSignedIn, setIsExtensionSignedIn] = useState(false);
  const [extensionVersion, setExtensionVersion] = useState<string | null>(null);
  const [localStorageScanDone, setLocalStorageScanDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if the extension injected the global flag
    const checkExtension = () => {
      const win = window as unknown as Record<string, unknown>;
      const active =
        !!win.__CP_BOT_ACTIVE__ ||
        document.documentElement.getAttribute("data-cp-bot-active") === "true";
      setIsExtensionActive(active);

      const signedIn = document.documentElement.getAttribute("data-cp-bot-signed-in") === "true";
      setIsExtensionSignedIn(signedIn);

      const version =
        (win.__CP_BOT_VERSION__ as string | undefined) ||
        document.documentElement.getAttribute("data-cp-bot-version");
      setExtensionVersion(version || null);
    };

    // Check localStorage scan marker
    const checkScan = () => {
      const scanDone = localStorage.getItem("cp_bot_first_scan_done") === "true";
      setLocalStorageScanDone(scanDone);
    };

    const handleRefresh = () => {
      checkExtension();
      checkScan();
      router.refresh();
    };

    handleRefresh();

    // Check again in case injection takes a moment
    const timer = setTimeout(checkExtension, 1000);

    // Listen for tab focus/visibility change to auto-refresh state (e.g. after installing/signing in)
    window.addEventListener("visibilitychange", handleRefresh);
    window.addEventListener("focus", handleRefresh);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("visibilitychange", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, [mounted, router]);

  const firstScanDone = hasCompletedScan || localStorageScanDone;

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 rounded-2xl bg-slate-200"></div>
        <div className="h-64 rounded-2xl bg-slate-200"></div>
      </div>
    );
  }

  const stepStatuses = {
    1: isExtensionActive,
    2: isExtensionActive && isExtensionSignedIn,
    3: firstScanDone,
    4: hasCompletedPaste,
  };

  // Determine first incomplete step
  let activeStep = 1;
  if (stepStatuses[1]) {
    if (stepStatuses[2]) {
      if (stepStatuses[3]) {
        if (stepStatuses[4]) {
          activeStep = 5; // All complete!
        } else {
          activeStep = 4;
        }
      } else {
        activeStep = 3;
      }
    } else {
      activeStep = 2;
    }
  }

  const allCompleted = activeStep === 5;

  // Step renderer helper
  const renderStep = (
    stepNum: number,
    title: string,
    description: string,
    actionButton?: { label: string; href: string; external?: boolean; download?: boolean }
  ) => {
    const isCompleted = stepStatuses[stepNum as keyof typeof stepStatuses];
    const isActive = stepNum === activeStep;

    return (
      <div
        className={cn(
          "relative flex flex-col md:flex-row md:items-start gap-4 rounded-2xl border bg-white/70 p-5 backdrop-blur-md transition-all duration-300",
          isCompleted
            ? "border-slate-200/80 opacity-75"
            : isActive
            ? "border-cyan-500 ring-2 ring-cyan-50 shadow-md translate-y-[-2px]"
            : "border-slate-200/60 opacity-60 pointer-events-none"
        )}
      >
        {/* Step Indicator */}
        <div className="flex shrink-0 items-center justify-center">
          {isCompleted ? (
            <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white shadow-sm">
              <Check className="h-4 w-4 stroke-[3]" />
            </div>
          ) : (
            <div
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full border-2 text-sm font-bold shadow-sm transition-colors",
                isActive
                  ? "border-cyan-500 bg-cyan-50 text-cyan-600"
                  : "border-slate-200 text-slate-400"
              )}
            >
              {stepNum}
            </div>
          )}
        </div>

        {/* Step Description */}
        <div className="flex-1 space-y-3">
          <div>
            <h3 className={cn("text-sm font-extrabold", isCompleted ? "text-slate-500" : "text-slate-800")}>
              {title}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-400">
              {description}
            </p>
          </div>

          {/* Action Button */}
          {actionButton && !isCompleted && isActive && (
            <div>
              {actionButton.external ? (
                <a
                  href={actionButton.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={actionButton.download}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-4 text-xs font-bold text-white shadow-sm shadow-cyan-100 transition hover:bg-cyan-700"
                >
                  {actionButton.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Link
                  href={actionButton.href}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-4 text-xs font-bold text-white shadow-sm shadow-cyan-100 transition hover:bg-cyan-700"
                >
                  {actionButton.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const isOutdated =
    isExtensionActive &&
    extensionVersion &&
    minimumSupportedVersion
      ? isVersionBelow(extensionVersion, minimumSupportedVersion)
      : false;

  return (
    <div className="space-y-6">
      {isOutdated && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 shadow-sm flex items-center gap-2">
          <span>⚠ Your CP Bot extension is outdated — please reload it from chrome://extensions</span>
        </div>
      )}

      {/* Live Connection Card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-panel backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-100">
            <Chrome className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Connection Status</p>
            <h2 className="text-sm font-extrabold text-slate-800">Chrome Extension</h2>
            {extensionVersion && (
              <div className="text-xs text-slate-500 mt-1">
                Extension version {extensionVersion}
              </div>
            )}
          </div>
        </div>

        {/* Live Badge */}
        {isExtensionActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-100 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Extension Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-500 border border-slate-200 shadow-sm">
            Extension Not Detected
          </span>
        )}
      </section>

      {/* Checklist or Success Panel */}
      {allCompleted ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-md backdrop-blur-md space-y-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white shadow-sm shrink-0">
              <CheckCircle className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-emerald-800">You&apos;re all set!</h2>
              <p className="text-xs font-bold leading-relaxed text-emerald-600">
                CP Bot is active and ready. Head to Fulfillment History to track your orders.
              </p>
            </div>
          </div>
          <div className="flex justify-center md:justify-start pt-2">
            <Link
              href="/cp-bot/fulfillment-history"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-sm shadow-emerald-100 transition hover:bg-emerald-700"
            >
              View Fulfillment History
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 px-1">
            <Sparkles className="h-4 w-4 text-cyan-600" />
            Onboarding Checklist
          </h2>

          <div className="space-y-3">
            {/* Step 1 */}
            {renderStep(
              1,
              "Install the CP Bot Extension",
              "Add CP Bot to Chrome to start automating your order fulfillment.",
              {
                // TEMPORARY: point back to Chrome Web Store URL once published
                label: "Download Extension (.zip)",
                href: "https://drive.google.com/drive/folders/1gxmzlp_yyysABu1ycX7VCkeGRg4r8kjm?usp=sharing",
                external: true,
                download: false,
              }
            )}

            {/* Step 2 */}
            {renderStep(
              2,
              "Sign in to CP Bot",
              "Open the CP Bot popup and sign in with your Automation Alchemists account."
            )}

            {/* Step 3 */}
            {renderStep(
              3,
              "Scan your eBay AU orders",
              "Go to your eBay AU Seller Hub → All Orders page, open CP Bot, and press Scan to load your buyer addresses.",
              {
                label: "Open eBay AU Orders",
                href: "https://www.ebay.com.au/sh/ord/?filter=status:ALL_ORDERS",
                external: true,
              }
            )}

            {/* Step 4 */}
            {renderStep(
              4,
              "Paste your first address into Amazon",
              "Select an order in CP Bot, go to Amazon AU, and use CP Bot to paste the buyer address into checkout.",
              {
                label: "Open Amazon AU",
                href: "https://www.amazon.com.au",
                external: true,
              }
            )}
          </div>
        </section>
      )}
      <div className="mt-8">
        <DownloadExtensionCard />
      </div>
    </div>
  );
}
