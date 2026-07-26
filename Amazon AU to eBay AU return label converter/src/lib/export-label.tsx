"use client";

import { pdf } from "@react-pdf/renderer";
import { toJpeg, toPng } from "html-to-image";
import { LabelPdfDocument } from "@/components/label-pdf";
import { buildFileName, downloadBlob, downloadDataUrl } from "@/lib/utils";
import type { LabelDetails, LabelTemplate } from "@/types";

type ImageFormat = "png" | "jpg";

interface ExportPayload {
  template: LabelTemplate;
  details: LabelDetails;
  codeImage: string;
  secondaryImage?: string | null;
}

function getPreviewNode() {
  const node = document.getElementById("label-preview");

  if (!node) {
    throw new Error("Label preview is not available.");
  }

  return node;
}

export async function exportPreviewImage(format: ImageFormat, payload: ExportPayload) {
  const node = getPreviewNode();
  const fileName = buildFileName(payload.template, payload.details, format);

  const options = {
    cacheBust: true,
    pixelRatio: 3,
    backgroundColor: "#ffffff",
  };

  const dataUrl =
    format === "jpg"
      ? await toJpeg(node, { ...options, quality: 1 })
      : await toPng(node, { ...options, quality: 1 });

  downloadDataUrl(dataUrl, fileName);
}

export async function exportPreviewPdf(payload: ExportPayload) {
  const blob = await pdf(
    <LabelPdfDocument
      template={payload.template}
      details={payload.details}
      codeImage={payload.codeImage}
      secondaryImage={payload.secondaryImage}
    />,
  ).toBlob();

  downloadBlob(blob, buildFileName(payload.template, payload.details, "pdf"));
}
