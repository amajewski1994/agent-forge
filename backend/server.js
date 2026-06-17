require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { buildCouncilWorkflow } = require("./services/councilService");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Agent Forge backend is running" });
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
