import type { Decision } from "@/types";

interface DecisionCardProps {
  decision: Decision;
}

export default function DecisionCard({ decision }: DecisionCardProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 bg-emerald-950/30 border border-emerald-500/15">
      <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-xs text-slate-200 leading-relaxed">{decision.text}</span>
    </div>
  );
}
