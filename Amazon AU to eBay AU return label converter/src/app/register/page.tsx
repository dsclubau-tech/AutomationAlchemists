"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, AlertCircle } from "lucide-react";
import { registerWithPassword } from "@/app/login/actions";
import { hasSupabaseEnv } from "@/lib/supabase/config";

interface RegisterPageProps {
  searchParams: Promise<{
    email?: string;
    error?: string;
  }>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-bold text-white shadow-sm shadow-blue-100 hover:bg-blue-600 transition hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating account...
        </>
      ) : (
        "Create account"
      )}
    </button>
  );
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = use(searchParams);
  const authEnabled = hasSupabaseEnv();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 bg-slate-50/50">
      <section className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md p-8 shadow-panel animate-slide-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 overflow-hidden rounded-2xl shadow-md shadow-blue-100 mb-4">
            <img src="/return-logo.png" alt="Return Converter Logo" className="h-12 w-12 object-cover select-none" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Create Account</h1>
          <p className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Register before opening the return converter
          </p>
        </div>

        {!authEnabled ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold leading-relaxed text-amber-800 shadow-sm shadow-amber-50/50">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4" />
              <span>Offline Mode Active</span>
            </div>
            Supabase auth is not configured. Registration is disabled in local no-auth mode.
            <div className="mt-3.5">
              <Link className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition" href="/">
                Open Converter
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {params.error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 shadow-sm">
                {params.error}
              </div>
            ) : null}

            <form action={registerWithPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={params.email || ""}
                    required
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <SubmitButton />
            </form>
            
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              Already registered?{" "}
              <Link className="text-blue-500 hover:text-blue-600 underline transition" href="/login">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
