"use client";

import { useState, useCallback, useRef } from "react";
import type { AgentStatus, CouncilMessage, Conflict, Decision, OutputItem, Vote, VoteOption } from "@/types";
import { AGENTS } from "@/data/agents";

export type CouncilPhase =
  | "idle"
  | "analysis"
  | "council"
  | "conflict"
  | "voting"
  | "decision"
  | "output"
  | "complete";

export interface CouncilSimState {
  phase: CouncilPhase;
  messages: CouncilMessage[];
  decisions: Decision[];
  conflicts: Conflict[];
  votes: Vote[];
  voteOptions: VoteOption[];
  outputItems: OutputItem[];
  agentStatuses: Record<string, AgentStatus>;
  isRunning: boolean;
  round: number;
  agentReadyCount: number;
  start: () => void;
}

const SPEAKING_ORDER_ABBRS = ["PM", "CTO", "DES", "QA", "CEO"];
const VOTE_ORDER_ABBRS     = ["PM", "CTO", "DES", "QA"];

function computeAgentStatuses(
  phase: CouncilPhase,
  messageCount: number,
  voteCount: number,
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
  if (phase === "voting") {
    return Object.fromEntries(
      AGENTS.map((a) => {
        if (a.abbr === "CEO") return [a.abbr, "thinking" as AgentStatus];
        if (a.abbr === "ENG") return [a.abbr, "idle"    as AgentStatus];
        const idx = VOTE_ORDER_ABBRS.indexOf(a.abbr);
        if (idx === -1)          return [a.abbr, "idle"     as AgentStatus];
        if (idx < voteCount)     return [a.abbr, "active"   as AgentStatus];
        if (idx === voteCount)   return [a.abbr, "thinking" as AgentStatus];
        return [a.abbr, "idle" as AgentStatus];
      }),
    );
  }
  // analysis | council | conflict | decision — sequential speaking order
  return Object.fromEntries(
    AGENTS.map((a) => {
      const idx = SPEAKING_ORDER_ABBRS.indexOf(a.abbr);
      if (idx === -1)          return [a.abbr, "idle"     as AgentStatus];
      if (idx < messageCount)  return [a.abbr, "active"   as AgentStatus];
      if (idx === messageCount) return [a.abbr, "thinking" as AgentStatus];
      return [a.abbr, "idle" as AgentStatus];
    }),
  );
}

// ── sim data ──────────────────────────────────────────────────────────────

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

const SIM_VOTE_OPTIONS: VoteOption[] = [
  { id: "A", label: "Full auth" },
  { id: "B", label: "Mock auth" },
];

const SIM_VOTES: Vote[] = [
  { agentAbbr: "PM",  agentName: "Product Manager",   optionId: "B", reason: "Mock auth keeps scope lean. Real auth is v2 scope." },
  { agentAbbr: "CTO", agentName: "Technical Advisor",  optionId: "B", reason: "Full auth adds 2+ weeks. MVP doesn't need it." },
  { agentAbbr: "DES", agentName: "Designer",           optionId: "B", reason: "Users won't notice mock auth if the UX is solid." },
  { agentAbbr: "QA",  agentName: "Quality Analyst",    optionId: "A", reason: "Real auth is a security requirement, not a nice-to-have." },
];

const SIM_DECISIONS: Decision[] = [
  { id: 1, text: "Mock auth for MVP" },
  { id: 2, text: "Core workflow" },
  { id: 3, text: "User onboarding" },
  { id: 4, text: "Error handling" },
];

const OUTPUT_ITEMS_BASE: OutputItem[] = [
  { id: 1, title: "PRD",          subtitle: "Product Requirements", icon: "📄", ready: false },
  { id: 2, title: "MVP Scope",    subtitle: "Core features",        icon: "🎯", ready: false },
  { id: 3, title: "User Flow",    subtitle: "User journey",         icon: "🔀", ready: false },
  { id: 4, title: "Architecture", subtitle: "System design",        icon: "🏗️", ready: false },
  { id: 5, title: "DB Schema",    subtitle: "Database structure",   icon: "🗄️", ready: false },
  { id: 6, title: "API Endpoints",subtitle: "REST API specs",       icon: "🔌", ready: false },
  { id: 7, title: "Backlog",      subtitle: "Development tasks",    icon: "📋", ready: false },
  { id: 8, title: "Impl. Plan",   subtitle: "Step-by-step plan",    icon: "🗺️", ready: false },
];

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── hook ──────────────────────────────────────────────────────────────────

export function useCouncilSimulation(): CouncilSimState {
  const [phase, setPhase]             = useState<CouncilPhase>("idle");
  const [messages, setMessages]       = useState<CouncilMessage[]>([]);
  const [decisions, setDecisions]     = useState<Decision[]>([]);
  const [conflicts, setConflicts]     = useState<Conflict[]>([]);
  const [votes, setVotes]             = useState<Vote[]>([]);
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>([]);
  const [outputItems, setOutputItems] = useState<OutputItem[]>(OUTPUT_ITEMS_BASE);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const start = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const schedule = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };

    // reset
    setPhase("analysis");
    setMessages([]);
    setDecisions([]);
    setConflicts([]);
    setVotes([]);
    setVoteOptions([]);
    setOutputItems(OUTPUT_ITEMS_BASE);

    // 2s — PM speaks
    schedule(() => setMessages([{ ...SIM_MESSAGES[0], timestamp: nowTime() }]), 2000);

    // 4.5s — council begins, CTO speaks
    schedule(() => {
      setPhase("council");
      setMessages(prev => [...prev, { ...SIM_MESSAGES[1], timestamp: nowTime() }]);
    }, 4500);

    // 7s — Designer speaks
    schedule(() => setMessages(prev => [...prev, { ...SIM_MESSAGES[2], timestamp: nowTime() }]), 7000);

    // 9.5s — QA speaks
    schedule(() => setMessages(prev => [...prev, { ...SIM_MESSAGES[3], timestamp: nowTime() }]), 9500);

    // 11s — conflict detected
    schedule(() => {
      setPhase("conflict");
      setConflicts([SIM_CONFLICT]);
    }, 11000);

    // 12s — voting begins
    schedule(() => {
      setPhase("voting");
      setVoteOptions(SIM_VOTE_OPTIONS);
    }, 12000);

    // votes arrive 800ms apart (CEO reviewing derived from votes.length === 4 in voting phase)
    schedule(() => setVotes([SIM_VOTES[0]]),                             13000);
    schedule(() => setVotes([SIM_VOTES[0], SIM_VOTES[1]]),               13800);
    schedule(() => setVotes([SIM_VOTES[0], SIM_VOTES[1], SIM_VOTES[2]]), 14600);
    schedule(() => setVotes(SIM_VOTES),                                  15400);

    // 16.4s — decision phase opens (CEO still "thinking" in sidebar until message lands)
    schedule(() => {
      setPhase("decision");
      setDecisions(SIM_DECISIONS);
    }, 16400);

    // 16.9s — CEO message arrives (500ms gap gives chat typing indicator window)
    schedule(() => setMessages(prev => [...prev, { ...SIM_MESSAGES[4], timestamp: nowTime() }]), 16900);

    // 18.5s — output generation begins
    schedule(() => {
      setPhase("output");
      OUTPUT_ITEMS_BASE.forEach((_, idx) => {
        schedule(
          () => setOutputItems(prev =>
            prev.map((item, i) => (i === idx ? { ...item, ready: true } : item))
          ),
          idx * 500,
        );
      });
    }, 18500);

    // 23.5s — complete  (18500 + 8×500 = 22500 + 1000 buffer)
    schedule(() => setPhase("complete"), 23500);
  }, []);

  return {
    phase,
    messages,
    decisions,
    conflicts,
    votes,
    voteOptions,
    outputItems,
    agentStatuses: computeAgentStatuses(phase, messages.length, votes.length),
    isRunning: phase !== "idle" && phase !== "complete",
    round: 1,
    agentReadyCount: messages.length,
    start,
  };
}
