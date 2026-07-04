const { callQwen } = require("../qwenService");
const {
  AGENT_PROMPTS,
  ROADMAP_PM_OPENING_USER_PROMPT,
  ROADMAP_GENERATE_STEPS_SYSTEM_PROMPT,
  ROADMAP_GENERATE_STEPS_USER_PROMPT,
  ROADMAP_PM_ASK_OPINION_USER_PROMPT,
  ROADMAP_EVALUATE_SYSTEM_PROMPT,
  ROADMAP_DESIGNER_EVALUATE_USER_PROMPT,
  ROADMAP_CTO_EVALUATE_USER_PROMPT,
  ROADMAP_QA_EVALUATE_USER_PROMPT,
  ROADMAP_DESIGNER_NO_CONCERN_USER_PROMPT,
  ROADMAP_DESIGNER_CONCERN_USER_PROMPT,
  ROADMAP_CTO_NO_CONCERN_USER_PROMPT,
  ROADMAP_CTO_CONCERN_USER_PROMPT,
  ROADMAP_QA_NO_CONCERN_USER_PROMPT,
  ROADMAP_QA_CONCERN_USER_PROMPT,
  ROADMAP_CEO_DECISION_SYSTEM_PROMPT,
  ROADMAP_CEO_DECISION_USER_PROMPT,
} = require("../prompts");
const { formatConversationHistory, extractJson } = require("../../utils/councilUtils");
const { AGENT_META } = require("../agentHelpers");

const FALLBACK_STEPS = [
  "Set up the project and base infrastructure",
  "Build the core product functionality",
  "Integrate the required external services",
  "Implement the user interface",
  "Test and validate key scenarios",
  "Deploy to production",
];

async function runRoadmapReviewSection({
  agentKey,
  evaluateUserPrompt,
  noConcernUserPrompt,
  concernUserPrompt,
  sendMessage,
}) {
  const agentMeta = AGENT_META[agentKey];

  const evalRaw = await callQwen({
    systemPrompt: ROADMAP_EVALUATE_SYSTEM_PROMPT,
    userPrompt: evaluateUserPrompt,
  });

  let hasConcern = false;
  try {
    const parsed = JSON.parse(extractJson(evalRaw));
    hasConcern = parsed.hasConcern === true;
  } catch {}

  const userPrompt = hasConcern ? concernUserPrompt : noConcernUserPrompt;
  const message = await callQwen({
    systemPrompt: AGENT_PROMPTS[agentKey].systemPrompt,
    userPrompt,
  });
  sendMessage({ agentAbbr: agentMeta.agentAbbr, role: agentMeta.role, content: message, type: "message" });
}

async function runImplementationRoadmapFlow({ idea, topic, resolvedDecisions, messages, topicStartIndex, sendMessage, send }) {
  // PM opens the stage
  const pmOpening = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: ROADMAP_PM_OPENING_USER_PROMPT({ idea, topic }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmOpening, type: "message" });

  // Silently generate the ordered roadmap steps based on prior decisions
  const stepsRaw = await callQwen({
    systemPrompt: ROADMAP_GENERATE_STEPS_SYSTEM_PROMPT,
    userPrompt: ROADMAP_GENERATE_STEPS_USER_PROMPT({ idea, resolvedDecisions }),
  });

  let steps = [];
  try {
    const parsed = JSON.parse(extractJson(stepsRaw));
    if (Array.isArray(parsed.steps)) steps = parsed.steps.filter(Boolean);
  } catch {}
  if (steps.length < 2) steps = FALLBACK_STEPS;

  // PM presents the roadmap, one stage per line
  const roadmapMessage = `Here's how the roadmap looks:\n\n${steps
    .map((step, i) => `Step ${i + 1} ${step}`)
    .join("\n")}`;
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: roadmapMessage, type: "message", preCouncil: true });

  // PM asks the team for their opinion on the order
  const pmAskOpinion = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: ROADMAP_PM_ASK_OPINION_USER_PROMPT({ idea }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmAskOpinion, type: "message" });

  // Designer reviews the order first — sees only the PM's presentation so far
  const historyBeforeDesigner = formatConversationHistory(messages.slice(topicStartIndex));
  await runRoadmapReviewSection({
    agentKey: "DESIGNER",
    evaluateUserPrompt: ROADMAP_DESIGNER_EVALUATE_USER_PROMPT({ roadmapHistory: historyBeforeDesigner }),
    noConcernUserPrompt: ROADMAP_DESIGNER_NO_CONCERN_USER_PROMPT({
      presentationHistory: historyBeforeDesigner,
      sentenceCount: 2,
    }),
    concernUserPrompt: ROADMAP_DESIGNER_CONCERN_USER_PROMPT({
      presentationHistory: historyBeforeDesigner,
      sentenceCount: 3,
    }),
    sendMessage,
  });

  // CTO reviews the order next — sees the Designer's remark too, so it can skip a repeat
  const historyBeforeCto = formatConversationHistory(messages.slice(topicStartIndex));
  await runRoadmapReviewSection({
    agentKey: "CTO",
    evaluateUserPrompt: ROADMAP_CTO_EVALUATE_USER_PROMPT({ roadmapHistory: historyBeforeCto }),
    noConcernUserPrompt: ROADMAP_CTO_NO_CONCERN_USER_PROMPT({
      presentationHistory: historyBeforeCto,
      sentenceCount: 2,
    }),
    concernUserPrompt: ROADMAP_CTO_CONCERN_USER_PROMPT({
      presentationHistory: historyBeforeCto,
      sentenceCount: 3,
    }),
    sendMessage,
  });

  // QA reviews the order last — sees both the Designer's and CTO's remarks
  const historyBeforeQa = formatConversationHistory(messages.slice(topicStartIndex));
  await runRoadmapReviewSection({
    agentKey: "QA",
    evaluateUserPrompt: ROADMAP_QA_EVALUATE_USER_PROMPT({ roadmapHistory: historyBeforeQa }),
    noConcernUserPrompt: ROADMAP_QA_NO_CONCERN_USER_PROMPT({
      presentationHistory: historyBeforeQa,
      sentenceCount: 2,
    }),
    concernUserPrompt: ROADMAP_QA_CONCERN_USER_PROMPT({
      presentationHistory: historyBeforeQa,
      sentenceCount: 3,
    }),
    sendMessage,
  });

  // PM hands over to CEO
  const pmHandover = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: `The team has finished reviewing the order of the implementation roadmap. As the Product Manager, briefly summarize that the discussion is complete and ask the CEO to finalize the roadmap order. Write exactly 2 sentences.`,
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmHandover, type: "message" });

  // CEO presents the final roadmap with corrections applied
  const rawCeoDecision = await callQwen({
    systemPrompt: ROADMAP_CEO_DECISION_SYSTEM_PROMPT,
    userPrompt: ROADMAP_CEO_DECISION_USER_PROMPT({
      steps,
      conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
    maxTokens: 600,
  });

  return {
    ceoDecision: rawCeoDecision?.trim() || roadmapMessage,
  };
}

module.exports = { runImplementationRoadmapFlow };
