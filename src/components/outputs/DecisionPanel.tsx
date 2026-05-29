"use client";

import { useState } from "react";
import { useCouncilSim } from "@/context/CouncilSimContext";
import ConflictCard from "./ConflictCard";
import DecisionCard from "./DecisionCard";
import OutputCard from "./OutputCard";
import ReportPreviewModal from "./ReportPreviewModal";
import SectionHeader from "./SectionHeader";
import VoteCard from "./VoteCard";

export default function DecisionPanel() {
  const { decisions, conflicts, votes, voteOptions, outputItems, phase } = useCouncilSim();
  const readyCount = outputItems.filter((i) => i.ready).length;
  const [showReport, setShowReport] = useState(false);

  const showVoting = voteOptions.length > 0 && conflicts.length > 0 &&
    (phase === "voting" || votes.length > 0);

  return (
    <aside className="flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800/60">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outputs</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">

        {/* Conflicts */}
        <section>
          <SectionHeader title="Conflicts" count={conflicts.length || undefined} />
          {conflicts.length === 0 ? (
            <p className="text-[10px] text-slate-800 px-0.5">None detected yet.</p>
          ) : (
            <div className="space-y-2">
              {conflicts.map((conflict) => (
                <ConflictCard key={conflict.id} conflict={conflict} />
              ))}
            </div>
          )}
        </section>

        {/* Voting */}
        {showVoting && (
          <section>
            <SectionHeader title="Voting" count={votes.length} total={4} />
            <VoteCard
              conflict={conflicts[0]}
              options={voteOptions}
              votes={votes}
              phase={phase}
            />
          </section>
        )}

        {/* Decisions */}
        <section>
          <SectionHeader title="Decisions" count={decisions.length || undefined} />
          {decisions.length === 0 ? (
            <p className="text-[10px] text-slate-800 px-0.5">Waiting for council...</p>
          ) : (
            <div className="space-y-1.5">
              {decisions.map((decision, i) => (
                <DecisionCard key={decision.id} decision={decision} delay={i * 80} />
              ))}
            </div>
          )}
        </section>

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

        {/* Preview Report — appears when session is complete */}
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
