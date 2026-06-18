"use client";

import { useCouncilSim } from "@/context/CouncilSimContext";
import SectionHeader from "./SectionHeader";

type AgendaItemState = "completed" | "active" | "inactive";

function AgendaItemRow({
  index,
  title,
  state,
  delay,
}: {
  index: number;
  title: string;
  state: AgendaItemState;
  delay: number;
}) {
  const animStyle = { animationDelay: `${delay}ms` };

  if (state === "completed") {
    return (
      <li className="flex items-start gap-3 px-3 py-2 bg-emerald-950/10 animate-slide-up" style={animStyle}>
        <div className="w-3.5 h-3.5 mt-px shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
          <svg className="w-2 h-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-[11px] text-slate-600 leading-snug line-through">{title}</span>
      </li>
    );
  }

  if (state === "active") {
    return (
      <li className="flex items-start gap-3 px-3 py-2.5 bg-indigo-950/40 border-l-2 border-indigo-500 animate-slide-up" style={animStyle}>
        <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        </div>
        <span className="text-[11px] font-semibold text-slate-200 leading-snug tracking-tight">{title}</span>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 px-3 py-2 animate-slide-up" style={animStyle}>
      <span className="text-[10px] font-bold text-slate-700 mt-px shrink-0 w-3.5 text-right">
        {index + 1}
      </span>
      <span className="text-[11px] text-slate-600 leading-snug">{title}</span>
    </li>
  );
}

export default function SessionBrief() {
  const { submittedIdea, agenda, agendaUnlocked, topicSummaries, currentTopic } = useCouncilSim();

  const agendaVisible = agenda.length > 0 && agendaUnlocked;

  function getAgendaState(title: string): AgendaItemState {
    if (topicSummaries.some((s) => s.topicTitle === title)) return "completed";
    if (currentTopic?.topicTitle === title) return "active";
    return "inactive";
  }

  if (!submittedIdea) return null;

  return (
    <section className="animate-fade-in space-y-2">
      <SectionHeader title="Brief" />

      {/* Idea */}
      <div className="relative rounded-xl overflow-hidden border border-indigo-500/25 shadow-lg shadow-indigo-500/5 flex flex-col justify-center min-h-20">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-950/60 via-slate-900/40 to-slate-900/20 pointer-events-none" />
        <div className="relative px-4 py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Your idea</span>
          </div>
          <p className="text-[11px] text-slate-200 leading-relaxed">
            {submittedIdea}
          </p>
        </div>
      </div>

      {/* Agenda */}
      {agendaVisible && (
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 overflow-hidden animate-reveal">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/30">
            <svg className="w-3 h-3 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agenda</span>
            <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800/80 text-slate-500">
              {agenda.length}
            </span>
          </div>
          <ol className="divide-y divide-slate-700/20">
            {agenda.map((item, idx) => (
              <AgendaItemRow
                key={idx}
                index={idx}
                title={item.title}
                state={getAgendaState(item.title)}
                delay={idx * 90}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
