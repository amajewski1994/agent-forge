import type { Vote, VoteOption } from "./vote";

export interface Conflict {
  id: number;
  title: string;
  description: string;
  resolution?: string;
  votes?: Vote[];
  options?: VoteOption[];
}
