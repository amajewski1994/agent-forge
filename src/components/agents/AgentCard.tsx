import { CARD_STYLE } from "@/constants/agentStyles";
import type { Agent } from "@/types";
import Image from "next/image";
import AgentStatusBadge from "./AgentStatusBadge";

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const isActive = agent.status === "active";
  const isIdle = agent.status === "idle";

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-default",
        CARD_STYLE[agent.status],
      ].join(" ")}
    >
      <div
        className={[
          "rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm",
          isActive ? "w-10 h-10" : "w-9 h-9",
          isIdle ? "opacity-40" : "",
        ].join(" ")}
      >
        <Image
          src={agent.avatar}
          alt={agent.name}
          width={40}
          height={40}
          className="w-full h-full object-cover"
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
