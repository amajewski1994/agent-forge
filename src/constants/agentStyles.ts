import type { AgentStatus } from "@/types";

export interface StatusBadgeConfig {
  wrapper: string;
  text: string;
  dot: string;
}

export const STATUS_BADGE: Record<AgentStatus, StatusBadgeConfig | null> = {
  active: {
    wrapper: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
    text: "Active",
    dot: "bg-emerald-400",
  },
  thinking: {
    wrapper: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    text: "Thinking",
    dot: "bg-amber-400",
  },
  idle: null,
};

export const CARD_STYLE: Record<AgentStatus, string> = {
  active: [
    "bg-gradient-to-b from-violet-950/50 to-slate-900/60",
    "border border-cyan-500/30",
    "shadow-[0_0_20px_rgba(34,211,238,0.08)]",
  ].join(" "),
  thinking: "bg-slate-900/40 border border-amber-500/10",
  idle: "border border-slate-800/20",
};
