"use client";

import { useState } from "react";
import { useCouncilSim } from "@/context/CouncilSimContext";
import type { CouncilPhase } from "@/hooks/useCouncilSimulation";

const PHASE_LABEL: Record<CouncilPhase, string> = {
  idle:             "Start Council",
  analysis:         "Analyzing...",
  activating:       "Activating agents...",
  council:          "In council...",
  conflict:         "Resolving conflict...",
  voting:           "Agents voting...",
  decision:         "Deciding...",
  awaiting_proceed:  "Waiting for you...",
  awaiting_generate: "Waiting for you...",
  output:            "Generating output...",
  complete:         "Start Council",
};

export default function PromptInput() {
  const [idea, setIdea] = useState("");
  const { phase, start } = useCouncilSim();
  const isRunning = phase !== "idle" && phase !== "complete";
  const isReady = idea.trim().length > 0 && !isRunning;

  const handleStart = () => {
    if (!isReady) return;
    start(idea.trim());
    setIdea("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div className="shrink-0 p-4 border-t border-slate-800/60">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 px-3 py-2.5 focus-within:border-slate-700/80 transition-colors">
        <div className="flex items-center gap-3">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your product idea or MVP concept..."
            rows={1}
            disabled={isRunning}
            className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-700 resize-none outline-none leading-relaxed disabled:opacity-50"
          />
          <button
            onClick={handleStart}
            disabled={!isReady}
            className={`shrink-0 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              isReady
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 cursor-pointer"
                : "bg-slate-800/40 text-slate-700 cursor-not-allowed"
            }`}
          >
            {isRunning ? (
              <>
                <span className="w-3 h-3 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
                {/* {PHASE_LABEL[phase]} */}
              </>
            ) : (
              <>
                Start Council
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
