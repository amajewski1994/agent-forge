"use client";

import { createContext, useContext } from "react";
import {
  useCouncilSimulation,
  type CouncilSimState,
} from "@/hooks/useCouncilSimulation";

const CouncilSimContext = createContext<CouncilSimState | null>(null);

export function CouncilSimProvider({ children }: { children: React.ReactNode }) {
  const sim = useCouncilSimulation();
  return (
    <CouncilSimContext.Provider value={sim}>{children}</CouncilSimContext.Provider>
  );
}

export function useCouncilSim(): CouncilSimState {
  const ctx = useContext(CouncilSimContext);
  if (!ctx) throw new Error("useCouncilSim must be used within CouncilSimProvider");
  return ctx;
}
