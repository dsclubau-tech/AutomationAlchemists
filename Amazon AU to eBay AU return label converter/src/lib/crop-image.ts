import type { Area } from "react-easy-crop";

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Unable to load image.")));
    image.src = src;
  });
}

export async function createCroppedImage(imageSrc: string, crop: Area, mimeType = "image/png") {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not prepare the cropped image.");
  }

  // Round crop dimensions and offsets to prevent sub-pixel interpolation or clipping
  // and constrain them within the original image boundaries
  const cropX = Math.max(0, Math.min(image.width - 1, Math.round(crop.x)));
  const cropY = Math.max(0, Math.min(image.height - 1, Math.round(crop.y)));
  const cropWidth = Math.max(1, Math.min(image.width - cropX, Math.round(crop.width)));
  const cropHeight = Math.max(1, Math.min(image.height - cropY, Math.round(crop.height)));

  canvas.width = cropWidth;
  canvas.height = cropHeight;

  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL(mimeType, 0.96);
}
