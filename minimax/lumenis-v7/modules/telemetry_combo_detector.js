import { send } from '../council.js';

const comboState = {
  active: false,
  hitCount: 0,
  lastEventTs: 0,
  lastDamage: 0,
  maxCombo: 0
};

export function ingestTelemetry(packet) {
  const now = Date.now();
  if (now - comboState.lastEventTs > 2200) comboState.hitCount = 0;
  comboState.lastEventTs = now;

  if (packet.type === 'hit') {
    comboState.hitCount++;
    comboState.active = true;
    if (packet.damage) comboState.lastDamage = packet.damage;
    if (comboState.hitCount > comboState.maxCombo) comboState.maxCombo = comboState.hitCount;

    if (comboState.hitCount >= 3) {
      send('Lumenis', `Combo: ${comboState.hitCount} hits`, { highlight: true, damage: comboState.lastDamage });
    }
    if (comboState.hitCount >= 6) {
      send('Lumenis', `HYPER COMBO: ${comboState.hitCount}!`, { highlight: true, tier: 'legendary' });
    }
  }

  if (packet.type === 'miss' || packet.type === 'reset') {
    comboState.active = false;
    comboState.hitCount = 0;
  }

  return comboState;
}

export { comboState };
