"use client";

import { useEffect } from "react";
import { useCouncilSim } from "@/context/CouncilSimContext";
import { exportMarkdown } from "@/lib/report";

interface ReportPreviewModalProps {
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-slate-800/70 border border-slate-700/50 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 leading-tight">
      {children}
    </span>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-slate-950/60 border border-slate-800/50 rounded-xl px-4 py-3 text-[11px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
      {children}
    </pre>
  );
}

export default function ReportPreviewModal({ onClose }: ReportPreviewModalProps) {
  const { prd } = useCouncilSim();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!prd) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="animate-slide-up w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{prd.title}</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Product Requirements Document — AI Council Output</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportMarkdown(prd)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Markdown
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          <Section title="Podsumowanie produktu">
            <p className="text-[12px] text-slate-300 leading-relaxed">{prd.productSummary}</p>
          </Section>

          <Section title="Zakres MVP">
            <div className="flex flex-wrap gap-2">
              {prd.mvpScope.map((item: string, i: number) => <Tag key={i}>{item}</Tag>)}
            </div>
          </Section>

          <Section title="User Flow">
            <div className="space-y-1.5">
              {prd.userFlow.map((step: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-indigo-400">{i + 1}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {step.replace(/^\d+\.\s*/, "")}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Architektura">
            <CodeBlock>{prd.architecture}</CodeBlock>
          </Section>

          <Section title="Schemat bazy danych">
            <div className="space-y-1.5">
              {prd.dbSchema.map((row: string, i: number) => (
                <p key={i} className="font-mono text-[11px] text-slate-400 bg-slate-950/40 rounded-lg px-3 py-1.5">{row}</p>
              ))}
            </div>
          </Section>

          <Section title="Endpointy API">
            <div className="space-y-1.5">
              {prd.apiEndpoints.map((ep: string, i: number) => (
                <p key={i} className="font-mono text-[11px] text-slate-400 bg-slate-950/40 rounded-lg px-3 py-1.5">{ep}</p>
              ))}
            </div>
          </Section>

          <Section title="Backlog">
            <div className="space-y-1.5">
              {prd.backlog.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-3.5 h-3.5 rounded border border-slate-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-relaxed">{item.replace(/^\[.\]\s*/, "")}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Plan implementacji">
            <div className="space-y-2">
              {prd.implementationPlan.map((phase: string, i: number) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-800/40 border border-slate-700/40 px-3 py-2.5">
                  <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                    F{i + 1}
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{phase.replace(/^(Week \d+ — |Faza \d+ — )/, "")}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Ryzyka">
            <div className="space-y-2">
              {prd.risks.map((risk: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-amber-950/20 border border-amber-500/15 px-3 py-2">
                  <svg className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{risk}</p>
                </div>
              ))}
            </div>
          </Section>

          <p className="text-center text-[10px] text-slate-700 mt-2">Wygenerowane przez AgentForge — AI Product Council</p>
        </div>
      </div>
    </div>
  );
}
