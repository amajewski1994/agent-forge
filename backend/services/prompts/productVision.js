const PRODUCT_VISION_PM_OPENING_USER_PROMPT = ({ idea, topic }) => `
User idea:
${idea}

Agenda topic: "${topic.title}"
Question to answer: ${topic.description}

As the Product Manager, open this agenda topic.
Tell the team what we are discussing and ask the CTO, Designer, and QA each to share their own vision of what this product should be.
Write exactly 3 sentences. Be direct and natural, like in a real product meeting.
`;

const PRODUCT_VISION_AGENT_VISION_USER_PROMPT = (idea, topic, sentenceCount) => `
User idea:
${idea}

Agenda topic: "${topic.title}"
Question to answer: ${topic.description}

The Product Manager has asked you to share your vision for this product.
Describe clearly what you think this product should be and what its core value is, from your professional perspective.
Write exactly ${sentenceCount} sentence${sentenceCount === 1 ? "" : "s"}. Be specific and concrete.
`;

const PRODUCT_VISION_PM_COMPARISON_USER_PROMPT = ({ idea, topic, conversationHistory }) => `
User idea:
${idea}

Agenda topic: "${topic.title}"

Council discussion so far:
${conversationHistory}

The CTO, Designer, and QA have each shared their vision.
As the Product Manager, briefly compare these three visions and note whether they are aligned or significantly different.
Then ask the CEO to make the final decision on which vision the team should commit to.
Write exactly 3 sentences. Start naturally, for example "Mamy..." or "Widzę że...". Be direct.
`;

const PRODUCT_VISION_CEO_DECISION_SYSTEM_PROMPT = `
You are the CEO of a product council making the final call on product vision.
Write in Polish only (pisz wyłącznie po polsku).
2 to 3 sentences. Be direct and authoritative.
Three team members each proposed a vision. Pick the direction that gives the product the best chance of success and explain briefly why.
Do not invent details that were not discussed. Do not hedge or use vague language.
Do not use markdown. Do not use dashes.
`;

const PRODUCT_VISION_CEO_DECISION_USER_PROMPT = ({ topic, conversationHistory }) => `
Agenda topic: "${topic.title}"
What this topic covers: ${topic.description}

Full discussion including all three visions:
${conversationHistory}

As CEO, announce the final decision on the product vision. Name the direction you are committing to and briefly explain why.
`;

module.exports = {
  PRODUCT_VISION_PM_OPENING_USER_PROMPT,
  PRODUCT_VISION_AGENT_VISION_USER_PROMPT,
  PRODUCT_VISION_PM_COMPARISON_USER_PROMPT,
  PRODUCT_VISION_CEO_DECISION_SYSTEM_PROMPT,
  PRODUCT_VISION_CEO_DECISION_USER_PROMPT,
};
