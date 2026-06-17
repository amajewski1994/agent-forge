const { callQwen } = require("./qwenService");
const {
  AGENT_PROMPTS,
  VOTE_SYSTEM_PROMPTS,
  VOTE_USER_PROMPT,
  DETERMINE_AGENT_STANCE_SYSTEM_PROMPT,
  DETERMINE_AGENT_STANCE_USER_PROMPT,
  FORCED_VOTE_REASON_USER_PROMPT,
  PM_VOTE_ANNOUNCEMENT_USER_PROMPT,
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
    if (!parsed.reason?.trim()) parsed.reason = "Zgodnie z priorytetami mojej roli.";
    return parsed;
  } catch {
    return { optionId: Math.random() < 0.5 ? "A" : "B", reason: "Zgodnie z priorytetami mojej roli." };
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
  return result?.trim() || "Zgodnie z tym, co już powiedziałem.";
}

async function generatePMVoteAnnouncement({ conflict, sideA, sideB }) {
  const result = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: PM_VOTE_ANNOUNCEMENT_USER_PROMPT({ conflict, sideA, sideB }),
  });
  return result?.trim() || `Przechodzimy do głosowania w temacie "${conflict.topic}".`;
}

async function runConflictVote({ conflict, messages, send }) {
  const conflictId = Date.now();
  send("conflict_detected", { id: conflictId, title: conflict.topic, description: conflict.description });

  const sideA = conflict.sideA || "Support";
  const sideB = conflict.sideB || "Oppose";
  const voteOptions = [{ id: "A", label: sideA }, { id: "B", label: sideB }];

  const pmAnnouncement = await generatePMVoteAnnouncement({ conflict, sideA, sideB });
  send("agent_message", { id: Date.now(), agentAbbr: "PM", role: "Product Manager", content: pmAnnouncement, type: "message" });
  send("vote_options", voteOptions);

  const conversationHistory = formatConversationHistory(messages);
  const tally = { A: 0, B: 0 };
  const collectedVotes = [];

  for (const agent of VOTE_AGENTS) {
    const ownStatements =
      messages.filter((m) => m.agentAbbr === agent.abbr).map((m) => m.content).join("\n") || null;

    const { stance } = await determineAgentStance({ agentKey: agent.key, conflict, ownStatements });
    console.log(`[Vote Stance] ${agent.abbr}:`, stance);

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

module.exports = { runConflictVote };
