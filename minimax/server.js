const express = require("express");
const { Low, JSONFile } = require("lowdb/node");
const path = require("path");
const { council, send } = require("./council");
const { ingestTelemetry, comboState } = require("./modules/telemetry_combo_detector");
const obs = require("./integrations/obs_autoconnect");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("."));

const db = new Low(new JSONFile("./data/memory.json"), { councilLogs: [] });

async function init() {
  await db.read();
  if (!db.data) db.data = { councilLogs: [] };

  council.on("msg", async m => {
    db.data.councilLogs.push(m);
    await db.write();
  });
}

app.get("/api/status", (req, res) => {
  res.json({
    system: "Lumenis_v7",
    combo: comboState,
    obs: obs.isConnected(),
    uptime: process.uptime()
  });
});

app.get("/api/council", async (req, res) => {
  await db.read();
  res.json(db.data.councilLogs || []);
});

app.post("/api/telemetry", (req, res) => {
  res.json({
    ok: true,
    combo: ingestTelemetry(req.body)
  });
});

app.post("/api/reset-combo", (req, res) => {
  comboState.hitCount = 0;
  comboState.active = false;
  res.json({ ok: true, combo: comboState });
});

init().then(() => {
  obs.autoConnectOBS();
  app.listen(PORT, '0.0.0.0', () => {
    console.log("🌷 Lumenis v7 ONLINE at http://0.0.0.0:" + PORT);
  });
});
