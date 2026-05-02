import Cube from "cubejs";

let isSolverInitialized = false;

function ensureSolverInitialized() {
  if (isSolverInitialized) return;
  Cube.initSolver();
  isSolverInitialized = true;
}

export function solveCube(state: string): { moves: string[]; raw: string } {
  ensureSolverInitialized();
  const cube = Cube.fromString(state);
  const raw = cube.solve();
  const moves = raw.split(" ").map((m) => m.trim()).filter(Boolean);
  return { moves, raw };
}
