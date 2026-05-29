"use client";

import { useCouncilSim } from "@/context/CouncilSimContext";
import type { CouncilPhase } from "@/hooks/useCouncilSimulation";

const PHASE_LABEL: Record<CouncilPhase, string> = {
  idle:     "Ready",
  analysis: "Phase: Analysis",
  council:  "Phase: Discussion",
  conflict: "Phase: Resolution",
  voting:   "Phase: Voting",
  decision: "Phase: Decision",
  output:   "Phase: Output",
  complete: "Complete",
};

export default function PhaseStatus() {
  const { phase } = useCouncilSim();
  return <span className="text-xs text-slate-700">{PHASE_LABEL[phase]}</span>;
}
