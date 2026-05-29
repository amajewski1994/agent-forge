import { AGENT_STYLE_MAP, FALLBACK_STYLE } from "@/constants/agentChatStyles";

interface AgentMessageAvatarProps {
  agentAbbr: string;
  large?: boolean;
}

export default function AgentMessageAvatar({ agentAbbr, large }: AgentMessageAvatarProps) {
  const style = AGENT_STYLE_MAP[agentAbbr] ?? FALLBACK_STYLE;
  return (
    <div
      className={[
        "rounded-lg flex items-center justify-center shrink-0 border",
        large ? "w-9 h-9" : "w-8 h-8",
        style.bg,
      ].join(" ")}
    >
      <span className={`text-[9px] font-bold leading-none ${style.color}`}>{agentAbbr}</span>
    </div>
  );
}
