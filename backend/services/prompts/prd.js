const PRD_GENERATION_SYSTEM_PROMPT = `
You are a Senior Product Manager writing an MVP Package document.
You are synthesizing the CEO decisions and council discussion from a product session into a structured document.

Return ONLY valid JSON. No markdown. No explanation. No code fences.

Response shape:
{
  "projectName": "string — product name (2-5 words)",
  "productSummary": "string — 2-3 sentences: what we are building, for whom, and what is the core value.",
  "mvpScope": {
    "inMvp": ["string", ...],
    "postMvp": ["string", ...]
  },
  "userFlow": ["string", ...],
  "architecture": "string — multiline technical description of the approved stack and system boundaries",
  "dataAndIntegrations": ["string", ...],
  "implementationRoadmap": ["string", ...],
  "risksAndOpenQuestions": ["string", ...],
  "decisionLog": [
    { "stage": "agenda stage title (e.g. Product Vision)", "decision": "CEO decision text" }
  ]
}

Rules:
- Write ALL text content in English (except code syntax, HTTP methods, field names, tech names)
- Base ALL content strictly on the CEO decisions and council discussion — do not invent features
- projectName: the product name agreed upon or derived from the idea
- productSummary: synthesize the core vision — what, for whom, why, in 2-3 sentences
- mvpScope.inMvp: 4-7 concrete features confirmed for the MVP by the CEO decisions
- mvpScope.postMvp: 3-5 features explicitly deferred or excluded from MVP scope
- userFlow: 5-7 steps of the main user journey from entry to success state
- architecture: the approved stack and system boundaries (frontend, backend, AI, deployment, auth)
- dataAndIntegrations: 4-6 key data entities and/or external integrations (format: "Entity/Integration — short description")
- implementationRoadmap: 3-5 build phases in order (format: "Phase N — what it covers")
- risksAndOpenQuestions: 3-5 specific risks flagged during the session OR open questions left to resolve
- decisionLog: copy EXACTLY from the DECISION LOG provided in the user prompt — do not rephrase, reorder, or omit any entry
- Keep each array item concise (under 20 words)
`;

const PRD_GENERATION_USER_PROMPT = ({ idea, topicSummaries, decisions }) => {
  const topicsBlock = topicSummaries
    .map((s, idx) => {
      const lines = [
        `### Stage ${idx + 1}: ${s.topicTitle}`,
        `Discussion: ${s.summary}`,
        `CEO decision: ${s.decision}`,
      ];
      if (s.conflict) {
        lines.push(`Conflict: ${s.conflict.title} → resolution: ${s.conflict.resolution || "none"}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const decisionsBlock =
    decisions.length > 0
      ? `\nDecisions from council votes:\n${decisions.map((d) => `- ${d.text}`).join("\n")}`
      : "";

  const decisionLogBlock = topicSummaries
    .map((s, idx) => `${idx + 1}. ${s.topicTitle} → ${s.decision}`)
    .join("\n");

  return `User idea:
${idea}

Product council session stages with CEO decisions:
${topicsBlock}
${decisionsBlock}

DECISION LOG — copy these entries VERBATIM into the decisionLog field in the JSON response.
Do not change the order, do not paraphrase, do not omit any entry.
${decisionLogBlock}

Based on the CEO decisions above, create the MVP Package for this product.
Respond ONLY in JSON format matching the given schema.`;
};

module.exports = {
  PRD_GENERATION_SYSTEM_PROMPT,
  PRD_GENERATION_USER_PROMPT,
};
