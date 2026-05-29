"use client";

import { useState } from "react";
import { AGENTS } from "@/data/agents";

const EXAMPLE_CHIPS = ["Doctor booking MVP", "AI fitness coach", "SaaS CRM for dentists"];

export default function PromptInput() {
  const [idea, setIdea] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleStart = () => {
    if (!idea.trim() || isRunning) return;
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleStart();
    }
  };

  const isReady = idea.trim().length > 0 && !isRunning;

  return (
    <div className="shrink-0 p-4 border-t border-slate-800/60">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-3 focus-within:border-slate-700/80 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-600 font-medium">Product Idea / MVP Concept</label>
          <div className="flex items-center gap-1.5">
            {EXAMPLE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setIdea(chip)}
                className="text-[10px] px-2 py-0.5 rounded-full border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-700 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-3">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your product idea or MVP concept..."
            rows={2}
            className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-700 resize-none outline-none leading-relaxed"
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
                Running...
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

        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/40">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-700">{AGENTS.length} agents ready • Est. 2–3 min</span>
        </div>
      </div>
    </div>
  );
}
