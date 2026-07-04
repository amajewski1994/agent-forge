const ROADMAP_PM_OPENING_USER_PROMPT = ({ idea, topic }) => `
User idea:
${idea}

Agenda topic: "${topic.title}"
What this topic covers: ${topic.description}

As the Product Manager, open this agenda topic.
Start by telling the team that this is the last point on the agenda, then say that based on everything decided so far, you will now lay out the implementation roadmap in build order.
Write exactly 2 sentences. Be direct and natural, like in a real product meeting.
`;

const ROADMAP_GENERATE_STEPS_SYSTEM_PROMPT = `
You are helping plan the build order for a product. Given a product idea and the decisions already made by the council, produce an ordered implementation roadmap.
Return ONLY valid JSON. No markdown. No explanation. No code fences.
Response shape: {"steps": ["step 1", "step 2", ...]}
Return between 5 and 8 steps, ordered from first to last, each step a short phrase describing what gets built at that stage.
`;

const ROADMAP_GENERATE_STEPS_USER_PROMPT = ({ idea, resolvedDecisions }) => {
  const decisionsBlock =
    resolvedDecisions.length > 0
      ? `\nDecisions already made by the council:\n${resolvedDecisions.map((d) => `- ${d.topic}: "${d.winner}"`).join("\n")}\n`
      : "";

  return `
User idea:
${idea}
${decisionsBlock}
Based on everything decided so far, produce the ordered implementation roadmap for building this product. Return JSON only.
`;
};

const ROADMAP_PM_ASK_OPINION_USER_PROMPT = ({ idea }) => `
User idea:
${idea}

You have just presented the implementation roadmap to the team.
As the Product Manager, ask the team for their opinion specifically on the order of the steps, not on whether any step is needed.
Write exactly 2 sentences.
`;

const ROADMAP_EVALUATE_SYSTEM_PROMPT = `
You are an evaluator for a product council. Decide whether an agent would raise a genuine concern about the ORDER of the implementation roadmap steps, purely from their professional perspective. Do not judge whether a step is necessary, only whether the sequencing is right.

Judge this the way an experienced reviewer would in a real meeting: engage critically with the specific order shown, do not default to agreement just to be agreeable, but also do not invent a problem that is not really there.
Mark hasConcern as true only if you can point to a specific pair of steps where the order creates a real dependency, risk, or validation problem from this agent's professional angle.
Mark hasConcern as false if the order already respects those constraints reasonably well from this agent's perspective, even if a different but equally valid order would also have worked.

If an earlier speaker in the discussion already proposed moving the same step, or the same pair of steps, for essentially the same reason, mark hasConcern as false. Only mark it true for a reordering that has not already been raised, or that this agent would justify with a genuinely different reason than what was already said.

Return ONLY valid JSON. No markdown. No explanation. No code fences.
Response shape: {"hasConcern": true} or {"hasConcern": false}
`;

const ROADMAP_DESIGNER_EVALUATE_USER_PROMPT = ({ roadmapHistory }) => `
Discussion so far, including the roadmap and any remarks already made by other agents:
${roadmapHistory}

From a UX and user flow perspective, does the Designer have a genuine concern about the ORDER of these steps?
Look specifically for cases where something that shapes the user experience is scheduled later than something less user facing, where a step needed to validate the user flow comes too late, or where the user facing parts of the product are not built early enough to get real feedback.
If another agent already proposed the same reordering above, do not raise it again.
Return JSON only.
`;

const ROADMAP_CTO_EVALUATE_USER_PROMPT = ({ roadmapHistory }) => `
Discussion so far, including the roadmap and any remarks already made by other agents:
${roadmapHistory}

From a technical perspective, does the CTO have a genuine concern about the ORDER of these steps?
Look specifically for cases where a step technically depends on another step scheduled later, where foundational infrastructure is scheduled after the features that need it, or where an integration is attempted before the system it plugs into actually exists.
If another agent already proposed the same reordering above, do not raise it again.
Return JSON only.
`;

const ROADMAP_QA_EVALUATE_USER_PROMPT = ({ roadmapHistory }) => `
Discussion so far, including the roadmap and any remarks already made by other agents:
${roadmapHistory}

From a quality and validation perspective, does the QA have a genuine concern about the ORDER of these steps?
Look specifically for cases where testing or validation of a step happens before the thing it depends on is ready, where a risky or failure prone step is left until too late to catch problems early, or where end to end validation is scheduled before all the pieces it needs actually exist.
If another agent already proposed the same reordering above, do not raise it again.
Return JSON only.
`;

const ROADMAP_DESIGNER_NO_CONCERN_USER_PROMPT = ({ presentationHistory, sentenceCount }) => `
Discussion so far:
${presentationHistory}

As the Designer, you have no concern about the order of the implementation roadmap. Say so directly, from a user flow perspective.
Write exactly ${sentenceCount} sentences.
`;

const ROADMAP_DESIGNER_CONCERN_USER_PROMPT = ({ presentationHistory, sentenceCount }) => `
Discussion so far:
${presentationHistory}

As the Designer, you have a genuine concern about the order of the implementation roadmap from a user flow perspective.
State clearly which step you would move and where in the order it should go instead. Be specific about the step names.
If another agent already proposed moving these same steps, do not repeat their point as your own, add a distinct reason or a different pair of steps instead.
Do not ask questions. Take a clear position.
Write exactly ${sentenceCount} sentences.
`;

const ROADMAP_CTO_NO_CONCERN_USER_PROMPT = ({ presentationHistory, sentenceCount }) => `
Discussion so far:
${presentationHistory}

As the CTO, you have no concern about the order of the implementation roadmap. Say so directly, from a technical dependency perspective.
Write exactly ${sentenceCount} sentences.
`;

const ROADMAP_CTO_CONCERN_USER_PROMPT = ({ presentationHistory, sentenceCount }) => `
Discussion so far:
${presentationHistory}

As the CTO, you have a genuine concern about the order of the implementation roadmap from a technical dependency perspective.
State clearly which step you would move and where in the order it should go instead. Be specific about the step names.
If another agent already proposed moving these same steps, do not repeat their point as your own, add a distinct reason or a different pair of steps instead.
Do not ask questions. Take a clear position.
Write exactly ${sentenceCount} sentences.
`;

const ROADMAP_QA_NO_CONCERN_USER_PROMPT = ({ presentationHistory, sentenceCount }) => `
Discussion so far:
${presentationHistory}

As the QA, you have no concern about the order of the implementation roadmap. Say so directly, from a quality and validation perspective.
Write exactly ${sentenceCount} sentences.
`;

const ROADMAP_QA_CONCERN_USER_PROMPT = ({ presentationHistory, sentenceCount }) => `
Discussion so far:
${presentationHistory}

As the QA, you have a genuine concern about the order of the implementation roadmap from a quality and validation perspective.
State clearly which step you would move and where in the order it should go instead. Be specific about the step names.
If another agent already proposed moving these same steps, do not repeat their point as your own, add a distinct reason or a different pair of steps instead.
Do not ask questions. Take a clear position.
Write exactly ${sentenceCount} sentences.
`;

const ROADMAP_CEO_DECISION_SYSTEM_PROMPT = `
You are the CEO of a product council making the final call on the implementation roadmap order.
Write in English only.
Be direct and authoritative.

Present the full, final implementation roadmap, incorporating any reordering that the discussion showed a genuine, well argued reason for based on the concerns raised by Designer, CTO, or QA.
Format each roadmap step on its own line as "Step N description", for example "Step 1 Set up the project and base infrastructure".
Do not add any commentary before or after the list.
Do not use markdown headers or bullet points. Do not number steps with dots like "1.", only use the "Step N" format.
Do not use dashes ("-", "–", "—").
`;

const ROADMAP_CEO_DECISION_USER_PROMPT = ({ steps, conversationHistory }) => `
Original proposed roadmap order:
${steps.map((s, i) => `Step ${i + 1} ${s}`).join("\n")}

Full council discussion about the roadmap order:
${conversationHistory}

As CEO, present the final implementation roadmap, reordering steps where the discussion showed a genuine, well argued reason to do so. Keep the original wording of each step unless a small clarification is needed.
Format each step on its own line as "Step N description", renumbered sequentially starting from Step 1. Return the list only, no other text before or after.
`;

module.exports = {
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
};
