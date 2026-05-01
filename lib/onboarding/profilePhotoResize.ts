/** Resize and encode profile photos so localStorage (~5MB) is not exceeded by a single data URL. */

const DEFAULT_MAX_EDGE = 720;
const DEFAULT_QUALITY = 0.82;
/** Target max serialized string length (UTF-16 ~ same as byte count for ASCII data URLs). */
const TARGET_MAX_CHARS = 450_000;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

async function decodeToDrawable(file: File): Promise<{ draw: HTMLImageElement | ImageBitmap; release?: () => void }> {
  if (typeof createImageBitmap !== "undefined") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        draw: bitmap,
        release: () => bitmap.close(),
      };
    } catch {
      /* fall through */
    }
  }
  const img = await loadImageFromFile(file);
  return { draw: img };
}

function intrinsicSize(source: HTMLImageElement | ImageBitmap): { w: number; h: number } {
  if (source instanceof HTMLImageElement) {
    return { w: source.naturalWidth, h: source.naturalHeight };
  }
  return { w: source.width, h: source.height };
}

export async function fileToProfileJpegDataUrl(
  file: File,
  maxEdge = DEFAULT_MAX_EDGE,
  initialQuality = DEFAULT_QUALITY
): Promise<string> {
  const { draw, release } = await decodeToDrawable(file);
  try {
    const { w, h } = intrinsicSize(draw);
    if (!w || !h) throw new Error("Invalid image size");

    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(draw, 0, 0, tw, th);

    let q = initialQuality;
    let dataUrl = canvas.toDataURL("image/jpeg", q);
    while (dataUrl.length > TARGET_MAX_CHARS && q > 0.45) {
      q -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", q);
    }
    if (!dataUrl.startsWith("data:image/jpeg") || dataUrl.length < 64) {
      throw new Error("Encode failed");
    }
    return dataUrl;
  } finally {
    release?.();
  }
}
