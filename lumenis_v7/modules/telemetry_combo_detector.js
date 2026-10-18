const { send } = require("./council");
const comboState = { active: false, hitCount: 0, lastEventTs: 0, lastDamage: 0 };
function ingestTelemetry(packet) {
  if (!packet) return comboState;
  const now = Date.now();
  if(packet.type === "hit") {
    if(now - comboState.lastEventTs >= 2200) comboState.hitCount = 0;
    comboState.hitCount++;
    if(comboState.hitCount >= 3) send("Lumenis", `Combo: ${comboState.hitCount} hits`, { highlight: true });
  }
  comboState.lastEventTs = now;
  return comboState;
}
module.exports = { ingestTelemetry, comboState };
