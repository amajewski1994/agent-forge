const { callQwen } = require("../qwenService");
const {
  AGENT_PROMPTS,
  DATA_CTO_SYSTEM_PROMPT,
  DATA_PM_OPENING_USER_PROMPT,
  DATA_CTO_APP_DATA_USER_PROMPT,
  DATA_DESIGNER_APP_DATA_COMMENT_USER_PROMPT,
  DATA_QA_APP_DATA_COMMENT_USER_PROMPT,
  DATA_PM_CONFIRM_APP_DATA_USER_PROMPT,
  DATA_CTO_GENERATE_SERVICES_SYSTEM_PROMPT,
  DATA_CTO_GENERATE_SERVICES_USER_PROMPT,
  DATA_CTO_SERVICES_INTRO_USER_PROMPT,
  DATA_CTO_SERVICE_DETAIL_USER_PROMPT,
  DATA_QA_RISK_USER_PROMPT,
  DATA_EVALUATE_SYSTEM_PROMPT,
  DATA_CTO_EVALUATE_USER_PROMPT,
  DATA_CTO_AGREE_RISK_USER_PROMPT,
  DATA_CTO_DISAGREE_RISK_USER_PROMPT,
  DATA_CONFLICT_CONTEXT_SYSTEM_PROMPT,
  DATA_CONFLICT_CONTEXT_USER_PROMPT,
  DATA_CEO_DECISION_SYSTEM_PROMPT,
  DATA_CEO_DECISION_USER_PROMPT,
} = require("../prompts");
const { formatConversationHistory, extractJson } = require("../../utils/councilUtils");
const { runConflictVote } = require("../voteService");

function randomDataSentenceCount() {
  return Math.floor(Math.random() * 4) + 5;
}

async function runDataModelFlow({ idea, topic, resolvedDecisions, messages, topicStartIndex, sendMessage, send }) {
  // PM opens the stage
  const pmOpening = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: DATA_PM_OPENING_USER_PROMPT({ idea, topic }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmOpening, type: "message" });

  // CTO presents the core application data
  const appDataMsg = await callQwen({
    systemPrompt: DATA_CTO_SYSTEM_PROMPT,
    userPrompt: DATA_CTO_APP_DATA_USER_PROMPT({ idea, resolvedDecisions, sentenceCount: randomDataSentenceCount() }),
    maxTokens: 600,
  });
  sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: appDataMsg, type: "message" });

  const appDataHistory = formatConversationHistory(messages.slice(topicStartIndex));

  // Designer adds remarks
  const designerComment = await callQwen({
    systemPrompt: AGENT_PROMPTS.DESIGNER.systemPrompt,
    userPrompt: DATA_DESIGNER_APP_DATA_COMMENT_USER_PROMPT({ presentationHistory: appDataHistory, sentenceCount: 3 }),
  });
  sendMessage({ agentAbbr: "DES", role: "Product Designer", content: designerComment, type: "message" });

  // QA adds remarks
  const qaComment = await callQwen({
    systemPrompt: AGENT_PROMPTS.QA.systemPrompt,
    userPrompt: DATA_QA_APP_DATA_COMMENT_USER_PROMPT({ presentationHistory: appDataHistory, sentenceCount: 3 }),
  });
  sendMessage({ agentAbbr: "QA", role: "Quality Analyst", content: qaComment, type: "message" });

  // PM confirms App Data and moves to Integrations
  const pmConfirm = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: DATA_PM_CONFIRM_APP_DATA_USER_PROMPT({ idea }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmConfirm, type: "message" });

  // Silently generate the required external services
  const servicesRaw = await callQwen({
    systemPrompt: DATA_CTO_GENERATE_SERVICES_SYSTEM_PROMPT,
    userPrompt: DATA_CTO_GENERATE_SERVICES_USER_PROMPT({ idea, resolvedDecisions }),
  });

  let services = [];
  try {
    const parsed = JSON.parse(extractJson(servicesRaw));
    if (Array.isArray(parsed.services)) services = parsed.services.filter(Boolean);
  } catch {}
  if (services.length === 0) services = ["Zewnętrzny dostawca płatności", "Usługa wysyłki e maili"];

  // CTO names the services
  const servicesIntroMsg = await callQwen({
    systemPrompt: DATA_CTO_SYSTEM_PROMPT,
    userPrompt: DATA_CTO_SERVICES_INTRO_USER_PROMPT({ idea, services, sentenceCount: 2 }),
    maxTokens: 400,
  });
  sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: servicesIntroMsg, type: "message" });

  // CTO describes each service in a follow up message
  for (const service of services) {
    const serviceDetailMsg = await callQwen({
      systemPrompt: DATA_CTO_SYSTEM_PROMPT,
      userPrompt: DATA_CTO_SERVICE_DETAIL_USER_PROMPT({ idea, service, resolvedDecisions, sentenceCount: randomDataSentenceCount() }),
      maxTokens: 600,
    });
    sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: serviceDetailMsg, type: "message" });
  }

  const servicesHistory = formatConversationHistory(messages.slice(topicStartIndex));

  // QA checks for risk in the proposed services
  const qaRiskMsg = await callQwen({
    systemPrompt: AGENT_PROMPTS.QA.systemPrompt,
    userPrompt: DATA_QA_RISK_USER_PROMPT({ presentationHistory: servicesHistory, sentenceCount: 3 }),
  });
  sendMessage({ agentAbbr: "QA", role: "Quality Analyst", content: qaRiskMsg, type: "message" });

  // CTO decides whether to accept the concern or defend the service
  const currentHistory = formatConversationHistory(messages.slice(topicStartIndex));
  const evalRaw = await callQwen({
    systemPrompt: DATA_EVALUATE_SYSTEM_PROMPT,
    userPrompt: DATA_CTO_EVALUATE_USER_PROMPT({ presentationHistory: currentHistory }),
  });

  let ctoAgrees = true;
  try {
    const parsed = JSON.parse(extractJson(evalRaw));
    ctoAgrees = parsed.agrees !== false;
  } catch {}

  if (ctoAgrees) {
    const ctoAgreeMsg = await callQwen({
      systemPrompt: DATA_CTO_SYSTEM_PROMPT,
      userPrompt: DATA_CTO_AGREE_RISK_USER_PROMPT({ presentationHistory: currentHistory, sentenceCount: 3 }),
    });
    sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: ctoAgreeMsg, type: "message" });
  } else {
    const ctoDisagreeMsg = await callQwen({
      systemPrompt: DATA_CTO_SYSTEM_PROMPT,
      userPrompt: DATA_CTO_DISAGREE_RISK_USER_PROMPT({ presentationHistory: currentHistory, sentenceCount: 3 }),
    });
    sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: ctoDisagreeMsg, type: "message" });

    sendMessage({
      agentAbbr: "PM",
      role: "Product Manager",
      content: `Mamy różnicę zdań w kwestii integracji. Przechodzimy do głosowania.`,
      type: "message",
    });

    const conflictHistory = formatConversationHistory(messages.slice(topicStartIndex));
    const conflictContextRaw = await callQwen({
      systemPrompt: DATA_CONFLICT_CONTEXT_SYSTEM_PROMPT,
      userPrompt: DATA_CONFLICT_CONTEXT_USER_PROMPT({ conversationHistory: conflictHistory }),
    });

    let conflictContext = {
      topic: `Ryzyko integracji`,
      description: `QA zgłosiła zastrzeżenie do jednej z proponowanych integracji CTO.`,
      sideA: "Zachować integrację",
      sideB: "Zastąpić integrację",
    };
    try {
      const parsed = JSON.parse(extractJson(conflictContextRaw));
      if (parsed.topic && parsed.sideA && parsed.sideB) {
        conflictContext = {
          topic: parsed.topic,
          description: parsed.description || conflictContext.description,
          sideA: parsed.sideA,
          sideB: parsed.sideB,
        };
      }
    } catch {}

    await runConflictVote({
      conflict: conflictContext,
      messages: messages.slice(topicStartIndex),
      send,
    });
  }

  // PM hands over to CEO
  const pmHandover = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: `The council has finished discussing the application data and the required integrations. As the Product Manager, briefly summarize that the discussion is complete and ask the CEO to make the final decision on the data model and integrations. Write exactly 2 sentences.`,
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmHandover, type: "message" });

  // CEO final decision across both sections
  const rawCeoDecision = await callQwen({
    systemPrompt: DATA_CEO_DECISION_SYSTEM_PROMPT,
    userPrompt: DATA_CEO_DECISION_USER_PROMPT({
      conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
    maxTokens: 600,
  });

  return {
    ceoDecision: rawCeoDecision?.trim() || `Zatwierdzamy model danych i integracje zaproponowane przez CTO.`,
  };
}

module.exports = { runDataModelFlow };
