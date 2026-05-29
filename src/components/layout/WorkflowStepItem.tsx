import type { WorkflowStep, WorkflowStepStatus } from "@/constants/workflow";
import { STEP_STYLES } from "@/constants/workflow";
import StepCircle from "./StepCircle";

interface WorkflowStepItemProps {
  step: WorkflowStep;
  nextStatus?: WorkflowStepStatus;
  isLast: boolean;
}

function connectorClass(current: WorkflowStepStatus, next?: WorkflowStepStatus): string {
  if (current === "done" && next === "active") {
    return "bg-gradient-to-r from-emerald-500/50 to-indigo-500/30";
  }
  if (current === "done") {
    return "bg-emerald-500/40";
  }
  return "bg-slate-800/60";
}

function sublabelClass(status: WorkflowStepStatus): string {
  if (status === "active") return "text-indigo-400/60";
  if (status === "done") return "text-slate-600";
  return "text-slate-800";
}

export default function WorkflowStepItem({ step, nextStatus, isLast }: WorkflowStepItemProps) {
  const style = STEP_STYLES[step.status];

  return (
    <div className={`flex items-center ${isLast ? "" : "flex-1"}`}>
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <StepCircle step={step} />
        <div className="text-center">
          <p className={`text-xs font-semibold leading-none ${style.label}`}>{step.label}</p>
          <p className={`text-[10px] leading-none mt-0.5 ${sublabelClass(step.status)}`}>
            {step.sublabel}
          </p>
        </div>
      </div>
      {!isLast && (
        <div className={`flex-1 h-px mx-2 mb-4 ${connectorClass(step.status, nextStatus)}`} />
      )}
    </div>
  );
}
