"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  AgendaItem,
  AgentStatus,
  CouncilMessage,
  Conflict,
  Decision,
  OutputItem,
  TopicSummary,
  Vote,
  VoteOption,
} from "@/types";
import type { MvpReport } from "@/lib/report";
import { AGENTS } from "@/data/agents";

export type CouncilPhase =
  | "idle"
  | "analysis"
  | "activating"
  | "council"
  | "conflict"
  | "voting"
  | "decision"
  | "awaiting_proceed"
  | "awaiting_generate"
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
  typingAgent: string | null;
  isRunning: boolean;
  submittedIdea: string;
  agenda: AgendaItem[];
  spinnerPhase: "analyzing" | "activating" | "generating" | null;
  agendaUnlocked: boolean;
  councilStarted: boolean;
  councilFinished: boolean;
  prd: MvpReport | null;
  isPrdGenerating: boolean;
  generatePrd: () => void;
  generateMvpPackage: () => void;
  start: (idea: string) => void;
  proceed: () => void;
}

const SPEAKING_ORDER_ABBRS = ["PM", "CTO", "DES", "QA", "CEO"];
const VOTE_ORDER_ABBRS = ["PM", "CTO", "DES", "QA"];

function computeAgentStatuses(
  phase: CouncilPhase,
  activatedAgents: string[],
): Record<string, AgentStatus> {
  if (phase === "idle" || phase === "analysis") {
    return Object.fromEntries(AGENTS.map((a) => [a.abbr, "idle" as AgentStatus]));
  }
  if (phase === "activating") {
    const activatedSet = new Set(activatedAgents);
    return Object.fromEntries(
      AGENTS.map((a) => [
        a.abbr,
        a.abbr !== "ENG" && activatedSet.has(a.abbr) ? "active" : "idle" as AgentStatus,
      ]),
    );
  }
  if (phase === "output" || phase === "complete") {
    return Object.fromEntries(AGENTS.map((a) => [a.abbr, "active" as AgentStatus]));
  }
  // awaiting_proceed | council | conflict | voting | decision
  return Object.fromEntries(
    AGENTS.map((a) => [a.abbr, a.abbr === "ENG" ? "idle" : "active" as AgentStatus]),
  );
}

const OUTPUT_ITEMS_BASE: OutputItem[] = [
  { id: 1, title: "Product Summary",        subtitle: "", icon: "", ready: false },
  { id: 2, title: "MVP Scope",              subtitle: "", icon: "", ready: false },
  { id: 3, title: "User Flow",              subtitle: "", icon: "", ready: false },
  { id: 4, title: "Architecture",           subtitle: "", icon: "", ready: false },
  { id: 5, title: "Data & Integrations",    subtitle: "", icon: "", ready: false },
  { id: 6, title: "Implementation Roadmap", subtitle: "", icon: "", ready: false },
  { id: 7, title: "Risks & Open Questions", subtitle: "", icon: "", ready: false },
  { id: 8, title: "Decision Log",           subtitle: "", icon: "", ready: false },
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
  const [outputItems, setOutputItems] =
    useState<OutputItem[]>(OUTPUT_ITEMS_BASE);
  const [topicSummaries, setTopicSummaries] = useState<TopicSummary[]>([]);
  const [currentTopic, setCurrentTopic] = useState<{
    stageNumber: number;
    topicTitle: string;
  } | null>(null);
  const [submittedIdea, setSubmittedIdea] = useState("");
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [spinnerPhase, setSpinnerPhase] = useState<"analyzing" | "activating" | "generating" | null>(null);
  const [agendaUnlocked, setAgendaUnlocked] = useState(false);
  const [activatedAgents, setActivatedAgents] = useState<string[]>([]);
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  const [councilStarted, setCouncilStarted] = useState(false);
  const [councilFinished, setCouncilFinished] = useState(false);
  const [prd, setPrd] = useState<MvpReport | null>(null);
  const [isPrdGenerating, setIsPrdGenerating] = useState(false);

  const esRef = useRef<EventSource | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sessionIdRef = useRef<string>("");
  const preCouncilRef = useRef(true);
  const councilStartedRef = useRef(false);
  // Always-fresh snapshot of data needed for PRD generation (avoids stale closures)
  const prdDataRef = useRef<{
    idea: string;
    topicSummaries: TopicSummary[];
    decisions: Decision[];
  }>({ idea: "", topicSummaries: [], decisions: [] });

  useEffect(() => {
    return () => {
      esRef.current?.close();
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const proceed = useCallback(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    preCouncilRef.current = false;
    setPhase("council");
    fetch(`${BACKEND_URL}/api/council/proceed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(console.error);
  }, []);

  const generateMvpPackage = useCallback(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    fetch(`${BACKEND_URL}/api/council/generate-start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(console.error);
  }, []);

  const generatePrd = useCallback(() => {
    const { idea, topicSummaries, decisions } = prdDataRef.current;
    setIsPrdGenerating(true);
    setPrd(null);
    fetch(`${BACKEND_URL}/api/council/generate-prd`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, topicSummaries, decisions }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.prd) setPrd(data.prd); })
      .catch(console.error)
      .finally(() => setIsPrdGenerating(false));
  }, []);

  const start = useCallback((idea: string) => {
    esRef.current?.close();
    esRef.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    preCouncilRef.current = true;

    const sessionId =
      Date.now().toString(36) + Math.random().toString(36).slice(2);
    sessionIdRef.current = sessionId;

    const schedule = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };

    // Reset all state
    const normalizedIdea = idea.charAt(0).toUpperCase() + idea.slice(1);
    setSubmittedIdea(normalizedIdea);
    setAgenda([]);
    setSpinnerPhase("analyzing");
    setAgendaUnlocked(false);
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
    setActivatedAgents([]);
    setTypingAgent(null);
    setCouncilStarted(false);
    setCouncilFinished(false);
    setPrd(null);
    setIsPrdGenerating(false);
    councilStartedRef.current = false;
    prdDataRef.current = { idea: normalizedIdea, topicSummaries: [], decisions: [] };

    const url = `${BACKEND_URL}/api/council/start?idea=${encodeURIComponent(idea)}&sessionId=${sessionId}`;
    const es = new EventSource(url);
    esRef.current = es;

    // ── Chat messages — queue held until after activation ─────────────────
    type QueueItem =
      | { kind: "message"; msg: CouncilMessage }
      | { kind: "phase"; value: CouncilPhase };

    const msgQueue: QueueItem[] = [];
    let queueBusy = true; // held until activation completes

    const processNext = () => {
      if (msgQueue.length === 0) {
        queueBusy = false;
        setTypingAgent(null);
        return;
      }
      queueBusy = true;
      const item = msgQueue.shift()!;

      if (item.kind === "phase") {
        setTypingAgent(null);
        setPhase(item.value);
        timers.current.push(setTimeout(processNext, 50));
        return;
      }

      const { msg } = item;

      // CEO decision: set phase first, show typing dots for 3s, then reveal
      if (msg.type === "decision") {
        setPhase("decision");
        setTypingAgent(msg.agentAbbr);
        timers.current.push(setTimeout(() => {
          setTypingAgent(null);
          setMessages((prev) => [...prev, msg]);
          timers.current.push(setTimeout(processNext, 50));
        }, 3000));
        return;
      }

      // All other messages: show typing dots for 2s, then reveal message
      setTypingAgent(msg.agentAbbr);
      timers.current.push(setTimeout(() => {
        setTypingAgent(null);
        setMessages((prev) => [...prev, msg]);
        timers.current.push(setTimeout(processNext, 50));
      }, 2000));
    };

    es.addEventListener("agenda_ready", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as AgendaItem[];
      setAgenda(data);
    });

    es.addEventListener("agent_message", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as Omit<CouncilMessage, "timestamp">;
      if (data.agentAbbr === "PM" && !councilStartedRef.current) {
        councilStartedRef.current = true;
        setCouncilStarted(true);
      }
      msgQueue.push({ kind: "message", msg: { ...data, timestamp: nowTime(), preCouncil: preCouncilRef.current } });
      if (!queueBusy) processNext();
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
      const {
        conflictTopic,
        winner,
        tally,
        votes: finalVotes,
        options: finalOptions,
      } = JSON.parse(e.data) as {
        conflictTopic?: string;
        winner: VoteOption;
        tally: Record<string, number>;
        votes: Vote[];
        options: VoteOption[];
      };
      if (conflictTopic) {
        const newDecision = { id: Date.now(), text: `${conflictTopic}: ${winner.label}` };
        setDecisions((prev) => {
          const next = [...prev, newDecision];
          prdDataRef.current.decisions = next;
          return next;
        });
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

    // ── Proceed gate — activate agents, then show "Generating agenda…", then drain PM messages ─
    es.addEventListener("awaiting_proceed", () => {
      const agentsToActivate = AGENTS.filter((a) => a.abbr !== "ENG");
      setPhase("activating");
      setSpinnerPhase("activating");
      agentsToActivate.forEach((agent, idx) => {
        schedule(() => {
          setActivatedAgents((prev) => [...prev, agent.abbr]);
        }, (idx + 1) * 600);
      });
      const totalActivationMs = (agentsToActivate.length + 1) * 600;
      // Spinner → "Generating agenda…" + reveal agenda in sidebar
      schedule(() => {
        setSpinnerPhase("generating");
        setAgendaUnlocked(true);
      }, totalActivationMs);
      // Spinner disappears
      schedule(() => setSpinnerPhase(null), totalActivationMs + 1500);
      // 1s after spinner hides: start draining PM messages
      schedule(() => {
        msgQueue.push({ kind: "phase", value: "awaiting_proceed" });
        queueBusy = false;
        processNext();
      }, totalActivationMs + 2500);
    });

    // ── Stage summaries ────────────────────────────────────────────────────
    es.addEventListener("topic_start", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as {
        stageNumber: number;
        topicTitle: string;
      };
      setCurrentTopic(data);
    });

    es.addEventListener("stage_summary", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as TopicSummary;
      setCurrentTopic(null);
      setTopicSummaries((prev) => {
        const next = [...prev, data];
        prdDataRef.current.topicSummaries = next;
        return next;
      });
    });

    // ── Awaiting generate ──────────────────────────────────────────────────
    es.addEventListener("awaiting_generate", () => {
      msgQueue.push({ kind: "phase", value: "awaiting_generate" });
      if (!queueBusy) processNext();
    });

    // ── Output ─────────────────────────────────────────────────────────────
    es.addEventListener("final_output", () => {
      generatePrd();
      schedule(() => {
        setPhase("output");
        OUTPUT_ITEMS_BASE.forEach((_, idx) => {
          schedule(
            () =>
              setOutputItems((prev) =>
                prev.map((item, i) =>
                  i === idx ? { ...item, ready: true } : item,
                ),
              ),
            idx * 500,
          );
        });
      }, 1000);
      // 1000 + 8×500 = 5000ms, plus 1s buffer
      schedule(() => setPhase("complete"), 7000);
    });

    // ── Cleanup ────────────────────────────────────────────────────────────
    es.addEventListener("done", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.message === "Council finished") {
          setCouncilFinished(true);
        }
      } catch {}
      es.close();
      esRef.current = null;
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setPhase("complete");
    };
  }, [generatePrd]);

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
    agentStatuses: computeAgentStatuses(phase, activatedAgents),
    typingAgent,
    isRunning: phase !== "idle" && phase !== "complete",
    submittedIdea,
    agenda,
    spinnerPhase,
    agendaUnlocked,
    councilStarted,
    councilFinished,
    prd,
    isPrdGenerating,
    generatePrd,
    generateMvpPackage,
    start,
    proceed,
  };
}
