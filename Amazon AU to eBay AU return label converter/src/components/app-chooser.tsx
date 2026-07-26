"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

export function AppChooser() {
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<"main" | "cp-bot" | null>(null);

  // Prefetch routes on mount so that redirecting is as fast as possible
  useEffect(() => {
    router.prefetch("/main");
    router.prefetch("/cp-bot");
  }, [router]);

  // Safety timeout: if navigation hangs for 6 seconds (e.g. cold start / network drop),
  // clear the loading state so the user can interact with the page or try again.
  useEffect(() => {
    if (!selectedApp) return;
    const timer = setTimeout(() => {
      setSelectedApp(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [selectedApp]);

  const handleSelect = (app: "main" | "cp-bot") => {
    if (selectedApp) return;
    setSelectedApp(app);
    router.push(app === "main" ? "/main" : "/cp-bot");
  };

  const btnClassMain = `group relative flex flex-col items-start rounded-2xl border-2 p-6 text-left shadow-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
    selectedApp
      ? "border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed"
      : "border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/40 hover:-translate-y-1 cursor-pointer"
  }`;

  const btnClassCpBot = `group relative flex flex-col items-start rounded-2xl border-2 p-6 text-left shadow-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 ${
    selectedApp
      ? "border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed"
      : "border-slate-200/80 bg-white hover:border-teal-400 hover:shadow-xl hover:shadow-teal-100/40 hover:-translate-y-1 cursor-pointer"
  }`;

  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(59,130,246,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(20,184,166,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-2xl px-6 animate-slide-up">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Choose your app
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            Where would you like to go?
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-relaxed text-slate-400">
            Select one of the apps below to get started.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Return Converter Card */}
          <button
            type="button"
            disabled={selectedApp !== null}
            onClick={() => handleSelect("main")}
            className={btnClassMain}
          >
            {/* Icon */}
            <div className="mb-5 overflow-hidden rounded-2xl shadow-md shadow-blue-100 transition-transform duration-300 group-hover:scale-110">
              <img src="/return-logo.png" alt="Return Converter Logo" className="h-14 w-14 object-cover select-none" />
            </div>

            {/* Content */}
            <h2 className="text-lg font-extrabold tracking-tight text-slate-800">
              Return Converter
            </h2>
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Amazon AU to eBay AU
            </p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
              Convert supplier return screenshots into clean eBay-suitable return labels.
            </p>

            {/* Arrow */}
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
              Open app
              <ArrowRight className="h-3.5 w-3.5" />
            </div>

            {/* Active badge */}
            <span className="absolute right-4 top-4 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-200/60">
              Active
            </span>
          </button>

          {/* CP Bot Card */}
          <button
            type="button"
            disabled={selectedApp !== null}
            onClick={() => handleSelect("cp-bot")}
            className={btnClassCpBot}
          >
            {/* Icon */}
            <div className="mb-5 overflow-hidden rounded-2xl shadow-md shadow-cyan-100 transition-transform duration-300 group-hover:scale-110">
              <img src="/robot-logo-56.jpg" alt="CP Bot Logo" className="h-14 w-14 object-cover select-none" />
            </div>

            {/* Content */}
            <h2 className="text-lg font-extrabold tracking-tight text-slate-800">
              CP Bot
            </h2>
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              CopyPaste Bot
            </p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
              Automate order fulfillment by copying eBay buyer addresses into Amazon AU checkout.
            </p>

            {/* Arrow */}
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-teal-500 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
              Open app
              <ArrowRight className="h-3.5 w-3.5" />
            </div>

            {/* Active badge */}
            <span className="absolute right-4 top-4 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-200/60">
              Active
            </span>
          </button>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] font-semibold text-slate-300">
          Powered by Automation Alchemists
        </p>
      </div>

      {/* Loading Overlay */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md transition-opacity duration-300 animate-fade-in">
          <div className="flex flex-col items-center text-center">
            {/* Spinner */}
            <div className="relative flex h-16 w-16 items-center justify-center">
              {/* Glow background */}
              <div
                className={`absolute inset-0 rounded-full blur-md opacity-25 animate-pulse ${
                  selectedApp === "main"
                    ? "bg-blue-500"
                    : "bg-gradient-to-br from-blue-500 to-teal-500"
                }`}
              />
              {/* Outer ring */}
              <div className="absolute h-14 w-14 rounded-full border-2 border-slate-100" />
              {/* Spinning accent */}
              <div
                className={`absolute h-14 w-14 rounded-full border-2 border-transparent border-t-2 animate-spin ${
                  selectedApp === "main" ? "border-t-blue-500" : "border-t-teal-500"
                }`}
                style={{ animationDuration: "0.6s" }}
              />
            </div>

            {/* Message */}
            <h3 className="mt-6 text-lg font-extrabold tracking-tight text-slate-800 animate-pulse">
              {selectedApp === "main" ? "Opening Return Converter..." : "Opening CP Bot..."}
            </h3>
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Preparing your workspace
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

