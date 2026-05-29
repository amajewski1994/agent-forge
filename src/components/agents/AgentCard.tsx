import { CARD_STYLE } from "@/constants/agentStyles";
import type { Agent } from "@/types";
import AgentStatusBadge from "./AgentStatusBadge";

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const isActive = agent.status === "active";
  const isIdle = agent.status === "idle";

  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-default ${CARD_STYLE[agent.status]}`}>
      <div
        className={[
          "rounded-xl flex items-center justify-center shrink-0",
          isActive ? "w-10 h-10 text-base" : "w-9 h-9 text-sm",
          agent.iconBg,
          isIdle ? "opacity-50" : "",
        ].join(" ")}
      >
        {agent.icon === "</>" ? (
          <span className="text-[10px] font-mono font-bold text-slate-300">&lt;/&gt;</span>
        ) : (
          agent.icon
        )}
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
