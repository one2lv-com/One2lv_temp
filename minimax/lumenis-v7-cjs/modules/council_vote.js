const votes = {};

module.exports = {
  vote:   (agent, strategy) => { votes[strategy] = (votes[strategy] || 0) + 1; },
  result: () => Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] || "Neutral",
  all:    () => votes,
  reset:  () => { Object.keys(votes).forEach(k => delete votes[k]); }
};
