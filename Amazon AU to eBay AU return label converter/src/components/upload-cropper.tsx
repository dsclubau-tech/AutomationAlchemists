"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { CheckCircle2, Crop, ImagePlus, Loader2, RotateCcw, ScanLine, Upload } from "lucide-react";
import { createCroppedImage, fileToDataUrl } from "@/lib/crop-image";
import { validateCodeImage } from "@/lib/code-validation";
import { cn } from "@/lib/utils";
import type { CodeValidation, LabelTemplate } from "@/types";

interface UploadCropperProps {
  template: LabelTemplate;
  codeImage: string | null;
  validation: CodeValidation;
  onChange: (image: string | null, validation: CodeValidation) => void;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const emptyValidation: CodeValidation = {
  status: "idle",
  message: "No code image selected yet.",
};

function getImageUrlFromDataTransfer(dataTransfer: DataTransfer): string | null {
  // Try text/uri-list
  const uriList = dataTransfer.getData("text/uri-list");
  if (uriList) {
    const urls = uriList.split("\n").map(u => u.trim()).filter(Boolean);
    if (urls.length > 0) return urls[0];
  }

  // Try URL
  const url = dataTransfer.getData("URL");
  if (url) return url;

  // Try text/html (extract src from img tag)
  const html = dataTransfer.getData("text/html");
  if (html) {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback to plain text if it looks like a URL
  const text = dataTransfer.getData("text");
  if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:image/"))) {
    return text;
  }

  return null;
}

export function UploadCropper({ template, codeImage, validation, onChange }: UploadCropperProps) {
  const inputId = useId();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeName = useMemo(() => {
    if (template.codeType === "qr") {
      return "QR code";
    }

    if (template.codeType === "barcode") {
      return "barcode";
    }

    return "printable label";
  }, [template.codeType]);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) {
        return;
      }

      setError(null);

      if (!file.type.startsWith("image/")) {
        setError("Upload a PNG, JPG, or WebP image.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("The image is larger than 8 MB. Use a smaller screenshot.");
        return;
      }

      const dataUrl = await fileToDataUrl(file);
      setSourceImage(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
      onChange(null, emptyValidation);
    },
    [onChange],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void handleFile(file);
            break;
          }
        }
      }
    },
    [handleFile],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      setError(null);

      // 1. Try file drop first (local storage)
      const file = event.dataTransfer.files[0];
      if (file) {
        void handleFile(file);
        return;
      }

      // 2. Try URL drag-and-drop (from another webpage)
      const imageUrl = getImageUrlFromDataTransfer(event.dataTransfer);
      if (imageUrl) {
        setBusy(true);
        try {
          if (imageUrl.startsWith("data:image/")) {
            setSourceImage(imageUrl);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedArea(null);
            onChange(null, emptyValidation);
          } else {
            const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
            let data: { dataUrl?: string; error?: string } = {};
            try {
              data = await res.json();
            } catch {
              // Ignore parse error and let status check handle it
            }

            if (!res.ok) {
              throw new Error(data.error || "Unable to fetch image from this URL.");
            }
            if (data.error) {
              throw new Error(data.error);
            }
            if (!data.dataUrl) {
              throw new Error("Failed to load image data URL.");
            }
            setSourceImage(data.dataUrl);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedArea(null);
            onChange(null, emptyValidation);
          }
        } catch (err) {
          const rawMsg = err instanceof Error ? err.message : "Failed to load dragged image.";
          if (imageUrl.includes("amazon.com") || rawMsg.toLowerCase().includes("authentication") || rawMsg.toLowerCase().includes("html page")) {
            setError("Unable to fetch Amazon image due to authentication/security. Try copying the image (Right-click -> Copy Image) and pasting it (Ctrl+V) here.");
          } else {
            setError(rawMsg);
          }
        } finally {
          setBusy(false);
        }
      }
    },
    [handleFile, onChange],
  );

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const confirmCrop = useCallback(async () => {
    if (!sourceImage || !croppedArea) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const cropped = await createCroppedImage(sourceImage, croppedArea);
      const result = await validateCodeImage(cropped, template.codeType);
      onChange(cropped, result);
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "Unable to crop this image.");
    } finally {
      setBusy(false);
    }
  }, [croppedArea, onChange, sourceImage, template.codeType]);

  const applyWholeImage = useCallback(async () => {
    if (!sourceImage) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await validateCodeImage(sourceImage, template.codeType);
      onChange(sourceImage, result);
    } catch {
      onChange(sourceImage, {
        status: "unsupported",
        message: "Image added. Please visually confirm it is readable before export.",
      });
    } finally {
      setBusy(false);
    }
  }, [onChange, sourceImage, template.codeType]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => void handleDrop(event)}
        className={cn(
          "rounded-xl border-2 border-dashed p-6 transition-all duration-300",
          dragging
            ? "border-blue-500 bg-blue-50/50 scale-[0.98] ring-4 ring-blue-50/50"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30",
        )}
      >
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <label
          htmlFor={inputId}
          className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 text-center"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-500 shadow-sm transition-transform duration-300 group-hover:scale-110">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold text-slate-700">
            Upload, paste, or drag in the {codeName}
          </span>
          <span className="max-w-sm text-xs font-medium leading-5 text-slate-400">
            Drop a file here, paste from clipboard (Ctrl+V), or drag the QR, barcode, or label image directly from the Amazon return page.
            Max 8 MB.
          </span>
        </label>
      </div>

      {sourceImage ? (
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink">Crop the {codeName}</div>
              <div className="text-xs text-neutral-500">
                Keep only the scannable code or full printable carrier label inside the frame.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSourceImage(null);
                onChange(null, emptyValidation);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>

          <div className="relative h-[320px] overflow-hidden rounded-md border border-line bg-neutral-950">
            <Cropper
              image={sourceImage}
              crop={crop}
              zoom={zoom}
              aspect={template.aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <label className="flex items-center gap-3 text-sm text-neutral-700">
              <span className="font-semibold text-ink">Zoom</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-action"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {template.codeType === "label" ? (
                <button
                  type="button"
                  onClick={() => void applyWholeImage()}
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 transition"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  )}
                  Use Full Image
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void confirmCrop()}
                disabled={busy || !croppedArea}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm transition"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Crop className="h-4 w-4" aria-hidden="true" />
                )}
                {busy ? "Processing..." : "Apply Crop"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {codeImage ? (
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
            Cropped image
          </div>
          <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
            <div className="grid min-h-32 place-items-center rounded-md border border-line bg-neutral-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={codeImage}
                alt={`Cropped ${codeName}`}
                className="max-h-48 max-w-full object-contain"
              />
            </div>
            <div
              className={cn(
                "rounded-md border px-3 py-2 text-sm leading-6",
                validation.status === "passed" && "border-green-200 bg-green-50 text-green-900",
                validation.status === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
                validation.status === "unsupported" &&
                  "border-neutral-200 bg-neutral-50 text-neutral-700",
                validation.status === "idle" && "border-neutral-200 bg-neutral-50 text-neutral-700",
              )}
            >
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <ScanLine className="h-4 w-4" aria-hidden="true" />
                Scan check
              </div>
              <p>{validation.message}</p>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}
    </div>
  );
}
