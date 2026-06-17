"use client";

import { useState } from "react";
import type { Conflict } from "@/types";

interface ConflictCardProps {
  conflict: Conflict;
}

const VOTE_AGENT_COLOR: Record<string, string> = {
  PM:  "text-violet-400",
  CTO: "text-cyan-400",
  DES: "text-pink-400",
  QA:  "text-amber-400",
  CEO: "text-emerald-400",
};

export default function ConflictCard({ conflict }: ConflictCardProps) {
  const { votes = [], options = [] } = conflict;
  const [open, setOpen] = useState(false);

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
        <span className="text-xs font-semibold text-amber-200 flex-1 min-w-0 truncate">{conflict.title}</span>
      </div>

      <div className="px-3 pb-2.5 border-t border-amber-500/10">
        <p className="text-xs text-slate-500 leading-relaxed mt-2 mb-2">{conflict.description}</p>

        {conflict.resolution && (
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-600 uppercase tracking-wide">Resolved</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ✓ {conflict.resolution}
              </span>
            </div>
            {votes.length > 0 && (
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1 text-[9px] font-semibold text-slate-600 hover:text-slate-400 transition-colors shrink-0"
              >
                {open ? "hide" : "votes"}
                <svg
                  className={`w-2.5 h-2.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {open && votes.length > 0 && (
          <div className="border-t border-amber-500/10 pt-2 mt-1.5 space-y-1.5">
            {votes.map((vote, i) => {
              const optLabel = options.find((o) => o.id === vote.optionId)?.label ?? vote.optionId;
              const agentColor = VOTE_AGENT_COLOR[vote.agentAbbr] ?? "text-slate-400";
              const isMinority =
                votes.filter((v) => v.optionId === vote.optionId).length < votes.length / 2;
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
        )}
      </div>
    </div>
  );
}
