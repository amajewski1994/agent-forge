export interface Decision {
  id: number;
  text: string;
}

export interface TopicSummaryConflict {
  title: string;
  description: string;
  resolution: string;
  votes: import("./vote").Vote[];
  options: import("./vote").VoteOption[];
}

export interface TopicSummary {
  id: number;
  stageNumber: number;
  topicTitle: string;
  summary: string;
  decision: string;
  conflict?: TopicSummaryConflict;
}

export interface OutputItem {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  ready: boolean;
}
