"use client";

import { useState } from "react";

const STEPS = [
  {
    title: "Describe your idea",
    body: 'Enter a short description of the product you want to build, e.g. "an app with recipes for healthy smoothies."',
  },
  {
    title: "Start the Council",
    body: "Click the Start Council button. The agent team analyzes your idea and moves through the planning stages.",
  },
  {
    title: "Follow the council discussion",
    body: "PM, CTO, Designer, and QA present their recommendations on product vision, target users, MVP scope, UX, tech stack, data, and roadmap.",
  },
  {
    title: "See the CEO's decisions",
    body: "After each stage the CEO makes the final call. These decisions set the direction for the next stages.",
  },
  {
    title: "Receive the MVP Package",
    body: "Once the process is complete, the Engineer assembles a ready-to-use MVP package: product summary, MVP scope, user flow, architecture, data & integrations, roadmap, risks, and a full Decision Log.",
  },
  {
    title: "Use the plan to build your product",
    body: "Download or copy the package and use it as the starting point for your product and technical team.",
  },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700 transition-colors text-xs text-slate-400 hover:text-slate-300"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        How it works
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800/80 shadow-2xl shadow-slate-950/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-100">How it works</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-3.5">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center mt-0.5">
                    <span className="text-[11px] font-bold text-indigo-400">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200 leading-snug">{step.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-800/60 bg-slate-950/40">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
