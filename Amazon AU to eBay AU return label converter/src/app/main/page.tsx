import Link from "next/link";
import { ArrowRight, CheckCircle2, FileImage, ListChecks, Scissors, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getAppAuthContext } from "@/lib/auth-context";
import { TEMPLATE_IDS, TEMPLATES } from "@/lib/templates";

const gettingStarted = [
  {
    title: "Choose the return method",
    copy: "Match the Amazon AU return option, such as Australia Post QR, printable label, or ParcelPoint.",
    icon: ListChecks,
  },
  {
    title: "Upload and crop the code",
    copy: "Upload a screenshot, or drag the QR, barcode, or label image directly from the Amazon return page, then crop the needed area.",
    icon: Scissors,
  },
  {
    title: "Add eBay order details",
    copy: "Enter the item details needed for templates that include an item table.",
    icon: FileImage,
  },
  {
    title: "Export locally",
    copy: "Download the converted label as PNG, JPG, or PDF without uploading the source image.",
    icon: ShieldCheck,
  },
];

export default async function MainPage() {
  const auth = await getAppAuthContext();

  return (
    <AppShell authEnabled={auth.authEnabled} userEmail={auth.userEmail}>
      <div className="mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-panel backdrop-blur-md">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p
                className="text-xs font-extrabold uppercase tracking-[0.28em] text-blue-500"
                style={{
                  textShadow: "0 0 14px rgba(59, 130, 246, 0.65), 0 0 28px rgba(16, 185, 129, 0.28)",
                }}
              >
                Created by Automation Alchemists
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800">
                Amazon AU to eBay AU return label converter
              </h1>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                Convert supplier return screenshots into clean eBay-suitable return labels using the approved
                Australia Post and ParcelPoint templates.
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 text-sm font-bold text-white shadow-sm shadow-blue-100 transition hover:bg-blue-600 hover-lift"
              href="/"
            >
              Start Converting
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-sm font-extrabold text-slate-800">How to get started</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Use Convert Labels when you are ready to generate a label.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {gettingStarted.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Step {index + 1}
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-800">{item.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs font-medium leading-5 text-slate-500">{item.copy}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-panel backdrop-blur-md">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Supported templates</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                These templates are available on Convert Labels.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {TEMPLATE_IDS.length} active
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {TEMPLATE_IDS.map((id) => {
              const template = TEMPLATES[id];

              return (
                <div key={id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4">
                  <span
                    className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: template.accent }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                <h3 className="text-xs font-extrabold text-slate-800">{template.name}</h3>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">{template.type}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
