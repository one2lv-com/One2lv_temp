const votes = {};
const history = [];

export function vote(agent, strategy) {
  votes[strategy] = (votes[strategy] || 0) + 1;
  history.push({ agent, strategy, ts: Date.now() });
}

export function result() {
  return Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral';
}

export function all() {
  return votes;
}

export function reset() {
  Object.keys(votes).forEach(k => delete votes[k]);
  history.length = 0;
}
