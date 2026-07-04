const { callQwen } = require("../qwenService");
const {
  AGENT_PROMPTS,
  MVP_SCOPE_PRESENTATION_SYSTEM_PROMPT,
  MVP_SCOPE_GENERATE_FEATURES_SYSTEM_PROMPT,
  MVP_SCOPE_GENERATE_FEATURES_USER_PROMPT,
  MVP_SCOPE_PM_PRESENT_FEATURES_USER_PROMPT,
  MVP_SCOPE_PM_ANNOUNCE_ANALYSIS_USER_PROMPT,
  MVP_SCOPE_CATEGORIZE_SYSTEM_PROMPT,
  MVP_SCOPE_CATEGORIZE_USER_PROMPT,
  MVP_SCOPE_PM_ANNOUNCE_DISCUSSION_USER_PROMPT,
  MVP_SCOPE_PM_FEATURE_OPENER_USER_PROMPT,
  MVP_SCOPE_FEATURE_SCORE_USER_PROMPT,
  MVP_SCOPE_CEO_FINAL_SYSTEM_PROMPT,
  MVP_SCOPE_CEO_FINAL_USER_PROMPT,
  MVP_SCOPE_STAGE_SUMMARY_SYSTEM_PROMPT,
  MVP_SCOPE_STAGE_SUMMARY_USER_PROMPT,
} = require("../prompts");
const { formatConversationHistory, extractJson } = require("../../utils/councilUtils");
const { AGENT_META, generateCheckedAgentReply } = require("../agentHelpers");
const { runFeatureVote } = require("../voteService");

const STANCE_OPTIONS = ["approved", "postMvp", "rejected"];
const STANCE_LABELS = { approved: "Approved MVP", postMvp: "Post MVP", rejected: "Rejected" };

const ROLE_STANCE_NOTES = {
  CTO: {
    approved: `You believe this feature is technically feasible and should ship in the MVP. Argue from a technical perspective: clear scope, manageable complexity, no blocking dependencies.`,
    postMvp: `You believe this feature needs infrastructure that isn't ready yet. Argue about technical prerequisites, build order, or why it makes more sense after the core system is stable.`,
    rejected: `You believe this feature introduces disproportionate complexity or unclear implementation scope. Argue about over-engineering, poor return on build cost, or technical debt risk.`,
  },
  DESIGNER: {
    approved: `You believe this feature meaningfully improves the user journey and belongs in the first release. Argue from a UX flow perspective: user clarity, reduced friction, or journey completeness.`,
    postMvp: `You believe this is a useful UX addition but not critical for the first release. Argue that the core flow works without it and this can be refined once the product is live.`,
    rejected: `You believe this feature would confuse users, create awkward flows, or add unnecessary cognitive load. Argue from a UX clarity standpoint and protect the core experience.`,
  },
  QA: {
    approved: `You believe this feature has clear acceptance criteria and can be validated reliably. Argue from a quality standpoint: testable edge cases, low failure risk, and predictable behavior.`,
    postMvp: `You believe this feature has too many undefined edge cases to rush into the MVP. Argue about validation risk — more time is needed to define failure scenarios and testing scope.`,
    rejected: `You believe this feature creates untestable scenarios or has too many unknown failure modes. Argue about unpredictability and the maintenance burden it would create.`,
  },
};

async function runMvpScopeFlow({ idea, resolvedDecisions, messages, topicStartIndex, sendMessage, send, waitForProceed }) {
  // 1. Generate 9 features (silent)
  const featuresRaw = await callQwen({
    systemPrompt: MVP_SCOPE_GENERATE_FEATURES_SYSTEM_PROMPT,
    userPrompt: MVP_SCOPE_GENERATE_FEATURES_USER_PROMPT({ idea, resolvedDecisions }),
  });

  let features = [];
  try {
    const parsed = JSON.parse(extractJson(featuresRaw));
    if (Array.isArray(parsed.features)) features = parsed.features;
  } catch {}
  if (features.length !== 9) {
    features = features.slice(0, 9);
    while (features.length < 9) features.push(`Feature ${features.length + 1}`);
  }

  // PM presents all 9 features
  const pmPresentation = await callQwen({
    systemPrompt: MVP_SCOPE_PRESENTATION_SYSTEM_PROMPT,
    userPrompt: MVP_SCOPE_PM_PRESENT_FEATURES_USER_PROMPT({ idea, features }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmPresentation, type: "message" });

  // PM announces analysis, frontend shows loader
  const pmAnalysisMsg = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: MVP_SCOPE_PM_ANNOUNCE_ANALYSIS_USER_PROMPT(),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmAnalysisMsg, type: "message" });

  send("mvp_scope_analyzing", {});

  const categorizeRaw = await callQwen({
    systemPrompt: MVP_SCOPE_CATEGORIZE_SYSTEM_PROMPT,
    userPrompt: MVP_SCOPE_CATEGORIZE_USER_PROMPT({ idea, features, resolvedDecisions }),
  });

  let approved = [], postMvp = [], rejected = [], discussion = [];
  try {
    const parsed = JSON.parse(extractJson(categorizeRaw));
    if (Array.isArray(parsed.approved)) approved = parsed.approved;
    if (Array.isArray(parsed.postMvp)) postMvp = parsed.postMvp;
    if (Array.isArray(parsed.rejected)) rejected = parsed.rejected;
    if (Array.isArray(parsed.discussion)) discussion = parsed.discussion;
  } catch {}

  if (approved.length + postMvp.length + rejected.length + discussion.length < 9) {
    approved = features.slice(0, 2);
    postMvp = features.slice(2, 4);
    rejected = features.slice(4, 6);
    discussion = features.slice(6, 9);
  }

  const categorizationMessage = [
    "Here are the analysis results:",
    "",
    "1. Approved MVP:",
    ...approved.map((f) => `- ${f}`),
    "",
    "2. Post MVP:",
    ...postMvp.map((f) => `- ${f}`),
    "",
    "3. Rejected:",
    ...rejected.map((f) => `- ${f}`),
    "",
    "4. For Discussion:",
    ...discussion.map((f) => `- ${f}`),
  ].join("\n");
  await new Promise((r) => setTimeout(r, 6000));
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: categorizationMessage, type: "message", preCouncil: true });

  send("mvp_scope_table", { approved: [...approved], postMvp: [...postMvp], rejected: [...rejected], discussion: [...discussion] });

  const pmDiscussionMsg = await callQwen({
    systemPrompt: AGENT_PROMPTS.PM.systemPrompt,
    userPrompt: MVP_SCOPE_PM_ANNOUNCE_DISCUSSION_USER_PROMPT({ discussionFeatures: discussion }),
  });
  sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmDiscussionMsg, type: "message" });

  const finalCategories = {
    approved: [...approved],
    postMvp: [...postMvp],
    rejected: [...rejected],
    discussion: [...discussion],
  };

  // Discuss each "For Discussion" feature one by one
  for (let fi = 0; fi < discussion.length; fi++) {
    const feature = discussion[fi];
    const featureStartIndex = messages.length;

    const agentStances = {};
    agentStances["PM"] = STANCE_OPTIONS[Math.floor(Math.random() * 3)];

    await Promise.all(["CTO", "DESIGNER", "QA"].map(async (agentKey) => {
      const raw = await callQwen({
        systemPrompt: AGENT_PROMPTS[agentKey].systemPrompt,
        userPrompt: MVP_SCOPE_FEATURE_SCORE_USER_PROMPT({ agentKey, feature, idea }),
      });
      let score = 5;
      try { score = JSON.parse(extractJson(raw))?.score ?? 5; } catch {}
      score = Math.min(10, Math.max(1, Number(score) || 5));
      agentStances[agentKey] = score <= 3 ? "rejected" : score <= 6 ? "postMvp" : "approved";
    }));

    const featureTopic = {
      title: `MVP Scope: ${feature}`,
      description: `Should the feature "${feature}" be in the MVP, moved to Post-MVP, or rejected entirely?`,
    };

    if (waitForProceed) {
      await new Promise((r) => setTimeout(r, 3000));
      const proceedPrompt = fi === 0
        ? `Can we move on to discussing the first feature from the "For Discussion" group: "${feature}"?`
        : `Can we move on to discussing the next feature: "${feature}"?`;
      sendMessage({ agentAbbr: "PM", role: "Product Manager", content: proceedPrompt, type: "message" });
      send("awaiting_feature_proceed", {});
      await waitForProceed();
    }

    const pmFeatureOpener = await callQwen({
      systemPrompt: MVP_SCOPE_PRESENTATION_SYSTEM_PROMPT,
      userPrompt: MVP_SCOPE_PM_FEATURE_OPENER_USER_PROMPT({ feature, discussionFeatures: discussion, currentIndex: fi }),
    });
    sendMessage({ agentAbbr: "PM", role: "Product Manager", content: pmFeatureOpener, type: "message" });

    for (const agentKey of ["CTO", "DESIGNER", "QA"]) {
      const lastMsg = messages[messages.length - 1];
      const convHistory = formatConversationHistory(messages.slice(featureStartIndex));
      const stanceNote = ROLE_STANCE_NOTES[agentKey]?.[agentStances[agentKey]]
        ?? `You believe this feature should be ${STANCE_LABELS[agentStances[agentKey]]}. Argue clearly and naturally for that position.`;

      const response = await generateCheckedAgentReply({
        agentKey, idea, conversationHistory: convHistory, lastMessage: lastMsg, resolvedDecisions, topic: featureTopic,
        sentenceCount: Math.floor(Math.random() * 4) + 5,
        stanceNote,
      });

      const meta = AGENT_META[agentKey];
      sendMessage({ agentAbbr: meta.agentAbbr, role: meta.role, content: response, type: "message" });
    }

    sendMessage({ agentAbbr: "PM", role: "Product Manager", content: `Let's move to a vote on the feature "${feature}".`, type: "message" });

    const voteResult = await runFeatureVote({ feature, messages: messages.slice(featureStartIndex), send, agentStances });
    const winnerOptionId = voteResult?.winner?.id ?? "A";

    const optionToGroup = { A: "postMvp", B: "approved", C: "rejected" };
    const targetGroup = optionToGroup[winnerOptionId] ?? "postMvp";

    const idxInDiscussion = finalCategories.discussion.indexOf(feature);
    if (idxInDiscussion !== -1) finalCategories.discussion.splice(idxInDiscussion, 1);
    finalCategories[targetGroup].push(feature);
    send("mvp_scope_feature_move", { feature, from: "discussion", to: targetGroup });
  }

  send("mvp_scope_final", { ...finalCategories });

  const ceoBuildFinalRaw = await callQwen({
    systemPrompt: MVP_SCOPE_CEO_FINAL_SYSTEM_PROMPT,
    userPrompt: MVP_SCOPE_CEO_FINAL_USER_PROMPT({ finalCategories }),
  });
  const ceoDecision = ceoBuildFinalRaw?.trim() || `We're finalizing the MVP scope and moving on to the next stages.`;

  const customStageSummary = await callQwen({
    systemPrompt: MVP_SCOPE_STAGE_SUMMARY_SYSTEM_PROMPT,
    userPrompt: MVP_SCOPE_STAGE_SUMMARY_USER_PROMPT({
      discussionFeatures: discussion,
      finalCategories,
      stageMessages: formatConversationHistory(messages.slice(topicStartIndex)),
    }),
  }).then((r) => r?.trim() || null);

  return { ceoDecision, customStageSummary };
}

module.exports = { runMvpScopeFlow };
