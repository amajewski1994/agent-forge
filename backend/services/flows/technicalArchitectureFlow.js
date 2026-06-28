const { callQwen } = require("../qwenService");
const {
  AGENT_PROMPTS,
  TECH_CTO_SYSTEM_PROMPT,
  TECH_PM_OPENING_USER_PROMPT,
  TECH_CTO_TECH_STACK_USER_PROMPT,
  TECH_CTO_SYSTEM_ARCH_USER_PROMPT,
  TECH_CTO_DATA_MODEL_USER_PROMPT,
  TECH_CTO_INFRA_USER_PROMPT,
  TECH_CEO_DECISION_SYSTEM_PROMPT,
  TECH_CEO_DECISION_USER_PROMPT,
  TECH_PM_INVITE_DESIGNER_USER_PROMPT,
  TECH_PM_INVITE_QA_USER_PROMPT,
  TECH_EVALUATE_SYSTEM_PROMPT,
  TECH_DESIGNER_EVALUATE_USER_PROMPT,
  TECH_QA_EVALUATE_USER_PROMPT,
  TECH_DESIGNER_AGREE_USER_PROMPT,
  TECH_QA_AGREE_USER_PROMPT,
  TECH_DESIGNER_DISAGREE_USER_PROMPT,
  TECH_QA_DISAGREE_USER_PROMPT,
  TECH_CHECK_STILL_CONFLICT_SYSTEM_PROMPT,
  TECH_CHECK_STILL_CONFLICT_USER_PROMPT,
  TECH_CONFLICT_CONTEXT_SYSTEM_PROMPT,
  TECH_CONFLICT_CONTEXT_USER_PROMPT,
  TECH_CTO_RESOLUTION_USER_PROMPT,
} = require("../prompts");
const { formatConversationHistory, extractJson } = require("../../utils/councilUtils");
const { AGENT_META, generateCheckedAgentReply } = require("../agentHelpers");
const { runConflictVote } = require("../voteService");

function randomTechSentenceCount() {
  return Math.floor(Math.random() * 4) + 5;
}

async function runTechReviewSection({
  agentKey,
  evaluateUserPrompt,
  agreeUserPrompt,
  disagreeUserPrompt,
  idea,
  topic,
  resolvedDecisions,
  messages,
  topicStartIndex,
  sendMessage,
  send,
}) {
  const agentMeta = AGENT_META[agentKey];

  const evalRaw = await callQwen({
    systemPrompt: TECH_EVALUATE_SYSTEM_PROMPT,
    userPrompt: evaluateUserPrompt,
  });

  let agrees = true;
  try {
    const parsed = JSON.parse(extractJson(evalRaw));
    agrees = parsed.agrees !== false;
  } catch {}

  if (agrees) {
    const agreeMsg = await callQwen({
      systemPrompt: AGENT_PROMPTS[agentKey].systemPrompt,
      userPrompt: agreeUserPrompt,
    });
    sendMessage({ agentAbbr: agentMeta.agentAbbr, role: agentMeta.role, content: agreeMsg, type: "message" });
    return;
  }

  // Disagrees — initial statement
  const disagreeMsg = await callQwen({
    systemPrompt: AGENT_PROMPTS[agentKey].systemPrompt,
    userPrompt: disagreeUserPrompt,
  });
  sendMessage({ agentAbbr: agentMeta.agentAbbr, role: agentMeta.role, content: disagreeMsg, type: "message" });

  // Round 1: CTO defends
  const ctoReply1 = await generateCheckedAgentReply({
    agentKey: "CTO",
    idea,
    conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    lastMessage: messages[messages.length - 1],
    resolvedDecisions,
    topic,
    sentenceCount: 4,
  });
  sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: ctoReply1, type: "message" });

  // Round 1: Reviewer pushes back
  const reviewerReply1 = await generateCheckedAgentReply({
    agentKey,
    idea,
    conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    lastMessage: messages[messages.length - 1],
    resolvedDecisions,
    topic,
    sentenceCount: 3,
  });
  sendMessage({ agentAbbr: agentMeta.agentAbbr, role: agentMeta.role, content: reviewerReply1, type: "message" });

  // Round 2: CTO counter-reply
  const ctoReply2 = await generateCheckedAgentReply({
    agentKey: "CTO",
    idea,
    conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    lastMessage: messages[messages.length - 1],
    resolvedDecisions,
    topic,
    sentenceCount: 3,
  });
  sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: ctoReply2, type: "message" });

  // Round 2: Reviewer final position
  const reviewerReply2 = await generateCheckedAgentReply({
    agentKey,
    idea,
    conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    lastMessage: messages[messages.length - 1],
    resolvedDecisions,
    topic,
    sentenceCount: 3,
  });
  sendMessage({ agentAbbr: agentMeta.agentAbbr, role: agentMeta.role, content: reviewerReply2, type: "message" });

  // Check if conflict still stands after the exchange
  const stillConflictRaw = await callQwen({
    systemPrompt: TECH_CHECK_STILL_CONFLICT_SYSTEM_PROMPT,
    userPrompt: TECH_CHECK_STILL_CONFLICT_USER_PROMPT({
      conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
  });

  let stillConflict = true;
  try {
    const parsed = JSON.parse(extractJson(stillConflictRaw));
    stillConflict = parsed.stillConflict !== false;
  } catch {}

  if (!stillConflict) {
    const ctoResolutionMsg = await callQwen({
      systemPrompt: AGENT_PROMPTS.CTO.systemPrompt,
      userPrompt: TECH_CTO_RESOLUTION_USER_PROMPT({
        conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
        agentRole: agentMeta.role,
        sentenceCount: 2,
      }),
    });
    sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: ctoResolutionMsg, type: "message" });

    sendMessage({
      agentAbbr: "PM",
      role: "Product Manager",
      content: `Dobrze, widzę że doszliście do porozumienia. Dziękuję za tę wymianę zdań.`,
      type: "message",
    });
    return;
  }

  sendMessage({
    agentAbbr: "PM",
    role: "Product Manager",
    content: `Mamy różnicę zdań w kwestii architektury. Przechodzimy do głosowania.`,
    type: "message",
  });

  const conflictContextRaw = await callQwen({
    systemPrompt: TECH_CONFLICT_CONTEXT_SYSTEM_PROMPT,
    userPrompt: TECH_CONFLICT_CONTEXT_USER_PROMPT({
      agentRole: agentMeta.role,
      conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
  });

  let conflictContext = {
    topic: `Kierunek architektury — ${agentMeta.role}`,
    description: `${agentMeta.role} zgłosił zastrzeżenie do propozycji architektonicznej CTO.`,
    sideA: "Kierunek CTO",
    sideB: `Zmiana wg ${agentMeta.role}`,
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

async function runTechnicalArchitectureFlow({ idea, topic, resolvedDecisions, messages, topicStartIndex, sendMessage, send }) {
  // PM opens the stage
  const pmOpening = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: TECH_PM_OPENING_USER_PROMPT({ idea, topic }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmOpening, type: "message" });

  // CTO presents 4 sections
  const techStackMsg = await callQwen({
    systemPrompt: TECH_CTO_SYSTEM_PROMPT,
    userPrompt: TECH_CTO_TECH_STACK_USER_PROMPT({ idea, resolvedDecisions, sentenceCount: randomTechSentenceCount() }),
    maxTokens: 600,
  });
  sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: techStackMsg, type: "message" });

  const systemArchMsg = await callQwen({
    systemPrompt: TECH_CTO_SYSTEM_PROMPT,
    userPrompt: TECH_CTO_SYSTEM_ARCH_USER_PROMPT({ idea, resolvedDecisions, sentenceCount: randomTechSentenceCount() }),
    maxTokens: 600,
  });
  sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: systemArchMsg, type: "message" });

  const dataModelMsg = await callQwen({
    systemPrompt: TECH_CTO_SYSTEM_PROMPT,
    userPrompt: TECH_CTO_DATA_MODEL_USER_PROMPT({ idea, resolvedDecisions, sentenceCount: randomTechSentenceCount() }),
    maxTokens: 600,
  });
  sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: dataModelMsg, type: "message" });

  const infraMsg = await callQwen({
    systemPrompt: TECH_CTO_SYSTEM_PROMPT,
    userPrompt: TECH_CTO_INFRA_USER_PROMPT({ idea, resolvedDecisions, sentenceCount: randomTechSentenceCount() }),
    maxTokens: 600,
  });
  sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: infraMsg, type: "message" });

  // Capture CTO's presentation before Designer/QA speak — used for silent evals
  const ctoPresentationHistory = formatConversationHistory(messages.slice(topicStartIndex));

  // PM invites Designer
  const pmInviteDesigner = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: TECH_PM_INVITE_DESIGNER_USER_PROMPT({ idea }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmInviteDesigner, type: "message" });

  // Designer review
  await runTechReviewSection({
    agentKey: "DESIGNER",
    evaluateUserPrompt: TECH_DESIGNER_EVALUATE_USER_PROMPT({ presentationHistory: ctoPresentationHistory }),
    agreeUserPrompt: TECH_DESIGNER_AGREE_USER_PROMPT({ presentationHistory: ctoPresentationHistory, sentenceCount: 3 }),
    disagreeUserPrompt: TECH_DESIGNER_DISAGREE_USER_PROMPT({ presentationHistory: ctoPresentationHistory, sentenceCount: 4 }),
    idea,
    topic,
    resolvedDecisions,
    messages,
    topicStartIndex,
    sendMessage,
    send,
  });

  // PM invites QA (using full current history so PM sounds aware of Designer's input)
  const pmInviteQA = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: TECH_PM_INVITE_QA_USER_PROMPT({ idea }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmInviteQA, type: "message" });

  // QA review — eval uses CTO's original presentation, speech uses full current history
  const currentHistory = formatConversationHistory(messages.slice(topicStartIndex));
  await runTechReviewSection({
    agentKey: "QA",
    evaluateUserPrompt: TECH_QA_EVALUATE_USER_PROMPT({ presentationHistory: ctoPresentationHistory }),
    agreeUserPrompt: TECH_QA_AGREE_USER_PROMPT({ presentationHistory: currentHistory, sentenceCount: 3 }),
    disagreeUserPrompt: TECH_QA_DISAGREE_USER_PROMPT({ presentationHistory: currentHistory, sentenceCount: 4 }),
    idea,
    topic,
    resolvedDecisions,
    messages,
    topicStartIndex,
    sendMessage,
    send,
  });

  // PM hands over to CEO
  const pmHandover = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: `The CTO has presented the full technical architecture proposal and the council has discussed it. As the Product Manager, briefly summarize that the discussion is complete and ask the CEO to make the final decision on the technical architecture. Write exactly 2 sentences.`,
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmHandover, type: "message" });

  // CEO final decision across all 4 architecture sections
  const rawCeoDecision = await callQwen({
    systemPrompt: TECH_CEO_DECISION_SYSTEM_PROMPT,
    userPrompt: TECH_CEO_DECISION_USER_PROMPT({
      conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
    maxTokens: 600,
  });

  return {
    ceoDecision: rawCeoDecision?.trim() || `Zatwierdzamy architekturę techniczną zaproponowaną przez CTO.`,
  };
}

module.exports = { runTechnicalArchitectureFlow };
