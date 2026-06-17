function formatConversationHistory(messages) {
  return messages
    .map((msg) => `${msg.agentAbbr} (${msg.role}): ${msg.content}`)
    .join("\n\n");
}

function extractJson(raw) {
  if (!raw) return "";
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];
  return raw.trim();
}

module.exports = { formatConversationHistory, extractJson };
