import { type CubeFaceLetter, type FaceId } from "@/lib/faces";

export const faceOrder: CubeFaceLetter[] = ["U", "R", "F", "D", "L", "B"];

type BuildCubeStateParams = {
  labelsByFaceId: Partial<Record<FaceId, CubeFaceLetter[]>>;
  letterToFaceId: Record<CubeFaceLetter, FaceId>;
};

export function buildCubeState(params: BuildCubeStateParams): { state: string | null; errors: string[] } {
  const { labelsByFaceId, letterToFaceId } = params;
  const errors: string[] = [];
  const chunks: string[] = [];

  for (const letter of faceOrder) {
    const faceId = letterToFaceId[letter];
    const labels = labelsByFaceId[faceId];

    if (!labels) {
      errors.push(`Missing labels for face ${letter} (${faceId}).`);
      continue;
    }

    if (labels.length !== 9) {
      errors.push(`Face ${letter} (${faceId}) has ${labels.length} labels; expected 9.`);
      continue;
    }

    chunks.push(labels.join(""));
  }

  if (errors.length > 0) {
    return { state: null, errors };
  }

  return { state: chunks.join(""), errors: [] };
}

export function validateCubeState(state: string): string[] {
  const errors: string[] = [];
  const allowed = new Set<CubeFaceLetter>(["U", "R", "F", "D", "L", "B"]);

  if (state.length !== 54) {
    errors.push(`State length is ${state.length}; expected 54.`);
  }

  const invalidChars = state
    .split("")
    .filter((char) => !allowed.has(char as CubeFaceLetter));
  if (invalidChars.length > 0) {
    const unique = Array.from(new Set(invalidChars)).join(", ");
    errors.push(`State contains invalid characters: ${unique}. Allowed: U,R,F,D,L,B.`);
  }

  const counts: Record<CubeFaceLetter, number> = {
    U: 0,
    R: 0,
    F: 0,
    D: 0,
    L: 0,
    B: 0
  };

  for (const char of state) {
    if (allowed.has(char as CubeFaceLetter)) {
      counts[char as CubeFaceLetter] += 1;
    }
  }

  for (const letter of faceOrder) {
    if (counts[letter] !== 9) {
      errors.push(`Count for ${letter} is ${counts[letter]}; expected 9.`);
    }
  }

  return errors;
}
