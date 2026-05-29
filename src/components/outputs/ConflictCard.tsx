import type { Conflict } from "@/types";

interface ConflictCardProps {
  conflict: Conflict;
}

export default function ConflictCard({ conflict }: ConflictCardProps) {
  return (
    <div className="rounded-xl bg-amber-950/20 border border-amber-500/20 overflow-hidden animate-slide-up">
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
        <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs font-semibold text-amber-200">{conflict.title}</span>
      </div>
      <div className="px-3 pb-2.5 border-t border-amber-500/10">
        <p className="text-xs text-slate-500 leading-relaxed mt-2 mb-2.5">{conflict.description}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-600 uppercase tracking-wide">Resolved</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ✓ {conflict.resolution}
          </span>
        </div>
      </div>
    </div>
  );
}
