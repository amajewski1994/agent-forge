export type MessageType = "message" | "decision";

export interface CouncilMessage {
  id: number;
  agentAbbr: string;
  role: string;
  content: string;
  timestamp: string;
  type: MessageType;
}
