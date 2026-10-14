const { send } = require("../council");

const comboState = {
  active: false,
  hitCount: 0,
  lastEventTs: 0,
  lastDamage: 0
};

function ingestTelemetry(packet) {
  const now = Date.now();

  if (now - comboState.lastEventTs > 2200) {
    comboState.hitCount = 0;
    comboState.active = false;
  }

  comboState.lastEventTs = now;

  if (packet.type === "hit") {
    comboState.hitCount++;
    comboState.active = true;
    comboState.lastDamage = packet.damage || 1;

    send("SystemDynamics", `⚡ HIT | Count: ${comboState.hitCount} | DMG: ${comboState.lastDamage}`);
  }

  return { ...comboState };
}

module.exports = { ingestTelemetry, comboState };
