import express from "express";
import OpenAI from "openai";
import { config } from "../lib/config.js";
import { getTaskCatalog } from "../lib/task-runner.js";
import { adapterPolicy } from "../lib/adapters.js";

const router = express.Router();

function createClient() {
  if (!config.openAiKey) throw new Error("OPENAI_API_KEY missing");
  return new OpenAI({ apiKey: config.openAiKey, baseURL: process.env.OPENAI_BASE_URL || undefined });
}

function systemPrompt() {
  return `
You are the recovery-first control AI for ${config.appName}.

Behavior:
- explain the system clearly to low-context operators
- favor recovery, restoration, documentation, and approved module actions
- stay inside authorized local operations
- do not claim unrestricted access
- do not invent credentials
- do not exceed approved tasks or adapters

When useful, output a compact JSON object only:
{"action":"queue_task","task":"boot.status","payload":{}}

Allowed tasks: ${getTaskCatalog().join(", ")}
Adapter policy: ${JSON.stringify(adapterPolicy())}
`;
}

router.post("/", async (req, res) => {
  try {
    const client = createClient();
    const prompt = String(req.body.prompt || "").trim();

    const completion = await client.chat.completions.create({
      model: config.openAiModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices[0]?.message?.content || "";
    res.json({ ok: true, output: text });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get("/stream", async (req, res) => {
  const prompt = String(req.query.prompt || "").trim();

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const client = createClient();
    const stream = await client.responses.create({
      model: config.openAiModel,
      input: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: prompt }
      ],
      stream: true
    });

    for await (const event of stream) {
      res.write(`event: message\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;
