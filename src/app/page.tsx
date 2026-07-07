"use client";

import { useState } from "react";
import Image from "next/image";
import { AgentSidebar } from "@/components/agents";
import { CouncilChat, PromptInput } from "@/components/council";
import CouncilStatusBar from "@/components/council/CouncilStatusBar";
import { DecisionPanel } from "@/components/outputs";
import { WorkflowTimeline } from "@/components/layout";
import PhaseStatus from "@/components/layout/PhaseStatus";
import HowItWorks from "@/components/layout/HowItWorks";
import { CouncilSimProvider } from "@/context/CouncilSimContext";

type Drawer = "agents" | "outputs" | null;

export default function Home() {
  const [drawer, setDrawer] = useState<Drawer>(null);

  return (
    <CouncilSimProvider>
    <main className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-800/60 px-3 sm:px-5 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/30 shrink-0">
            <Image
              src="/agent-forge/Agent Forge logo.png"
              alt="Agent Forge logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white leading-none tracking-tight">AgentForge</h1>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <HowItWorks />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Session Active</span>
          </div>
          <div className="hidden min-[1000px]:block">
            <PhaseStatus />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Council edge toggle (mobile drawer trigger) */}
        <button
          onClick={() => setDrawer("agents")}
          aria-label="Open council panel"
          className="min-[1000px]:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 px-1.5 py-3 rounded-r-xl bg-slate-900/90 border border-l-0 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/90 transition-colors shadow-lg shadow-slate-950/40"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[9px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl]">
            Council
          </span>
        </button>

        {/* Outputs edge toggle (mobile drawer trigger) */}
        <button
          onClick={() => setDrawer("outputs")}
          aria-label="Open outputs panel"
          className="min-[1000px]:hidden fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 px-1.5 py-3 rounded-l-xl bg-slate-900/90 border border-r-0 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/90 transition-colors shadow-lg shadow-slate-950/40"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l-7 7 7 7" />
          </svg>
          <span className="text-[9px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl]">
            Outputs
          </span>
        </button>

        {/* Drawer backdrop (mobile only) */}
        {drawer !== null && (
          <div
            onClick={() => setDrawer(null)}
            className="min-[1000px]:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
          />
        )}

        {/* Council drawer (mobile only) */}
        <div
          className={`min-[1000px]:hidden fixed inset-y-0 left-0 z-50 w-1/4 min-w-60 max-w-[80%] bg-slate-950 border-r border-slate-800/60 shadow-2xl shadow-slate-950/60 transition-transform duration-300 ease-in-out ${
            drawer === "agents" ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={() => setDrawer(null)}
            aria-label="Close council panel"
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <AgentSidebar />
        </div>

        {/* Outputs drawer (mobile only) */}
        <div
          className={`min-[1000px]:hidden fixed inset-y-0 right-0 z-50 w-1/2 min-w-60 max-w-[90%] bg-slate-950 border-l border-slate-800/60 shadow-2xl shadow-slate-950/60 transition-transform duration-300 ease-in-out ${
            drawer === "outputs" ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            onClick={() => setDrawer(null)}
            aria-label="Close outputs panel"
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <DecisionPanel />
        </div>

        {/* Council sidebar (desktop only) */}
        <div className="hidden min-[1000px]:flex flex-col w-65 shrink-0 overflow-hidden">
          <AgentSidebar />
        </div>

        <section className="flex flex-col w-full flex-1 overflow-hidden min-[1000px]:border-x border-slate-800/60">
          <CouncilStatusBar />
          <CouncilChat />
          <PromptInput />
        </section>

        {/* Outputs panel (desktop only) */}
        <div className="hidden min-[1000px]:flex flex-col w-80 shrink-0 overflow-hidden">
          <DecisionPanel />
        </div>
      </div>

      <WorkflowTimeline />
    </main>
    </CouncilSimProvider>
  );
}
