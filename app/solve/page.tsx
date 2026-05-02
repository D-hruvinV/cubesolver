"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCubeScan } from "@/context/cube-scan-context";
import { buildCubeState, validateCubeState } from "@/lib/cube-state";
import { type CubeFaceLetter, type FaceId, faces } from "@/lib/faces";
import { solveCube } from "@/lib/solver";

const letterToFaceId: Record<CubeFaceLetter, FaceId> = {
  U: "up",
  R: "right",
  F: "front",
  D: "down",
  L: "left",
  B: "back"
};

export default function SolvePage() {
  const { getFinalLabels, images } = useCubeScan();
  const [copiedState, setCopiedState] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [solverError, setSolverError] = useState<string | null>(null);
  const [solutionRaw, setSolutionRaw] = useState("");
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [copiedMoves, setCopiedMoves] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const hasAllScans = useMemo(() => faces.every((face) => Boolean(images[face.id])), [images]);

  const labelsByFaceId = useMemo(
    () => ({
      up: getFinalLabels("up"),
      right: getFinalLabels("right"),
      front: getFinalLabels("front"),
      down: getFinalLabels("down"),
      left: getFinalLabels("left"),
      back: getFinalLabels("back")
    }),
    [getFinalLabels]
  );

  const buildResult = useMemo(
    () => buildCubeState({ labelsByFaceId, letterToFaceId }),
    [labelsByFaceId]
  );
  const validationErrors = useMemo(
    () => (buildResult.state ? validateCubeState(buildResult.state) : []),
    [buildResult.state]
  );
  const allErrors = [...buildResult.errors, ...validationErrors];
  const isValid = Boolean(buildResult.state) && allErrors.length === 0;

  if (!hasAllScans) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center p-4 sm:p-6">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Validate Cube</h1>
          <p className="mt-2 text-sm text-slate-600">
            No scans found yet. Capture all faces before validating cube state.
          </p>
          <div className="mt-5 flex gap-2">
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
    <main className="mx-auto min-h-screen w-full max-w-4xl p-4 sm:p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Validate Cube</h1>
          <Link
            href="/review"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Back to Review
          </Link>
        </div>

        <div className="mt-4">
          <span
            className={`inline-flex rounded-md px-3 py-1 text-sm font-semibold ${
              isValid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}
          >
            {isValid ? "Valid" : "Invalid"}
          </span>
        </div>

        {allErrors.length > 0 ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-red-700">
            {allErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-slate-700">Cube State (54 chars)</p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <code className="block break-all font-mono text-sm text-slate-800">
              {buildResult.state ?? "Unavailable"}
            </code>
          </div>
          <button
            type="button"
            disabled={!buildResult.state}
            onClick={async () => {
              if (!buildResult.state) return;
              await navigator.clipboard.writeText(buildResult.state);
              setCopiedState(true);
              window.setTimeout(() => setCopiedState(false), 1200);
            }}
            className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiedState ? "Copied" : "Copy"}
          </button>
        </div>

        {isValid ? (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <button
              type="button"
              disabled={isSolving}
              onClick={async () => {
                if (!buildResult.state) return;
                setIsSolving(true);
                setSolverError(null);
                try {
                  const result = solveCube(buildResult.state);
                  setSolutionRaw(result.raw);
                  setSolutionMoves(result.moves);
                  setCurrentStep(0);
                } catch {
                  setSolverError("Solver failed. Please re-check scanned faces.");
                  setSolutionRaw("");
                  setSolutionMoves([]);
                } finally {
                  setIsSolving(false);
                }
              }}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSolving ? "Solving..." : "Solve Cube"}
            </button>

            {solverError ? <p className="mt-3 text-sm text-red-700">{solverError}</p> : null}

            {solutionMoves.length > 0 ? (
              <div className="mt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">
                    Total moves: {solutionMoves.length}
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={stepMode}
                        onChange={(e) => {
                          setStepMode(e.target.checked);
                          setCurrentStep(0);
                        }}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Step Mode
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!solutionRaw) return;
                        await navigator.clipboard.writeText(solutionRaw);
                        setCopiedMoves(true);
                        window.setTimeout(() => setCopiedMoves(false), 1200);
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
                    >
                      {copiedMoves ? "Copied" : "Copy moves"}
                    </button>
                  </div>
                </div>

                {stepMode ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">
                      Step {currentStep + 1} of {solutionMoves.length}
                    </p>
                    <p className="mt-2 font-mono text-4xl font-bold text-slate-900">
                      {solutionMoves[currentStep]}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={currentStep >= solutionMoves.length - 1}
                        onClick={() =>
                          setCurrentStep((prev) => Math.min(solutionMoves.length - 1, prev + 1))
                        }
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : (
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-800">
                    {solutionMoves.map((move, index) => (
                      <li key={`${move}-${index}`} className="font-mono">
                        {move}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
