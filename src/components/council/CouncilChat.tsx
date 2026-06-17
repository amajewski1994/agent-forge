"use client";

import { useEffect, useRef } from "react";
import { useCouncilSim } from "@/context/CouncilSimContext";
import type { CouncilPhase } from "@/hooks/useCouncilSimulation";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const PHASE_HEADER: Record<CouncilPhase, string> = {
  idle:             "Waiting to start",
  analysis:         "Analyzing requirements",
  council:          "Council in debate",
  conflict:         "Resolving conflict",
  voting:           "Agents voting",
  decision:         "CEO is deciding",
  awaiting_proceed: "Awaiting your decision",
  output:           "Generating deliverables",
  complete:         "Session complete",
};

function getTypingAgent(phase: CouncilPhase, messageCount: number): { abbr: string; role: string } | null {
  if (phase === "idle" || phase === "conflict" || phase === "voting" || phase === "awaiting_proceed" || phase === "output" || phase === "complete") return null;
  // First two are hardcoded in the backend — safe to name them
  if (messageCount === 0) return { abbr: "PM", role: "Product Manager" };
  if (messageCount === 1) return { abbr: "CTO", role: "Technical Advisor" };
  // Dynamic order from here — don't guess who's next
  return { abbr: "···", role: "Agent" };
}

export default function CouncilChat() {
  const { messages, phase, submittedIdea, proceed } = useCouncilSim();
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingAgent = getTypingAgent(phase, messages.length);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingAgent]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

      {typingAgent && (
        <TypingIndicator agentAbbr={typingAgent.abbr} agentRole={typingAgent.role} />
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
