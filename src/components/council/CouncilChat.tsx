"use client";

import { useEffect, useRef } from "react";
import { useCouncilSim } from "@/context/CouncilSimContext";
import type { CouncilPhase } from "@/hooks/useCouncilSimulation";
import MessageBubble from "./MessageBubble";
import AgentMessageAvatar from "./AgentMessageAvatar";

const PHASE_HEADER: Record<CouncilPhase, string> = {
  idle:             "Waiting to start",
  analysis:         "Analyzing requirements",
  activating:       "Activating agents",
  council:          "Council in debate",
  conflict:         "Resolving conflict",
  voting:           "Agents voting",
  decision:         "CEO is deciding",
  awaiting_proceed: "Awaiting your decision",
  output:           "Generating deliverables",
  complete:         "Session complete",
};

const COUNCIL_THINKING_PHASES: CouncilPhase[] = ["council", "conflict", "voting"];

export default function CouncilChat() {
  const { messages, phase, submittedIdea, proceed, typingAgent, isRunning, spinnerPhase } = useCouncilSim();
  const bottomRef = useRef<HTMLDivElement>(null);

  const showCouncilThinking =
    isRunning && !typingAgent && COUNCIL_THINKING_PHASES.includes(phase);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingAgent, phase]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
      <div className="flex items-center gap-3 pb-1">
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              phase === "idle" || phase === "complete"
                ? "bg-slate-600"
                : "bg-emerald-400 animate-pulse"
            }`}
          />
          <span className="text-xs text-slate-500">{PHASE_HEADER[phase]}</span>
        </div>
        <div className="flex-1 h-px bg-slate-800/60" />
        {messages.length > 0 && (
          <span className="text-[10px] text-slate-700">{messages.length} messages</span>
        )}
      </div>


      {phase === "idle" && messages.length === 0 && !submittedIdea && (
        <p className="text-xs text-slate-700 text-center py-10">
          Enter an idea and start the council.
        </p>
      )}

      {submittedIdea && (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-600/20 border border-indigo-500/30 px-4 py-3">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">Your idea</p>
            <p className="text-sm text-slate-200 leading-relaxed">{submittedIdea}</p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.type === "decision" && (
            <div className="flex items-center gap-2 mb-3 mt-1">
              <div className="flex-1 h-px bg-slate-800/60" />
              <span className="text-[9px] text-slate-700 uppercase tracking-wider">Council Decision</span>
              <div className="flex-1 h-px bg-slate-800/60" />
            </div>
          )}
          <MessageBubble message={msg} />
        </div>
      ))}

      {showCouncilThinking && (
        <div className="flex justify-center items-center gap-2.5 py-1 animate-fade-in">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-[11px] text-slate-600 italic">Council is thinking...</span>
        </div>
      )}

      {typingAgent && (
        <div className="flex gap-3 animate-fade-in">
          <AgentMessageAvatar agentAbbr={typingAgent} />
          <div className="flex items-center">
            <div className="rounded-xl rounded-tl-sm px-3.5 py-3 bg-slate-900/50 border border-slate-800/40">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {spinnerPhase !== null && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 animate-fade-in">
          <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-indigo-400 animate-spin" />
          <span className="text-xs text-slate-500">
            {spinnerPhase === "generating"
              ? "Generating agenda…"
              : spinnerPhase === "activating"
              ? "Activating council…"
              : "Analyzing your idea…"}
          </span>
        </div>
      )}

      {phase === "awaiting_proceed" && (
        <div className="flex justify-center py-2">
          <button
            onClick={proceed}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer"
          >
            Proceed
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
