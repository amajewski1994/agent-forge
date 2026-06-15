const { callQwen } = require("./qwenService");
const { AGENT_PROMPTS, REPLY_USER_PROMPT } = require("./prompts");

function formatConversationHistory(messages) {
  return messages
    .map((msg) => `${msg.agentAbbr} (${msg.role}): ${msg.content}`)
    .join("\n\n");
}

function computeWinner(voteOptions, votes) {
  const counts = Object.fromEntries(voteOptions.map((o) => [o.id, 0]));

  for (const v of votes) {
    counts[v.optionId] = (counts[v.optionId] ?? 0) + 1;
  }

  const sorted = [...voteOptions].sort((a, b) => counts[b.id] - counts[a.id]);
  const isTie = counts[sorted[0].id] === counts[sorted[1].id];

  if (isTie) {
    return voteOptions.find((o) => o.id === "B");
  }

  return sorted[0];
}

const DECISION_TEMPLATES = {
  "Full auth": {
    content:
      "The council has voted: full authentication from day one. Security cannot be deferred.",
    decisions: [
      { id: 1, text: "Full auth from day one" },
      { id: 2, text: "Core workflow first" },
      { id: 3, text: "Mock auth as internal test fallback" },
    ],
  },
  "Mock auth": {
    content:
      "Decision: use mock authentication for the MVP. Full auth is v2 scope.",
    decisions: [
      { id: 1, text: "Mock auth for MVP" },
      { id: 2, text: "Core workflow first" },
      { id: 3, text: "Full auth moved to v2" },
    ],
  },
};

function buildDecisionEvent(winner) {
  const template = DECISION_TEMPLATES[winner.label] ?? {
    content: `The council has decided: ${winner.label}.`,
    decisions: [{ id: 1, text: winner.label }],
  };

  return {
    id: 5,
    agentAbbr: "CEO",
    role: "Decision Leader",
    content: template.content,
    type: "decision",
    decisions: template.decisions,
  };
}

async function evaluateAgentInterest({
  agentKey,
  idea,
  lastMessage,
  conversationHistory,
}) {
  const agent = AGENT_PROMPTS[agentKey];

  const result = await callQwen({
    systemPrompt: `
You are an internal routing classifier for a product council.

Your job is NOT to be helpful.
Your job is to decide whether this agent truly needs to speak next.

Return ONLY valid JSON.
No markdown. No explanation.

Response shape:
{
  "relevance": 0,
  "stance": "neutral",
  "reason": "short reason"
}

Scoring rules:
0 = completely irrelevant
1-2 = weakly related, should not respond
3-4 = somewhat related, but not important enough
5 = relevant, but still probably skip
6-7 = important enough to respond
8-9 = strong disagreement, major risk, or direct impact on this agent's goal
10 = critical issue that must be addressed immediately

Important:
- Most agents should score below 6.
- Do not give 8 unless the latest message creates a serious issue for this agent's role.
- Do not respond just because the topic is generally related.
- Penalize repetition.
- Penalize generic agreement.
- If another agent already covered the concern, score 0-3.
- If unsure, score 4.

stance must be one of:
"agree", "disagree", "clarify", "neutral".
`,
    userPrompt: `
Agent:
${agentKey}

Agent role prompt:
${agent.systemPrompt}

User idea:
${idea}

Conversation so far:
${conversationHistory}

Latest message:
${lastMessage.agentAbbr}: ${lastMessage.content}

Should this agent respond next?
Return a low score unless this agent has a specific, non-repeated reason to speak next.
Return JSON only.
`,
  });

  try {
    return JSON.parse(result);
  } catch {
    return {
      relevance: 0,
      stance: "neutral",
      reason: "Invalid JSON response",
    };
  }
}

async function generateAgentReply({
  agentKey,
  idea,
  conversationHistory,
  lastMessage,
}) {
  const agent = AGENT_PROMPTS[agentKey];

  return callQwen({
    systemPrompt: agent.systemPrompt,
    userPrompt: REPLY_USER_PROMPT(idea, conversationHistory, lastMessage),
  });
}

async function buildCouncilWorkflow(idea, options = {}) {
  const { send } = options;

  const messages = [];

  const agentMeta = {
    PM: {
      agentAbbr: "PM",
      role: "Product Manager",
    },
    CTO: {
      agentAbbr: "CTO",
      role: "Chief Technology Officer",
    },
    DESIGNER: {
      agentAbbr: "DES",
      role: "Product Designer",
    },
    QA: {
      agentAbbr: "QA",
      role: "Quality Analyst",
    },
  };

  const responseCount = {
    PM: 0,
    CTO: 0,
    DESIGNER: 0,
    QA: 0,
  };

  const sendMessage = (message) => {
    messages.push(message);
    responseCount[
      Object.keys(agentMeta).find(
        (key) => agentMeta[key].agentAbbr === message.agentAbbr,
      )
    ]++;

    send("agent_message", message);
  };

  const pmResponse = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: AGENT_PROMPTS.PM.buildUserPrompt({ idea }),
  });

  sendMessage({
    id: 1,
    agentAbbr: "PM",
    role: "Product Manager",
    content: pmResponse,
    type: "message",
  });

  const ctoLastMessage = messages[messages.length - 1];

  const ctoResponse = await generateAgentReply({
    agentKey: "CTO",
    idea,
    conversationHistory: formatConversationHistory(messages),
    lastMessage: ctoLastMessage,
  });

  sendMessage({
    id: 2,
    agentAbbr: "CTO",
    role: "Chief Technology Officer",
    content: ctoResponse,
    type: "message",
  });

  const maxMessages = 8;
  const minRelevance = 4;
  const maxResponsesPerAgent = 2;

  for (let i = 3; i <= maxMessages; i++) {
    const lastMessage = messages[messages.length - 1];
    const conversationHistory = formatConversationHistory(messages);

    const candidateAgents = Object.keys(agentMeta).filter((agentKey) => {
      const isSameAgent =
        agentMeta[agentKey].agentAbbr === lastMessage.agentAbbr;

      const hasReachedLimit = responseCount[agentKey] >= maxResponsesPerAgent;

      return !isSameAgent && !hasReachedLimit;
    });

    const evaluations = [];

    for (const agentKey of candidateAgents) {
      const evaluation = await evaluateAgentInterest({
        agentKey,
        idea,
        lastMessage,
        conversationHistory,
      });

      evaluations.push({
        agentKey,
        ...evaluation,
      });
    }

    evaluations.sort((a, b) => b.relevance - a.relevance);

    const winner = evaluations[0];

    if (!winner || winner.relevance < minRelevance) {
      break;
    }

    const response = await generateAgentReply({
      agentKey: winner.agentKey,
      idea,
      conversationHistory,
      lastMessage,
    });

    const meta = agentMeta[winner.agentKey];

    sendMessage({
      id: i,
      agentAbbr: meta.agentAbbr,
      role: meta.role,
      content: response,
      type: "message",
    });
  }
}

// OLD WORKFLOW WITH VOTES
// async function buildCouncilWorkflow(idea) {
//   const pmResponse = await callQwen({
//     systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
//     userPrompt: AGENT_PROMPTS.PM.buildUserPrompt({ idea }),
//   });

//   const ctoResponse = await callQwen({
//     systemPrompt: AGENT_PROMPTS.CTO.systemPrompt,
//     userPrompt: AGENT_PROMPTS.CTO.buildUserPrompt({
//       idea,
//       pmResponse,
//     }),
//   });

//   const designerResponse = await callQwen({
//     systemPrompt: AGENT_PROMPTS.DESIGNER.systemPrompt,
//     userPrompt: AGENT_PROMPTS.DESIGNER.buildUserPrompt({
//       idea,
//       pmResponse,
//       ctoResponse,
//     }),
//   });

//   const qaResponse = await callQwen({
//     systemPrompt: AGENT_PROMPTS.QA.systemPrompt,
//     userPrompt: AGENT_PROMPTS.QA.buildUserPrompt({
//       idea,
//       pmResponse,
//       ctoResponse,
//       designerResponse,
//     }),
//   });

//   const agentMessages = [
//     {
//       type: "agent_message",
//       data: {
//         id: 1,
//         agentAbbr: "PM",
//         role: "Product Manager",
//         content: pmResponse,
//         // content: `Analyzing idea: "${idea}". The MVP should focus on onboarding, the core workflow, and basic account handling.`,
//         type: "message",
//       },
//     },
//     {
//       type: "agent_message",
//       data: {
//         id: 2,
//         agentAbbr: "CTO",
//         role: "Chief Technology Officer",
//         // content:
//         //   "I recommend mock authentication for the MVP. Full authentication would slow us down significantly.",
//         content: ctoResponse,
//         type: "message",
//       },
//     },
//     {
//       type: "agent_message",
//       data: {
//         id: 3,
//         agentAbbr: "DES",
//         role: "Designer",
//         content: designerResponse,
//         // content:
//         //   "The user flow should be simple: start, complete the main action, confirm success.",
//         type: "message",
//       },
//     },
//     {
//       type: "agent_message",
//       data: {
//         id: 4,
//         agentAbbr: "QA",
//         role: "Quality Analyst",
//         content: qaResponse,
//         // content:
//         //   "We need to handle empty states, failed actions, and unclear user input.",
//         type: "message",
//       },
//     },
//   ];

//   const voteOptions = [
//     { id: "A", label: "Full auth" },
//     { id: "B", label: "Mock auth" },
//   ];

//   const votes = [
//     {
//       agentAbbr: "PM",
//       agentName: "Product Manager",
//       optionId: "B",
//       reason: "Mock auth keeps the MVP scope lean.",
//     },
//     {
//       agentAbbr: "CTO",
//       agentName: "Technical Advisor",
//       optionId: "B",
//       reason: "Full auth adds weeks of work. Ship first, secure later.",
//     },
//     {
//       agentAbbr: "DES",
//       agentName: "Designer",
//       optionId: "A",
//       reason: "Real auth gives users a more trustworthy experience.",
//     },
//     {
//       agentAbbr: "QA",
//       agentName: "Quality Analyst",
//       optionId: "A",
//       reason: "Real authentication reduces security and testing risks.",
//     },
//   ];

//   const winner = computeWinner(voteOptions, votes);

//   return [
//     ...agentMessages,
//     // {
//     //   type: "conflict_detected",
//     //   data: {
//     //     id: 1,
//     //     title: "Authentication scope",
//     //     description:
//     //       "PM wants account handling, CTO wants mock authentication for MVP speed.",
//     //     resolution: "TBD — pending vote",
//     //   },
//     // },
//     // {
//     //   type: "vote_options",
//     //   data: voteOptions,
//     // },
//     // ...votes.map((vote) => ({
//     //   type: "vote",
//     //   data: vote,
//     // })),
//     // {
//     //   type: "decision",
//     //   data: buildDecisionEvent(winner),
//     // },
//     // {
//     //   type: "final_output",
//     //   data: {
//     //     prd: "MVP application based on a simple user flow and fast validation.",
//     //     mvpScope: ["mock login", "core product action", "basic dashboard"],
//     //     userFlow: [
//     //       "enter idea",
//     //       "start council",
//     //       "review decisions",
//     //       "export MVP plan",
//     //     ],
//     //     architecture: [
//     //       "Next.js frontend",
//     //       "Express backend",
//     //       "SSE realtime stream",
//     //     ],
//     //     databaseSchema: [
//     //       "projects",
//     //       "council_sessions",
//     //       "messages",
//     //       "decisions",
//     //       "outputs",
//     //     ],
//     //     apiEndpoints: ["GET /", "GET /api/council/start?idea=..."],
//     //     backlog: [
//     //       "Frontend flow",
//     //       "Backend workflow",
//     //       "AI integration",
//     //       "Database persistence",
//     //       "Deploy",
//     //     ],
//     //     implementationPlan: [
//     //       "Build mock workflow",
//     //       "Move workflow logic to backend",
//     //       "Connect Qwen API",
//     //       "Store sessions",
//     //       "Deploy demo",
//     //     ],
//     //   },
//     // },
//   ];
// }

module.exports = {
  buildCouncilWorkflow,
};
