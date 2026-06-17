import { useMemo } from "react";
import type { Conflict, Vote, VoteOption } from "@/types";
import type { CouncilPhase } from "@/hooks/useCouncilSimulation";

interface VoteCardProps {
  conflict: Conflict;
  options: VoteOption[];
  votes: Vote[];
  phase: CouncilPhase;
}

const AGENT_TEXT: Record<string, string> = {
  PM:  "text-violet-400",
  CTO: "text-cyan-400",
  DES: "text-pink-400",
  QA:  "text-amber-400",
  CEO: "text-emerald-400",
  ENG: "text-orange-400",
};

export default function VoteCard({ conflict, options, votes, phase }: VoteCardProps) {
  const regularVotes  = votes.filter((v) => !v.isTiebreaker);
  const ceoTiebreaker = votes.find((v) => v.isTiebreaker) ?? null;

  const tally = useMemo(
    () =>
      options.map((opt) => {
        const count = votes.filter((v) => v.optionId === opt.id).length;
        const pct   = votes.length > 0 ? Math.round((count / votes.length) * 100) : 0;
        return { opt, count, pct };
      }),
    [options, votes],
  );

  const allRegularVoted = regularVotes.length === 4;
  const isTied = allRegularVoted && !ceoTiebreaker && (() => {
    const counts = options.map((o) => regularVotes.filter((v) => v.optionId === o.id).length);
    return counts.length >= 2 && counts[0] === counts[1];
  })();
  const allVoted        = (allRegularVoted && !isTied) || !!ceoTiebreaker;
  const isCeoReviewing  = isTied && phase === "voting";

  const winnerId = allVoted
    ? tally.reduce((best, cur) => (cur.count > best.count ? cur : best)).opt.id
    : null;

  return (
    <div className="rounded-xl bg-slate-900/50 border border-slate-700/40 overflow-hidden animate-slide-up">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-2">
        <div className="flex items-center gap-2">
          <svg className="w-3 h-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold text-slate-200">{conflict.title}</span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5">
          Voting
        </span>
      </div>

      {/* Option pills */}
      <div className="flex gap-1.5 px-3 pb-2.5">
        {options.map((opt) => {
          const isWinner = winnerId === opt.id;
          return (
            <div
              key={opt.id}
              className={[
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all duration-500",
                allVoted && isWinner
                  ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                  : allVoted
                  ? "bg-slate-800/20 border-slate-800/30 text-slate-600"
                  : "bg-slate-800/50 border-slate-700/50 text-slate-400",
              ].join(" ")}
            >
              <span className={allVoted && !isWinner ? "text-slate-700" : "text-slate-500"}>{opt.id}</span>
              {opt.label}
              {allVoted && isWinner && <span className="ml-0.5 text-indigo-400">✓</span>}
            </div>
          );
        })}
      </div>

      {/* Vote rows */}
      {votes.length > 0 && (
        <div className="border-t border-slate-800/50 px-3 py-2 space-y-2.5">
          {votes.map((vote, i) => {
            const textColor  = AGENT_TEXT[vote.agentAbbr] ?? "text-slate-400";
            const optLabel   = options.find((o) => o.id === vote.optionId)?.label ?? vote.optionId;
            const tallyItem  = tally.find((t) => t.opt.id === vote.optionId);
            const isMinority = allVoted && (tallyItem?.count ?? 0) < votes.length / 2;
            return (
              <div key={i} className="animate-slide-up">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold ${textColor}`}>{vote.agentAbbr}</span>
                  <svg className="w-2.5 h-2.5 text-slate-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className={`text-[10px] font-semibold ${isMinority ? "text-amber-400" : "text-slate-300"}`}>
                    {optLabel}
                  </span>
                  {vote.isTiebreaker && (
                    <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded px-1 py-px">
                      tiebreaker
                    </span>
                  )}
                  {isMinority && !vote.isTiebreaker && (
                    <span className="text-[9px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded px-1 py-px">
                      dissent
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5 pl-5.5">{vote.reason}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tally bars */}
      <div className="border-t border-slate-800/50 px-3 py-2.5 space-y-2">
        {tally.map(({ opt, count, pct }) => {
          const isLeading = count > 0 && count === Math.max(...tally.map((t) => t.count));
          return (
            <div key={opt.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500">{opt.label}</span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {count}
                  {votes.length > 0 && (
                    <span className="text-slate-700 ml-1">({pct}%)</span>
                  )}
                </span>
              </div>
              <div className="h-1 rounded-full bg-slate-800/80">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isLeading ? "bg-indigo-500/60" : "bg-slate-700/60"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* CEO tiebreaker reviewing */}
      {isCeoReviewing && (
        <div className="border-t border-slate-800/50 px-3 py-2 flex items-center gap-2 animate-fade-in">
          <span className="text-sm">👑</span>
          <span className="text-[10px] text-emerald-500 animate-pulse-soft">CEO casting the tiebreaker...</span>
        </div>
      )}
    </div>
  );
}
