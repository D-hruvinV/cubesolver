"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCubeScan } from "@/context/cube-scan-context";
import { faces } from "@/lib/faces";

export default function ReviewPage() {
  const {
    images,
    userOverridesByFace,
    resetAll,
    sampleAndClassifyAllFaces,
    isSamplingAllFaces,
    samplingAllFacesError
  } = useCubeScan();

  useEffect(() => {
    const hasAllImages = faces.every((face) => Boolean(images[face.id]));
    if (!hasAllImages) return;
    void sampleAndClassifyAllFaces();
  }, [images, sampleAndClassifyAllFaces]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-4 sm:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Review Captures</h1>
            <p className="text-sm text-slate-600">Check all six face photos before moving on.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/solve"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Validate Cube
            </Link>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Reset
            </button>
            <Link
              href="/scan"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Back to Scan
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {faces.map((face) => {
            const image = images[face.id];
            return (
              <article
                key={face.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <Link href={`/inspect/${face.id}`} className="block aspect-square bg-slate-100">
                  {image ? (
                    <img src={image} alt={`${face.label} face`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No image captured
                    </div>
                  )}
                </Link>
                <div className="flex items-center justify-between p-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">{face.label}</h2>
                    <p className="text-xs text-slate-500">
                      {Object.keys(userOverridesByFace[face.id]).length > 0 ? "Edited" : "Auto"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/inspect/${face.id}`}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      Inspect
                    </Link>
                    <Link
                      href={`/scan?step=${face.id}`}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Retake
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {isSamplingAllFaces ? (
          <p className="mt-4 text-sm text-slate-600">Analyzing colors across all faces...</p>
        ) : null}
        {samplingAllFacesError ? (
          <p className="mt-2 text-sm text-red-600">{samplingAllFacesError}</p>
        ) : null}
      </div>
    </main>
  );
}
