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
const {
  formatConversationHistory,
  extractJson,
} = require("../utils/councilUtils");
const { runConflictVote } = require("./voteService");

const AGENT_META = {
  PM: { agentAbbr: "PM", role: "Product Manager" },
  CTO: { agentAbbr: "CTO", role: "Chief Technology Officer" },
  DESIGNER: { agentAbbr: "DES", role: "Product Designer" },
  QA: { agentAbbr: "QA", role: "Quality Analyst" },
};

async function evaluateAgentInterest({
  agentKey,
  idea,
  lastMessage,
  conversationHistory,
  resolvedDecisions = [],
  topic = null,
}) {
  const agent = AGENT_PROMPTS[agentKey];
  const decisionsBlock =
    resolvedDecisions.length > 0
      ? `\nFINAL DECISIONS (CLOSED — score 0 if the agent wants to reopen these):\n${resolvedDecisions.map((d) => `- ${d.topic}: "${d.winner}"`).join("\n")}\n`
      : "";

  const result = await callQwen({
    systemPrompt: INTEREST_SYSTEM_PROMPT,
    userPrompt: INTEREST_USER_PROMPT({
      agentKey,
      agentSystemPrompt: agent.systemPrompt,
      idea,
      decisionsBlock,
      conversationHistory,
      lastMessage,
      topic,
    }),
  });

  try {
    return JSON.parse(result);
  } catch {
    return { relevance: 0, stance: "neutral", reason: "Invalid JSON response" };
  }
}

function randomSentenceCount() {
  return Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
}

async function generateAgentReply({
  agentKey,
  idea,
  conversationHistory,
  lastMessage,
  resolvedDecisions = [],
  topic = null,
  sentenceCount = randomSentenceCount(),
}) {
  return callQwen({
    systemPrompt: AGENT_PROMPTS[agentKey].systemPrompt,
    userPrompt: REPLY_USER_PROMPT(
      idea,
      conversationHistory,
      lastMessage,
      resolvedDecisions,
      topic,
      sentenceCount,
    ),
  });
}

async function validateAgentScope({ agentKey, scopeDescription, message }) {
  const result = await callQwen({
    systemPrompt: VALIDATE_AGENT_SCOPE_SYSTEM_PROMPT,
    userPrompt: VALIDATE_AGENT_SCOPE_USER_PROMPT({
      agentKey,
      scopeDescription,
      message,
    }),
  });
  try {
    return JSON.parse(extractJson(result)).inScope !== false;
  } catch {
    return true;
  }
}

async function generateCheckedAgentReply(params) {
  const scopeDescription = AGENT_SCOPE_DESCRIPTIONS[params.agentKey];
  const paramsWithCount = { ...params, sentenceCount: randomSentenceCount() };
  if (!scopeDescription) return generateAgentReply(paramsWithCount);

  let response;
  for (let attempt = 1; attempt <= 2; attempt++) {
    response = await generateAgentReply(paramsWithCount);
    const inScope = await validateAgentScope({
      agentKey: params.agentKey,
      scopeDescription,
      message: response,
    });
    console.log(
      `[Scope Check] ${params.agentKey} (attempt ${attempt}):`,
      inScope ? "in scope" : "out of scope, retrying",
    );
    if (inScope) return response;
  }
  return response;
}

async function generatePMIdeaIntro({ idea }) {
  return callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: PM_IDEA_INTRO_USER_PROMPT({ idea }),
  });
}

async function generateTopicOpening({ idea, topic, conversationHistory }) {
  return callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: TOPIC_OPENING_USER_PROMPT({ idea, topic, conversationHistory }),
  });
}

async function generateCEOTopicDecision({
  topic,
  conversationHistory,
  resolvedDecisions = [],
  voteWinner = null,
}) {
  const result = await callQwen({
    systemPrompt: CEO_TOPIC_DECISION_SYSTEM_PROMPT,
    userPrompt: CEO_TOPIC_DECISION_USER_PROMPT({
      topic,
      conversationHistory,
      resolvedDecisions,
      voteWinner,
    }),
  });
  return (
    result?.trim() ||
    `Zespół idzie dalej z tym, co ustaliliśmy w temacie "${topic.title}".`
  );
}

function formatAgendaMessage(agenda) {
  const list = agenda
    .map((topic, idx) => `${idx + 1}. ${topic.title}`)
    .join("\n");
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
    return {
      category: "Other",
      confidence: 0,
      reason: "Invalid JSON response",
    };
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

  const uxIndex = FIXED_AGENDA_STAGES.findIndex(
    (s) => s.title === "User Experience",
  );
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

  const resolvedSection =
    resolvedTopics.length > 0
      ? `\n\nTopics already resolved by vote — do NOT trigger a new conflict on these:\n${resolvedTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
      : "";

  const result = await callQwen({
    systemPrompt: DETECT_CONFLICTS_SYSTEM_PROMPT,
    userPrompt: DETECT_CONFLICTS_USER_PROMPT({
      fullHistory,
      recentFormatted,
      resolvedSection,
    }),
  });

  try {
    const parsed = JSON.parse(extractJson(result));
    if (parsed.hasConflict && (parsed.confidence ?? 0) < 7)
      return { hasConflict: false };
    return parsed;
  } catch {
    return { hasConflict: false };
  }
}

async function buildCouncilWorkflow(idea, options = {}) {
  const { send, waitForProceed } = options;
  const messages = [];
  const resolvedTopics = [];
  const resolvedDecisions = [];
  let nextMessageId = 1;

  const sendMessage = (message) => {
    messages.push(message);
    send("agent_message", message);
  };

  const projectCategory = await classifyProject(idea);
  console.log(
    "[Project Classification]",
    JSON.stringify(projectCategory, null, 2),
  );

  const agenda = await buildAgenda(idea, projectCategory.category);
  console.log("[Council Agenda]", JSON.stringify(agenda, null, 2));
  send("agenda_ready", agenda);

  const pmIdeaIntro = await generatePMIdeaIntro({ idea });
  sendMessage({
    id: nextMessageId++,
    agentAbbr: "PM",
    role: "Product Manager",
    content: pmIdeaIntro,
    type: "message",
  });
  sendMessage({
    id: nextMessageId++,
    agentAbbr: "PM",
    role: "Product Manager",
    content: formatAgendaMessage(agenda),
    type: "message",
  });

  const topicsToRun = agenda.slice(0, 1);

  if (waitForProceed) {
    sendMessage({
      id: nextMessageId++,
      agentAbbr: "PM",
      role: "Product Manager",
      content: `Czy możemy przejść do pierwszego punktu: „${topicsToRun[0]?.title}"?`,
      type: "message",
    });
    send("awaiting_proceed", {});
    await waitForProceed();
  }
  const minRelevance = 5;
  const maxResponsesPerAgentPerTopic = 4;
  const maxRepliesPerTopic = 6;
  let stageNumber = 0;

  for (let topicIndex = 0; topicIndex < topicsToRun.length; topicIndex++) {
    const topic = topicsToRun[topicIndex];
    const isLastTopic = topicIndex === topicsToRun.length - 1;
    stageNumber++;
    console.log("[Agenda Topic]", topic.title);
    send("topic_start", { stageNumber, topicTitle: topic.title });
    const topicStartIndex = messages.length;

    if (stageNumber > 1) {
      sendMessage({
        id: nextMessageId++,
        agentAbbr: "PM",
        role: "Product Manager",
        content: `Przechodzimy do punktu numer ${stageNumber}: ${topic.title}.`,
        type: "message",
      });
    }

    const pmOpening = await generateTopicOpening({
      idea,
      topic,
      conversationHistory: formatConversationHistory(messages),
    });
    sendMessage({
      id: nextMessageId++,
      agentAbbr: "PM",
      role: "Product Manager",
      content: pmOpening,
      type: "message",
    });

    const firstResponderKey = topic.firstResponder || "CTO";
    const firstResponderMeta = AGENT_META[firstResponderKey] || AGENT_META.CTO;

    const firstResponse = await generateCheckedAgentReply({
      agentKey: firstResponderKey,
      idea,
      conversationHistory: formatConversationHistory(messages),
      lastMessage: messages[messages.length - 1],
      resolvedDecisions,
      topic,
    });
    sendMessage({
      id: nextMessageId++,
      agentAbbr: firstResponderMeta.agentAbbr,
      role: firstResponderMeta.role,
      content: firstResponse,
      type: "message",
    });

    const responseCountForTopic = { PM: 1, CTO: 0, DESIGNER: 0, QA: 0 };
    responseCountForTopic[firstResponderKey] = 1;

    for (let i = 0; i < maxRepliesPerTopic; i++) {
      const lastMessage = messages[messages.length - 1];
      const conversationHistory = formatConversationHistory(messages);

      const candidateAgents = Object.keys(AGENT_META).filter(
        (key) =>
          AGENT_META[key].agentAbbr !== lastMessage.agentAbbr &&
          responseCountForTopic[key] < maxResponsesPerAgentPerTopic,
      );

      const evaluations = [];
      for (const agentKey of candidateAgents) {
        const evaluation = await evaluateAgentInterest({
          agentKey,
          idea,
          lastMessage,
          conversationHistory,
          resolvedDecisions,
          topic,
        });
        evaluations.push({ agentKey, ...evaluation });
      }

      evaluations.sort((a, b) => b.relevance - a.relevance);
      const winner = evaluations[0];
      if (!winner || winner.relevance < minRelevance) break;

      const response = await generateCheckedAgentReply({
        agentKey: winner.agentKey,
        idea,
        conversationHistory,
        lastMessage,
        resolvedDecisions,
        topic,
      });

      const meta = AGENT_META[winner.agentKey];
      sendMessage({
        id: nextMessageId++,
        agentAbbr: meta.agentAbbr,
        role: meta.role,
        content: response,
        type: "message",
      });
      responseCountForTopic[winner.agentKey] =
        (responseCountForTopic[winner.agentKey] || 0) + 1;
    }

    const conflict = await detectConflicts(
      messages.slice(topicStartIndex),
      resolvedTopics,
    );
    console.log("[Conflict Detection]", JSON.stringify(conflict, null, 2));

    let conflictData = null;
    let voteWinner = null;

    if (conflict.hasConflict) {
      resolvedTopics.push(conflict.topic);
      sendMessage({
        id: nextMessageId++,
        agentAbbr: "PM",
        role: "Product Manager",
        content: `Mamy różnicę zdań w kwestii "${conflict.topic}". Przechodzimy do głosowania.`,
        type: "message",
      });
      const result = await runConflictVote({ conflict, messages, send });
      if (result?.winner) {
        conflictData = result.conflictData ?? null;
        voteWinner = result.winner;
      }
    } else {
      sendMessage({
        id: nextMessageId++,
        agentAbbr: "PM",
        role: "Product Manager",
        content:
          "Widzę że jesteśmy zgodni. Oddaję głos CEO w celu podjęcia decyzji.",
        type: "message",
      });
    }

    const ceoDecision = await generateCEOTopicDecision({
      topic,
      conversationHistory: formatConversationHistory(
        messages.slice(topicStartIndex),
      ),
      resolvedDecisions,
      voteWinner,
    });
    const ceoMessage = {
      id: Date.now(),
      agentAbbr: "CEO",
      role: "Decision Leader",
      content: ceoDecision,
      type: "decision",
    };
    messages.push(ceoMessage);
    send("agent_message", ceoMessage);
    resolvedDecisions.push({ topic: topic.title, winner: ceoDecision });

    const stageHistory = formatConversationHistory(
      messages.slice(topicStartIndex),
    );
    const summaryText = await generateTopicSummary({
      topicTitle: topic.title,
      stageMessages: stageHistory,
    });
    send("stage_summary", {
      id: Date.now(),
      stageNumber,
      topicTitle: topic.title,
      summary: summaryText,
      decision: ceoDecision,
      conflict: conflictData,
    });

    if (!isLastTopic && waitForProceed) {
      const nextTopic = topicsToRun[topicIndex + 1];
      sendMessage({
        id: nextMessageId++,
        agentAbbr: "PM",
        role: "Product Manager",
        content: `Zamknęliśmy temat "${topic.title}". Czy możemy przejść do kolejnego punktu: "${nextTopic.title}"?`,
        type: "message",
      });
      send("awaiting_proceed", {});
      await waitForProceed();
    }
  }

  send("final_output", {});
}

module.exports = { buildCouncilWorkflow };
