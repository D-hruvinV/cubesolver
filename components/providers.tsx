"use client";

import { CubeScanProvider } from "@/context/cube-scan-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <CubeScanProvider>{children}</CubeScanProvider>;
}
