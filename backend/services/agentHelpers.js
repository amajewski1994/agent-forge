const { callQwen } = require("./qwenService");
const {
  AGENT_PROMPTS,
  REPLY_USER_PROMPT,
  CLASSIFY_PROJECT_SYSTEM_PROMPT,
  CLASSIFY_PROJECT_USER_PROMPT,
  FIXED_AGENDA_STAGES,
  BUILD_AGENDA_SYSTEM_PROMPT,
  BUILD_AGENDA_USER_PROMPT,
  PM_IDEA_INTRO_USER_PROMPT,
  PM_CLOSING_USER_PROMPT,
  TOPIC_OPENING_USER_PROMPT,
  CEO_TOPIC_DECISION_SYSTEM_PROMPT,
  CEO_TOPIC_DECISION_USER_PROMPT,
  INTEREST_SYSTEM_PROMPT,
  INTEREST_USER_PROMPT,
  DETECT_CONFLICTS_SYSTEM_PROMPT,
  DETECT_CONFLICTS_USER_PROMPT,
  AGENT_SCOPE_DESCRIPTIONS,
  VALIDATE_AGENT_SCOPE_SYSTEM_PROMPT,
  VALIDATE_AGENT_SCOPE_USER_PROMPT,
  TOPIC_SUMMARY_SYSTEM_PROMPT,
  TOPIC_SUMMARY_USER_PROMPT,
} = require("./prompts");
const { formatConversationHistory, extractJson } = require("../utils/councilUtils");

const AGENT_META = {
  PM: { agentAbbr: "PM", role: "Product Manager" },
  CTO: { agentAbbr: "CTO", role: "Chief Technology Officer" },
  DESIGNER: { agentAbbr: "DES", role: "Product Designer" },
  QA: { agentAbbr: "QA", role: "Quality Analyst" },
};

function randomSentenceCount() {
  return Math.floor(Math.random() * 3) + 2;
}

async function evaluateAgentInterest({ agentKey, idea, lastMessage, conversationHistory, resolvedDecisions = [], topic = null }) {
  const agent = AGENT_PROMPTS[agentKey];
  const decisionsBlock = resolvedDecisions.length > 0
    ? `\nFINAL DECISIONS (CLOSED — score 0 if the agent wants to reopen these):\n${resolvedDecisions.map((d) => `- ${d.topic}: "${d.winner}"`).join("\n")}\n`
    : "";

  const result = await callQwen({
    systemPrompt: INTEREST_SYSTEM_PROMPT,
    userPrompt: INTEREST_USER_PROMPT({ agentKey, agentSystemPrompt: agent.systemPrompt, idea, decisionsBlock, conversationHistory, lastMessage, topic }),
  });

  try {
    return JSON.parse(result);
  } catch {
    return { relevance: 0, stance: "neutral", reason: "Invalid JSON response" };
  }
}

async function generateAgentReply({ agentKey, idea, conversationHistory, lastMessage, resolvedDecisions = [], topic = null, sentenceCount = randomSentenceCount(), stanceNote = null }) {
  const basePrompt = REPLY_USER_PROMPT(idea, conversationHistory, lastMessage, resolvedDecisions, topic, sentenceCount);
  const userPrompt = stanceNote ? `${basePrompt}\nIMPORTANT: ${stanceNote}` : basePrompt;
  return callQwen({ systemPrompt: AGENT_PROMPTS[agentKey].systemPrompt, userPrompt });
}

async function validateAgentScope({ agentKey, scopeDescription, message }) {
  const result = await callQwen({
    systemPrompt: VALIDATE_AGENT_SCOPE_SYSTEM_PROMPT,
    userPrompt: VALIDATE_AGENT_SCOPE_USER_PROMPT({ agentKey, scopeDescription, message }),
  });
  try {
    return JSON.parse(extractJson(result)).inScope !== false;
  } catch {
    return true;
  }
}

async function generateCheckedAgentReply(params) {
  const scopeDescription = AGENT_SCOPE_DESCRIPTIONS[params.agentKey];
  const paramsWithCount = { ...params, sentenceCount: params.sentenceCount ?? randomSentenceCount() };
  if (!scopeDescription) return generateAgentReply(paramsWithCount);

  let response;
  for (let attempt = 1; attempt <= 2; attempt++) {
    response = await generateAgentReply(paramsWithCount);
    const inScope = await validateAgentScope({ agentKey: params.agentKey, scopeDescription, message: response });
    console.log(`[Scope Check] ${params.agentKey} (attempt ${attempt}):`, inScope ? "in scope" : "out of scope, retrying");
    if (inScope) return response;
  }
  return response;
}

async function generatePMIdeaIntro({ idea }) {
  return callQwen({ systemPrompt: AGENT_PROMPTS.PM.systemPrompt, userPrompt: PM_IDEA_INTRO_USER_PROMPT({ idea }) });
}

async function generateTopicOpening({ idea, topic, conversationHistory }) {
  return callQwen({ systemPrompt: AGENT_PROMPTS.PM.systemPrompt, userPrompt: TOPIC_OPENING_USER_PROMPT({ idea, topic, conversationHistory }) });
}

async function generateCEOTopicDecision({ topic, conversationHistory, resolvedDecisions = [], voteWinner = null }) {
  const result = await callQwen({
    systemPrompt: CEO_TOPIC_DECISION_SYSTEM_PROMPT,
    userPrompt: CEO_TOPIC_DECISION_USER_PROMPT({ topic, conversationHistory, resolvedDecisions, voteWinner }),
  });
  return result?.trim() || `Zespół idzie dalej z tym, co ustaliliśmy w temacie "${topic.title}".`;
}

function formatAgendaMessage(agenda) {
  const list = agenda.map((topic, idx) => `${idx + 1}. ${topic.title}`).join("\n");
  return `Oto nasza agenda na to spotkanie. Przejdziemy po kolei przez te punkty:\n\n${list}`;
}

async function classifyProject(idea) {
  const result = await callQwen({
    systemPrompt: CLASSIFY_PROJECT_SYSTEM_PROMPT,
    userPrompt: CLASSIFY_PROJECT_USER_PROMPT({ idea }),
  });
  try {
    return JSON.parse(extractJson(result));
  } catch {
    return { category: "Other", confidence: 0, reason: "Invalid JSON response" };
  }
}

async function buildAgenda(idea, category) {
  const result = await callQwen({
    systemPrompt: BUILD_AGENDA_SYSTEM_PROMPT,
    userPrompt: BUILD_AGENDA_USER_PROMPT({ idea, category }),
  });

  let dynamicTopics = [];
  try {
    const parsed = JSON.parse(extractJson(result));
    if (Array.isArray(parsed.topics)) {
      dynamicTopics = parsed.topics.filter((t) => t?.title && t?.description);
    }
  } catch {}

  const uxIndex = FIXED_AGENDA_STAGES.findIndex((s) => s.title === "User Experience");
  return [
    ...FIXED_AGENDA_STAGES.slice(0, uxIndex + 1),
    ...dynamicTopics,
    ...FIXED_AGENDA_STAGES.slice(uxIndex + 1),
  ];
}

async function generateTopicSummary({ topicTitle, stageMessages }) {
  const result = await callQwen({
    systemPrompt: TOPIC_SUMMARY_SYSTEM_PROMPT,
    userPrompt: TOPIC_SUMMARY_USER_PROMPT({ topicTitle, stageMessages }),
  });
  return result?.trim() || "Dyskusja objęła główne aspekty tematu.";
}

async function detectConflicts(messages, resolvedTopics = []) {
  const fullHistory = formatConversationHistory(messages);
  const recentFormatted = messages
    .slice(-3)
    .map((m) => `${m.agentAbbr} (${m.role}): ${m.content}`)
    .join("\n\n");

  const resolvedSection = resolvedTopics.length > 0
    ? `\n\nTopics already resolved by vote — do NOT trigger a new conflict on these:\n${resolvedTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
    : "";

  const result = await callQwen({
    systemPrompt: DETECT_CONFLICTS_SYSTEM_PROMPT,
    userPrompt: DETECT_CONFLICTS_USER_PROMPT({ fullHistory, recentFormatted, resolvedSection }),
  });

  try {
    const parsed = JSON.parse(extractJson(result));
    if (parsed.hasConflict && (parsed.confidence ?? 0) < 7) return { hasConflict: false };
    return parsed;
  } catch {
    return { hasConflict: false };
  }
}

async function generatePMClosingMessage({ agenda }) {
  return callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: PM_CLOSING_USER_PROMPT({ agenda }),
  });
}

module.exports = {
  AGENT_META,
  randomSentenceCount,
  evaluateAgentInterest,
  generateCheckedAgentReply,
  generatePMIdeaIntro,
  generateTopicOpening,
  generateCEOTopicDecision,
  formatAgendaMessage,
  classifyProject,
  buildAgenda,
  generateTopicSummary,
  detectConflicts,
  generatePMClosingMessage,
};
