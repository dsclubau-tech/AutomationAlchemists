import type { LabelDetails, LabelTemplate } from "@/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function buildFileName(template: LabelTemplate, details: LabelDetails, extension: string) {
  const ref = details.orderRef.trim() || "return-label";
  const safeRef = ref.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const safeTemplate = template.shortName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return `${safeRef || "return-label"}-${safeTemplate}.${extension}`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function extractAusPostTracking(rawValue: string): string | null {
  if (!rawValue) return null;

  const cleaned = rawValue.trim();
  try {
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      const url = new URL(cleaned);
      const pathname = url.pathname;
      const segments = pathname.split("/").filter(Boolean);
      for (const segment of segments) {
        if (/^(?:99\d{14}|[A-Z0-9]{21,24}|[A-Z]{2}\d{9}[A-Z]{2})/i.test(segment)) {
          return segment;
        }
      }
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && /^[A-Z0-9]{10,25}$/i.test(lastSegment)) {
        return lastSegment;
      }
    }
  } catch {
    // ignore URL parse error
  }

  // 23 character tracking starting with 36 or 38 (alphanumeric)
  const match23 = cleaned.match(/(3[68][A-Z0-9]{21})/i);
  if (match23) return match23[1];

  // 21 character tracking starting with 33 (alphanumeric)
  const match21 = cleaned.match(/(33[A-Z0-9]{19})/i);
  if (match21) return match21[1];

  // 16 character tracking starting with 99 (numeric)
  const match16 = cleaned.match(/(99\d{14})/);
  if (match16) return match16[1];

  // 13 character international tracking
  const match13 = cleaned.match(/([A-Z]{2}\d{9}AU)/i);
  if (match13) return match13[1];

  if (/^[A-Z0-9]{10,25}$/i.test(cleaned)) {
    return cleaned;
  }

  return null;
}

