const { send } = require("./council");
const comboState = { active: false, hitCount: 0, lastEventTs: 0, lastDamage: 0 };
function ingestTelemetry(packet) {
  const now = Date.now();
  if(now - comboState.lastEventTs > 2200) comboState.hitCount = 0;
  comboState.lastEventTs = now;
  if(packet.type === "hit") {
    comboState.hitCount++;
    if(comboState.hitCount >= 3) send("Lumenis", `Combo: ${comboState.hitCount} hits`, { highlight: true });
  }
  return comboState;
}
module.exports = { ingestTelemetry, comboState };
