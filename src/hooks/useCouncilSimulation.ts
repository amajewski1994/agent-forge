"use client";

import { useState, useCallback, useRef } from "react";
import type { AgentStatus, CouncilMessage, Conflict, Decision, OutputItem } from "@/types";
import { AGENTS } from "@/data/agents";

export type CouncilPhase =
  | "idle"
  | "analysis"
  | "council"
  | "conflict"
  | "decision"
  | "output"
  | "complete";

export interface CouncilSimState {
  phase: CouncilPhase;
  messages: CouncilMessage[];
  decisions: Decision[];
  conflicts: Conflict[];
  outputItems: OutputItem[];
  agentStatuses: Record<string, AgentStatus>;
  isRunning: boolean;
  round: number;
  agentReadyCount: number;
  start: () => void;
}

const SPEAKING_ORDER_ABBRS = ["PM", "CTO", "DES", "QA", "CEO"];

function computeAgentStatuses(
  phase: CouncilPhase,
  messageCount: number,
): Record<string, AgentStatus> {
  if (phase === "idle") {
    return Object.fromEntries(AGENTS.map((a) => [a.abbr, "idle" as AgentStatus]));
  }
  if (phase === "complete") {
    return Object.fromEntries(AGENTS.map((a) => [a.abbr, "active" as AgentStatus]));
  }
  if (phase === "output") {
    const statuses: Record<string, AgentStatus> = Object.fromEntries(
      SPEAKING_ORDER_ABBRS.map((abbr) => [abbr, "active" as AgentStatus]),
    );
    statuses["ENG"] = "thinking";
    return statuses;
  }
  return Object.fromEntries(
    AGENTS.map((a) => {
      const idx = SPEAKING_ORDER_ABBRS.indexOf(a.abbr);
      if (idx === -1) return [a.abbr, "idle" as AgentStatus];
      if (idx < messageCount) return [a.abbr, "active" as AgentStatus];
      if (idx === messageCount) return [a.abbr, "thinking" as AgentStatus];
      return [a.abbr, "idle" as AgentStatus];
    }),
  );
}

const SIM_MESSAGES: Omit<CouncilMessage, "timestamp">[] = [
  { id: 1, agentAbbr: "PM",  role: "Product Manager",   content: "The MVP should cover user onboarding, the core workflow, and account management.", type: "message" },
  { id: 2, agentAbbr: "CTO", role: "Technical Advisor",  content: "I recommend using mock authentication for the MVP to keep the scope minimal.", type: "message" },
  { id: 3, agentAbbr: "DES", role: "Designer",           content: "The main flow should be intuitive: sign up, set preferences, complete the core action.", type: "message" },
  { id: 4, agentAbbr: "QA",  role: "Quality Analyst",    content: "We need to handle empty states and error recovery as edge cases.", type: "message" },
  { id: 5, agentAbbr: "CEO", role: "Decision Leader",    content: "Decision: ship the core workflow with mock auth. Prioritize the primary user action.", type: "decision" },
];

const SIM_CONFLICT: Conflict = {
  id: 1,
  title: "Authentication scope",
  description: "PM wanted full login, CTO suggested mock login.",
  resolution: "mock login",
};

const SIM_DECISIONS: Decision[] = [
  { id: 1, text: "Mock auth for MVP" },
  { id: 2, text: "Core workflow" },
  { id: 3, text: "User onboarding" },
  { id: 4, text: "Error handling" },
];

const OUTPUT_ITEMS_BASE: OutputItem[] = [
  { id: 1, title: "PRD",         subtitle: "Product Requirements", icon: "📄", ready: false },
  { id: 2, title: "MVP Scope",   subtitle: "Core features",        icon: "🎯", ready: false },
  { id: 3, title: "User Flow",   subtitle: "User journey",         icon: "🔀", ready: false },
  { id: 4, title: "Architecture",subtitle: "System design",        icon: "🏗️", ready: false },
  { id: 5, title: "DB Schema",   subtitle: "Database structure",   icon: "🗄️", ready: false },
  { id: 6, title: "API Endpoints",subtitle: "REST API specs",      icon: "🔌", ready: false },
  { id: 7, title: "Backlog",     subtitle: "Development tasks",    icon: "📋", ready: false },
  { id: 8, title: "Impl. Plan",  subtitle: "Step-by-step plan",    icon: "🗺️", ready: false },
];

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function useCouncilSimulation(): CouncilSimState {
  const [phase, setPhase]           = useState<CouncilPhase>("idle");
  const [messages, setMessages]     = useState<CouncilMessage[]>([]);
  const [decisions, setDecisions]   = useState<Decision[]>([]);
  const [conflicts, setConflicts]   = useState<Conflict[]>([]);
  const [outputItems, setOutputItems] = useState<OutputItem[]>(OUTPUT_ITEMS_BASE);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const start = useCallback(() => {
    // cancel any in-flight timers from a previous run
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const schedule = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };

    // reset all state
    setPhase("analysis");
    setMessages([]);
    setDecisions([]);
    setConflicts([]);
    setOutputItems(OUTPUT_ITEMS_BASE);

    // 2s — PM speaks
    schedule(() => {
      setMessages([{ ...SIM_MESSAGES[0], timestamp: nowTime() }]);
    }, 2000);

    // 4s — council begins, CTO speaks
    schedule(() => {
      setPhase("council");
      setMessages(prev => [...prev, { ...SIM_MESSAGES[1], timestamp: nowTime() }]);
    }, 4000);

    // 6s — Designer speaks
    schedule(() => {
      setMessages(prev => [...prev, { ...SIM_MESSAGES[2], timestamp: nowTime() }]);
    }, 6000);

    // 8s — QA speaks
    schedule(() => {
      setMessages(prev => [...prev, { ...SIM_MESSAGES[3], timestamp: nowTime() }]);
    }, 8000);

    // 10s — conflict detected
    schedule(() => {
      setPhase("conflict");
      setConflicts([SIM_CONFLICT]);
    }, 10000);

    // 12s — CEO resolves, decisions populated
    schedule(() => {
      setPhase("decision");
      setMessages(prev => [...prev, { ...SIM_MESSAGES[4], timestamp: nowTime() }]);
      setDecisions(SIM_DECISIONS);
    }, 12000);

    // 14s — output generation begins; mark items ready one by one
    schedule(() => {
      setPhase("output");
      OUTPUT_ITEMS_BASE.forEach((_, idx) => {
        schedule(
          () => setOutputItems(prev =>
            prev.map((item, i) => (i === idx ? { ...item, ready: true } : item))
          ),
          idx * 300,
        );
      });
    }, 14000);

    // 18s — session complete
    schedule(() => setPhase("complete"), 18000);
  }, []); // timers ref and state setters are both stable

  return {
    phase,
    messages,
    decisions,
    conflicts,
    outputItems,
    agentStatuses: computeAgentStatuses(phase, messages.length),
    isRunning: phase !== "idle" && phase !== "complete",
    round: 1,
    agentReadyCount: messages.length,
    start,
  };
}
