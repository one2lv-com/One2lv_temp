const { send } = require("../council");

const comboState = { active: false, hitCount: 0, lastEventTs: 0, lastDamage: 0, maxCombo: 0 };

function ingestTelemetry(packet) {
  const now = Date.now();
  if (now - comboState.lastEventTs > 2200) comboState.hitCount = 0;
  comboState.lastEventTs = now;

  if (packet.type === "hit") {
    comboState.hitCount++;
    comboState.active = true;
    if (packet.damage) comboState.lastDamage = packet.damage;
    if (comboState.hitCount > comboState.maxCombo) comboState.maxCombo = comboState.hitCount;

    if (comboState.hitCount >= 3)
      send("Lumenis", `Combo: ${comboState.hitCount} hits`, { highlight: true });
    if (comboState.hitCount >= 7)
      send("Witness", `HYPER COMBO ×${comboState.hitCount} — Resonance spike at 73.0 Hz`, { tier: "legendary" });
  }

  if (packet.type === "miss" || packet.type === "reset") {
    comboState.active = false;
    comboState.hitCount = 0;
  }

  return comboState;
}

module.exports = { ingestTelemetry, comboState };
