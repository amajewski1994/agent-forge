import { STATUS_BADGE } from "@/constants/agentStyles";
import type { AgentStatus } from "@/types";

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

export default function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const config = STATUS_BADGE[status];
  if (!config) return null;

  return (
    <span className={`shrink-0 inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${config.wrapper}`}>
      <span className={`w-1 h-1 rounded-full animate-pulse ${config.dot}`} />
      {config.text}
    </span>
  );
}
