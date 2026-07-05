require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { buildCouncilWorkflow } = require("./services/councilService");
const { callQwen } = require("./services/qwenService");
const { PRD_GENERATION_SYSTEM_PROMPT, PRD_GENERATION_USER_PROMPT } = require("./services/prompts");
const { extractJson } = require("./utils/councilUtils");

const app = express();

app.use(cors());
app.use(express.json());

const pendingSessions = new Map();
const pendingGenerateSessions = new Map();

app.get("/", (req, res) => {
  res.json({ message: "Agent Forge backend is running" });
});

app.post("/api/council/proceed", (req, res) => {
  const { sessionId } = req.body;
  const resolve = pendingSessions.get(sessionId);
  if (resolve) {
    pendingSessions.delete(sessionId);
    resolve();
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

app.post("/api/council/generate-start", (req, res) => {
  const { sessionId } = req.body;
  const resolve = pendingGenerateSessions.get(sessionId);
  if (resolve) {
    pendingGenerateSessions.delete(sessionId);
    resolve();
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

app.post("/api/council/generate-prd", async (req, res) => {
  const { idea, topicSummaries, decisions } = req.body;

  if (!idea || !Array.isArray(topicSummaries)) {
    return res.status(400).json({ error: "Missing required fields: idea, topicSummaries" });
  }

  try {
    const result = await callQwen({
      systemPrompt: PRD_GENERATION_SYSTEM_PROMPT,
      userPrompt: PRD_GENERATION_USER_PROMPT({ idea, topicSummaries, decisions: decisions || [] }),
      maxTokens: 6000,
    });

    const prd = JSON.parse(extractJson(result));
    res.json({ prd });
  } catch (error) {
    console.error("PRD generation error:", error);
    res.status(500).json({ error: error.message || "PRD generation failed" });
  }
});

app.get("/api/council/start", async (req, res) => {
  const idea = req.query.idea || "No idea provided";
  const sessionId = req.query.sessionId || null;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (type, data) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const waitForProceed = sessionId
    ? () => new Promise((resolve) => { pendingSessions.set(sessionId, resolve); })
    : null;

  const waitForGenerate = sessionId
    ? () => new Promise((resolve) => { pendingGenerateSessions.set(sessionId, resolve); })
    : null;

  req.on("close", () => {
    if (sessionId) {
      pendingSessions.delete(sessionId);
      pendingGenerateSessions.delete(sessionId);
    }
  });

  try {
    await buildCouncilWorkflow(idea, { send, waitForProceed, waitForGenerate });

    send("done", { message: "Council finished" });
    res.end();
  } catch (error) {
    console.error("Council error:", error);

    if (error.code === "INVALID_IDEA") {
      send("invalid_idea", { message: error.message });
    } else {
      send("error", {
        message: error.message || "Council workflow failed",
      });
    }

    res.end();
  }
});

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Backend listening on ${HOST}:${PORT}`);
});
