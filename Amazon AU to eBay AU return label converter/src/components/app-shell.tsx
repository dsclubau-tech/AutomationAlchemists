"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, LayoutDashboard, LogOut, Settings, ShieldCheck, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  authEnabled: boolean;
  children: React.ReactNode;
  userEmail: string | null;
}

const navItems = [
  {
    href: "/main",
    label: "Main Page",
    description: "Overview and setup",
    icon: LayoutDashboard,
  },
  {
    href: "/",
    label: "Convert Labels",
    description: "Create labels",
    icon: Home,
  },
  {
    href: "/account",
    label: "Account",
    description: "Profile and history",
    icon: UserCircle,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/cp-bot") {
    return pathname === "/cp-bot";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ authEnabled, children, userEmail }: AppShellProps) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsNavigating(false);
  }

  const cpBotActive = pathname === "/cp-bot" || pathname.startsWith("/cp-bot/");
  const returnConverterActive = !cpBotActive;
  const visibleNavItems = cpBotActive
    ? [
        {
          href: "/cp-bot",
          label: "Main Page",
          description: "Overview & setup",
          icon: Home,
        },
        {
          href: "/cp-bot/fulfillment-history",
          label: "Fulfillment History & Logs",
          description: "Orders, validation & activity",
          icon: LayoutDashboard,
        },
        {
          href: "/cp-bot/settings",
          label: "Settings",
          description: "Automation preferences",
          icon: Settings,
        },
        ...navItems.filter((item) => item.href === "/account"),
      ]
    : navItems;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] w-full overflow-hidden bg-slate-100/50">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500 animate-loading-bar" />
        </div>
      )}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md lg:flex">
        <div className="mb-8 space-y-2">
          <Link
            className={cn(
              "relative flex items-center gap-3 rounded-2xl border px-2 py-2 transition",
              returnConverterActive
                ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm shadow-blue-50 ring-2 ring-blue-100"
                : "border-transparent hover:bg-slate-50",
            )}
            href="/main"
            onClick={(e) => {
              if (!returnConverterActive && !e.metaKey && !e.ctrlKey) {
                setIsNavigating(true);
              }
            }}
          >
            <span className="grid h-10 w-10 overflow-hidden rounded-xl shadow-md shadow-blue-100">
              <img src="/return-logo.png" alt="Return Converter Logo" className="h-10 w-10 object-cover select-none" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold leading-none tracking-tight text-slate-800">
                Return Converter
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Amazon AU to eBay AU
              </span>
            </span>
            {returnConverterActive ? (
              <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                Active
              </span>
            ) : null}
          </Link>

          <Link
            className={cn(
              "relative flex items-center gap-3 rounded-2xl border px-2 py-2 transition",
              cpBotActive
                ? "border-cyan-200 bg-cyan-50 text-cyan-800 shadow-sm shadow-cyan-50 ring-2 ring-cyan-100"
                : "border-transparent hover:bg-slate-50",
            )}
            href="/cp-bot"
            onClick={(e) => {
              if (!cpBotActive && !e.metaKey && !e.ctrlKey) {
                setIsNavigating(true);
              }
            }}
          >
            <span className="overflow-hidden rounded-xl shadow-md shadow-cyan-100">
              <img src="/robot-logo-40.jpg" alt="CP Bot Logo" className="h-10 w-10 object-cover select-none" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold leading-none tracking-tight text-slate-800">
                CP Bot
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                CopyPaste Bot
              </span>
            </span>
            {cpBotActive ? (
              <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                Active
              </span>
            ) : null}
          </Link>
        </div>

        <nav aria-label="Primary navigation" className="space-y-1.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition",
                  active
                    ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
                href={item.href}
                onClick={(e) => {
                  if (!active && !e.metaKey && !e.ctrlKey) {
                    setIsNavigating(true);
                  }
                }}
              >
                <Icon className={cn("h-4.5 w-4.5", active ? "text-blue-500" : "text-slate-400")} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block leading-none">{item.label}</span>
                  <span className={cn("mt-1 block truncate text-[10px]", active ? "text-blue-400" : "text-slate-400")}>
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          {authEnabled && userEmail ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signed in</div>
              <div className="mt-1 truncate text-xs font-extrabold text-slate-800">{userEmail}</div>
            </div>
          ) : null}

          <div className="flex items-center gap-2 rounded-xl border border-emerald-100/70 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            Local secure export
          </div>

          <Link
            href="/privacy"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            Privacy Policy
          </Link>

          {authEnabled ? (
            <a
              className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-600"
              href="/auth/signout"
            >
              <LogOut className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Sign out
            </a>
          ) : null}
        </div>
      </aside>

      <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md lg:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
            <Link
              className={cn(
                "flex min-w-0 shrink-0 items-center gap-3 rounded-xl px-2 py-1.5",
                returnConverterActive ? "bg-blue-50 ring-2 ring-blue-100" : "",
              )}
              href="/main"
              onClick={(e) => {
                if (!returnConverterActive && !e.metaKey && !e.ctrlKey) {
                  setIsNavigating(true);
                }
              }}
            >
              <span className="grid h-10 w-10 shrink-0 overflow-hidden rounded-xl shadow-md shadow-blue-100">
                <img src="/return-logo.png" alt="Return Converter Logo" className="h-10 w-10 object-cover select-none" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold leading-none tracking-tight text-slate-800">
                  Return Converter
                </span>
                <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Amazon AU to eBay AU
                </span>
              </span>
            </Link>
            <Link
              className={cn(
                "flex min-w-0 shrink-0 items-center gap-3 rounded-xl px-2 py-1.5",
                cpBotActive ? "bg-cyan-50 ring-2 ring-cyan-100" : "",
              )}
              href="/cp-bot"
              onClick={(e) => {
                if (!cpBotActive && !e.metaKey && !e.ctrlKey) {
                  setIsNavigating(true);
                }
              }}
            >
              <span className="overflow-hidden rounded-xl shadow-md shadow-cyan-100">
                <img src="/robot-logo-40.jpg" alt="CP Bot Logo" className="h-10 w-10 object-cover select-none" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold leading-none tracking-tight text-slate-800">
                  CP Bot
                </span>
                <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  CopyPaste Bot
                </span>
              </span>
            </Link>
          </div>
          {authEnabled ? (
            <a
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm"
              href="/auth/signout"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
          <Link
            href="/privacy"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm"
            aria-label="Privacy Policy"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <nav aria-label="Primary navigation" className="flex gap-2 overflow-x-auto pb-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "border border-slate-200 bg-white text-slate-600",
                )}
                href={item.href}
                onClick={(e) => {
                  if (!active && !e.metaKey && !e.ctrlKey) {
                    setIsNavigating(true);
                  }
                }}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="min-h-screen lg:pl-64">{children}</main>
    </div>
  );
}
