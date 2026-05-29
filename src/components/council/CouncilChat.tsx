"use client";

import { useEffect, useRef } from "react";
import { useCouncilSim } from "@/context/CouncilSimContext";
import type { CouncilPhase } from "@/hooks/useCouncilSimulation";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const PHASE_HEADER: Record<CouncilPhase, string> = {
  idle:     "Waiting to start",
  analysis: "Analyzing requirements",
  council:  "Council in debate",
  conflict: "Resolving conflict",
  voting:   "Agents voting",
  decision: "CEO is deciding",
  output:   "Generating deliverables",
  complete: "Session complete",
};

const SPEAKING_ORDER = [
  { abbr: "PM",  role: "Product Manager" },
  { abbr: "CTO", role: "Technical Advisor" },
  { abbr: "DES", role: "Designer" },
  { abbr: "QA",  role: "Quality Analyst" },
  { abbr: "CEO", role: "Decision Leader" },
];

function getTypingAgent(phase: CouncilPhase, messageCount: number) {
  // voting phase: voting UI is in the right panel; suppress chat typing indicator
  if (phase === "idle" || phase === "voting" || phase === "output" || phase === "complete") return null;
  if (messageCount >= SPEAKING_ORDER.length) return null;
  return SPEAKING_ORDER[messageCount];
}

export default function CouncilChat() {
  const { messages, phase } = useCouncilSim();
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

      {phase === "idle" && messages.length === 0 && (
        <p className="text-xs text-slate-700 text-center py-10">
          Enter an idea and start the council.
        </p>
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

      <div ref={bottomRef} />
    </div>
  );
}
