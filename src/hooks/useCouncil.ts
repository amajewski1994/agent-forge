"use client";

import { useState } from "react";
import type { CouncilMessage, Conflict, Decision, OutputItem } from "@/types";

export interface CouncilState {
  messages: CouncilMessage[];
  decisions: Decision[];
  conflicts: Conflict[];
  outputItems: OutputItem[];
  isRunning: boolean;
  round: number;
  agentReadyCount: number;
}

const MOCK_MESSAGES: CouncilMessage[] = [
  {
    id: 1,
    agentAbbr: "PM",
    role: "Product Manager",
    content: "MVP should include doctor search, booking and cancellation.",
    timestamp: "10:02",
    type: "message",
  },
  {
    id: 2,
    agentAbbr: "CTO",
    role: "Technical Advisor",
    content: "I recommend using mock authentication for the MVP.",
    timestamp: "10:03",
    type: "message",
  },
  {
    id: 3,
    agentAbbr: "DES",
    role: "Designer",
    content: "The booking flow should be simple: choose doctor, select slot, confirm.",
    timestamp: "10:04",
    type: "message",
  },
  {
    id: 4,
    agentAbbr: "QA",
    role: "Quality Analyst",
    content: "We need to handle cancellation as an edge case.",
    timestamp: "10:05",
    type: "message",
  },
  {
    id: 5,
    agentAbbr: "CEO",
    role: "Decision Leader",
    content: "Decision: build search, booking and cancellation. Use mock login.",
    timestamp: "10:06",
    type: "decision",
  },
];

const MOCK_DECISIONS: Decision[] = [
  { id: 1, text: "Mock login for MVP" },
  { id: 2, text: "Doctor search" },
  { id: 3, text: "Booking flow" },
  { id: 4, text: "Cancellation flow" },
];

const MOCK_CONFLICTS: Conflict[] = [
  {
    id: 1,
    title: "Authentication scope",
    description: "PM wanted full login, CTO suggested mock login.",
    resolution: "mock login",
  },
];

const MOCK_OUTPUT_ITEMS: OutputItem[] = [
  { id: 1, title: "PRD", subtitle: "Product Requirements", icon: "📄", ready: true },
  { id: 2, title: "MVP Scope", subtitle: "Core features", icon: "🎯", ready: true },
  { id: 3, title: "User Flow", subtitle: "User journey", icon: "🔀", ready: true },
  { id: 4, title: "Architecture", subtitle: "System design", icon: "🏗️", ready: false },
  { id: 5, title: "DB Schema", subtitle: "Database structure", icon: "🗄️", ready: false },
  { id: 6, title: "API Endpoints", subtitle: "REST API specs", icon: "🔌", ready: false },
  { id: 7, title: "Backlog", subtitle: "Development tasks", icon: "📋", ready: false },
  { id: 8, title: "Impl. Plan", subtitle: "Step-by-step plan", icon: "🗺️", ready: false },
];

export function useCouncil(): CouncilState {
  const [state] = useState<CouncilState>({
    messages: MOCK_MESSAGES,
    decisions: MOCK_DECISIONS,
    conflicts: MOCK_CONFLICTS,
    outputItems: MOCK_OUTPUT_ITEMS,
    isRunning: false,
    round: 1,
    agentReadyCount: 5,
  });

  return state;
}
