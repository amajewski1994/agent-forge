import Image from "next/image";
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
        "rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm",
        large ? "w-9 h-9" : "w-8 h-8",
      ].join(" ")}
    >
      <Image
        src={style.avatar}
        alt={agentAbbr}
        width={36}
        height={36}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
