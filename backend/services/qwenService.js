const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
});

async function callQwen({ systemPrompt, userPrompt }) {
  if (!process.env.QWEN_API_KEY) {
    throw new Error("Missing QWEN_API_KEY in .env");
  }

  const response = await client.chat.completions.create({
    model: process.env.QWEN_MODEL_PROD || "qwen-flash",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.3,
    max_tokens: Number(process.env.QWEN_MAX_TOKENS) || 250,
  });

  return response.choices[0].message.content;
}

module.exports = {
  callQwen,
};
