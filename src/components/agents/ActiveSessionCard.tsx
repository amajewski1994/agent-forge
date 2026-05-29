export default function ActiveSessionCard() {
  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800/50 overflow-hidden">
      <div className="px-3 pt-2.5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Healthcare MVP Council</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Round 1 of 3</p>
          </div>
          <div className="shrink-0 flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide">Live</span>
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
