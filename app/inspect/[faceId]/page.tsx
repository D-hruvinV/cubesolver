"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaceInspector } from "@/components/face-inspector";
import { useCubeScan } from "@/context/cube-scan-context";
import { faces } from "@/lib/faces";

export default function InspectFacePage() {
  const router = useRouter();
  const params = useParams<{ faceId: string }>();
  const { images } = useCubeScan();

  const requestedFaceId = params.faceId;

  const matchedFace = useMemo(() => faces.find((face) => face.id === requestedFaceId), [requestedFaceId]);
  const isValidFace = Boolean(matchedFace);

  useEffect(() => {
    if (!isValidFace) {
      router.replace("/review");
    }
  }, [isValidFace, router]);

  if (!isValidFace || !matchedFace) {
    return null;
  }

  const imageDataUrl = images[matchedFace.id];
  if (!imageDataUrl) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center p-4 sm:p-6">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Inspect: {matchedFace.label}</h1>
          <p className="mt-2 text-sm text-slate-600">
            No image was found for this face. Capture the face photo first, then inspect it here.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/scan"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Go to Scan
            </Link>
            <Link
              href="/review"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Back to Review
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <FaceInspector
      faceId={matchedFace.id}
      faceLabel={matchedFace.label}
      imageDataUrl={imageDataUrl}
    />
  );
}
