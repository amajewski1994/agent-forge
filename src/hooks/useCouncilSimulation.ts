"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  submittedIdea: string;
  start: (idea: string) => void;
}

const SPEAKING_ORDER_ABBRS = ["PM", "CTO", "DES", "QA", "CEO"];
const VOTE_ORDER_ABBRS = ["PM", "CTO", "DES", "QA"];

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
        if (a.abbr === "ENG") return [a.abbr, "idle" as AgentStatus];
        const idx = VOTE_ORDER_ABBRS.indexOf(a.abbr);
        if (idx === -1) return [a.abbr, "idle" as AgentStatus];
        if (idx < voteCount) return [a.abbr, "active" as AgentStatus];
        if (idx === voteCount) return [a.abbr, "thinking" as AgentStatus];
        return [a.abbr, "idle" as AgentStatus];
      }),
    );
  }
  // analysis | council | conflict | decision — sequential speaking order
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

const OUTPUT_ITEMS_BASE: OutputItem[] = [
  { id: 1, title: "PRD", subtitle: "Product Requirements", icon: "📄", ready: false },
  { id: 2, title: "MVP Scope", subtitle: "Core features", icon: "🎯", ready: false },
  { id: 3, title: "User Flow", subtitle: "User journey", icon: "🔀", ready: false },
  { id: 4, title: "Architecture", subtitle: "System design", icon: "🏗️", ready: false },
  { id: 5, title: "DB Schema", subtitle: "Database structure", icon: "🗄️", ready: false },
  { id: 6, title: "API Endpoints", subtitle: "REST API specs", icon: "🔌", ready: false },
  { id: 7, title: "Backlog", subtitle: "Development tasks", icon: "📋", ready: false },
  { id: 8, title: "Impl. Plan", subtitle: "Step-by-step plan", icon: "🗺️", ready: false },
];

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const BACKEND_URL = "http://localhost:4000";

// ── hook ──────────────────────────────────────────────────────────────────

export function useCouncilSimulation(): CouncilSimState {
  const [phase, setPhase] = useState<CouncilPhase>("idle");
  const [messages, setMessages] = useState<CouncilMessage[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>([]);
  const [outputItems, setOutputItems] = useState<OutputItem[]>(OUTPUT_ITEMS_BASE);
  const [submittedIdea, setSubmittedIdea] = useState("");

  const esRef = useRef<EventSource | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const messageCountRef = useRef(0);

  useEffect(() => {
    return () => {
      esRef.current?.close();
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const start = useCallback((idea: string) => {
    esRef.current?.close();
    esRef.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    messageCountRef.current = 0;

    const schedule = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };

    // Reset all state
    setSubmittedIdea(idea);
    setPhase("analysis");
    setMessages([]);
    setDecisions([]);
    setConflicts([]);
    setVotes([]);
    setVoteOptions([]);
    setOutputItems(OUTPUT_ITEMS_BASE);

    const url = `${BACKEND_URL}/api/council/start?idea=${encodeURIComponent(idea)}`;
    const es = new EventSource(url);
    esRef.current = es;

    // ── Chat messages ──────────────────────────────────────────────────────
    es.addEventListener("agent_message", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as Omit<CouncilMessage, "timestamp">;
      messageCountRef.current += 1;
      if (messageCountRef.current === 2) setPhase("council");
      setMessages((prev) => [...prev, { ...data, timestamp: nowTime() }]);
    });

    // ── Conflict ───────────────────────────────────────────────────────────
    es.addEventListener("conflict_detected", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as Conflict;
      setConflicts([data]);
      setPhase("conflict");
    });

    // ── Voting ─────────────────────────────────────────────────────────────
    es.addEventListener("vote_options", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as VoteOption[];
      setVoteOptions(data);
      setPhase("voting");
    });

    es.addEventListener("vote", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as Vote;
      setVotes((prev) => [...prev, data]);
    });

    // ── Decision ───────────────────────────────────────────────────────────
    es.addEventListener("decision", (e: MessageEvent) => {
      const raw = JSON.parse(e.data) as Omit<CouncilMessage, "timestamp"> & { decisions?: Decision[] };
      const { decisions: newDecisions, ...messageData } = raw;
      setPhase("decision");
      if (newDecisions) setDecisions(newDecisions);
      // Small delay so the phase indicator updates before the CEO message lands
      schedule(() => {
        setMessages((prev) => [...prev, { ...messageData, timestamp: nowTime() }]);
      }, 500);
    });

    // ── Output ─────────────────────────────────────────────────────────────
    es.addEventListener("final_output", () => {
      schedule(() => {
        setPhase("output");
        OUTPUT_ITEMS_BASE.forEach((_, idx) => {
          schedule(
            () => setOutputItems((prev) =>
              prev.map((item, i) => (i === idx ? { ...item, ready: true } : item))
            ),
            idx * 500,
          );
        });
      }, 1000);
      // 1000 + 8×500 = 5000ms, plus 1s buffer
      schedule(() => setPhase("complete"), 7000);
    });

    // ── Cleanup ────────────────────────────────────────────────────────────
    es.addEventListener("done", () => {
      es.close();
      esRef.current = null;
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setPhase("complete");
    };
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
    submittedIdea,
    start,
  };
}
