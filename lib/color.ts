export type RGB = { r: number; g: number; b: number };

export function rgbToHex(rgb: RGB): string {
  const toHex = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}


export async function sampleGridColorsFromDataUrl(
  dataUrl: string,
  opts: { sampleSize?: number } = {}
): Promise<RGB[]> {
  const sampleSize = opts.sampleSize ?? 12;

  const img = await loadImage(dataUrl);

  // Natural image dimensions
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  // ✅ Match "object-cover" into a square: center-crop to square
  const side = Math.min(w, h);
  const sx = Math.floor((w - side) / 2);
  const sy = Math.floor((h - side) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Draw the cropped square
  ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side);

  const cell = side / 3;
  const colors: RGB[] = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = Math.round((col + 0.5) * cell);
      const cy = Math.round((row + 0.5) * cell);

      const half = Math.floor(sampleSize / 2);
      const x0 = clamp(cx - half, 0, side - 1);
      const y0 = clamp(cy - half, 0, side - 1);
      const x1 = clamp(cx + half, 0, side - 1);
      const y1 = clamp(cy + half, 0, side - 1);

      const sw = Math.max(1, x1 - x0);
      const sh = Math.max(1, y1 - y0);

      const imageData = ctx.getImageData(x0, y0, sw, sh).data;

      let r = 0, g = 0, b = 0;
      const count = imageData.length / 4;

      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
      }

      colors.push({
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
      });
    }
  }

  return colors;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
