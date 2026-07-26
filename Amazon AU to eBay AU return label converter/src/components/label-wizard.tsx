"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  Loader2,
  RotateCcw,
  Scan,
} from "lucide-react";
import { DetailsForm } from "@/components/details-form";
import { LabelPreview } from "@/components/label-preview";
import { StepDot } from "@/components/step-dot";
import { TemplateCard } from "@/components/template-card";
import { UploadCropper } from "@/components/upload-cropper";
import { exportPreviewImage, exportPreviewPdf } from "@/lib/export-label";
import { validateCodeImage } from "@/lib/code-validation";
import { createClient } from "@/lib/supabase/client";
import { TEMPLATE_IDS, TEMPLATES } from "@/lib/templates";
import { cn, extractAusPostTracking } from "@/lib/utils";
import type { CodeValidation, LabelDetails, TemplateId } from "@/types";

const steps = ["Template", "Crop Code", "Details", "Export"];

const emptyValidation: CodeValidation = {
  status: "idle",
  message: "No code image selected yet.",
};

const initialDetails: LabelDetails = {
  itemName: "",
  quantity: "1",
  orderRef: "",
  trackingNumber: "",
};

function getInitialDetails(): LabelDetails {
  if (typeof window === "undefined") {
    return initialDetails;
  }

  const params = new URLSearchParams(window.location.search);
  const orderRef = params.get("orderRef") || params.get("ebayOrderId") || "";
  const itemName = params.get("itemName") || "";
  const quantity = params.get("quantity") || "";

  return {
    ...initialDetails,
    orderRef,
    itemName,
    quantity: quantity && Number(quantity) > 0 ? quantity : initialDetails.quantity,
  };
}

interface LabelWizardProps {
  authEnabled?: boolean;
  userId?: string | null;
}

interface RecentLabel {
  id: string;
  template_id: TemplateId;
  item_name: string;
  created_at: string;
}

async function hashDataUrl(dataUrl: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dataUrl));

  return `sha256:${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function LabelWizard({
  authEnabled = false,
  userId = null,
}: LabelWizardProps) {
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<TemplateId>("auspost_qr");
  const [codeImage, setCodeImage] = useState<string | null>(null);
  const [validation, setValidation] = useState<CodeValidation>(emptyValidation);
  const [secondaryImage, setSecondaryImage] = useState<string | null>(null);
  const [secondaryValidation, setSecondaryValidation] = useState<CodeValidation>(emptyValidation);
  const [details, setDetails] = useState<LabelDetails>(getInitialDetails);
  const [exportState, setExportState] = useState<string | null>(null);
  const [recentLabels, setRecentLabels] = useState<RecentLabel[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [trackingCopied, setTrackingCopied] = useState(false);

  const template = TEMPLATES[templateId];

  const handleManualScan = useCallback(async (isAuto = false) => {
    const node = document.getElementById("label-preview");
    if (!node) {
      if (!isAuto) {
        setScanError("Label preview is not available to scan.");
      }
      return;
    }

    setScanning(true);
    if (!isAuto) {
      setScanError(null);
    }

    try {
      const labelDataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 4,
        backgroundColor: "#ffffff",
      });

      let result = await validateCodeImage(labelDataUrl, template.codeType);

      // Fallback: If full label scan fails, attempt scanning the high-resolution cropped source directly
      if (!result.rawValue && codeImage) {
        result = await validateCodeImage(codeImage, template.codeType);
      }

      if (result.rawValue) {
        const tracking = extractAusPostTracking(result.rawValue) || result.rawValue;
        setDetails((prev) => ({ ...prev, trackingNumber: tracking }));
        setTrackingCopied(false);
        setScanError(null);
      } else {
        if (!isAuto) {
          setScanError(result.message || "No QR code detected in the rendered label.");
        }
      }
    } catch {
      if (!isAuto) {
        setScanError("An error occurred while scanning the label QR code.");
      }
    } finally {
      setScanning(false);
    }
  }, [codeImage, template.codeType]);

  useEffect(() => {
    if (step === 3 && templateId === "auspost_qr" && codeImage) {
      const timer = setTimeout(() => {
        setScanError(null);
        void handleManualScan(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, templateId, codeImage, handleManualScan]);

  const secondaryTemplate = useMemo(() => {
    if (!template.secondaryCodeLabel) {
      return null;
    }

    return {
      ...template,
      name: template.secondaryCodeLabel,
      shortName: template.secondaryCodeLabel,
      type: template.secondaryCodeHelp || "Secondary label",
      codeType: template.secondaryCodeType || "barcode",
      codeLabel: template.secondaryCodeLabel,
      aspectRatio: template.secondaryAspectRatio || 3.45,
      showItemTable: false,
    };
  }, [template]);

  const canContinue = useMemo(() => {
    if (step === 0) {
      return Boolean(templateId);
    }

    if (step === 1) {
      return Boolean(codeImage) && (!template.secondaryRequired || Boolean(secondaryImage));
    }

    if (step === 2) {
      if (!template.showItemTable) {
        return true;
      }

      return details.itemName.trim().length > 0 && Number(details.quantity) > 0;
    }

    return true;
  }, [
    codeImage,
    details.itemName,
    details.quantity,
    secondaryImage,
    step,
    template.secondaryRequired,
    template.showItemTable,
    templateId,
  ]);

  const loadRecentLabels = useCallback(async () => {
    if (!authEnabled || !userId) {
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("label_history")
        .select("id, template_id, item_name, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(error.message || "Failed to load recent labels");
      }

      setRecentLabels((data || []) as RecentLabel[]);
      setHistoryError(null);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Could not load recent labels.");
    }
  }, [authEnabled, userId]);

  async function logLabelHistory(format: "png" | "jpg" | "pdf") {
    if (!authEnabled || !userId || !codeImage) {
      return;
    }

    const supabase = createClient();
    const quantity = Number.parseInt(details.quantity, 10);
    const { error } = await supabase.from("label_history").insert({
      user_id: userId,
      template_id: template.id,
      item_name: details.itemName.trim() || template.name,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      order_ref: details.orderRef.trim() || null,
      code_image_url: await hashDataUrl(codeImage),
      output_format: format,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message || "Database logging failed");
    }

    await loadRecentLabels();
  }

  async function copyTrackingNumber() {
    const trackingNumber = details.trackingNumber?.trim();

    if (!trackingNumber) {
      return;
    }

    try {
      await navigator.clipboard.writeText(trackingNumber);
      setTrackingCopied(true);
      window.setTimeout(() => setTrackingCopied(false), 1800);
    } catch {
      setScanError("Could not copy the tracking number. Select it and copy manually.");
    }
  }

  async function runExport(kind: "png" | "jpg" | "pdf") {
    if (!codeImage) {
      return;
    }

    setExportState(`Preparing ${kind.toUpperCase()}`);

    try {
      if (kind === "pdf") {
        await exportPreviewPdf({ template, details, codeImage, secondaryImage });
      } else {
        await exportPreviewImage(kind, { template, details, codeImage, secondaryImage });
      }
      await logLabelHistory(kind);
      setExportState(`${kind.toUpperCase()} downloaded`);
      window.setTimeout(() => setExportState(null), 1800);
    } catch (error) {
      setExportState(error instanceof Error ? error.message : "Export failed");
    }
  }

  function resetAll() {
    setStep(0);
    setTemplateId("auspost_qr");
    setCodeImage(null);
    setValidation(emptyValidation);
    setSecondaryImage(null);
    setSecondaryValidation(emptyValidation);
    setDetails(initialDetails);
    setExportState(null);
    setTrackingCopied(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <nav
          aria-label="Progress"
          className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm no-print"
        >
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-4">
              <StepDot index={index} label={label} active={step === index} complete={step > index} />
              {index < steps.length - 1 ? (
                <div className="hidden h-[2px] w-12 bg-slate-100 md:block" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
          <section className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md p-6 shadow-panel no-print animate-slide-up">
            <div className="flex-1">
              {step === 0 ? (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Select Return Method</h2>
                    <p className="mt-1.5 text-xs font-medium text-slate-500 leading-normal">
                      Match the return option given by the supplier marketplace.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {TEMPLATE_IDS.map((id) => (
                      <TemplateCard
                        key={id}
                        template={TEMPLATES[id]}
                        selected={templateId === id}
                        onSelect={() => {
                          setTemplateId(id);
                          setCodeImage(null);
                          setValidation(emptyValidation);
                          setSecondaryImage(null);
                          setSecondaryValidation(emptyValidation);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Crop Code Image</h2>
                    <p className="mt-1.5 text-xs font-medium text-slate-500 leading-normal">
                      Upload a screenshot, or drag the QR, barcode, or label image directly from the Amazon return page.
                    </p>
                  </div>

                  <UploadCropper
                    template={template}
                    codeImage={codeImage}
                    validation={validation}
                    onChange={(image, result) => {
                      setCodeImage(image);
                      setValidation(result);
                    }}
                  />
                  {secondaryTemplate ? (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <UploadCropper
                        template={secondaryTemplate}
                        codeImage={secondaryImage}
                        validation={secondaryValidation}
                        onChange={(image, result) => {
                          setSecondaryImage(image);
                          setSecondaryValidation(result);
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Return Details</h2>
                    <p className="mt-1.5 text-xs font-medium text-slate-500 leading-normal">
                      {template.showItemTable
                        ? "Enter product name and quantity to match the eBay order."
                        : "No item description needed for this template. Reference ID is optional."}
                    </p>
                  </div>
                  <DetailsForm
                    details={details}
                    onChange={setDetails}
                    showItemFields={template.showItemTable}
                  />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Export Clean Label</h2>
                    <p className="mt-1.5 text-xs font-medium text-slate-500 leading-normal">
                      Download your converted label in image formats or optimized A4 PDF.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => void runExport("png")}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-bold text-white shadow-sm shadow-blue-100 hover:bg-blue-600 transition hover-lift"
                    >
                      <Download className="h-4.5 w-4.5" aria-hidden="true" />
                      PNG Image
                    </button>
                    <button
                      type="button"
                      onClick={() => void runExport("jpg")}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition hover-lift"
                    >
                      <Download className="h-4.5 w-4.5" aria-hidden="true" />
                      JPG Image
                    </button>
                    <button
                      type="button"
                      onClick={() => void runExport("pdf")}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition hover-lift"
                    >
                      <FileDown className="h-4.5 w-4.5 text-slate-500" aria-hidden="true" />
                      A4 PDF
                    </button>
                  </div>

                  {templateId === "auspost_qr" && codeImage && (
                    <div className="mt-6 border-t border-slate-100 pt-5 space-y-1.5 animate-slide-up">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="trackingNumber">
                        Australia Post Tracking Number
                      </label>
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                        <input
                          id="trackingNumber"
                          type="text"
                          value={details.trackingNumber || ""}
                          onChange={(e) => {
                            setDetails({ ...details, trackingNumber: e.target.value });
                            setTrackingCopied(false);
                          }}
                          placeholder="e.g. 9970189033320156"
                          className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                        />
                        <button
                          type="button"
                          disabled={!details.trackingNumber?.trim()}
                          onClick={() => void copyTrackingNumber()}
                          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 hover-lift"
                        >
                          {trackingCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                          )}
                          {trackingCopied ? "Copied" : "Copy"}
                        </button>
                        <button
                          type="button"
                          disabled={scanning}
                          onClick={() => void handleManualScan(false)}
                          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover-lift shrink-0"
                        >
                          {scanning ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Scan className="h-3.5 w-3.5 text-slate-500" />
                          )}
                          Scan QR
                        </button>
                      </div>
                      {scanError ? (
                        <p className="text-[10px] text-red-500 font-semibold">{scanError}</p>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium">
                          Scanned from the output label. You can edit it manually or trigger a re-scan.
                        </p>
                      )}
                      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs font-medium leading-5 text-slate-600">
                        <ul className="space-y-2">
                          <li>
                            Copy this tracking number and paste it into the eBay return upload page.
                          </li>
                          <li>
                            To verify it manually, check the tracking number on{" "}
                            <a
                              className="inline-flex items-center gap-1 font-bold text-blue-600 underline"
                              href="https://auspost.com.au/mypost/track/search"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Australia Post tracking
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                            .
                          </li>
                          <li>
                            Tracking may not be active instantly after it is generated. It can take 5-10 minutes
                            or longer to appear on the Australia Post website. You can wait to verify it, or upload it
                            without waiting at your own discretion.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {exportState ? (
                    <div
                      className={cn(
                        "mt-5 rounded-xl border p-4 text-xs font-bold transition-all duration-300",
                        exportState.includes("failed") || exportState.includes("not")
                          ? "border-red-100 bg-red-50 text-red-700 shadow-sm"
                          : "border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-50/50 animate-pulse-soft",
                      )}
                    >
                      {exportState}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition hover-lift shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition hover-lift"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset
                </button>
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                    disabled={!canContinue}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-500 px-5 text-sm font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm shadow-blue-100 transition hover-lift"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3 no-print">
              <div>
                <h2 className="text-sm font-bold text-slate-800 leading-none">Output Preview</h2>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Visually inspect the final converted format.</p>
              </div>
              <div
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: template.accent }}
              >
                {template.shortName}
              </div>
            </div>

            <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-panel">
              <LabelPreview
                template={template}
                details={details}
                codeImage={codeImage}
                secondaryImage={secondaryImage}
              />
            </div>
          </section>
        </div>

        {authEnabled && userId ? (
          <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-md shadow-sm no-print overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setHistoryOpen((open) => {
                  if (!open) {
                    void loadRecentLabels();
                  }

                  return !open;
                });
              }}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition duration-250"
            >
              <span className="inline-flex items-center gap-2.5 text-sm font-bold text-slate-700">
                <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Recent Converted Labels
              </span>
              <ChevronDown
                className={cn("h-4 w-4 text-slate-400 transition-transform duration-300", historyOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            {historyOpen ? (
              <div className="border-t border-slate-100 px-5 py-4 bg-white/40">
                {historyError ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 shadow-sm">
                    {historyError}
                  </div>
                ) : recentLabels.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {recentLabels.map((label) => (
                      <div key={label.id} className="grid gap-2 py-3.5 sm:grid-cols-[180px_1fr_140px] items-center hover:bg-slate-50/30 rounded-lg px-2 transition">
                        <div className="text-xs font-extrabold text-slate-800">
                          {TEMPLATES[label.template_id]?.shortName || label.template_id}
                        </div>
                        <div className="truncate text-xs text-slate-600 font-medium">{label.item_name}</div>
                        <div className="text-xs text-slate-400 font-bold">
                          {new Date(label.created_at).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs font-medium text-slate-400 py-2">No converted labels found. Start by converting one above!</div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}
    </div>
  );
}
