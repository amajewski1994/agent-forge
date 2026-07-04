const { callQwen } = require("./qwenService");
const {
  AGENT_PROMPTS,
  VOTE_SYSTEM_PROMPTS,
  VOTE_USER_PROMPT,
  DETERMINE_AGENT_STANCE_SYSTEM_PROMPT,
  DETERMINE_AGENT_STANCE_USER_PROMPT,
  FORCED_VOTE_REASON_USER_PROMPT,
  MVP_SCOPE_FEATURE_VOTE_SYSTEM_PROMPTS,
  MVP_SCOPE_FEATURE_VOTE_USER_PROMPT,
} = require("./prompts");
const { formatConversationHistory, extractJson } = require("../utils/councilUtils");

const VOTE_AGENTS = [
  { key: "PM", abbr: "PM", name: "Product Manager" },
  { key: "CTO", abbr: "CTO", name: "Chief Technology Officer" },
  { key: "DESIGNER", abbr: "DES", name: "Product Designer" },
  { key: "QA", abbr: "QA", name: "Quality Analyst" },
];

async function generateAgentVote({ agentKey, conflict, conversationHistory, ownStatements }) {
  const systemPrompt = VOTE_SYSTEM_PROMPTS[agentKey] || AGENT_PROMPTS[agentKey].systemPrompt;
  const result = await callQwen({
    systemPrompt,
    userPrompt: VOTE_USER_PROMPT({ conflict, conversationHistory, ownStatements }),
  });

  try {
    const parsed = JSON.parse(extractJson(result));
    if (!["A", "B"].includes(parsed.optionId)) parsed.optionId = Math.random() < 0.5 ? "A" : "B";
    if (!parsed.reason?.trim()) parsed.reason = "In line with my role's priorities.";
    return parsed;
  } catch {
    return { optionId: Math.random() < 0.5 ? "A" : "B", reason: "In line with my role's priorities." };
  }
}

async function determineAgentStance({ agentKey, conflict, ownStatements }) {
  if (!ownStatements) return { stance: "none" };

  const result = await callQwen({
    systemPrompt: DETERMINE_AGENT_STANCE_SYSTEM_PROMPT,
    userPrompt: DETERMINE_AGENT_STANCE_USER_PROMPT({ agentKey, conflict, ownStatements }),
  });

  try {
    const parsed = JSON.parse(extractJson(result));
    return ["A", "B", "none"].includes(parsed.stance) ? parsed : { stance: "none" };
  } catch {
    return { stance: "none" };
  }
}

async function generateForcedVoteReason({ agentKey, conflict, optionLabel, ownStatements }) {
  const systemPrompt = VOTE_SYSTEM_PROMPTS[agentKey] || AGENT_PROMPTS[agentKey].systemPrompt;
  const result = await callQwen({
    systemPrompt,
    userPrompt: FORCED_VOTE_REASON_USER_PROMPT({ conflict, optionLabel, ownStatements }),
  });
  return result?.trim() || "In line with what I already said.";
}


async function runConflictVote({ conflict, messages, send }) {
  const conflictId = Date.now();
  send("conflict_detected", { id: conflictId, title: conflict.topic, description: conflict.description });

  const sideA = conflict.sideA || "Support";
  const sideB = conflict.sideB || "Oppose";
  const voteOptions = [{ id: "A", label: sideA }, { id: "B", label: sideB }];

  send("vote_options", voteOptions);

  const conversationHistory = formatConversationHistory(messages);
  const tally = { A: 0, B: 0 };
  const collectedVotes = [];

  for (const agent of VOTE_AGENTS) {
    const ownStatements =
      messages.filter((m) => m.agentAbbr === agent.abbr).map((m) => m.content).join("\n") || null;

    const { stance } = await determineAgentStance({ agentKey: agent.key, conflict, ownStatements });

    let vote;
    if (stance === "A" || stance === "B") {
      const optionLabel = stance === "A" ? sideA : sideB;
      const reason = await generateForcedVoteReason({ agentKey: agent.key, conflict, optionLabel, ownStatements });
      vote = { optionId: stance, reason };
    } else {
      vote = await generateAgentVote({ agentKey: agent.key, conflict, conversationHistory, ownStatements: null });
    }

    tally[vote.optionId] = (tally[vote.optionId] || 0) + 1;
    const votePayload = { agentAbbr: agent.abbr, agentName: agent.name, optionId: vote.optionId, reason: vote.reason };
    collectedVotes.push(votePayload);
    send("vote", votePayload);
  }

  if (tally.A === tally.B) {
    const ceoVote = await generateAgentVote({ agentKey: "CEO", conflict, conversationHistory });
    tally[ceoVote.optionId] = (tally[ceoVote.optionId] || 0) + 1;
    const ceoPayload = {
      agentAbbr: "CEO",
      agentName: "Decision Leader",
      optionId: ceoVote.optionId,
      reason: ceoVote.reason,
      isTiebreaker: true,
    };
    collectedVotes.push(ceoPayload);
    send("vote", ceoPayload);
  }

  const winnerOption = tally.A > tally.B ? voteOptions[0] : voteOptions[1];
  const loserOption = tally.A > tally.B ? voteOptions[1] : voteOptions[0];

  send("votes_complete", {
    conflictId,
    conflictTopic: conflict.topic,
    winner: winnerOption,
    tally,
    votes: collectedVotes,
    options: voteOptions,
  });

  return {
    winner: winnerOption,
    conflictData: {
      title: conflict.topic,
      description: conflict.description,
      resolution: `${winnerOption.label} (${tally.A ?? 0}-${tally.B ?? 0})`,
      votes: collectedVotes,
      options: voteOptions,
    },
  };
}

const FEATURE_VOTE_OPTIONS = [
  { id: "A", label: "Post MVP" },
  { id: "B", label: "Approved MVP" },
  { id: "C", label: "Rejected" },
];

async function generateFeatureVote({ agentKey, feature, conversationHistory, ownStatements }) {
  const systemPrompt = MVP_SCOPE_FEATURE_VOTE_SYSTEM_PROMPTS[agentKey] || AGENT_PROMPTS[agentKey].systemPrompt;
  const result = await callQwen({
    systemPrompt,
    userPrompt: MVP_SCOPE_FEATURE_VOTE_USER_PROMPT({ feature, conversationHistory, ownStatements }),
  });
  try {
    const parsed = JSON.parse(extractJson(result));
    if (!["A", "B", "C"].includes(parsed.optionId)) parsed.optionId = "A";
    if (!parsed.reason?.trim()) parsed.reason = "In line with my role's priorities.";
    return parsed;
  } catch {
    return { optionId: "A", reason: "In line with my role's priorities." };
  }
}

const STANCE_TO_OPTION = { approved: "B", postMvp: "A", rejected: "C" };

async function generateForcedFeatureVoteReason({ agentKey, feature, forcedOptionId, conversationHistory }) {
  const systemPrompt = MVP_SCOPE_FEATURE_VOTE_SYSTEM_PROMPTS[agentKey] || AGENT_PROMPTS[agentKey].systemPrompt;
  const optionLabel = FEATURE_VOTE_OPTIONS.find((o) => o.id === forcedOptionId)?.label ?? forcedOptionId;
  const result = await callQwen({
    systemPrompt,
    userPrompt: `The council discussed the feature: "${feature}".
You have decided to vote for: ${optionLabel}.
Write a brief reason (max 8 words, in English) explaining why.
Return ONLY valid JSON: {"optionId":"${forcedOptionId}","reason":"your reason here"}`,
  });
  try {
    const parsed = JSON.parse(extractJson(result));
    return { optionId: forcedOptionId, reason: parsed.reason?.trim() || "In line with my role's priorities." };
  } catch {
    return { optionId: forcedOptionId, reason: "In line with my role's priorities." };
  }
}

async function runFeatureVote({ feature, messages, send, agentStances = {} }) {
  const conflictId = Date.now();
  send("conflict_detected", {
    id: conflictId,
    title: feature,
    description: `Vote on whether to include the feature "${feature}" in the product scope.`,
  });
  send("vote_options", FEATURE_VOTE_OPTIONS);

  const conversationHistory = formatConversationHistory(messages);
  const tally = { A: 0, B: 0, C: 0 };
  const collectedVotes = [];

  for (const agent of VOTE_AGENTS) {
    const forcedStance = agentStances[agent.key];
    let vote;
    if (forcedStance && STANCE_TO_OPTION[forcedStance]) {
      const forcedOptionId = STANCE_TO_OPTION[forcedStance];
      vote = await generateForcedFeatureVoteReason({ agentKey: agent.key, feature, forcedOptionId, conversationHistory });
    } else {
      const ownStatements =
        messages.filter((m) => m.agentAbbr === agent.abbr).map((m) => m.content).join("\n") || null;
      vote = await generateFeatureVote({ agentKey: agent.key, feature, conversationHistory, ownStatements });
    }
    tally[vote.optionId] = (tally[vote.optionId] || 0) + 1;
    const votePayload = { agentAbbr: agent.abbr, agentName: agent.name, optionId: vote.optionId, reason: vote.reason };
    collectedVotes.push(votePayload);
    send("vote", votePayload);
  }

  const maxCount = Math.max(tally.A, tally.B, tally.C);
  const topOptions = FEATURE_VOTE_OPTIONS.filter((o) => tally[o.id] === maxCount);

  if (topOptions.length > 1) {
    const ceoVote = await generateFeatureVote({ agentKey: "CEO", feature, conversationHistory, ownStatements: null });
    tally[ceoVote.optionId] = (tally[ceoVote.optionId] || 0) + 1;
    const ceoPayload = {
      agentAbbr: "CEO", agentName: "Decision Leader",
      optionId: ceoVote.optionId, reason: ceoVote.reason, isTiebreaker: true,
    };
    collectedVotes.push(ceoPayload);
    send("vote", ceoPayload);
  }

  const finalMax = Math.max(...FEATURE_VOTE_OPTIONS.map((o) => tally[o.id]));
  const winnerOption = FEATURE_VOTE_OPTIONS.find((o) => tally[o.id] === finalMax);

  send("votes_complete", {
    conflictId,
    conflictTopic: feature,
    winner: winnerOption,
    tally,
    votes: collectedVotes,
    options: FEATURE_VOTE_OPTIONS,
  });

  return { winner: winnerOption };
}

module.exports = { runConflictVote, runFeatureVote };
