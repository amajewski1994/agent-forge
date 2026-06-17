import { AgentSidebar } from "@/components/agents";
import { CouncilChat, PromptInput } from "@/components/council";
import CouncilStatusBar from "@/components/council/CouncilStatusBar";
import { DecisionPanel } from "@/components/outputs";
import { WorkflowTimeline } from "@/components/layout";
import PhaseStatus from "@/components/layout/PhaseStatus";
import { CouncilSimProvider } from "@/context/CouncilSimContext";

export default function Home() {
  return (
    <CouncilSimProvider>
    <main className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-800/60 px-5 py-3 flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-none tracking-tight">AgentForge</h1>
            <p className="text-xs text-slate-500 leading-none mt-0.5">AI Product Council</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Session Active</span>
          </div>
          <PhaseStatus />
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[260px_1fr_320px] overflow-hidden">
        <AgentSidebar />
        <section className="flex flex-col overflow-hidden border-x border-slate-800/60">
          <CouncilStatusBar />
          <CouncilChat />
          <PromptInput />
        </section>
        <DecisionPanel />
      </div>

      <WorkflowTimeline />
    </main>
    </CouncilSimProvider>
  );
}
