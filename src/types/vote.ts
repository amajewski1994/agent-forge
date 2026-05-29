export interface VoteOption {
  id: string;
  label: string;
}

export interface Vote {
  agentAbbr: string;
  agentName: string;
  optionId: string;
  reason: string;
}
