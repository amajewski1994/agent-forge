import type { WorkflowStep } from "@/constants/workflow";
import { STEP_STYLES } from "@/constants/workflow";

interface StepCircleProps {
  step: WorkflowStep;
}

export default function StepCircle({ step }: StepCircleProps) {
  const isActive = step.status === "active";
  const style = STEP_STYLES[step.status];

  return (
    <div
      className={[
        "rounded-full border-2 flex items-center justify-center transition-all duration-300",
        isActive ? "w-6 h-6" : "w-5 h-5",
        style.circle,
      ].join(" ")}
    >
      {step.status === "done" && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {step.status === "active" && <div className="w-2 h-2 rounded-full bg-white" />}
      {step.status === "pending" && (
        <span className="text-[9px] font-bold text-slate-500">{step.id}</span>
      )}
    </div>
  );
}
