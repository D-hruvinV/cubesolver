import type { FaceId } from "@/lib/faces";
import type { RGB } from "@/lib/color";

export type Lab = { l: number; a: number; b: number };

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function rgbToXyz(rgb: RGB): { x: number; y: number; z: number } {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  // sRGB (D65)
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  return { x, y, z };
}

export function rgbToLab(rgb: RGB): Lab {
  const { x, y, z } = rgbToXyz(rgb);

  // D65 reference white
  const refX = 0.95047;
  const refY = 1.0;
  const refZ = 1.08883;

  const fxInput = x / refX;
  const fyInput = y / refY;
  const fzInput = z / refZ;

  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;

  const f = (t: number) => (t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116);

  const fx = f(fxInput);
  const fy = f(fyInput);
  const fz = f(fzInput);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

export function deltaE(lab1: Lab, lab2: Lab): number {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

export function nearestCenterColor(
  sampleRgb: RGB,
  centerRgbs: Record<FaceId, RGB>
): FaceId {
  const sampleLab = rgbToLab(sampleRgb);
  const entries = Object.entries(centerRgbs) as Array<[FaceId, RGB]>;

  let bestFaceId = entries[0][0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [faceId, centerRgb] of entries) {
    const distance = deltaE(sampleLab, rgbToLab(centerRgb));
    if (distance < bestDistance) {
      bestDistance = distance;
      bestFaceId = faceId;
    }
  }

  return bestFaceId;
}
