require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { buildCouncilWorkflow } = require("./services/councilService");

const app = express();

app.use(cors());
app.use(express.json());

const pendingSessions = new Map();

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

  req.on("close", () => {
    if (sessionId) pendingSessions.delete(sessionId);
  });

  try {
    await buildCouncilWorkflow(idea, { send, waitForProceed });

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
