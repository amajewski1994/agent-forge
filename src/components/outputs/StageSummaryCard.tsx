"use client";

import { useState } from "react";
import type { TopicSummary } from "@/types";

interface StageSummaryCardProps {
  summary: TopicSummary;
  delay?: number;
}

type Section = "summary" | "decision" | "conflict" | null;

const VOTE_AGENT_COLOR: Record<string, string> = {
  PM:  "text-violet-400",
  CTO: "text-cyan-400",
  DES: "text-pink-400",
  QA:  "text-amber-400",
  CEO: "text-emerald-400",
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 text-slate-500 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function StageSummaryCard({ summary, delay }: StageSummaryCardProps) {
  const [openSection, setOpenSection] = useState<Section>(null);

  const toggle = (section: Section) =>
    setOpenSection((prev) => (prev === section ? null : section));

  const { conflict } = summary;

  return (
    <div
      className="rounded-xl border border-slate-700/40 bg-slate-900/40 overflow-hidden animate-scale-in"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-700/30 flex items-center gap-2">
        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider shrink-0">
          Etap {summary.stageNumber}
        </span>
        <span className="text-[10px] text-slate-600">·</span>
        <span className="text-[11px] text-slate-300 font-medium truncate">{summary.topicTitle}</span>
      </div>

      <div>
        {/* Podsumowanie */}
        <button
          onClick={() => toggle("summary")}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/30 transition-colors"
        >
          <span className="text-[11px] font-medium text-slate-400">Podsumowanie</span>
          <ChevronIcon open={openSection === "summary"} />
        </button>
        {openSection === "summary" && (
          <div className="px-3 pb-2.5 pt-0.5 border-t border-slate-700/20 bg-slate-800/20">
            <p className="text-[11px] text-slate-300 leading-relaxed">{summary.summary}</p>
          </div>
        )}

        {/* Głosowanie (only when resolved by vote) */}
        {conflict && (
          <>
            <button
              onClick={() => toggle("conflict")}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/30 transition-colors border-t border-slate-700/20"
            >
              <span className="text-[11px] font-medium text-slate-400 truncate">Głosowanie – {summary.topicTitle}</span>
              <ChevronIcon open={openSection === "conflict"} />
            </button>
            {openSection === "conflict" && (
              <div className="px-3 pb-2.5 pt-2 border-t border-slate-700/20 bg-slate-800/20">
                <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{conflict.description}</p>
                <div className="space-y-1.5">
                  {conflict.votes.map((vote, i) => {
                    const optLabel = conflict.options.find((o) => o.id === vote.optionId)?.label ?? vote.optionId;
                    const agentColor = VOTE_AGENT_COLOR[vote.agentAbbr] ?? "text-slate-400";
                    const isMinority =
                      conflict.votes.filter((v) => v.optionId === vote.optionId).length < conflict.votes.length / 2;
                    return (
                      <div key={i} className="flex gap-2 items-start">
                        <span className={`text-[10px] font-bold w-7 shrink-0 pt-px ${agentColor}`}>
                          {vote.agentAbbr}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-semibold ${isMinority ? "text-amber-400" : "text-slate-400"}`}>
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
                          <p className="text-[9px] text-slate-600 leading-relaxed mt-0.5">{vote.reason}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700/20">
                  <span className="text-[10px] font-semibold text-emerald-400">✓ {conflict.resolution}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Decyzja */}
        <button
          onClick={() => toggle("decision")}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/30 transition-colors border-t border-slate-700/20"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 shrink-0" />
            <span className="text-[11px] font-medium text-emerald-400">Decyzja</span>
          </div>
          <ChevronIcon open={openSection === "decision"} />
        </button>
        {openSection === "decision" && (
          <div className="px-3 pb-2.5 pt-0.5 border-t border-slate-700/20 bg-emerald-950/20">
            <p className="text-[11px] text-slate-300 leading-relaxed">{summary.decision}</p>
          </div>
        )}
      </div>
    </div>
  );
}
