"use client";

import { useCouncilSim } from "@/context/CouncilSimContext";
import ConflictCard from "./ConflictCard";
import DecisionCard from "./DecisionCard";
import OutputCard from "./OutputCard";
import SectionHeader from "./SectionHeader";

export default function DecisionPanel() {
  const { decisions, conflicts, outputItems } = useCouncilSim();
  const readyCount = outputItems.filter((i) => i.ready).length;

  return (
    <aside className="flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800/60">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outputs</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        <section>
          <SectionHeader title="Decisions" count={decisions.length || undefined} />
          {decisions.length === 0 ? (
            <p className="text-[10px] text-slate-800 px-0.5">Waiting for council...</p>
          ) : (
            <div className="space-y-1.5">
              {decisions.map((decision) => (
                <DecisionCard key={decision.id} decision={decision} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Conflicts" count={conflicts.length || undefined} />
          {conflicts.length === 0 ? (
            <p className="text-[10px] text-slate-800 px-0.5">None detected yet.</p>
          ) : (
            <div className="space-y-2">
              {conflicts.map((conflict) => (
                <ConflictCard key={conflict.id} conflict={conflict} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader
            title="Final Output"
            count={readyCount || undefined}
            total={outputItems.length}
          />
          <div className="grid grid-cols-2 gap-1.5">
            {outputItems.map((item) => (
              <OutputCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
