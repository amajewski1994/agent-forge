const { callQwen } = require("../qwenService");
const {
  AGENT_PROMPTS,
  UX_DESIGNER_SYSTEM_PROMPT,
  UX_PM_OPENING_USER_PROMPT,
  UX_DESIGNER_PHILOSOPHY_USER_PROMPT,
  UX_DESIGNER_VISUAL_STYLE_USER_PROMPT,
  UX_DESIGNER_SCREEN_STRUCTURE_USER_PROMPT,
  UX_DESIGNER_USER_FLOW_USER_PROMPT,
  UX_CEO_DECISION_SYSTEM_PROMPT,
  UX_CEO_DECISION_USER_PROMPT,
  UX_PM_INVITE_CTO_USER_PROMPT,
  UX_PM_INVITE_QA_USER_PROMPT,
  UX_EVALUATE_SYSTEM_PROMPT,
  UX_CTO_EVALUATE_USER_PROMPT,
  UX_QA_EVALUATE_USER_PROMPT,
  UX_CTO_AGREE_USER_PROMPT,
  UX_QA_AGREE_USER_PROMPT,
  UX_CTO_DISAGREE_USER_PROMPT,
  UX_QA_DISAGREE_USER_PROMPT,
  UX_CHECK_STILL_CONFLICT_SYSTEM_PROMPT,
  UX_CHECK_STILL_CONFLICT_USER_PROMPT,
  UX_CONFLICT_CONTEXT_SYSTEM_PROMPT,
  UX_CONFLICT_CONTEXT_USER_PROMPT,
} = require("../prompts");
const { formatConversationHistory, extractJson } = require("../../utils/councilUtils");
const { AGENT_META, generateCheckedAgentReply } = require("../agentHelpers");
const { runConflictVote } = require("../voteService");

function randomUxSentenceCount() {
  return Math.floor(Math.random() * 4) + 5;
}

async function runUxReviewSection({
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
    systemPrompt: UX_EVALUATE_SYSTEM_PROMPT,
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

  // Designer defends
  const designerReply = await generateCheckedAgentReply({
    agentKey: "DESIGNER",
    idea,
    conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    lastMessage: messages[messages.length - 1],
    resolvedDecisions,
    topic,
    sentenceCount: 4,
  });
  sendMessage({ agentAbbr: "DES", role: "Product Designer", content: designerReply, type: "message" });

  // Agent replies
  const agentReply = await generateCheckedAgentReply({
    agentKey,
    idea,
    conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    lastMessage: messages[messages.length - 1],
    resolvedDecisions,
    topic,
    sentenceCount: 3,
  });
  sendMessage({ agentAbbr: agentMeta.agentAbbr, role: agentMeta.role, content: agentReply, type: "message" });

  // Check if conflict still stands after the exchange
  const stillConflictRaw = await callQwen({
    systemPrompt: UX_CHECK_STILL_CONFLICT_SYSTEM_PROMPT,
    userPrompt: UX_CHECK_STILL_CONFLICT_USER_PROMPT({
      conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
  });

  let stillConflict = true;
  try {
    const parsed = JSON.parse(extractJson(stillConflictRaw));
    stillConflict = parsed.stillConflict !== false;
  } catch {}

  if (!stillConflict) return;

  sendMessage({
    agentAbbr: "PM",
    role: "Product Manager",
    content: `We have a disagreement about UX. Let's move to a vote.`,
    type: "message",
  });

  const conflictContextRaw = await callQwen({
    systemPrompt: UX_CONFLICT_CONTEXT_SYSTEM_PROMPT,
    userPrompt: UX_CONFLICT_CONTEXT_USER_PROMPT({
      agentRole: agentMeta.role,
      conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
  });

  let conflictContext = {
    topic: `UX direction — ${agentMeta.role}`,
    description: `${agentMeta.role} raised a concern about the Designer's UX proposal.`,
    sideA: "Designer's direction",
    sideB: `${agentMeta.role}'s change`,
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

async function runUserExperienceFlow({ idea, topic, resolvedDecisions, messages, topicStartIndex, sendMessage, send }) {
  // PM opens the stage
  const pmOpening = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: UX_PM_OPENING_USER_PROMPT({ idea, topic }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmOpening, type: "message" });

  // Designer presents 4 sections
  const philosophyMsg = await callQwen({
    systemPrompt: UX_DESIGNER_SYSTEM_PROMPT,
    userPrompt: UX_DESIGNER_PHILOSOPHY_USER_PROMPT({ idea, resolvedDecisions, sentenceCount: randomUxSentenceCount() }),
    maxTokens: 600,
  });
  sendMessage({ agentAbbr: "DES", role: "Product Designer", content: philosophyMsg, type: "message" });

  const visualStyleMsg = await callQwen({
    systemPrompt: UX_DESIGNER_SYSTEM_PROMPT,
    userPrompt: UX_DESIGNER_VISUAL_STYLE_USER_PROMPT({ idea, resolvedDecisions, sentenceCount: randomUxSentenceCount() }),
    maxTokens: 600,
  });
  sendMessage({ agentAbbr: "DES", role: "Product Designer", content: visualStyleMsg, type: "message" });

  const screenStructureMsg = await callQwen({
    systemPrompt: UX_DESIGNER_SYSTEM_PROMPT,
    userPrompt: UX_DESIGNER_SCREEN_STRUCTURE_USER_PROMPT({ idea, resolvedDecisions, sentenceCount: randomUxSentenceCount() }),
    maxTokens: 600,
  });
  sendMessage({ agentAbbr: "DES", role: "Product Designer", content: screenStructureMsg, type: "message" });

  const userFlowMsg = await callQwen({
    systemPrompt: UX_DESIGNER_SYSTEM_PROMPT,
    userPrompt: UX_DESIGNER_USER_FLOW_USER_PROMPT({ idea, resolvedDecisions, sentenceCount: randomUxSentenceCount() }),
    maxTokens: 600,
  });
  sendMessage({ agentAbbr: "DES", role: "Product Designer", content: userFlowMsg, type: "message" });

  // Capture Designer's presentation before CTO/QA speak — used for silent evals
  const designerPresentationHistory = formatConversationHistory(messages.slice(topicStartIndex));

  // PM invites CTO
  const pmInviteCTO = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: UX_PM_INVITE_CTO_USER_PROMPT({ idea }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmInviteCTO, type: "message" });

  // CTO review
  await runUxReviewSection({
    agentKey: "CTO",
    evaluateUserPrompt: UX_CTO_EVALUATE_USER_PROMPT({ presentationHistory: designerPresentationHistory }),
    agreeUserPrompt: UX_CTO_AGREE_USER_PROMPT({ presentationHistory: designerPresentationHistory, sentenceCount: 3 }),
    disagreeUserPrompt: UX_CTO_DISAGREE_USER_PROMPT({ presentationHistory: designerPresentationHistory, sentenceCount: 4 }),
    idea,
    topic,
    resolvedDecisions,
    messages,
    topicStartIndex,
    sendMessage,
    send,
  });

  // PM invites QA (using full current history so PM sounds aware of CTO's input)
  const pmInviteQA = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: UX_PM_INVITE_QA_USER_PROMPT({ idea }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmInviteQA, type: "message" });

  // QA review — eval uses Designer's original presentation, speech uses full current history
  const currentHistory = formatConversationHistory(messages.slice(topicStartIndex));
  await runUxReviewSection({
    agentKey: "QA",
    evaluateUserPrompt: UX_QA_EVALUATE_USER_PROMPT({ presentationHistory: designerPresentationHistory }),
    agreeUserPrompt: UX_QA_AGREE_USER_PROMPT({ presentationHistory: currentHistory, sentenceCount: 3 }),
    disagreeUserPrompt: UX_QA_DISAGREE_USER_PROMPT({ presentationHistory: currentHistory, sentenceCount: 4 }),
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
    userPrompt: `The Designer has presented the full UX proposal and the council has discussed it. As the Product Manager, briefly summarize that the discussion is complete and ask the CEO to make the final decision on the UX direction. Write exactly 2 sentences.`,
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmHandover, type: "message" });

  // CEO final decision across all 4 UX sections
  const rawCeoDecision = await callQwen({
    systemPrompt: UX_CEO_DECISION_SYSTEM_PROMPT,
    userPrompt: UX_CEO_DECISION_USER_PROMPT({
      conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
    maxTokens: 600,
  });

  return {
    ceoDecision: rawCeoDecision?.trim() || `Zatwierdzamy kierunek UX zaprezentowany przez Designera.`,
  };
}

module.exports = { runUserExperienceFlow };
