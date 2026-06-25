import { CARD_STYLE } from "@/constants/agentStyles";
import type { Agent } from "@/types";
import {
  Crown,
  LayoutDashboard,
  Cpu,
  Palette,
  ShieldCheck,
  Code2,
  type LucideIcon,
} from "lucide-react";
import AgentStatusBadge from "./AgentStatusBadge";

const ICON_MAP: Record<string, LucideIcon> = {
  Crown,
  LayoutDashboard,
  Cpu,
  Palette,
  ShieldCheck,
  Code2,
};

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const isActive = agent.status === "active";
  const isIdle = agent.status === "idle";
  const IconComponent = ICON_MAP[agent.icon] ?? Crown;

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-default",
        CARD_STYLE[agent.status],
      ].join(" ")}
    >
      <div
        className={[
          "rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm",
          isActive ? "w-10 h-10" : "w-9 h-9",
          agent.iconBg,
          isIdle ? "opacity-40" : "",
        ].join(" ")}
      >
        <IconComponent
          size={isActive ? 18 : 16}
          className="text-white drop-shadow-sm"
          strokeWidth={1.75}
        />
      </div>

      <div className="flex-1 min-w-0">
        <span
          className={[
            "text-sm font-semibold truncate block",
            isActive ? "text-white" : isIdle ? "text-slate-500" : "text-slate-300",
          ].join(" ")}
        >
          {agent.name}
        </span>
        <p className={`text-xs truncate mt-0.5 ${isIdle ? "text-slate-700" : "text-slate-500"}`}>
          {agent.role}
        </p>
      </div>

      <AgentStatusBadge status={agent.status} />
    </div>
  );
}
