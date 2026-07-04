export type AgentStatus = "active" | "thinking" | "idle";

export interface Agent {
  id: number;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  color: string;
  avatar: string;
  iconBg: string;
  abbr: string;
  chatColor: string;
  chatBg: string;
}
