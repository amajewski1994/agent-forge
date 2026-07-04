"use client";

import { useCouncilSim } from "@/context/CouncilSimContext";
import type { CouncilPhase } from "@/hooks/useCouncilSimulation";

const DOT_COLOR: Record<string, string> = {
  "text-indigo-400":  "bg-indigo-400",
  "text-amber-400":   "bg-amber-400",
  "text-emerald-400": "bg-emerald-400",
  "text-violet-400":  "bg-violet-400",
  "text-slate-400":   "bg-slate-400",
};

function getStatus(
  phase: CouncilPhase,
  currentTopic: { stageNumber: number; topicTitle: string } | null,
): { label: string; sublabel?: string; color: string; pulse: boolean } | null {
  if (currentTopic) {
    return { label: `Stage ${currentTopic.stageNumber}`, sublabel: currentTopic.topicTitle, color: "text-indigo-400", pulse: true };
  }
  switch (phase) {
    case "idle":     return null;
    case "analysis":   return { label: "Analyzing",             color: "text-amber-400",   pulse: true  };
    case "activating": return { label: "Activating agents",     color: "text-amber-400",   pulse: true  };
    case "council":  return { label: "Debating",                color: "text-emerald-400", pulse: true  };
    case "conflict": return { label: "Conflict detected",       color: "text-amber-400",   pulse: true  };
    case "voting":   return { label: "Voting",                  color: "text-violet-400",  pulse: true  };
    case "decision":          return { label: "CEO Decision",           color: "text-emerald-400", pulse: false };
    case "awaiting_proceed":  return { label: "Waiting for you",         color: "text-indigo-400",  pulse: false };
    case "awaiting_generate": return { label: "Ready to generate",      color: "text-indigo-400",  pulse: false };
    case "output":            return { label: "Generating documents",   color: "text-slate-400",   pulse: true  };
    case "complete":         return { label: "Session complete",       color: "text-slate-500",   pulse: false };
  }
}

export default function CouncilStatusBar() {
  const { phase, currentTopic } = useCouncilSim();
  const status = getStatus(phase, currentTopic);

  return (
    <div className="shrink-0 px-4 py-2.5 border-b border-slate-800/40 flex items-center gap-2.5 min-h-9.5">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" />
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Council Chat</h2>
      {status && (
        <>
          <div className="w-px h-3 bg-slate-700 shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            {status.pulse && (
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${DOT_COLOR[status.color] ?? "bg-slate-400"}`} />
            )}
            <span className={`text-[11px] font-semibold shrink-0 ${status.color}`}>
              {status.label}
            </span>
            {status.sublabel && (
              <>
                <span className="text-[10px] text-slate-600 shrink-0">·</span>
                <span className="text-[11px] text-slate-400 truncate">{status.sublabel}</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
