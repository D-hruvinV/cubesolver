"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaceCaptureStep } from "@/components/face-capture-step";
import { useCubeScan } from "@/context/cube-scan-context";
import { faces } from "@/lib/faces";
import { fileToCompressedJpegDataUrl } from "@/lib/image";

const instructions: Record<string, string> = {
  front: "Hold the cube with the front face centered and fully visible.",
  right: "Rotate to the right face and keep edges aligned in frame.",
  back: "Turn to the back face and avoid glare from direct light.",
  left: "Show the left face square-on to the camera.",
  up: "Tilt to capture the top face clearly from above.",
  down: "Flip to show the bottom face with all stickers visible."
};

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const { images, setImage, clearImage } = useCubeScan();

  const stepIndex = useMemo(() => {
    if (!stepParam) return 0;
    const idx = faces.findIndex((f) => f.id === stepParam);
    return idx === -1 ? 0 : idx;
  }, [stepParam]);

  const currentFace = faces[stepIndex];
  const currentImage = images[currentFace.id];

  const goToStep = (nextIndex: number) => {
    const face = faces[nextIndex];
    if (!face) return;
    router.push(`/scan?step=${face.id}`);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Cube Face Scan</h1>
        <p className="text-sm text-slate-600">Capture each face in the required order.</p>
      </div>

      <FaceCaptureStep
        faceLabel={currentFace.label}
        instruction={instructions[currentFace.id]}
        imageDataUrl={currentImage}
        stepIndex={stepIndex}
        totalSteps={faces.length}
        onSelectImage={async (file) => {
          const dataUrl = await fileToCompressedJpegDataUrl(file, 900, 0.8);
          setImage(currentFace.id, dataUrl);
        }}
        onRetake={() => clearImage(currentFace.id)}
        onBack={() => goToStep(stepIndex - 1)}
        onNext={() => {
          if (stepIndex === faces.length - 1) {
            router.push("/review");
            return;
          }
          goToStep(stepIndex + 1);
        }}
      />
    </main>
  );
}
