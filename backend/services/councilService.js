const { formatConversationHistory } = require("../utils/councilUtils");
const { runConflictVote } = require("./voteService");
const { runProductVisionFlow } = require("./flows/productVisionFlow");
const { runMvpScopeFlow } = require("./flows/mvpScopeFlow");
const { runUserExperienceFlow } = require("./flows/userExperienceFlow");
const {
  runTechnicalArchitectureFlow,
} = require("./flows/technicalArchitectureFlow");
const { runDataModelFlow } = require("./flows/dataModelFlow");
const {
  runImplementationRoadmapFlow,
} = require("./flows/implementationRoadmapFlow");
const {
  AGENT_META,
  evaluateAgentInterest,
  generateCheckedAgentReply,
  generatePMIdeaIntro,
  generateCEOTopicDecision,
  formatAgendaMessage,
  classifyProject,
  buildAgenda,
  generateTopicSummary,
  detectConflicts,
  generatePMClosingMessage,
  generateTopicOpening,
} = require("./agentHelpers");

const MIN_RELEVANCE = 5;
const MAX_RESPONSES_PER_AGENT = 4;
const MIN_REPLIES_PER_TOPIC = 3;
const MAX_REPLIES_PER_TOPIC = 8;

async function runDynamicDiscussion({
  idea,
  topic,
  messages,
  topicStartIndex,
  resolvedTopics,
  resolvedDecisions,
  sendMessage,
  send,
}) {
  const pmOpening = await generateTopicOpening({
    idea,
    topic,
    conversationHistory: formatConversationHistory(
      messages.slice(topicStartIndex),
    ),
  });
  sendMessage({
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
    conversationHistory: formatConversationHistory(
      messages.slice(topicStartIndex),
    ),
    lastMessage: messages[messages.length - 1],
    resolvedDecisions,
    topic,
  });
  sendMessage({
    agentAbbr: firstResponderMeta.agentAbbr,
    role: firstResponderMeta.role,
    content: firstResponse,
    type: "message",
  });

  const responseCount = { PM: 1, CTO: 0, DESIGNER: 0, QA: 0 };
  responseCount[firstResponderKey] = 1;

  for (let i = 0; i < MAX_REPLIES_PER_TOPIC; i++) {
    const lastMessage = messages[messages.length - 1];
    const conversationHistory = formatConversationHistory(
      messages.slice(topicStartIndex),
    );

    const candidateAgents = Object.keys(AGENT_META).filter(
      (key) =>
        AGENT_META[key].agentAbbr !== lastMessage.agentAbbr &&
        responseCount[key] < MAX_RESPONSES_PER_AGENT,
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
    if (
      !winner ||
      (i >= MIN_REPLIES_PER_TOPIC && winner.relevance < MIN_RELEVANCE)
    )
      break;

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
      agentAbbr: meta.agentAbbr,
      role: meta.role,
      content: response,
      type: "message",
    });
    responseCount[winner.agentKey] = (responseCount[winner.agentKey] || 0) + 1;
  }

  const conflict = await detectConflicts(
    messages.slice(topicStartIndex),
    resolvedTopics,
  );

  let voteWinner = null;
  let conflictData = null;

  if (conflict.hasConflict) {
    resolvedTopics.push(conflict.topic);
    sendMessage({
      agentAbbr: "PM",
      role: "Product Manager",
      content: `We have a disagreement on "${conflict.topic}". Let's move to a vote.`,
      type: "message",
    });
    const result = await runConflictVote({ conflict, messages, send });
    if (result?.winner) {
      conflictData = result.conflictData ?? null;
      voteWinner = result.winner;
    }
  } else {
    sendMessage({
      agentAbbr: "PM",
      role: "Product Manager",
      content:
        "It looks like we're aligned. I'll hand it to the CEO to make the call.",
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

  return { ceoDecision, conflictData };
}

async function buildCouncilWorkflow(idea, options = {}) {
  const { send, waitForProceed, waitForGenerate } = options;
  const messages = [];
  const resolvedTopics = [];
  const resolvedDecisions = [];
  let nextMessageId = 1;

  const sendMessage = (payload) => {
    const message = { id: nextMessageId++, ...payload };
    messages.push(message);
    send("agent_message", message);
  };

  const projectCategory = await classifyProject(idea);

  if (projectCategory.valid === false) {
    const error = new Error("unknown idea, try again.");
    error.code = "INVALID_IDEA";
    throw error;
  }

  const agenda = await buildAgenda(idea, projectCategory.category);
  send("agenda_ready", agenda);

  const pmIdeaIntro = await generatePMIdeaIntro({ idea });
  sendMessage({
    agentAbbr: "PM",
    role: "Product Manager",
    content: pmIdeaIntro,
    type: "message",
  });
  sendMessage({
    agentAbbr: "PM",
    role: "Product Manager",
    content: formatAgendaMessage(agenda),
    type: "message",
  });

  const topicsToRun = agenda.slice(9, 10);

  if (waitForProceed) {
    sendMessage({
      agentAbbr: "PM",
      role: "Product Manager",
      content: `Can we move on to the first item: "${topicsToRun[0]?.title}"?`,
      type: "message",
    });
    send("awaiting_proceed", {});
    await waitForProceed();
  }

  let stageNumber = 0;

  for (let topicIndex = 0; topicIndex < topicsToRun.length; topicIndex++) {
    const topic = topicsToRun[topicIndex];
    const isLastTopic = topicIndex === topicsToRun.length - 1;
    stageNumber++;
    send("topic_start", { stageNumber, topicTitle: topic.title });
    const topicStartIndex = messages.length;

    if (stageNumber > 1) {
      sendMessage({
        agentAbbr: "PM",
        role: "Product Manager",
        content: `Moving on to item number ${stageNumber}: ${topic.title}.`,
        type: "message",
      });
    }

    let ceoDecision;
    let conflictData = null;
    let customStageSummary = null;

    if (topic.title === "Product Vision") {
      ({ ceoDecision } = await runProductVisionFlow({
        idea,
        topic,
        messages,
        topicStartIndex,
        sendMessage,
      }));
    } else if (topic.title === "MVP Scope") {
      ({ ceoDecision, customStageSummary } = await runMvpScopeFlow({
        idea,
        resolvedDecisions,
        messages,
        topicStartIndex,
        sendMessage,
        send,
        waitForProceed,
      }));
    } else if (topic.title === "User Experience") {
      ({ ceoDecision } = await runUserExperienceFlow({
        idea,
        topic,
        resolvedDecisions,
        messages,
        topicStartIndex,
        sendMessage,
        send,
      }));
    } else if (topic.title === "Technical Architecture") {
      ({ ceoDecision } = await runTechnicalArchitectureFlow({
        idea,
        topic,
        resolvedDecisions,
        messages,
        topicStartIndex,
        sendMessage,
        send,
      }));
    } else if (topic.title === "Data Model") {
      ({ ceoDecision } = await runDataModelFlow({
        idea,
        topic,
        resolvedDecisions,
        messages,
        topicStartIndex,
        sendMessage,
        send,
      }));
    } else if (topic.title === "Implementation Roadmap") {
      ({ ceoDecision } = await runImplementationRoadmapFlow({
        idea,
        topic,
        resolvedDecisions,
        messages,
        topicStartIndex,
        sendMessage,
        send,
      }));
    } else {
      ({ ceoDecision, conflictData } = await runDynamicDiscussion({
        idea,
        topic,
        messages,
        topicStartIndex,
        resolvedTopics,
        resolvedDecisions,
        sendMessage,
        send,
      }));
    }

    sendMessage({
      agentAbbr: "CEO",
      role: "Decision Leader",
      content: ceoDecision,
      type: "decision",
      ...(topic.title === "Implementation Roadmap" ? { preCouncil: true } : {}),
    });
    resolvedDecisions.push({ topic: topic.title, winner: ceoDecision });

    const summaryText =
      customStageSummary ??
      (await generateTopicSummary({
        topicTitle: topic.title,
        stageMessages: formatConversationHistory(
          messages.slice(topicStartIndex),
        ),
      }));
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
        agentAbbr: "PM",
        role: "Product Manager",
        content: `We've closed the topic "${topic.title}". Can we move on to the next item: "${nextTopic.title}"?`,
        type: "message",
      });
      send("awaiting_feature_proceed", {});
      await waitForProceed();
    }
  }

  const pmClosing = await generatePMClosingMessage({ agenda: topicsToRun });
  sendMessage({
    agentAbbr: "PM",
    role: "Product Manager",
    content: pmClosing,
    type: "message",
  });

  if (waitForGenerate) {
    send("awaiting_generate", {});
    await waitForGenerate();
  }

  send("final_output", {});
}

module.exports = { buildCouncilWorkflow };
