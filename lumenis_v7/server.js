const express = require("express");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const { council, send } = require("./modules/council");
const { ingestTelemetry, comboState } = require("./modules/telemetry_combo_detector");
const { vote, result } = require("./modules/council_vote");
const obs = require("./integrations/obs_autoconnect");
const twitchChat = require("./integrations/twitch_chat");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const db = new Low(new JSONFile("./data/memory.json"), { councilLogs: [] });

async function init() {
  await db.read();
  db.data ||= { councilLogs: [] };
  council.on("msg", async m => {
    db.data.councilLogs.push(m);
    await db.write();
  });
}

app.get("/api/status", (req, res) => res.json({ system: "Lumenis_v7", combo: comboState, obs: obs.isConnected() }));
app.get("/api/council", async (req, res) => { await db.read(); res.json(db.data.councilLogs); });
app.get("/api/council/vote", (req, res) => res.json({ strategy: result() }));
app.post("/api/telemetry", (req, res) => res.json({ ok: true, combo: ingestTelemetry(req.body) }));

init().then(() => {
  obs.autoConnectOBS();
  app.listen(8080, () => console.log("🌷 Lumenis v7 ONLINE at http://localhost:8080"));
});
