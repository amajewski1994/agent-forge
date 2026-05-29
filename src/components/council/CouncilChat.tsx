"use client";

import { useCouncil } from "@/hooks/useCouncil";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const TYPING_AGENT = { abbr: "PM", role: "Product Manager" };

export default function CouncilChat() {
  const { messages } = useCouncil();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center gap-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500">Council in session</span>
        </div>
        <div className="flex-1 h-px bg-slate-800/60" />
        <span className="text-[10px] text-slate-700">{messages.length} messages</span>
      </div>

      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.type === "decision" && (
            <div className="flex items-center gap-2 mb-3 mt-1">
              <div className="flex-1 h-px bg-slate-800/60" />
              <span className="text-[9px] text-slate-700 uppercase tracking-wider">Round Decision</span>
              <div className="flex-1 h-px bg-slate-800/60" />
            </div>
          )}
          <MessageBubble message={msg} />
        </div>
      ))}

      <TypingIndicator agentAbbr={TYPING_AGENT.abbr} agentRole={TYPING_AGENT.role} />
    </div>
  );
}
