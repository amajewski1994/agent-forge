"use client";

import { useCouncilSim } from "@/context/CouncilSimContext";
import type { CouncilPhase } from "@/hooks/useCouncilSimulation";

const PHASE_LABEL: Record<CouncilPhase, string> = {
  idle:     "Ready to start",
  analysis: "Phase: Analysis",
  council:  "Phase: Discussion",
  conflict: "Phase: Resolution",
  decision: "Phase: Decision",
  output:   "Phase: Output",
  complete: "Session complete",
};

export default function ActiveSessionCard() {
  const { phase, isRunning } = useCouncilSim();

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800/50 overflow-hidden">
      <div className="px-3 pt-2.5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Product Strategy Session</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{PHASE_LABEL[phase]}</p>
          </div>
          <div className="shrink-0 flex items-center gap-1 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isRunning ? "bg-indigo-400 animate-pulse" : "bg-slate-600"}`} />
            <span className={`text-[9px] font-bold uppercase tracking-wide transition-colors ${isRunning ? "text-indigo-400" : "text-slate-600"}`}>
              {isRunning ? "Live" : "Idle"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/50 px-3 py-2">
        <button className="w-full flex items-center justify-between text-[10px] text-slate-600 hover:text-slate-300 transition-colors group">
          <span>View session details</span>
          <svg
            className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
