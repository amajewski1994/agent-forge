"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AgentStatus, CouncilMessage, Conflict, Decision, OutputItem, TopicSummary, Vote, VoteOption } from "@/types";
import { AGENTS } from "@/data/agents";

export type CouncilPhase =
  | "idle"
  | "analysis"
  | "council"
  | "conflict"
  | "voting"
  | "decision"
  | "awaiting_proceed"
  | "output"
  | "complete";

export interface CouncilSimState {
  phase: CouncilPhase;
  messages: CouncilMessage[];
  decisions: Decision[];
  conflicts: Conflict[];
  activeConflict: Conflict | null;
  votes: Vote[];
  voteOptions: VoteOption[];
  outputItems: OutputItem[];
  topicSummaries: TopicSummary[];
  currentTopic: { stageNumber: number; topicTitle: string } | null;
  agentStatuses: Record<string, AgentStatus>;
  isRunning: boolean;
  round: number;
  agentReadyCount: number;
  submittedIdea: string;
  start: (idea: string) => void;
  proceed: () => void;
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
  const [activeConflict, setActiveConflict] = useState<Conflict | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>([]);
  const [outputItems, setOutputItems] = useState<OutputItem[]>(OUTPUT_ITEMS_BASE);
  const [topicSummaries, setTopicSummaries] = useState<TopicSummary[]>([]);
  const [currentTopic, setCurrentTopic] = useState<{ stageNumber: number; topicTitle: string } | null>(null);
  const [submittedIdea, setSubmittedIdea] = useState("");

  const esRef = useRef<EventSource | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const messageCountRef = useRef(0);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    return () => {
      esRef.current?.close();
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const proceed = useCallback(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    setPhase("council");
    fetch(`${BACKEND_URL}/api/council/proceed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(console.error);
  }, []);

  const start = useCallback((idea: string) => {
    esRef.current?.close();
    esRef.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    messageCountRef.current = 0;

    const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    sessionIdRef.current = sessionId;

    const schedule = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };

    // Reset all state
    setSubmittedIdea(idea);
    setPhase("analysis");
    setMessages([]);
    setDecisions([]);
    setConflicts([]);
    setActiveConflict(null);
    setVotes([]);
    setVoteOptions([]);
    setOutputItems(OUTPUT_ITEMS_BASE);
    setTopicSummaries([]);
    setCurrentTopic(null);

    const url = `${BACKEND_URL}/api/council/start?idea=${encodeURIComponent(idea)}&sessionId=${sessionId}`;
    const es = new EventSource(url);
    esRef.current = es;

    // ── Chat messages ──────────────────────────────────────────────────────
    es.addEventListener("agent_message", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as Omit<CouncilMessage, "timestamp">;
      messageCountRef.current += 1;
      if (messageCountRef.current === 2) setPhase("council");
      if (data.type === "decision") setPhase("decision");
      setMessages((prev) => [...prev, { ...data, timestamp: nowTime() }]);
    });

    // ── Conflict ───────────────────────────────────────────────────────────
    es.addEventListener("conflict_detected", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as Conflict;
      setActiveConflict(data);
      setVotes([]);
      setVoteOptions([]);
      setPhase("conflict");
      setMessages((prev) =>
        prev.some((m) => m.id === -data.id)
          ? prev
          : [
              ...prev,
              {
                id: -data.id,
                agentAbbr: "CONFLICT",
                role: "Conflict Detected",
                content: data.description,
                timestamp: nowTime(),
                type: "conflict" as const,
                conflictTitle: data.title,
              },
            ],
      );
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

    es.addEventListener("votes_complete", (e: MessageEvent) => {
      const { conflictTopic, winner, tally, votes: finalVotes, options: finalOptions } = JSON.parse(e.data) as {
        conflictTopic?: string;
        winner: VoteOption;
        tally: Record<string, number>;
        votes: Vote[];
        options: VoteOption[];
      };
      if (conflictTopic) {
        setDecisions((prev) => [...prev, { id: Date.now(), text: `${conflictTopic}: ${winner.label}` }]);
      }
      setActiveConflict((prev) => {
        if (prev) {
          const resolved: Conflict = {
            ...prev,
            resolution: `${winner.label} (${tally.A ?? 0}-${tally.B ?? 0})`,
            votes: finalVotes,
            options: finalOptions,
          };
          setConflicts((c) =>
            c.some((x) => x.id === resolved.id) ? c : [...c, resolved],
          );
          const resultMsgId = -(prev.id + 1);
          setMessages((msgs) =>
            msgs.some((m) => m.id === resultMsgId)
              ? msgs
              : [
                  ...msgs,
                  {
                    id: resultMsgId,
                    agentAbbr: "RESULT",
                    role: "Vote Result",
                    content: `${winner.label} wins ${tally.A ?? 0}-${tally.B ?? 0}`,
                    timestamp: nowTime(),
                    type: "conflict_result" as const,
                    conflictTitle: prev.title,
                    votes: finalVotes,
                    options: finalOptions,
                  },
                ],
          );
        }
        return null;
      });
      setPhase("council");
    });

    // ── Proceed gate ───────────────────────────────────────────────────────
    es.addEventListener("awaiting_proceed", () => {
      setPhase("awaiting_proceed");
    });

    // ── Stage summaries ────────────────────────────────────────────────────
    es.addEventListener("topic_start", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { stageNumber: number; topicTitle: string };
      setCurrentTopic(data);
    });

    es.addEventListener("stage_summary", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as TopicSummary;
      setCurrentTopic(null);
      setTopicSummaries((prev) => [...prev, data]);
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
    activeConflict,
    votes,
    voteOptions,
    outputItems,
    topicSummaries,
    currentTopic,
    agentStatuses: computeAgentStatuses(phase, messages.length, votes.length),
    isRunning: phase !== "idle" && phase !== "complete",
    round: 1,
    agentReadyCount: messages.length,
    submittedIdea,
    start,
    proceed,
  };
}
