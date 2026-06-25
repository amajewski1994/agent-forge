import {
  Crown,
  LayoutDashboard,
  Cpu,
  Palette,
  ShieldCheck,
  Code2,
  type LucideIcon,
} from "lucide-react";
import { AGENT_STYLE_MAP, FALLBACK_STYLE } from "@/constants/agentChatStyles";

const ICON_MAP: Record<string, LucideIcon> = {
  Crown,
  LayoutDashboard,
  Cpu,
  Palette,
  ShieldCheck,
  Code2,
};

interface AgentMessageAvatarProps {
  agentAbbr: string;
  large?: boolean;
}

export default function AgentMessageAvatar({ agentAbbr, large }: AgentMessageAvatarProps) {
  const style = AGENT_STYLE_MAP[agentAbbr] ?? FALLBACK_STYLE;
  const IconComponent = ICON_MAP[style.icon] ?? Crown;

  return (
    <div
      className={[
        "rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm",
        large ? "w-9 h-9" : "w-8 h-8",
        style.iconBg ?? "bg-slate-700",
      ].join(" ")}
    >
      <IconComponent
        size={large ? 16 : 14}
        className="text-white drop-shadow-sm"
        strokeWidth={1.75}
      />
    </div>
  );
}
