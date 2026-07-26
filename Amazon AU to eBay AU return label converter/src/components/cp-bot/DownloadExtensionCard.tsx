"use client";

import { Chrome, ExternalLink } from "lucide-react";

const CHROME_WEB_STORE_URL =
  "https://chromewebstore.google.com/detail/cp-bot-by-automation-alch/lieicfingaoeaabjgaajbnimhekkjeok";

export function DownloadExtensionCard() {
  return (
    <section className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-panel backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <Chrome className="h-4.5 w-4.5" />
            </span>
            <h2 className="text-md font-extrabold text-slate-800">Get CP Bot from the Chrome Web Store</h2>
          </div>
          <p className="mt-2 text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Published &amp; available for all regions
          </p>
        </div>
        <div className="flex flex-col gap-1.5 items-start sm:items-end shrink-0">
          <a
            href={CHROME_WEB_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-xs font-extrabold text-white shadow-sm shadow-emerald-100 hover:shadow-md transition hover:from-emerald-700 hover:to-teal-700"
          >
            <Chrome className="h-4 w-4" />
            Install from Chrome Web Store
            <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
          </a>
        </div>
      </div>

      <div className="mt-6 border-t border-emerald-200/60 pt-5">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">How to get started:</h3>
        <ol className="mt-3 space-y-3.5 text-xs font-semibold leading-relaxed text-slate-600 list-none pl-0">
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-900">1</span>
            <span>Click <strong className="text-slate-800">Install from Chrome Web Store</strong> above and add the extension to Chrome.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-900">2</span>
            <span>Pin the <strong className="text-slate-800">CP Bot</strong> icon to your toolbar (puzzle-piece icon → pin).</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-900">3</span>
            <span>Sign in to this CP Bot Admin dashboard in the same browser — the extension will detect it automatically, no separate login needed in the popup.</span>
          </li>
        </ol>
      </div>
    </section>
  );
}
