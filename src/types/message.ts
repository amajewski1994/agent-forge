import type { Vote, VoteOption } from "./vote";

export type MessageType = "message" | "decision" | "conflict" | "conflict_result";

export interface CouncilMessage {
  id: number;
  agentAbbr: string;
  role: string;
  content: string;
  timestamp: string;
  type: MessageType;
  // Only present on conflict_result type
  conflictTitle?: string;
  votes?: Vote[];
  options?: VoteOption[];
}
