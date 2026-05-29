interface SectionHeaderProps {
  title: string;
  count?: number;
  total?: number;
}

export default function SectionHeader({ title, count, total }: SectionHeaderProps) {
  const badge =
    count !== undefined
      ? total !== undefined
        ? `${count} / ${total}`
        : String(count)
      : null;

  return (
    <div className="flex items-center gap-2 mb-2.5 px-0.5">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
      {badge !== null && (
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800/80 text-slate-500">
          {badge}
        </span>
      )}
    </div>
  );
}
