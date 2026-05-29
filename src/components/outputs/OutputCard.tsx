import type { OutputItem } from "@/types";

interface OutputCardProps {
  item: OutputItem;
}

export default function OutputCard({ item }: OutputCardProps) {
  return (
    <div
      className={[
        "rounded-xl p-2.5 border transition-all",
        item.ready
          ? "bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/15 hover:border-indigo-400/50 cursor-pointer"
          : "bg-slate-900/20 border-slate-800/30 opacity-40 cursor-default",
      ].join(" ")}
    >
      <div className="text-lg mb-1.5 leading-none">{item.icon}</div>
      <p className={`text-xs font-medium leading-tight ${item.ready ? "text-slate-200" : "text-slate-400"}`}>
        {item.title}
      </p>
      <p className="text-[10px] text-slate-600 leading-tight mt-0.5">{item.subtitle}</p>
      {item.ready && (
        <p className="text-[10px] font-medium text-indigo-400 mt-1.5">Ready ↗</p>
      )}
    </div>
  );
}
