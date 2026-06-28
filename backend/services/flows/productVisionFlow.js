const { callQwen } = require("../qwenService");
const {
  AGENT_PROMPTS,
  PRODUCT_VISION_PM_OPENING_USER_PROMPT,
  PRODUCT_VISION_AGENT_VISION_USER_PROMPT,
  PRODUCT_VISION_PM_COMPARISON_USER_PROMPT,
  PRODUCT_VISION_CEO_DECISION_SYSTEM_PROMPT,
  PRODUCT_VISION_CEO_DECISION_USER_PROMPT,
} = require("../prompts");
const { formatConversationHistory } = require("../../utils/councilUtils");
const { randomSentenceCount } = require("../agentHelpers");

async function runProductVisionFlow({ idea, topic, messages, topicStartIndex, sendMessage }) {
  const pmOpening = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: PRODUCT_VISION_PM_OPENING_USER_PROMPT({ idea, topic }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmOpening, type: "message" });

  const ctoVision = await callQwen({
    systemPrompt: AGENT_PROMPTS.CTO.systemPrompt,
    userPrompt: PRODUCT_VISION_AGENT_VISION_USER_PROMPT(idea, topic, randomSentenceCount()),
  });
  sendMessage({ agentAbbr: "CTO", role: "Chief Technology Officer", content: ctoVision, type: "message" });

  const designerVision = await callQwen({
    systemPrompt: AGENT_PROMPTS.DESIGNER.systemPrompt,
    userPrompt: PRODUCT_VISION_AGENT_VISION_USER_PROMPT(idea, topic, randomSentenceCount()),
  });
  sendMessage({ agentAbbr: "DES", role: "Product Designer", content: designerVision, type: "message" });

  const qaVision = await callQwen({
    systemPrompt: AGENT_PROMPTS.QA.systemPrompt,
    userPrompt: PRODUCT_VISION_AGENT_VISION_USER_PROMPT(idea, topic, randomSentenceCount()),
  });
  sendMessage({ agentAbbr: "QA", role: "Quality Analyst", content: qaVision, type: "message" });

  const pmComparison = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: PRODUCT_VISION_PM_COMPARISON_USER_PROMPT({
      idea,
      topic,
      conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmComparison, type: "message" });

  const rawCeoDecision = await callQwen({
    systemPrompt: PRODUCT_VISION_CEO_DECISION_SYSTEM_PROMPT,
    userPrompt: PRODUCT_VISION_CEO_DECISION_USER_PROMPT({
      topic,
      conversationHistory: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
  });

  return {
    ceoDecision: rawCeoDecision?.trim() || `Idziemy z wizją produktu wypracowaną przez cały zespół.`,
  };
}

module.exports = { runProductVisionFlow };
