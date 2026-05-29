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

export default function MessageBubble({ message }: MessageBubbleProps) {
  const style = AGENT_STYLE_MAP[message.agentAbbr] ?? FALLBACK_STYLE;
  const isDecision = message.type === "decision";

  return (
    <div className="flex gap-3 animate-slide-up">
      <AgentMessageAvatar agentAbbr={message.agentAbbr} large={isDecision} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs font-semibold ${style.color}`}>{message.role}</span>
          <span className="text-[10px] text-slate-700">{message.timestamp}</span>
          {isDecision && <span className={DECISION_BADGE}>⚡ Decision</span>}
        </div>
        <div
          className={[
            "rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed",
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
