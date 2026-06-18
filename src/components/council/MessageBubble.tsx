"use client";

import { useState } from "react";
import type { CouncilMessage } from "@/types";
import {
  AGENT_STYLE_MAP,
  FALLBACK_STYLE,
  MESSAGE_BUBBLE,
  DECISION_BADGE,
} from "@/constants/agentChatStyles";
import AgentMessageAvatar from "./AgentMessageAvatar";

interface MessageBubbleProps {
  message: CouncilMessage;
}

const VOTE_AGENT_COLOR: Record<string, string> = {
  PM: "text-violet-400",
  CTO: "text-cyan-400",
  DES: "text-pink-400",
  QA: "text-amber-400",
  CEO: "text-emerald-400",
};

function ConflictResultCard({ message }: MessageBubbleProps) {
  const { votes = [], options = [], conflictTitle, content } = message;
  const [open, setOpen] = useState(false);

  return (
    <div className="animate-slide-up rounded-xl bg-indigo-950/20 border border-indigo-500/20 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3.5 pt-2.5 pb-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-3 h-3 text-indigo-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
            Vote Complete
          </span>
        </div>
        <span className="text-[10px] text-slate-700">{message.timestamp}</span>
      </div>

      <div className="px-3.5 pb-2.5 border-t border-indigo-500/10">
        <p className="text-[10px] text-slate-600 mt-1.5 mb-0.5">
          {conflictTitle}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-indigo-200">{content}</p>
          {votes.length > 0 && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-[9px] font-semibold text-slate-600 hover:text-slate-400 transition-colors shrink-0"
            >
              {open ? "hide" : "see votes"}
              <svg
                className={`w-2.5 h-2.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {open && votes.length > 0 && (
          <div className="mt-2.5 space-y-2 border-t border-indigo-500/10 pt-2.5">
            {votes.map((vote, i) => {
              const optLabel =
                options.find((o) => o.id === vote.optionId)?.label ??
                vote.optionId;
              const agentColor =
                VOTE_AGENT_COLOR[vote.agentAbbr] ?? "text-slate-400";
              const isMinority =
                votes.filter((v) => v.optionId === vote.optionId).length <
                votes.length / 2;
              return (
                <div key={i} className="flex gap-2">
                  <span
                    className={`text-[10px] font-bold w-7 shrink-0 ${agentColor}`}
                  >
                    {vote.agentAbbr}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span
                        className={`text-[10px] font-semibold ${isMinority ? "text-amber-400" : "text-slate-300"}`}
                      >
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
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      {vote.reason}
                    </p>
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

export default function MessageBubble({ message }: MessageBubbleProps) {
  if (message.type === "conflict") return;
  if (message.type === "conflict_result")
    return <ConflictResultCard message={message} />;

  const style = AGENT_STYLE_MAP[message.agentAbbr] ?? FALLBACK_STYLE;
  const isDecision = message.type === "decision";

  return (
    <div className="flex gap-3 animate-slide-up">
      <AgentMessageAvatar agentAbbr={message.agentAbbr} large={isDecision} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs font-semibold ${style.color}`}>
            {message.role}
          </span>
          <span className="text-[10px] text-slate-700">
            {message.timestamp}
          </span>
          {isDecision && <span className={DECISION_BADGE}>⚡ Decision</span>}
        </div>
        <div
          className={[
            "rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed",
            message.preCouncil ? "whitespace-pre-line" : "",
            MESSAGE_BUBBLE[message.type],
            isDecision ? "text-slate-200 font-medium" : "text-slate-400",
          ].join(" ")}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
