import { WORKFLOW_STEPS } from "@/constants/workflow";
import WorkflowStepItem from "./WorkflowStepItem";

export default function WorkflowTimeline() {
  return (
    <div className="shrink-0 border-t border-slate-800/60 px-6 py-4 bg-slate-950/90">
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider shrink-0">
          Council Workflow
        </span>

        <div className="flex-1 flex items-center">
          {WORKFLOW_STEPS.map((step, index) => (
            <WorkflowStepItem
              key={step.id}
              step={step}
              nextStatus={WORKFLOW_STEPS[index + 1]?.status}
              isLast={index === WORKFLOW_STEPS.length - 1}
            />
          ))}
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] text-slate-600">Round 1 of 3</span>
        </div>
      </div>
    </div>
  );
}
