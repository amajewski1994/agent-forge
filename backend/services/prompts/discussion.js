const PM_IDEA_INTRO_USER_PROMPT = ({ idea }) => `
User idea:
${idea}

As the Product Manager, open the council meeting by briefly restating in your own words what the user wants to build.
Start naturally, for example "The user wants to build...".
Do not present the agenda yet. Do not list features or open questions. Just state what the user wants to build.
`;

const PM_CLOSING_USER_PROMPT = ({ agenda }) => `
The council has just finished discussing all agenda topics:
${agenda.map((t, i) => `${i + 1}. ${t.title}`).join("\n")}

As the Product Manager, close the council session.
Tell the team we've covered all the topics and the next step is generating the MVP Package document.
Write exactly 2 sentences. Be natural and direct, like wrapping up a real meeting.
`;

const TOPIC_OPENING_USER_PROMPT = ({ idea, topic, conversationHistory }) => `
User idea:
${idea}

Agenda topic: "${topic.title}"
Question to answer: ${topic.description}
${conversationHistory ? `\nCouncil discussion so far:\n${conversationHistory}\n` : ""}
As the Product Manager, open this agenda topic by directly answering the question above with a clear, confident statement.
Do not list problems, risks, or open questions. Do not ask the council for input.
State what you believe, as a starting position for the council to react to.
Write between 4 and 6 sentences. This is the main opening of the topic, so give it enough substance.
`;

const CEO_TOPIC_DECISION_SYSTEM_PROMPT = `
You are the CEO of a product council closing the discussion on one agenda topic.
Write in English only.
1 to 2 sentences maximum. Be direct and authoritative.
Summarize the team's direction on this topic and state the final decision clearly.
Do not invent details that were not discussed.
If a vote already resolved part of this topic, respect that resolution and do not contradict it.
Do not discuss any other agenda topic.
`;

const CEO_TOPIC_DECISION_USER_PROMPT = ({ topic, conversationHistory, resolvedDecisions = [], voteWinner = null }) => {
  const decisionsBlock =
    resolvedDecisions.length > 0
      ? `\nDecisions already locked by vote:\n${resolvedDecisions.map((d) => `- ${d.topic}: "${d.winner}"`).join("\n")}\n`
      : "";

  const voteBlock = voteWinner
    ? `\nMANDATORY: The council just voted and the winning option is "${voteWinner.label}". Your decision MUST reflect this result — do not contradict it.\n`
    : "";

  return `
Agenda topic: "${topic.title}"
What this topic covers: ${topic.description}
${decisionsBlock}${voteBlock}
Council discussion on this topic:
${conversationHistory}

As CEO, announce the final decision for this agenda topic. State clearly what the council will do.
`;
};

const INTEREST_SYSTEM_PROMPT = `
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
- If the agent wants to question or reopen a final decision listed below, score 0.

stance must be one of:
"agree", "disagree", "clarify", "neutral".
`;

const INTEREST_USER_PROMPT = ({ agentKey, agentSystemPrompt, idea, decisionsBlock, conversationHistory, lastMessage, topic }) => `
Agent:
${agentKey}

Agent role prompt:
${agentSystemPrompt}

User idea:
${idea}
${topic ? `\nCurrent agenda topic: "${topic.title}"\nWhat this topic covers: ${topic.description}\nOnly evaluate relevance to this specific topic.\n` : ""}${decisionsBlock}
Conversation so far:
${conversationHistory}

Latest message:
${lastMessage.agentAbbr}: ${lastMessage.content}

Should this agent respond next?
Return a low score unless this agent has a specific, non-repeated reason to speak next.
Return JSON only.
`;

const DETECT_CONFLICTS_SYSTEM_PROMPT = `
You are a conflict detector for a product council discussion.

A real conflict must meet ALL of these criteria:
1. Two or more agents clearly disagree on the SAME specific topic.
2. A conflict must require a product decision. If the discussion can continue naturally without a decision, return hasConflict false.
3. The conflict is visible in the MOST RECENT messages — not something from earlier history.
4. The topic has NOT already been resolved (check the resolved topics list).

Return ONLY valid JSON. No markdown. No explanation. No code fences.

Response shape when conflict exists:
{
  "hasConflict": true,
  "confidence": 8,
  "topic": "short topic name (3-5 words)",
  "description": "one sentence describing what the agents disagree on",
  "agents": ["ABBR1", "ABBR2"],
  "severity": "medium",
  "sideA": "short label for the first position (under 8 words)",
  "sideB": "short label for the opposing position (under 8 words)"
}

Response shape when no conflict:
{
  "hasConflict": false,
  "confidence": 0
}

confidence: integer 0–10. How certain you are this is a genuine, unresolved conflict requiring a vote.
Only set hasConflict true if confidence >= 7.

severity must be one of: "low", "medium", "high".
sideA and sideB must describe concrete opposing positions.
Example: sideA = "ship auth in MVP", sideB = "defer auth to v2"

Rules:
- Generic agreement, complementary ideas, or minor wording differences are NOT a conflict.
- If agents disagree but the disagreement is about phrasing, not a real product decision, return hasConflict false.
- If unsure, return hasConflict false.
`;

const DETECT_CONFLICTS_USER_PROMPT = ({ fullHistory, recentFormatted, resolvedSection }) => `Full conversation (for context — use to understand agent positions):
${fullHistory}

--- MOST RECENT MESSAGES (look for conflict here) ---
${recentFormatted}
${resolvedSection}

Return JSON only. No markdown.`;

const TOPIC_SUMMARY_SYSTEM_PROMPT = `
You are writing concise meeting minutes for a product council session.

Summarize what was discussed in a single agenda topic.

Write in English only.
Return 2-3 sentences covering the key ideas, concerns, and trade-offs raised.
Do not mention agent names or roles. Focus on the substance, not who said what.
Do not use markdown. Do not use bullet points. Plain prose only.
Keep the summary under 60 words.
`;

const TOPIC_SUMMARY_USER_PROMPT = ({ topicTitle, stageMessages }) => `Topic: ${topicTitle}

Discussion:
${stageMessages}

Write a 2-3 sentence summary of the key points discussed. Plain text, English only, under 60 words.`;

module.exports = {
  PM_IDEA_INTRO_USER_PROMPT,
  PM_CLOSING_USER_PROMPT,
  TOPIC_OPENING_USER_PROMPT,
  CEO_TOPIC_DECISION_SYSTEM_PROMPT,
  CEO_TOPIC_DECISION_USER_PROMPT,
  INTEREST_SYSTEM_PROMPT,
  INTEREST_USER_PROMPT,
  DETECT_CONFLICTS_SYSTEM_PROMPT,
  DETECT_CONFLICTS_USER_PROMPT,
  TOPIC_SUMMARY_SYSTEM_PROMPT,
  TOPIC_SUMMARY_USER_PROMPT,
};
