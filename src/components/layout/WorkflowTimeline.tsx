"use client";

import { WORKFLOW_STEPS, type WorkflowStepStatus } from "@/constants/workflow";
import { useCouncilSim } from "@/context/CouncilSimContext";
import type { CouncilPhase } from "@/hooks/useCouncilSimulation";
import WorkflowStepItem from "./WorkflowStepItem";

const PHASE_LABEL: Record<CouncilPhase, string> = {
  idle:             "Ready",
  analysis:         "Phase: Analysis",
  council:          "Phase: Discussion",
  conflict:         "Phase: Resolution",
  voting:           "Phase: Voting",
  decision:         "Phase: Decision",
  awaiting_proceed: "Phase: Decision",
  output:           "Phase: Output",
  complete:         "Complete",
};

const PHASE_STEPS: Record<CouncilPhase, WorkflowStepStatus[]> = {
  idle:             ["active",  "pending", "pending", "pending", "pending", "pending"],
  analysis:         ["done",    "active",  "pending", "pending", "pending", "pending"],
  council:          ["done",    "done",    "active",  "pending", "pending", "pending"],
  conflict:         ["done",    "done",    "active",  "pending", "pending", "pending"],
  voting:           ["done",    "done",    "active",  "pending", "pending", "pending"],
  decision:         ["done",    "done",    "done",    "active",  "pending", "pending"],
  awaiting_proceed: ["done",    "done",    "done",    "active",  "pending", "pending"],
  output:           ["done",    "done",    "done",    "done",    "active",  "pending"],
  complete:         ["done",    "done",    "done",    "done",    "done",    "done"],
};

export default function WorkflowTimeline() {
  const { phase } = useCouncilSim();
  const steps = WORKFLOW_STEPS.map((step, i) => ({
    ...step,
    status: PHASE_STEPS[phase][i],
  }));

  return (
    <div className="shrink-0 border-t border-slate-800/60 px-6 py-4 bg-slate-950/90">
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider shrink-0">
          Council Workflow
        </span>

        <div className="flex-1 flex items-center">
          {steps.map((step, index) => (
            <WorkflowStepItem
              key={step.id}
              step={step}
              nextStatus={steps[index + 1]?.status}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <div
            className={`w-1 h-1 rounded-full transition-colors ${
              phase === "complete"
                ? "bg-emerald-500"
                : phase !== "idle"
                ? "bg-indigo-500 animate-pulse"
                : "bg-slate-700"
            }`}
          />
          <span className="text-[10px] text-slate-600">{PHASE_LABEL[phase]}</span>
        </div>
      </div>
    </div>
  );
}
