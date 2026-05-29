import { AGENT_STYLE_MAP, FALLBACK_STYLE } from "@/constants/agentChatStyles";
import AgentMessageAvatar from "./AgentMessageAvatar";

interface TypingIndicatorProps {
  agentAbbr: string;
  agentRole: string;
}

export default function TypingIndicator({ agentAbbr, agentRole }: TypingIndicatorProps) {
  const style = AGENT_STYLE_MAP[agentAbbr] ?? FALLBACK_STYLE;
  return (
    <div className="flex gap-3 items-start animate-fade-in">
      <AgentMessageAvatar agentAbbr={agentAbbr} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs font-semibold ${style.color}`}>{agentRole}</span>
          <span className="text-[10px] text-slate-700 italic">composing...</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl rounded-tl-sm bg-slate-900/40 border border-slate-800/30 w-fit">
          <div className="w-1 h-1 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-1 h-1 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "120ms" }} />
          <div className="w-1 h-1 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "240ms" }} />
        </div>
      </div>
    </div>
  );
}
