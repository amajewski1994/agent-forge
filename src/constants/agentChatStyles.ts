import { AGENTS } from "@/data/agents";
import type { MessageType } from "@/types";

export interface AgentChatStyle {
  color: string;
  bg: string;
}

export const AGENT_STYLE_MAP: Record<string, AgentChatStyle> = Object.fromEntries(
  AGENTS.map((a) => [a.abbr, { color: a.chatColor, bg: a.chatBg }])
);

export const FALLBACK_STYLE: AgentChatStyle = {
  color: "text-slate-400",
  bg: "bg-slate-800/50 border-slate-700/50",
};

export const MESSAGE_BUBBLE: Record<MessageType, string> = {
  message: "bg-slate-900/50 border border-slate-800/40",
  decision: "bg-emerald-950/40 border border-emerald-500/30",
  conflict: "bg-amber-950/20 border border-amber-500/25",
  conflict_result: "bg-indigo-950/20 border border-indigo-500/20",
};

export const DECISION_BADGE =
  "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-wide";
