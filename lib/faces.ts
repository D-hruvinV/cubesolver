export const faces = [
  { id: "front", label: "Front" },
  { id: "right", label: "Right" },
  { id: "back", label: "Back" },
  { id: "left", label: "Left" },
  { id: "up", label: "Up" },
  { id: "down", label: "Down" }
] as const;

export type FaceId = (typeof faces)[number]["id"];
export type CubeFaceLetter = "U" | "R" | "F" | "D" | "L" | "B";

export const cubeFaceLetters: CubeFaceLetter[] = ["U", "R", "F", "D", "L", "B"];

export const faceIdToCubeLetter: Record<FaceId, CubeFaceLetter> = {
  front: "F",
  right: "R",
  back: "B",
  left: "L",
  up: "U",
  down: "D"
};
