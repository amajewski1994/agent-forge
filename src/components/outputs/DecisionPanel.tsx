"use client";

import { useState } from "react";
import { useCouncilSim } from "@/context/CouncilSimContext";
import OutputCard from "./OutputCard";
import ReportPreviewModal from "./ReportPreviewModal";
import SectionHeader from "./SectionHeader";
import StageSummaryCard from "./StageSummaryCard";
import VoteCard from "./VoteCard";

type AgendaItemState = "completed" | "active" | "inactive";

function AgendaItemRow({
  index,
  title,
  state,
}: {
  index: number;
  title: string;
  state: AgendaItemState;
}) {
  if (state === "completed") {
    return (
      <li className="flex items-start gap-3 px-3 py-2 bg-emerald-950/10">
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
      <li className="flex items-start gap-3 px-3 py-2.5 bg-indigo-950/40 border-l-2 border-indigo-500">
        <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        </div>
        <span className="text-[11px] font-semibold text-slate-200 leading-snug tracking-tight">{title}</span>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 px-3 py-2">
      <span className="text-[10px] font-bold text-slate-700 mt-px shrink-0 w-3.5 text-right">
        {index + 1}
      </span>
      <span className="text-[11px] text-slate-600 leading-snug">{title}</span>
    </li>
  );
}

export default function DecisionPanel() {
  const {
    activeConflict, votes, voteOptions, outputItems,
    topicSummaries, phase, submittedIdea, agenda, currentTopic,
    agendaUnlocked,
  } = useCouncilSim();

  const agendaVisible = agenda.length > 0 && agendaUnlocked;
  const readyCount = outputItems.filter((i) => i.ready).length;
  const [showReport, setShowReport] = useState(false);

  const showVoting = activeConflict !== null && voteOptions.length > 0;

  function getAgendaState(title: string): AgendaItemState {
    if (topicSummaries.some((s) => s.topicTitle === title)) return "completed";
    if (currentTopic?.topicTitle === title) return "active";
    return "inactive";
  }

  return (
    <aside className="flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800/60">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outputs</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-5">

        {/* Session Brief */}
        {submittedIdea && (
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
                    />
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {/* Voting */}
        {showVoting && (
          <section>
            <SectionHeader title="Voting" count={votes.length} total={4} />
            <VoteCard
              conflict={activeConflict}
              options={voteOptions}
              votes={votes}
              phase={phase}
            />
          </section>
        )}

        {/* Stage summaries */}
        {topicSummaries.length > 0 && (
          <section>
            <SectionHeader title="Etapy" count={topicSummaries.length} />
            <div className="space-y-2">
              {topicSummaries.map((s, i) => (
                <StageSummaryCard key={s.id} summary={s} delay={i * 80} />
              ))}
            </div>
          </section>
        )}

        {/* Final Output */}
        <section>
          <SectionHeader
            title="Final Output"
            count={readyCount || undefined}
            total={outputItems.length}
          />
          <div className="grid grid-cols-2 gap-1.5">
            {outputItems.map((item) => (
              <OutputCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* Preview Report */}
        {phase === "complete" && (
          <div className="animate-slide-up">
            <button
              onClick={() => setShowReport(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Preview Report
            </button>
          </div>
        )}
      </div>

      {showReport && <ReportPreviewModal onClose={() => setShowReport(false)} />}
    </aside>
  );
}
