const state = { dodgeLeft: 0, jumpSpam: 0, attackCount: 0, patterns: [] };

export function analyze(event, data = {}) {
  if (event === 'jump') state.jumpSpam++;
  if (event === 'dodge_left') state.dodgeLeft++;
  if (event === 'attack') state.attackCount++;
  state.patterns.push({ event, ts: Date.now(), ...data });
  if (state.patterns.length > 100) state.patterns.shift();
  return state;
}

export function getSuggestion() {
  if (state.jumpSpam > 5) return 'Opponent jump-spamming — bait and punish on landing.';
  if (state.dodgeLeft > 3) return 'Dodge pattern detected — pressure right side.';
  return 'Monitor patterns. Stay resonant.';
}

export { state };
