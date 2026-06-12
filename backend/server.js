require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { buildCouncilWorkflow } = require("./services/councilService");
const { callQwen } = require("./services/qwenService");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Agent Forge backend is running" });
});

app.get("/api/qwen/test", async (req, res) => {
  try {
    const result = await callQwen({
      systemPrompt: `
You are the PM Agent in an AI Product Council.
Your job is to define a very lean MVP scope.
Respond in Polish.
Return exactly 5 short bullet points.
Do not ask questions.
Do not write explanations.
`,
      userPrompt: `
Pomysł użytkownika:
Aplikacja do rezerwacji lekarzy.

Zaproponuj zakres MVP.
`,
    });

    res.json({
      success: true,
      model: process.env.QWEN_MODEL_TEST || "qwen-flash",
      result,
    });
  } catch (error) {
    console.error("Qwen test error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/council/start", async (req, res) => {
  const idea = req.query.idea || "No idea provided";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (type, data) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await buildCouncilWorkflow(idea, {
      send,
    });

    send("done", { message: "Council finished" });
    res.end();
  } catch (error) {
    console.error("Council error:", error);

    send("error", {
      message: error.message || "Council workflow failed",
    });

    res.end();
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
