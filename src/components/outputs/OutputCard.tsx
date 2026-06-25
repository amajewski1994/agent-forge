import type { OutputItem } from "@/types";

interface OutputCardProps {
  item: OutputItem;
}

export default function OutputCard({ item }: OutputCardProps) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
        {item.ready ? (
          <svg className="w-4 h-4 text-emerald-400 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-3 h-3 rounded-full border border-slate-700" />
        )}
      </div>
      <span className={`text-[11px] leading-tight transition-colors duration-500 ${item.ready ? "text-slate-300" : "text-slate-600"}`}>
        {item.title}
      </span>
    </div>
  );
}
