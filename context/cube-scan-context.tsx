"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { faceIdToCubeLetter, faces, type CubeFaceLetter, type FaceId } from "@/lib/faces";
import { sampleGridColorsFromDataUrl, type RGB } from "@/lib/color";
import { nearestCenterColor } from "@/lib/colorspace";

export type FaceImages = Record<FaceId, string | null>;
const STORAGE_KEY = "rubiks-scan-v1";
type SampledColorsByFace = Record<FaceId, RGB[]>;
type DerivedCenters = Record<FaceId, RGB | null>;
type AutoLabelsByFace = Record<FaceId, CubeFaceLetter[]>;
type UserOverridesByFace = Record<FaceId, Partial<Record<number, CubeFaceLetter>>>;

type PersistedCubeScan = {
  images: FaceImages;
  userOverridesByFace?: UserOverridesByFace;
  autoLabelsByFace?: AutoLabelsByFace;
  sampledColorsByFace?: SampledColorsByFace;
  derivedCenters?: DerivedCenters;
};


type CubeScanContextValue = {
  images: FaceImages;
  sampledColorsByFace: SampledColorsByFace;
  derivedCenters: DerivedCenters;
  autoLabelsByFace: AutoLabelsByFace;
  userOverridesByFace: UserOverridesByFace;
  isSamplingAllFaces: boolean;
  samplingAllFacesError: string | null;
  setImage: (face: FaceId, dataUrl: string) => void;
  clearImage: (face: FaceId) => void;
  setOverride: (face: FaceId, index: number, letter: CubeFaceLetter) => void;
  clearOverride: (face: FaceId, index: number) => void;
  resetFaceOverrides: (face: FaceId) => void;
  getFinalLabels: (face: FaceId) => CubeFaceLetter[];
  sampleAndClassifyAllFaces: () => Promise<void>;
  resetAll: () => void;
};

const createInitialImages = (): FaceImages =>
  faces.reduce((acc, face) => {
    acc[face.id] = null;
    return acc;
  }, {} as FaceImages);

const createEmptySampledColors = (): SampledColorsByFace =>
  faces.reduce((acc, face) => {
    acc[face.id] = [];
    return acc;
  }, {} as SampledColorsByFace);

const createEmptyCenters = (): DerivedCenters =>
  faces.reduce((acc, face) => {
    acc[face.id] = null;
    return acc;
  }, {} as DerivedCenters);

const createEmptyAutoLabels = (): AutoLabelsByFace =>
  faces.reduce((acc, face) => {
    acc[face.id] = [];
    return acc;
  }, {} as AutoLabelsByFace);

const createEmptyOverrides = (): UserOverridesByFace =>
  faces.reduce((acc, face) => {
    acc[face.id] = {};
    return acc;
  }, {} as UserOverridesByFace);

function normalizeStoredImages(value: unknown): FaceImages | null {
  if (!value || typeof value !== "object") return null;

  const incoming = value as Partial<Record<FaceId, unknown>>;
  const next = createInitialImages();

  for (const face of faces) {
    const item = incoming[face.id];
    if (typeof item === "string" || item === null) {
      next[face.id] = item;
    }
  }

  return next;
}

const CubeScanContext = createContext<CubeScanContextValue | undefined>(undefined);

export function CubeScanProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<FaceImages>(createInitialImages);
  const [sampledColorsByFace, setSampledColorsByFace] = useState<SampledColorsByFace>(
    createEmptySampledColors
  );
  const [derivedCenters, setDerivedCenters] = useState<DerivedCenters>(createEmptyCenters);
  const [autoLabelsByFace, setAutoLabelsByFace] = useState<AutoLabelsByFace>(createEmptyAutoLabels);
  const [userOverridesByFace, setUserOverridesByFace] = useState<UserOverridesByFace>(
    createEmptyOverrides
  );
  const [isSamplingAllFaces, setIsSamplingAllFaces] = useState(false);
  const [samplingAllFacesError, setSamplingAllFacesError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedCubeScan;

      // images
      const restoredImages = normalizeStoredImages(parsed.images ?? parsed);
      if (restoredImages) setImages(restoredImages);

      // overrides
      if (parsed.userOverridesByFace && typeof parsed.userOverridesByFace === "object") {
        setUserOverridesByFace((prev) => ({
          ...prev,
          ...parsed.userOverridesByFace
        }));
      }

      // Optional: restore these too (nice, not mandatory)
      if (parsed.autoLabelsByFace) setAutoLabelsByFace(parsed.autoLabelsByFace);
      if (parsed.sampledColorsByFace) setSampledColorsByFace(parsed.sampledColorsByFace);
      if (parsed.derivedCenters) setDerivedCenters(parsed.derivedCenters);
    }
  } catch {
    // Ignore malformed or inaccessible localStorage data.
  } finally {
    setIsHydrated(true);
  }
}, []);


  useEffect(() => {
    if (!isHydrated) return;
    try {
      const payload: PersistedCubeScan = {
      images,
      userOverridesByFace,
      autoLabelsByFace,
      sampledColorsByFace,
      derivedCenters
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    } catch {
      // Ignore storage write failures (e.g. private mode or quota issues).
    }
  }, [images, userOverridesByFace, autoLabelsByFace, sampledColorsByFace, derivedCenters, isHydrated]);


  const clearDerivedData = useCallback(() => {
    setSampledColorsByFace(createEmptySampledColors());
    setDerivedCenters(createEmptyCenters());
    setAutoLabelsByFace(createEmptyAutoLabels());
    setSamplingAllFacesError(null);
  }, []);

  const sampleAndClassifyAllFaces = useCallback(async () => {
    const entries = faces.map((face) => [face.id, images[face.id]] as const);
    const hasAllImages = entries.every(([, image]) => Boolean(image));
    if (!hasAllImages) return;

    setIsSamplingAllFaces(true);
    setSamplingAllFacesError(null);

    try {
      const sampledEntries = await Promise.all(
        entries.map(async ([faceId, imageDataUrl]) => {
          const colors = await sampleGridColorsFromDataUrl(imageDataUrl as string, { sampleSize: 18 });
          return [faceId, colors] as const;
        })
      );

      const nextSampled = createEmptySampledColors();
      for (const [faceId, colors] of sampledEntries) {
        nextSampled[faceId] = colors;
      }

      const nextCenters = createEmptyCenters();
      for (const face of faces) {
        const center = nextSampled[face.id][4];
        if (!center) {
          throw new Error(`Missing center sample for ${face.id}.`);
        }
        nextCenters[face.id] = center;
      }

      const centerLookup = faces.reduce((acc, face) => {
        const center = nextCenters[face.id];
        if (!center) {
          throw new Error(`Missing derived center for ${face.id}.`);
        }
        acc[face.id] = center;
        return acc;
      }, {} as Record<FaceId, RGB>);

      const nextAutoLabels = createEmptyAutoLabels();
      for (const face of faces) {
        nextAutoLabels[face.id] = nextSampled[face.id].map((rgb) => {
          const nearestFaceId = nearestCenterColor(rgb, centerLookup);
          return faceIdToCubeLetter[nearestFaceId];
        });
        // Force center sticker to the canonical face letter.
        nextAutoLabels[face.id][4] = faceIdToCubeLetter[face.id];
      }

      setSampledColorsByFace(nextSampled);
      setDerivedCenters(nextCenters);
      setAutoLabelsByFace(nextAutoLabels);
    } catch {
      setSamplingAllFacesError("Failed to sample and classify colors across all faces.");
    } finally {
      setIsSamplingAllFaces(false);
    }
  }, [images]);

  const value = useMemo(
    () => ({
      images,
      sampledColorsByFace,
      derivedCenters,
      autoLabelsByFace,
      userOverridesByFace,
      isSamplingAllFaces,
      samplingAllFacesError,
      setImage: (face: FaceId, dataUrl: string) => {
        clearDerivedData();
        setImages((prev) => ({ ...prev, [face]: dataUrl }));
      },
      clearImage: (face: FaceId) => {
        clearDerivedData();
        setImages((prev) => ({ ...prev, [face]: null }));
      },
      setOverride: (face: FaceId, index: number, letter: CubeFaceLetter) => {
        if (index < 0 || index > 8 || index === 4) return;
        setUserOverridesByFace((prev) => ({
          ...prev,
          [face]: {
            ...prev[face],
            [index]: letter
          }
        }));
      },
      clearOverride: (face: FaceId, index: number) => {
        if (index < 0 || index > 8) return;
        setUserOverridesByFace((prev) => {
          const nextFaceOverrides = { ...prev[face] };
          delete nextFaceOverrides[index];
          return { ...prev, [face]: nextFaceOverrides };
        });
      },
      resetFaceOverrides: (face: FaceId) => {
        setUserOverridesByFace((prev) => ({ ...prev, [face]: {} }));
      },
      getFinalLabels: (face: FaceId) => {
        const base = autoLabelsByFace[face];
        if (base.length !== 9) return [];
        const overrides = userOverridesByFace[face];
        const merged = [...base];
        for (let i = 0; i < 9; i += 1) {
          const override = overrides[i];
          if (override && i !== 4) {
            merged[i] = override;
          }
        }
        merged[4] = faceIdToCubeLetter[face];
        return merged;
      },
      sampleAndClassifyAllFaces,
      resetAll: () => {
        setImages(createInitialImages());
        clearDerivedData();
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore storage remove failures.
        }
      }
    }),
    [
      images,
      sampledColorsByFace,
      derivedCenters,
      autoLabelsByFace,
      userOverridesByFace,
      isSamplingAllFaces,
      samplingAllFacesError,
      clearDerivedData,
      sampleAndClassifyAllFaces
    ]
  );

  return <CubeScanContext.Provider value={value}>{children}</CubeScanContext.Provider>;
}

export function useCubeScan() {
  const ctx = useContext(CubeScanContext);
  if (!ctx) {
    throw new Error("useCubeScan must be used within CubeScanProvider.");
  }
  return ctx;
}
