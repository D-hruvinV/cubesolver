"use client";

type FaceCaptureStepProps = {
  faceLabel: string;
  instruction: string;
  imageDataUrl: string | null;
  stepIndex: number;
  totalSteps: number;
  onSelectImage: (file: File) => void;
  onRetake: () => void;
  onBack: () => void;
  onNext: () => void;
};

export function FaceCaptureStep({
  faceLabel,
  instruction,
  imageDataUrl,
  stepIndex,
  totalSteps,
  onSelectImage,
  onRetake,
  onBack,
  onNext
}: FaceCaptureStepProps) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        Step {stepIndex + 1} of {totalSteps}
      </p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">{faceLabel} Face</h2>
      <p className="mt-2 text-sm text-slate-600">{instruction}</p>

      <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
        <span className="text-sm font-medium text-slate-700">Capture or Choose Photo</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="mt-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelectImage(file);
          }}
        />
      </label>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {imageDataUrl ? (
          <img
            src={imageDataUrl}
            alt={`${faceLabel} preview`}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center text-sm text-slate-500">
            No image selected yet.
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetake}
          disabled={!imageDataUrl}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Retake
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={stepIndex === 0}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!imageDataUrl}
          className="ml-auto rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {stepIndex === totalSteps - 1 ? "Review" : "Next"}
        </button>
      </div>
    </div>
  );
}
