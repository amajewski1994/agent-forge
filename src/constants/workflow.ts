export type WorkflowStepStatus = "done" | "active" | "pending";

export interface WorkflowStep {
  id: number;
  label: string;
  sublabel: string;
  status: WorkflowStepStatus;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 1, label: "Input", sublabel: "Idea received", status: "done" },
  { id: 2, label: "Analysis", sublabel: "Requirements", status: "done" },
  { id: 3, label: "Council", sublabel: "In progress", status: "active" },
  { id: 4, label: "Output", sublabel: "Generation", status: "pending" },
  { id: 5, label: "Review", sublabel: "Final check", status: "pending" },
];

export const STEP_STYLES: Record<WorkflowStepStatus, { circle: string; label: string }> = {
  done: {
    circle: "bg-emerald-500 border-emerald-400 shadow-emerald-500/30 shadow-md",
    label: "text-emerald-400",
  },
  active: {
    circle: "bg-indigo-500 border-indigo-400 shadow-indigo-500/40 shadow-md animate-pulse",
    label: "text-indigo-400",
  },
  pending: {
    circle: "bg-slate-900 border-slate-700",
    label: "text-slate-600",
  },
};
