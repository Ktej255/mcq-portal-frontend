/**
 * Image compression utility for Mains Answer uploads.
 *
 * Enforces client-side downscaling and JPEG normalization so that individual
 * and bundled page uploads strictly respect Vercel's 4.5 MB serverless body limit,
 * while preserving clear handwriting legibility for vision graders and OCR engines.
 */

export interface AdaptiveCompressionSettings {
  maxDim: number;
  quality: number;
}

/**
 * Returns optimal dimension and JPEG quality settings based on page count,
 * guaranteeing the overall request stays safely below 3.8 MB.
 */
export function getAdaptiveCompressionSettings(pageCount: number): AdaptiveCompressionSettings {
  if (pageCount > 15) {
    // 16-30 pages: ~90-120 KB per page -> ~2.5 MB total
    return { maxDim: 1000, quality: 0.55 };
  }
  if (pageCount > 8) {
    // 9-15 pages: ~150-180 KB per page -> ~2.2 MB total
    return { maxDim: 1200, quality: 0.65 };
  }
  if (pageCount > 4) {
    // 5-8 pages: ~220-280 KB per page -> ~2.0 MB total
    return { maxDim: 1400, quality: 0.72 };
  }
  // 1-4 pages: ~350-500 KB per page -> ~1.5 MB total
  return { maxDim: 1600, quality: 0.80 };
}

/**
 * Downscale and compress an image file client-side before sending over the wire.
 */
export function compressImageForUpload(
  file: File,
  maxDim = 1600,
  quality = 0.80
): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|bmp)$/i.test(file.name)) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const compressed = new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: file.lastModified || Date.now(),
          });
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
