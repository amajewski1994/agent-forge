import { AGENTS } from "@/data/agents";
import ActiveSessionCard from "./ActiveSessionCard";
import AgentCard from "./AgentCard";

export default function AgentSidebar() {
  return (
    <aside className="flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800/60">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Council</h2>
        <p className="text-xs text-slate-600 mt-0.5">{AGENTS.length} agents assigned</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {AGENTS.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      <div className="p-3 border-t border-slate-800/60">
        <ActiveSessionCard />
      </div>
    </aside>
  );
}
