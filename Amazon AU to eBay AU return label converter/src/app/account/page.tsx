import Link from "next/link";
import { ArrowRight, Clock, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { changePassword } from "@/app/account/actions";
import { AppShell } from "@/components/app-shell";
import { getAppAuthContext } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";

interface AccountPageProps {
  searchParams: Promise<{
    password_changed?: string;
    password_error?: string;
  }>;
}

async function getLabelHistoryCount(authEnabled: boolean, userId: string | null) {
  if (!authEnabled || !userId) {
    return { count: null, error: null };
  }

  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("label_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return { count: count ?? 0, error: null };
  } catch (error) {
    return {
      count: null,
      error: error instanceof Error ? error.message : "Label history is not available yet.",
    };
  }
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const auth = await getAppAuthContext();
  const history = await getLabelHistoryCount(auth.authEnabled, auth.userId);

  return (
    <AppShell authEnabled={auth.authEnabled} userEmail={auth.userEmail}>
      <div className="mx-auto max-w-5xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-panel backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Account</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800">Your account</h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Manage access details for the return label converter. Exported images and PDFs stay local to this browser.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Mail className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-800">Signed-in email</h2>
            </div>
            <p className="truncate text-sm font-bold text-slate-700">
              {auth.userEmail || "Local no-auth mode"}
            </p>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
              {auth.authEnabled
                ? "This email controls access to the protected app pages."
                : "Supabase env vars are not configured, so auth is bypassed locally."}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-800">Export privacy</h2>
            </div>
            <p className="text-sm font-bold text-slate-700">Local browser export</p>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
              The app stores only label history metadata when Supabase is enabled. Source label images are not uploaded.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-purple-700">
                <Clock className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-800">Label history</h2>
            </div>
            <p className="text-sm font-bold text-slate-700">
              {history.count === null ? "Not available" : `${history.count} converted labels`}
            </p>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
              {history.error || "Recent conversions also appear below the Home page wizard."}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <KeyRound className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-800">Session</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 text-xs font-bold text-white shadow-sm shadow-blue-100 transition hover:bg-blue-600"
                href="/"
              >
                Convert Labels
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              {auth.authEnabled ? (
                <a
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  href="/auth/signout"
                >
                  Sign out
                </a>
              ) : null}
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <KeyRound className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Change password</h2>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                Enter your old password first. The app verifies it before saving the new password.
              </p>
            </div>
          </div>

          {params.password_changed ? (
            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-sm shadow-emerald-50/50">
              Password updated successfully.
            </div>
          ) : null}

          {params.password_error ? (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 shadow-sm">
              {params.password_error}
            </div>
          ) : null}

          <form action={changePassword} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="oldPassword">
                Old Password
              </label>
              <input
                id="oldPassword"
                name="oldPassword"
                type="password"
                autoComplete="current-password"
                required
                disabled={!auth.authEnabled}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="newPassword">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={!auth.authEnabled}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                disabled={!auth.authEnabled}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={!auth.authEnabled}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-500 px-4 text-xs font-bold text-white shadow-sm shadow-blue-100 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Update password
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
