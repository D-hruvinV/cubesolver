"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cubeFaceLetters, faceIdToCubeLetter, faces, type FaceId } from "@/lib/faces";
import { useCubeScan } from "@/context/cube-scan-context";
import { rgbToHex, sampleGridColorsFromDataUrl, type RGB } from "@/lib/color";

type FaceInspectorProps = {
  faceId: FaceId;
  faceLabel: string;
  imageDataUrl: string;
};

export function FaceInspector({ faceId, faceLabel, imageDataUrl }: FaceInspectorProps) {
  const {
    images,
    sampledColorsByFace,
    userOverridesByFace,
    setOverride,
    clearOverride,
    resetFaceOverrides,
    getFinalLabels,
    sampleAndClassifyAllFaces
  } = useCubeScan();
  const [showGrid, setShowGrid] = useState(true);
  const [fallbackSampledColors, setFallbackSampledColors] = useState<RGB[] | null>(null);
  const [isSampling, setIsSampling] = useState(false);
  const [samplingError, setSamplingError] = useState<string | null>(null);
  const [activeStickerIndex, setActiveStickerIndex] = useState<number | null>(null);

  const contextSamples = sampledColorsByFace[faceId];
  const sampledColors = contextSamples.length === 9 ? contextSamples : fallbackSampledColors;
  const finalLabels = getFinalLabels(faceId);
  const faceOverrides = userOverridesByFace[faceId];

  useEffect(() => {
    const hasAllImages = faces.every((face) => Boolean(images[face.id]));
    if (!hasAllImages) return;
    if (finalLabels.length === 9) return;
    void sampleAndClassifyAllFaces();
  }, [images, finalLabels.length, sampleAndClassifyAllFaces]);

  useEffect(() => {
    if (contextSamples.length === 9) {
      setFallbackSampledColors(null);
      setIsSampling(false);
      setSamplingError(null);
      return;
    }

    let isMounted = true;

    async function runSampling() {
      setIsSampling(true);
      setSamplingError(null);
      setFallbackSampledColors(null);

      try {
        const colors = await sampleGridColorsFromDataUrl(imageDataUrl, { sampleSize: 18 });
        if (isMounted) {
          setFallbackSampledColors(colors);
        }
      } catch {
        if (isMounted) {
          setSamplingError("Could not sample colors from this image.");
        }
      } finally {
        if (isMounted) {
          setIsSampling(false);
        }
      }
    }

    runSampling();

    return () => {
      isMounted = false;
    };
  }, [imageDataUrl, contextSamples]);

  const expectedCenterLetter = faceIdToCubeLetter[faceId];

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl p-4 sm:p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inspect: {faceLabel}</h1>
            <p className="text-sm text-slate-600">Face ID: {faceId}</p>
          </div>
          <Link
            href="/review"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Back to Review
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(event) => setShowGrid(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />
            Show Grid
          </label>
        </div>

        <div className="mt-5">
          <div className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img src={imageDataUrl} alt={`${faceLabel} face`} className="h-full w-full object-cover" />

            {showGrid ? (
              <div className="pointer-events-none absolute inset-0 border border-white/90">
                <div className="absolute inset-y-0 left-1/3 w-px -translate-x-1/2 bg-white/90" />
                <div className="absolute inset-y-0 left-2/3 w-px -translate-x-1/2 bg-white/90" />
                <div className="absolute inset-x-0 top-1/3 h-px -translate-y-1/2 bg-white/90" />
                <div className="absolute inset-x-0 top-2/3 h-px -translate-y-1/2 bg-white/90" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-xl">
          <h2 className="text-lg font-semibold text-slate-900">Sampled Colors</h2>
          {isSampling ? <p className="mt-2 text-sm text-slate-600">Sampling...</p> : null}
          {samplingError ? <p className="mt-2 text-sm text-red-600">{samplingError}</p> : null}

          {!isSampling && !samplingError && sampledColors ? (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {sampledColors.map((rgb, index) => {
                const hex = rgbToHex(rgb);
                const mappedLetter = finalLabels[index];
                return (
                  <div
                    key={index}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    <div className="h-16 w-full sm:h-20" style={{ backgroundColor: hex }} />
                    <div className="px-2 py-1 text-center text-[11px] font-medium text-slate-700">{hex}</div>
                    <div className="px-2 pb-2 text-center text-[11px] text-slate-600">
                      Mapped: {mappedLetter ?? "N/A"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mx-auto mt-6 w-full max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Final Labels</h2>
            <button
              type="button"
              onClick={() => resetFaceOverrides(faceId)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              Reset this face
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Center is locked to {expectedCenterLetter}. Tap a sticker to override.
          </p>

          {finalLabels.length === 9 ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {finalLabels.map((letter, index) => {
                const isCenter = index === 4;
                const isEdited = Boolean(faceOverrides[index]);
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={isCenter}
                    onClick={() => setActiveStickerIndex(index)}
                    className="relative rounded-lg border border-slate-300 bg-white p-4 text-center text-lg font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {letter}
                    {isEdited ? (
                      <span className="absolute right-1.5 top-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Labels are not ready yet. Visit Review first.</p>
          )}
        </div>
      </section>

      {activeStickerIndex !== null ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Set label for sticker {activeStickerIndex + 1}
              </h3>
              <button
                type="button"
                onClick={() => setActiveStickerIndex(null)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {cubeFaceLetters.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => {
                    if (activeStickerIndex === null) return;
                    setOverride(faceId, activeStickerIndex, letter);
                    setActiveStickerIndex(null);
                  }}
                  className="rounded-md border border-slate-300 bg-white py-2 text-center text-sm font-semibold text-slate-900"
                >
                  {letter}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (activeStickerIndex === null) return;
                clearOverride(faceId, activeStickerIndex);
                setActiveStickerIndex(null);
              }}
              className="mt-3 w-full rounded-md border border-slate-300 py-2 text-sm font-medium text-slate-700"
            >
              Clear override
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
