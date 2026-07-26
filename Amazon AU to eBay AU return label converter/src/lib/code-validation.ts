import type { CodeType, CodeValidation } from "@/types";

type BarcodeDetection = {
  rawValue?: string;
  format?: string;
};

type BarcodeDetectorInstance = {
  detect(source: HTMLImageElement): Promise<BarcodeDetection[]>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Unable to load image.")));
    image.src = src;
  });
}

function formatsFor(codeType: CodeType) {
  if (codeType === "qr") {
    return ["qr_code", "data_matrix", "pdf417", "aztec"];
  }

  if (codeType === "barcode") {
    return [
      "code_128",
      "code_39",
      "code_93",
      "codabar",
      "ean_13",
      "ean_8",
      "itf",
      "upc_a",
      "upc_e"
    ];
  }

  return [
    "qr_code",
    "data_matrix",
    "pdf417",
    "aztec",
    "code_128",
    "code_39",
    "code_93",
    "codabar",
    "ean_13",
    "ean_8",
    "itf",
    "upc_a",
    "upc_e"
  ];
}

export async function validateCodeImage(imageSrc: string, codeType: CodeType): Promise<CodeValidation> {
  const image = await loadImage(imageSrc);

  // 1. Try native BarcodeDetector if supported by the browser
  if (typeof window !== "undefined" && window.BarcodeDetector && codeType !== "label") {
    try {
      const detector = new window.BarcodeDetector({ formats: formatsFor(codeType) });
      const detections = await detector.detect(image);

      if (detections.length > 0) {
        return {
          status: "passed",
          message: "Code detected. The cropped image is ready for the label.",
          rawValue: detections[0]?.rawValue,
          formats: detections.map((detection) => detection.format || "unknown"),
        };
      }
    } catch {
      // Ignore native error, fall through to fallback
    }
  }

  // 2. Fallback to @zxing/browser if native detector fails or is not supported (Firefox, Safari, Mobile)
  if (codeType !== "label") {
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      const decodeResult = await reader.decodeFromImageUrl(imageSrc);

      if (decodeResult && decodeResult.getText()) {
        return {
          status: "passed",
          message: "Code detected. The cropped image is ready for the label.",
          rawValue: decodeResult.getText(),
          formats: [decodeResult.getBarcodeFormat()?.toString() || "unknown"],
        };
      }
    } catch {
      // Ignore zxing error
    }
  }

  // 3. Handle printable label templates
  if (codeType === "label") {
    return {
      status: "passed",
      message: "Printable label image is ready for the template.",
    };
  }

  // 4. Handle failed scanning with size-dependent warnings
  if (image.naturalWidth < 90 || image.naturalHeight < 90) {
    return {
      status: "warning",
      message: "The crop is quite small. Use a tighter screenshot or increase the crop area before exporting.",
    };
  }

  return {
    status: "warning",
    message: "No readable code was detected. Re-crop tightly around the QR/barcode and keep it sharp.",
  };
}
